import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET;

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  // Double-HMAC comparison: constant-time by design.
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

async function verifyCoinbaseSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-cc-webhook-signature") ?? "";

    if (!COINBASE_WEBHOOK_SECRET) {
      console.warn("COINBASE_WEBHOOK_SECRET is not set — skipping signature verification (dev mode)");
    } else {
      const valid = await verifyCoinbaseSignature(body, signature, COINBASE_WEBHOOK_SECRET);
      if (!valid) {
        return NextResponse.json({ error: "invalid signature" }, { status: 400 });
      }
    }

    const event = JSON.parse(body);
    const eventType = event.event?.type;

    if (eventType === "charge:confirmed" || eventType === "charge:resolved") {
      const email = event.event?.data?.metadata?.email;

      if (!email) {
        return NextResponse.json({ error: "no email in metadata" }, { status: 400 });
      }

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Look up user
      const { data: userRows } = await supabase.rpc("get_user_id_by_email", {
        user_email: email,
      });

      const userId = userRows?.[0]?.id;
      if (!userId) {
        return NextResponse.json({ error: "user not found" }, { status: 404 });
      }

      const chargeCode = event.event?.data?.code ?? "unknown";

      // Upsert subscription
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          payment_method: "crypto",
          payment_reference: `ld:coinbase:${chargeCode}`,
          status: "active",
        },
        { onConflict: "user_id" }
      );

      // Clear expires_at
      await supabase
        .from("ld_pages")
        .update({ expires_at: null })
        .eq("user_id", userId);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "webhook error" }, { status: 500 });
  }
}
