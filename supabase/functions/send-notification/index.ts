// supabase/functions/send-notification/index.ts
// Edge Function: dispatches email (via Resend) and/or webhook for a given event
//
// Input: { event_type: string, data: Record<string, any> }
// 1. Read notification_config for event_type
// 2. If email_enabled: read template, replace {{placeholders}}, send via Resend
// 3. If webhook_enabled: POST to webhook_url with JSON payload
// 4. Log both results to notification_log

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ─────────────────────────────────────────────────────────────────

function replacePlaceholders(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return data[key] != null ? String(data[key]) : "";
  });
}

async function getDefaultRecipient(): Promise<string | null> {
  const { data } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "email")
    .single();
  return data?.value ?? null;
}

async function logNotification(
  event_type: string,
  channel: "email" | "webhook",
  recipient: string | null,
  status: "sent" | "failed",
  payload_json: Record<string, any> | null,
  error_message: string | null
) {
  await supabase.from("notification_log").insert({
    event_type,
    channel,
    recipient,
    status,
    payload_json,
    error_message,
  });
}

// ── Email via Resend ────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text: string | null
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "notifications@resend.dev",
        to: [to],
        subject,
        html,
        ...(text ? { text } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Webhook ─────────────────────────────────────────────────────────────────

async function sendWebhook(
  url: string,
  headers: Record<string, string>,
  payload: Record<string, any>
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { ok: false, error: `Webhook ${res.status}: ${await res.text()}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { event_type, data } = (await req.json()) as {
      event_type: string;
      data: Record<string, any>;
    };

    if (!event_type) {
      return new Response(JSON.stringify({ error: "event_type required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Fetch config
    const { data: config, error: configErr } = await supabase
      .from("notification_config")
      .select("*")
      .eq("event_type", event_type)
      .single();

    if (configErr || !config) {
      return new Response(
        JSON.stringify({ error: `No config for event: ${event_type}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const results: { email?: string; webhook?: string } = {};

    // 2. Email
    if (config.email_enabled) {
      // Fetch template
      const { data: tpl } = await supabase
        .from("notification_templates")
        .select("*")
        .eq("event_type", event_type)
        .single();

      if (tpl) {
        const subject = replacePlaceholders(tpl.subject, data);
        const html = replacePlaceholders(tpl.body_html, data);
        const text = tpl.body_text ? replacePlaceholders(tpl.body_text, data) : null;

        // Determine recipient
        let recipient: string | null = config.email_to;
        if (!recipient) {
          if (tpl.is_customer_facing && data.email) {
            recipient = data.email;
          } else {
            recipient = await getDefaultRecipient();
          }
        }

        if (recipient) {
          const emailResult = await sendEmail(recipient, subject, html, text);
          results.email = emailResult.ok ? "sent" : emailResult.error!;
          await logNotification(
            event_type,
            "email",
            recipient,
            emailResult.ok ? "sent" : "failed",
            { subject, to: recipient },
            emailResult.ok ? null : emailResult.error!
          );
        } else {
          results.email = "no_recipient";
          await logNotification(event_type, "email", null, "failed", null, "No recipient configured");
        }
      } else {
        results.email = "no_template";
        await logNotification(event_type, "email", null, "failed", null, "No template found");
      }
    }

    // 3. Webhook
    if (config.webhook_enabled && config.webhook_url) {
      const payload = {
        event_type,
        timestamp: new Date().toISOString(),
        data,
      };
      const webhookResult = await sendWebhook(
        config.webhook_url,
        config.webhook_headers_json ?? {},
        payload
      );
      results.webhook = webhookResult.ok ? "sent" : webhookResult.error!;
      await logNotification(
        event_type,
        "webhook",
        config.webhook_url,
        webhookResult.ok ? "sent" : "failed",
        payload,
        webhookResult.ok ? null : webhookResult.error!
      );
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
