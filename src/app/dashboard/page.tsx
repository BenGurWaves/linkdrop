"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { LdPage, LdLink } from "@/lib/supabase";
import BioPage from "@/components/bio-page";
import Link from "next/link";

export default function DashboardHome() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [page, setPage] = useState<LdPage | null>(null);
  const [links, setLinks] = useState<LdLink[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, pageViews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const u = { id: authData.user.id, email: authData.user.email ?? "" };
      setUser(u);

      // Check pro
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan")
        .eq("user_id", u.id)
        .eq("plan", "pro")
        .limit(1)
        .single();
      setIsPro(!!sub);

      // Get page
      const { data: pageData } = await supabase
        .from("ld_pages")
        .select("*")
        .eq("user_id", u.id)
        .limit(1)
        .single();

      if (!pageData) {
        router.push("/onboarding");
        return;
      }

      setPage(pageData as LdPage);

      // Get links
      const { data: linksData } = await supabase
        .from("ld_links")
        .select("*")
        .eq("page_id", pageData.id)
        .order("position");
      setLinks((linksData ?? []) as LdLink[]);

      // Get stats
      const { data: clicks } = await supabase
        .from("ld_clicks")
        .select("id, link_id")
        .eq("page_id", pageData.id);

      const allClicks = clicks ?? [];
      const pageViews = allClicks.filter((c) => !c.link_id).length;
      const linkClicks = allClicks.filter((c) => c.link_id).length;

      setStats({
        totalLinks: (linksData ?? []).length,
        totalClicks: linkClicks,
        pageViews,
      });

      setLoading(false);
    }
    load();
  }, [router]);

  if (loading || !page) return null;

  const pageUrl = `linkdrop.calyvent.com/${page.username}`;

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary">
          dashboard
        </h1>
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-ui)] text-sm text-text-secondary">
            {user?.email}
          </span>
          {isPro && (
            <span className="rounded-full bg-sage px-2 py-0.5 font-[family-name:var(--font-ui)] text-[10px] font-medium text-white uppercase tracking-wider">
              pro
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-text-primary">
            {stats.totalLinks}
          </p>
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-1">
            links
          </p>
        </div>
        <div className="card text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-text-primary">
            {stats.totalClicks}
          </p>
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-1">
            clicks
          </p>
        </div>
        <div className="card text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-text-primary">
            {stats.pageViews}
          </p>
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-1">
            page views
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/dashboard/editor" className="btn btn-dark">
          edit links
        </Link>
        <Link href="/dashboard/settings" className="btn btn-outline">
          settings
        </Link>
        <a
          href={`https://glyph.calyvent.com?url=https://${pageUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          create QR with Glyph
        </a>
      </div>

      {/* Live Preview */}
      <div className="card p-0 overflow-hidden">
        <div className="border-b border-border-light px-4 py-2 flex items-center justify-between">
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
            live preview
          </p>
          <a
            href={`https://${pageUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-[family-name:var(--font-ui)] text-xs text-terracotta hover:underline"
          >
            {pageUrl}
          </a>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          <BioPage page={page} links={links} isPro={isPro} />
        </div>
      </div>
    </div>
  );
}
