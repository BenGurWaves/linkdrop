import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const parts = signature.split(",");
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2);
  const v1Sig = parts.find((p) => p.startsWith("v1="))?.slice(3);

  if (!timestamp || !v1Sig) return false;

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

  return expected === v1Sig;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature") ?? "";

    const valid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
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
