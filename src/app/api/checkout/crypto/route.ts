import { NextRequest, NextResponse } from "next/server";

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const res = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": COINBASE_API_KEY,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: "LinkDrop Pro",
        description: "LinkDrop Pro monthly subscription",
        pricing_type: "fixed_price",
        local_price: {
          amount: "5.00",
          currency: "USD",
        },
        metadata: {
          email,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message ?? "coinbase error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.data.hosted_url });
  } catch {
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}
