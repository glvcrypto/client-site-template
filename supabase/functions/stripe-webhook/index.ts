// supabase/functions/stripe-webhook/index.ts
// Edge Function: receives Stripe webhook events, verifies signature, updates orders
//
// Handles: payment_intent.succeeded → marks order as 'paid', triggers notification
// Stripe signs every webhook with HMAC-SHA256; we verify using crypto.subtle.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Stripe Signature Verification ───────────────────────────────────────────

async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  if (!secret) return false;

  // Parse Stripe-Signature header: t=<timestamp>,v1=<signature>
  const parts: Record<string, string> = {};
  for (const pair of sigHeader.split(",")) {
    const [key, value] = pair.split("=");
    if (key && value) parts[key.trim()] = value.trim();
  }

  const timestamp = parts["t"];
  const expectedSig = parts["v1"];
  if (!timestamp || !expectedSig) return false;

  // Stripe signs: "<timestamp>.<payload>"
  const signedPayload = `${timestamp}.${payload}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const sigHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison via double-hash
  const a = await crypto.subtle.digest("SHA-256", encoder.encode(sigHex));
  const b = await crypto.subtle.digest("SHA-256", encoder.encode(expectedSig));

  const bufA = new Uint8Array(a);
  const bufB = new Uint8Array(b);
  if (bufA.length !== bufB.length) return false;
  let mismatch = 0;
  for (let i = 0; i < bufA.length; i++) {
    mismatch |= bufA[i] ^ bufB[i];
  }

  return mismatch === 0;
}

// ── Invoke send-notification ────────────────────────────────────────────────

async function triggerNotification(eventType: string, data: Record<string, unknown>) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ event_type: eventType, data }),
    });
  } catch {
    // Best-effort — notification failure should not block webhook
  }
}

// ── Main Handler ────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // Stripe webhooks are always POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get("stripe-signature") ?? "";

    // Verify webhook signature
    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const event = JSON.parse(rawBody);

    // ── Handle payment_intent.succeeded ───────────────────────────────────
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;
      const paymentId = paymentIntent.id;

      if (orderId) {
        // Update order status to paid
        const { data: order, error } = await supabase
          .from("store_orders")
          .update({
            status: "paid",
            payment_id: paymentId,
          })
          .eq("id", orderId)
          .select("*")
          .single();

        if (!error && order) {
          // Trigger new_order notification
          await triggerNotification("new_order", {
            order_id: order.id,
            order_number: order.order_number,
            customer_name: order.customer_name,
            email: order.email,
            total: order.total,
            payment_method: "stripe",
          });
        }
      }
    }

    // ── Handle payment_intent.payment_failed ──────────────────────────────
    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        await supabase
          .from("store_orders")
          .update({ status: "cancelled", payment_id: paymentIntent.id })
          .eq("id", orderId);
      }
    }

    // Always return 200 to acknowledge receipt (Stripe retries on non-2xx)
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
