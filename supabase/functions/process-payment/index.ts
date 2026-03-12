// supabase/functions/process-payment/index.ts
// Edge Function: creates a payment intent (Stripe) or order (PayPal) for checkout
//
// Input: { payment_method: 'stripe' | 'paypal', order_id: string, amount: number }
// Stripe path  → creates PaymentIntent via REST API, returns { client_secret }
// PayPal path  → creates Order via REST API, returns { paypal_order_id }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ─────────────────────────────────────────────────────────────────

interface PaymentConfig {
  provider: string;
  is_enabled: boolean;
  config_json: Record<string, string>;
}

async function getPaymentConfig(provider: string): Promise<PaymentConfig | null> {
  const { data, error } = await supabase
    .from("store_payment_config")
    .select("*")
    .eq("provider", provider)
    .eq("is_enabled", true)
    .single();

  if (error || !data) return null;
  return data as PaymentConfig;
}

// ── Stripe ──────────────────────────────────────────────────────────────────

async function createStripePaymentIntent(
  secretKey: string,
  amountCents: number,
  orderId: string
): Promise<{ client_secret: string }> {
  const params = new URLSearchParams();
  params.append("amount", String(amountCents));
  params.append("currency", "cad");
  params.append("metadata[order_id]", orderId);

  const res = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Stripe error ${res.status}: ${body}`);
  }

  const intent = await res.json();
  return { client_secret: intent.client_secret };
}

// ── PayPal ──────────────────────────────────────────────────────────────────

async function getPayPalAccessToken(
  clientId: string,
  clientSecret: string,
  sandbox: boolean
): Promise<string> {
  const base = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal auth error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function createPayPalOrder(
  accessToken: string,
  amount: number,
  orderId: string,
  sandbox: boolean
): Promise<{ paypal_order_id: string }> {
  const base = sandbox
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const res = await fetch(`${base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: orderId,
          amount: {
            currency_code: "CAD",
            value: amount.toFixed(2),
          },
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`PayPal order error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return { paypal_order_id: data.id };
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
    const { payment_method, order_id, amount } = (await req.json()) as {
      payment_method: "stripe" | "paypal";
      order_id: string;
      amount: number;
    };

    // Validate input
    if (!payment_method || !order_id || !amount) {
      return new Response(
        JSON.stringify({ error: "payment_method, order_id, and amount are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!["stripe", "paypal"].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: "payment_method must be 'stripe' or 'paypal'" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (amount <= 0) {
      return new Response(
        JSON.stringify({ error: "amount must be greater than 0" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify order exists
    const { data: order, error: orderErr } = await supabase
      .from("store_orders")
      .select("id, total, status")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get payment config
    const config = await getPaymentConfig(payment_method);
    if (!config) {
      return new Response(
        JSON.stringify({ error: `${payment_method} is not enabled or configured` }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Stripe path ─────────────────────────────────────────────────────────
    if (payment_method === "stripe") {
      const secretKey = config.config_json.secret_key;
      if (!secretKey) {
        return new Response(
          JSON.stringify({ error: "Stripe secret_key not configured" }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      const amountCents = Math.round(amount * 100);
      const result = await createStripePaymentIntent(secretKey, amountCents, order_id);

      // Store payment intent reference on the order
      await supabase
        .from("store_orders")
        .update({ payment_method: "stripe" })
        .eq("id", order_id);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── PayPal path ─────────────────────────────────────────────────────────
    if (payment_method === "paypal") {
      const clientId = config.config_json.client_id;
      const clientSecret = config.config_json.client_secret;
      const sandbox = config.config_json.sandbox !== "false";

      if (!clientId || !clientSecret) {
        return new Response(
          JSON.stringify({ error: "PayPal client_id and client_secret not configured" }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      const accessToken = await getPayPalAccessToken(clientId, clientSecret, sandbox);
      const result = await createPayPalOrder(accessToken, amount, order_id, sandbox);

      // Store PayPal order reference
      await supabase
        .from("store_orders")
        .update({ payment_method: "paypal", payment_id: result.paypal_order_id })
        .eq("id", order_id);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Should never reach here
    return new Response(
      JSON.stringify({ error: "Unhandled payment method" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
