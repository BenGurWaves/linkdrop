import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const COINBASE_WEBHOOK_SECRET = process.env.COINBASE_WEBHOOK_SECRET!;

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

  return expected === signature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-cc-webhook-signature") ?? "";

    const valid = await verifyCoinbaseSignature(body, signature, COINBASE_WEBHOOK_SECRET);
    if (!valid) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
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

      // Upsert subscription
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          payment_method: "crypto",
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
