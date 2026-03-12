// supabase/functions/sync-analytics/index.ts
// Edge Function: syncs analytics data from GA4, Google Ads, and Meta Ads
//
// 1. Reads site_integrations for connected platforms
// 2. GA4 → runReport for traffic sources, device breakdown, top pages
// 3. Google Ads → campaign performance via REST API
// 4. Meta Ads → campaign insights via Marketing API
// 5. Updates last_synced_at on each integration
// 6. Returns summary of what was synced

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

interface SyncResult {
  platform: string;
  status: "synced" | "skipped" | "error";
  details?: string;
}

// ── GA4 Sync ────────────────────────────────────────────────────────────────

async function syncGA4(config: Record<string, string>): Promise<SyncResult> {
  const propertyId = config.property_id;
  const accessToken = config.access_token;

  if (!propertyId || !accessToken) {
    return { platform: "ga4", status: "skipped", details: "Missing property_id or access_token" };
  }

  const snapshotDate = yesterdayStr();
  const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  try {
    // ── Traffic Sources ───────────────────────────────────────────────────
    const trafficRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: snapshotDate, endDate: snapshotDate }],
        dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
        metrics: [
          { name: "sessions" },
          { name: "totalUsers" },
          { name: "bounceRate" },
          { name: "screenPageViewsPerSession" },
        ],
      }),
    });

    if (trafficRes.ok) {
      const trafficData = await trafficRes.json();
      const rows = trafficData.rows ?? [];

      for (const row of rows) {
        const source = row.dimensionValues?.[0]?.value ?? "(direct)";
        const medium = row.dimensionValues?.[1]?.value ?? "(none)";
        const sessions = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
        const users = parseInt(row.metricValues?.[1]?.value ?? "0", 10);
        const bounceRate = parseFloat(row.metricValues?.[2]?.value ?? "0");
        const pagesPerSession = parseFloat(row.metricValues?.[3]?.value ?? "0");

        await supabase.from("analytics_traffic_sources").upsert(
          {
            snapshot_date: snapshotDate,
            source,
            medium,
            sessions,
            users,
            bounce_rate: Math.round(bounceRate * 100) / 100,
            pages_per_session: Math.round(pagesPerSession * 100) / 100,
          },
          { onConflict: "snapshot_date,source,medium" }
        );
      }
    }

    // ── Device Breakdown ──────────────────────────────────────────────────
    const deviceRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: snapshotDate, endDate: snapshotDate }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "sessions" }],
      }),
    });

    if (deviceRes.ok) {
      const deviceData = await deviceRes.json();
      const rows = deviceData.rows ?? [];
      const totalSessions = rows.reduce(
        (sum: number, r: any) => sum + parseInt(r.metricValues?.[0]?.value ?? "0", 10),
        0
      );

      for (const row of rows) {
        const deviceType = (row.dimensionValues?.[0]?.value ?? "desktop").toLowerCase();
        const sessions = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
        const percentage = totalSessions > 0
          ? Math.round((sessions / totalSessions) * 10000) / 100
          : 0;

        if (["desktop", "mobile", "tablet"].includes(deviceType)) {
          await supabase.from("analytics_device_breakdown").upsert(
            {
              snapshot_date: snapshotDate,
              device_type: deviceType,
              sessions,
              percentage,
            },
            { onConflict: "snapshot_date,device_type" }
          );
        }
      }
    }

    // ── Top Pages ─────────────────────────────────────────────────────────
    const pagesRes = await fetch(baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: snapshotDate, endDate: snapshotDate }],
        dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        limit: "20",
      }),
    });

    if (pagesRes.ok) {
      const pagesData = await pagesRes.json();
      const rows = pagesData.rows ?? [];

      for (const row of rows) {
        const pagePath = row.dimensionValues?.[0]?.value ?? "/";
        const pageTitle = row.dimensionValues?.[1]?.value ?? null;
        const pageviews = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
        const avgTime = parseFloat(row.metricValues?.[1]?.value ?? "0");
        const bounceRate = parseFloat(row.metricValues?.[2]?.value ?? "0");

        await supabase.from("analytics_top_pages").upsert(
          {
            snapshot_date: snapshotDate,
            page_path: pagePath,
            page_title: pageTitle,
            pageviews,
            avg_time_on_page: Math.round(avgTime * 100) / 100,
            bounce_rate: Math.round(bounceRate * 100) / 100,
          },
          { onConflict: "snapshot_date,page_path" }
        );
      }
    }

    return { platform: "ga4", status: "synced" };
  } catch (e) {
    return { platform: "ga4", status: "error", details: (e as Error).message };
  }
}

// ── Google Ads Sync ─────────────────────────────────────────────────────────

