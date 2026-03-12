// supabase/functions/sync-reviews/index.ts
// Edge Function: syncs Google Business Profile reviews into the reviews table
//
// 1. Reads review_config for google_place_id
// 2. Calls Google Places API (New) to fetch reviews
// 3. Upserts into reviews table (dedup on source='google' + external_id)
// 4. Updates site_integrations last_synced_at for 'google_business'
// 5. Returns count of new/updated reviews

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Google Places API ───────────────────────────────────────────────────────

interface GoogleReview {
  name: string; // resource name, e.g. "places/xxx/reviews/yyy"
  relativePublishTimeDescription: string;
  rating: number;
  text?: { text: string };
  authorAttribution?: { displayName: string };
  publishTime: string;
}

async function fetchGoogleReviews(placeId: string): Promise<GoogleReview[]> {
  // Use Places API (New) — fetch place details with reviews field mask
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=reviews&key=${GOOGLE_API_KEY}`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": GOOGLE_API_KEY,
      "X-Goog-FieldMask": "reviews",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Google Places API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.reviews ?? [];
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    // 1. Read review config
    const { data: config, error: configErr } = await supabase
      .from("review_config")
      .select("*")
      .limit(1)
      .single();

    if (configErr || !config) {
      return new Response(
        JSON.stringify({ error: "No review config found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const placeId = config.google_place_id;
    if (!placeId) {
      return new Response(
        JSON.stringify({ ok: true, message: "No google_place_id configured, skipping sync", synced: 0 }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    if (!GOOGLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GOOGLE_API_KEY not configured" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch reviews from Google
    const googleReviews = await fetchGoogleReviews(placeId);

    let newCount = 0;
    let updatedCount = 0;

    // 3. Upsert each review
    for (const review of googleReviews) {
      // Extract review ID from resource name (e.g. "places/xxx/reviews/yyy")
      const nameParts = review.name.split("/");
      const externalId = nameParts[nameParts.length - 1];

      const reviewData = {
        source: "google" as const,
        external_id: externalId,
        reviewer_name: review.authorAttribution?.displayName ?? "Google User",
        rating: review.rating,
        review_text: review.text?.text ?? null,
        review_date: review.publishTime ?? new Date().toISOString(),
        is_visible: true,
      };

      // Check if review already exists
      const { data: existing } = await supabase
        .from("reviews")
        .select("id")
        .eq("source", "google")
        .eq("external_id", externalId)
        .maybeSingle();

      if (existing) {
        // Update existing review (rating/text may change)
        await supabase
          .from("reviews")
          .update({
            reviewer_name: reviewData.reviewer_name,
            rating: reviewData.rating,
            review_text: reviewData.review_text,
          })
          .eq("id", existing.id);
        updatedCount++;
      } else {
        // Insert new review
        await supabase.from("reviews").insert(reviewData);
        newCount++;
      }
    }

    // 4. Update site_integrations last_synced_at
    await supabase
      .from("site_integrations")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("integration_type", "google_business");

    // 5. Return summary
    return new Response(
      JSON.stringify({
        ok: true,
        total_fetched: googleReviews.length,
        new: newCount,
        updated: updatedCount,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
