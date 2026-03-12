// supabase/functions/review-request/index.ts
// Edge Function: processes pending review requests after configured delay
//
// 1. Reads review_config for delay_hours and email template
// 2. Queries review_requests where status='pending' AND created_at + delay <= now()
// 3. For each pending request: sends email via send-notification, updates status
// 4. Returns count of requests sent

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function invokeSendNotification(
  eventType: string,
  data: Record<string, unknown>
): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_type: eventType, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
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

    const delayHours = config.request_delay_hours ?? 24;
    const reviewUrl = config.review_url ?? "";

    // 2. Query pending requests that have passed the delay threshold
    // created_at + delay_hours <= now()
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - delayHours);

    const { data: pendingRequests, error: queryErr } = await supabase
      .from("review_requests")
      .select("*")
      .eq("status", "pending")
      .lte("created_at", cutoff.toISOString())
      .order("created_at", { ascending: true });

    if (queryErr) {
      return new Response(
        JSON.stringify({ error: "Failed to query pending requests" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!pendingRequests || pendingRequests.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, sent: 0, message: "No pending requests ready to send" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    let sentCount = 0;
    let failedCount = 0;

    // 3. Process each pending request
    for (const request of pendingRequests) {
      const success = await invokeSendNotification("review_request", {
        customer_name: request.customer_name,
        email: request.email,
        review_url: reviewUrl,
        request_id: request.id,
      });

      if (success) {
        // Update status to 'sent' and set sent_at
        await supabase
          .from("review_requests")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", request.id);

        sentCount++;
      } else {
        failedCount++;
      }
    }

    // 4. Return summary
    return new Response(
      JSON.stringify({
        ok: true,
        total_pending: pendingRequests.length,
        sent: sentCount,
        failed: failedCount,
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