async function syncGoogleAds(config: Record<string, string>): Promise<SyncResult> {
  const customerId = config.customer_id;
  const accessToken = config.access_token;
  const developerToken = config.developer_token;

  if (!customerId || !accessToken || !developerToken) {
    return { platform: "google_ads", status: "skipped", details: "Missing credentials" };
  }

  const snapshotDate = yesterdayStr();

  try {
    // Google Ads API — query campaign performance
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date = '${snapshotDate}'
    `;

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerId.replace(/-/g, "")}/googleAds:searchStream`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return { platform: "google_ads", status: "error", details: `API ${res.status}: ${body}` };
    }

    const data = await res.json();
    const results = data[0]?.results ?? [];

    for (const result of results) {
      const campaign = result.campaign;
      const metrics = result.metrics;

      const spend = (metrics.cost_micros ?? 0) / 1_000_000;
      const roas = spend > 0 ? (metrics.conversions_value ?? 0) / spend : 0;

      await supabase.from("analytics_ad_performance").upsert(
        {
          snapshot_date: snapshotDate,
          platform: "google_ads",
          campaign_name: campaign.name,
          campaign_id: String(campaign.id),
          spend: Math.round(spend * 100) / 100,
          impressions: metrics.impressions ?? 0,
          clicks: metrics.clicks ?? 0,
          ctr: metrics.ctr ? Math.round(metrics.ctr * 10000) / 100 : 0,
          cpc: metrics.average_cpc ? Math.round(metrics.average_cpc / 10000) / 100 : 0,
          conversions: Math.round(metrics.conversions ?? 0),
          conversion_value: Math.round((metrics.conversions_value ?? 0) * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          status: campaign.status === "ENABLED" ? "active" : "paused",
        },
        { onConflict: "snapshot_date,platform,campaign_id" }
      );
    }

    return { platform: "google_ads", status: "synced" };
  } catch (e) {
    return { platform: "google_ads", status: "error", details: (e as Error).message };
  }
}

// ── Meta Ads Sync ───────────────────────────────────────────────────────────

async function syncMetaAds(config: Record<string, string>): Promise<SyncResult> {
  const adAccountId = config.ad_account_id;
  const accessToken = config.access_token;

  if (!adAccountId || !accessToken) {
    return { platform: "meta", status: "skipped", details: "Missing ad_account_id or access_token" };
  }

  const snapshotDate = yesterdayStr();

  try {
    // Meta Marketing API — campaign insights
    const url = new URL(
      `https://graph.facebook.com/v19.0/act_${adAccountId}/insights`
    );
    url.searchParams.set("access_token", accessToken);
    url.searchParams.set("level", "campaign");
    url.searchParams.set(
      "fields",
      "campaign_name,campaign_id,spend,impressions,clicks,ctr,cpc,actions,action_values"
    );
    url.searchParams.set("time_range", JSON.stringify({
      since: snapshotDate,
      until: snapshotDate,
    }));

    const res = await fetch(url.toString());

    if (!res.ok) {
      const body = await res.text();
      return { platform: "meta", status: "error", details: `API ${res.status}: ${body}` };
    }

    const data = await res.json();
    const insights = data.data ?? [];

    for (const row of insights) {
      // Extract purchase conversions from actions array
      const purchaseAction = (row.actions ?? []).find(
        (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
      );
      const purchaseValue = (row.action_values ?? []).find(
        (a: any) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase"
      );

      const spend = parseFloat(row.spend ?? "0");
      const conversions = parseInt(purchaseAction?.value ?? "0", 10);
      const conversionValue = parseFloat(purchaseValue?.value ?? "0");
      const roas = spend > 0 ? conversionValue / spend : 0;

      await supabase.from("analytics_ad_performance").upsert(
        {
          snapshot_date: snapshotDate,
          platform: "meta",
          campaign_name: row.campaign_name,
          campaign_id: row.campaign_id,
          spend: Math.round(spend * 100) / 100,
          impressions: parseInt(row.impressions ?? "0", 10),
          clicks: parseInt(row.clicks ?? "0", 10),
          ctr: parseFloat(row.ctr ?? "0"),
          cpc: parseFloat(row.cpc ?? "0"),
          conversions,
          conversion_value: Math.round(conversionValue * 100) / 100,
          roas: Math.round(roas * 100) / 100,
          status: "active",
        },
        { onConflict: "snapshot_date,platform,campaign_id" }
      );
    }

    return { platform: "meta", status: "synced" };
  } catch (e) {
    return { platform: "meta", status: "error", details: (e as Error).message };
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
    // Read all connected integrations
    const { data: integrations, error } = await supabase
      .from("site_integrations")
      .select("*")
      .eq("is_connected", true);

    if (error) {
      return new Response(
        JSON.stringify({ error: "Failed to read integrations" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Also read ad_config for ads platforms
    const { data: adConfigs } = await supabase
      .from("ad_config")
      .select("*")
      .eq("is_enabled", true);

    const results: SyncResult[] = [];

    // ── GA4 ─────────────────────────────────────────────────────────────
    const ga4Integration = (integrations ?? []).find(
      (i) => i.integration_type === "google_analytics"
    );
    if (ga4Integration) {
      const ga4Config = ga4Integration.config_json as Record<string, string>;
      if (ga4Config.property_id) {
        const result = await syncGA4(ga4Config);
        results.push(result);

        if (result.status === "synced") {
          await supabase
            .from("site_integrations")
            .update({ last_synced_at: new Date().toISOString() })
            .eq("integration_type", "google_analytics");
        }
      }
    }

    // ── Google Ads ──────────────────────────────────────────────────────
    const googleAdsConfig = (adConfigs ?? []).find((c) => c.platform === "google_ads");
    if (googleAdsConfig) {
      const config = googleAdsConfig.config_json as Record<string, string>;
      const result = await syncGoogleAds(config);
      results.push(result);

      if (result.status === "synced") {
        await supabase
          .from("ad_config")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("platform", "google_ads");
      }
    }

    // ── Meta Ads ────────────────────────────────────────────────────────
    const metaAdsConfig = (adConfigs ?? []).find((c) => c.platform === "meta");
    if (metaAdsConfig) {
      const config = metaAdsConfig.config_json as Record<string, string>;
      const result = await syncMetaAds(config);
      results.push(result);

      if (result.status === "synced") {
        await supabase
          .from("ad_config")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("platform", "meta");
      }
    }

    if (results.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "No integrations connected", results: [] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
