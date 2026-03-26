import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function parseDevice(ua: string): { device: string; browser: string } {
  let device = "desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) {
    device = /ipad|tablet/i.test(ua) ? "tablet" : "mobile";
  }

  let browser = "other";
  if (/firefox/i.test(ua)) browser = "firefox";
  else if (/edg/i.test(ua)) browser = "edge";
  else if (/chrome|crios/i.test(ua)) browser = "chrome";
  else if (/safari/i.test(ua)) browser = "safari";

  return { device, browser };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sb = getSupabase();

  const { data: link } = await sb
    .from("ld_links")
    .select("id, url, page_id")
    .eq("id", id)
    .single();

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url), 302);
  }

  // Extract tracking info from headers
  const ua = request.headers.get("user-agent") ?? "";
  const country = request.headers.get("cf-ipcountry") ?? null;
  const city = request.headers.get("cf-ipcity") ?? null;
  const referrer = request.headers.get("referer") ?? null;
  const { device, browser } = parseDevice(ua);

  // Click tracking (awaited — Cloudflare Workers kill process after response)
  await sb.from("ld_clicks")
    .insert({
      link_id: link.id,
      page_id: link.page_id,
      country,
      city,
      device,
      browser,
      referrer,
    });

  return NextResponse.redirect(link.url, 302);
}
