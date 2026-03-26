import { NextRequest, NextResponse } from "next/server";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY!;
const COUPON_CODE = process.env.COUPON_CODE;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://linkdrop.calyvent.com";

export async function POST(req: NextRequest) {
  try {
    const { email, coupon } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    // Coupon activation
    if (coupon && COUPON_CODE && coupon === COUPON_CODE) {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if coupon was already used by this email
      const { data: existingActivation } = await supabase
        .from("coupon_activations")
        .select("id")
        .eq("coupon_code", coupon)
        .eq("email", email)
        .limit(1)
        .single();

      if (existingActivation) {
        return NextResponse.json({ error: "coupon already used" }, { status: 409 });
      }

      // Look up user by email
      const { data: userRows } = await supabase.rpc("get_user_id_by_email", {
        user_email: email,
      });

      const userId = userRows?.[0]?.id;
      if (!userId) {
        return NextResponse.json({ error: "user not found" }, { status: 404 });
      }

      // Record coupon activation
      await supabase.from("coupon_activations").insert({
        user_id: userId,
        coupon_code: coupon,
        email,
      });

      // Upsert subscription
      await supabase.from("subscriptions").upsert(
        {
          user_id: userId,
          plan: "pro",
          payment_method: "coupon",
          payment_reference: `ld:coupon:${coupon}`,
          status: "active",
        },
        { onConflict: "user_id" }
      );

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
