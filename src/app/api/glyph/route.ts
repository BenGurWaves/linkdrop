import { NextRequest, NextResponse } from "next/server";

const GLYPH_API_URL =
  process.env.GLYPH_API_URL || "https://glyph.calyvent.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title } = body;

    if (!url) {
      return NextResponse.json(
        { error: "url is required" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const response = await fetch(`${GLYPH_API_URL}/api/qr`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        destination_url: url,
        title: title || "LinkDrop Page",
        qr_type: "dynamic",
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create QR code";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
