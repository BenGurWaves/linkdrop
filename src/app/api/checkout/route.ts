import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const COUPON_CODE = process.env.COUPON_CODE;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://linkdrop.calyvent.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, coupon, user_id: bodyUserId } = body;

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Coupon activation
    if (coupon && COUPON_CODE && coupon === COUPON_CODE) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let userId = bodyUserId;

      if (!userId) {
        // Try all ld_pages — the email in the form might not match the username
        const { data: pages } = await supabase
          .from("ld_pages")
          .select("user_id");

        // If only one page exists or we need a different approach,
        // just grab the first page that matches. In practice, the client
        // sends user_id so this is a fallback.
        userId = pages?.[0]?.user_id;
      }

      if (!userId) {
        return NextResponse.json(
          { error: "no linkdrop page found. create a page first, then apply the coupon." },
          { status: 404 }
        );
      }

      // Record coupon activation (table has: email, coupon_code, activated_at)
      await supabase.from("coupon_activations").upsert(
        { email: email.toLowerCase(), coupon_code: coupon },
        { onConflict: "email" }
      );

      // Insert subscription (not upsert — user might have a Glyph sub already)
      // Delete any existing LinkDrop subscription first, then insert
      const { data: existingSubs } = await supabase
        .from("subscriptions")
        .select("id, payment_reference")
        .eq("user_id", userId)
        .eq("status", "active");

      const hasLdSub = existingSubs?.some((s: { payment_reference?: string | null }) =>
        s.payment_reference?.startsWith("ld:")
      );

      if (!hasLdSub) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan: "pro",
          payment_method: "coupon",
          payment_reference: `ld:coupon:${coupon}`,
          status: "active",
        });
      }

      // Clear expires_at
      await supabase
        .from("ld_pages")
        .update({ expires_at: null })
        .eq("user_id", userId);

      return NextResponse.json({ activated: true });
    }

    // Stripe checkout
    const params = new URLSearchParams();
    params.append("mode", "subscription");
    params.append("customer_email", email);
    params.append("success_url", `${BASE_URL}/dashboard?checkout=success`);
    params.append("cancel_url", `${BASE_URL}/pricing?checkout=cancelled`);
    params.append("line_items[0][quantity]", "1");
    params.append("line_items[0][price_data][currency]", "usd");
    params.append("line_items[0][price_data][unit_amount]", "500");
    params.append("line_items[0][price_data][recurring][interval]", "month");
    params.append(
      "line_items[0][price_data][product_data][name]",
      "LinkDrop Pro"
    );
    params.append("payment_method_types[0]", "card");
    params.append("payment_method_types[1]", "cashapp");

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: session.error?.message ?? "stripe error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
