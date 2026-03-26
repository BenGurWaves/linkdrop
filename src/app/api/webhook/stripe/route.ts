import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  // Double-HMAC comparison: constant-time by design.
  // HMAC both values with a random key, then compare the results.
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    crypto.getRandomValues(new Uint8Array(32)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const [macA, macB] = await Promise.all([
    crypto.subtle.sign("HMAC", key, encoder.encode(a)),
    crypto.subtle.sign("HMAC", key, encoder.encode(b)),
  ]);
  const viewA = new Uint8Array(macA);
  const viewB = new Uint8Array(macB);
  if (viewA.byteLength !== viewB.byteLength) return false;
  let result = 0;
  for (let i = 0; i < viewA.byteLength; i++) {
    result |= viewA[i] ^ viewB[i];
  }
  return result === 0;
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Sig = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1Sig) return false;

  // Replay protection: reject events older than 5 minutes
  const timestampSeconds = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestampSeconds) || Math.abs(now - timestampSeconds) > 300) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, v1Sig);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET is not set — skipping signature verification (dev mode)");
    } else {
      const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        return NextResponse.json({ error: "invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email;

      if (!email) {
        return NextResponse.json({ error: "no email" }, { status: 400 });
      }

      // Look up user
      const { data: userRows } = await supabase.rpc("get_user_id_by_email", {
        user_email: email,
      });

      const userId = userRows?.[0]?.id;
      if (!userId) {
        return NextResponse.json({ error: "user not found" }, { status: 404 });
      }

      // Upsert subscription
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          payment_method: "stripe",
          payment_reference: `ld:stripe:${session.id}`,
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
        },
        { onConflict: "user_id" }
      );

      // Clear expires_at so page never expires
      await supabase
        .from("ld_pages")
        .update({ expires_at: null })
        .eq("user_id", userId);
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;

      // Find by stripe subscription id
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subscription.id)
        .limit(1)
        .single();

      if (sub) {
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", plan: "free" })
          .eq("user_id", sub.user_id);
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "webhook error" }, { status: 500 });
  }
}
