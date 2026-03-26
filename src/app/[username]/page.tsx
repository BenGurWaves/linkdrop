import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import BioPage from "@/components/bio-page";
import type { LdPage, LdLink } from "@/lib/supabase";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const sb = getSupabase();

  const { data: page } = await sb
    .from("ld_pages")
    .select("display_name, bio, seo_title, seo_description, og_image_url")
    .eq("username", username)
    .single();

  if (!page) {
    return { title: "Not Found — LinkDrop" };
  }

  const title = page.seo_title ?? `${page.display_name} — LinkDrop`;
  const description =
    page.seo_description ?? page.bio ?? `Check out ${page.display_name}'s links`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://linkdrop.calyvent.com/${username}`,
      siteName: "LinkDrop",
      type: "profile",
      ...(page.og_image_url ? { images: [{ url: page.og_image_url }] } : {}),
    },
  };
}

export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const sb = getSupabase();

  // Fetch page
  const { data: page } = await sb
    .from("ld_pages")
    .select("*")
    .eq("username", username)
    .single();

  if (!page) {
    notFound();
  }

  const typedPage = page as LdPage;

  // Check expiration
  if (typedPage.expires_at && new Date(typedPage.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-warm px-5">
        <div className="max-w-sm text-center animate-in">
          <h1 className="mb-4 font-[family-name:var(--font-display)] text-3xl text-text-primary">
            This page has expired
          </h1>
          <p className="mb-6 font-[family-name:var(--font-body)] text-sm text-text-secondary">
            The owner&apos;s link page is no longer active. Want your own?
          </p>
          <a href="/" className="btn btn-primary">
            Create your LinkDrop
          </a>
        </div>
      </div>
    );
  }

  // Check subscription
  const { data: sub } = await sb
    .from("subscriptions")
    .select("plan")
    .eq("user_id", typedPage.user_id)
    .limit(1)
    .single();

  const isPro = sub?.plan === "pro";

  // Fetch links
  const { data: linksRaw } = await sb
    .from("ld_links")
    .select("*")
    .eq("page_id", typedPage.id)
    .eq("visible", true)
    .order("position", { ascending: true });

  let links = (linksRaw ?? []) as LdLink[];

  // Filter scheduled links (Pro only)
  if (isPro) {
    const now = new Date();
    links = links.filter((link) => {
      if (link.schedule_start && new Date(link.schedule_start) > now)
        return false;
      if (link.schedule_end && new Date(link.schedule_end) < now) return false;
      return true;
    });
  }

  // Glyph promo: show roughly 1 in 5 page views
  const showGlyphPromo = new Date().getMinutes() % 5 === 0;

  // Page view tracking (awaited — Cloudflare Workers kill process after response)
  await sb.from("ld_clicks")
    .insert({ page_id: typedPage.id, link_id: null });

  return (
    <BioPage
      page={typedPage}
      links={links}
      isPro={isPro}
      showGlyphPromo={showGlyphPromo}
    />
  );
}
