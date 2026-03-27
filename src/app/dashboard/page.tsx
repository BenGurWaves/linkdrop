"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { LdPage, LdLink } from "@/lib/supabase";
import BioPage from "@/components/bio-page";
import Link from "next/link";
import { isLinkDropPro } from "@/lib/check-pro";

export default function DashboardHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [pages, setPages] = useState<LdPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [links, setLinks] = useState<LdLink[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [stats, setStats] = useState({ totalLinks: 0, totalClicks: 0, pageViews: 0 });
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Load all pages for user
  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const u = { id: authData.user.id, email: authData.user.email ?? "" };
      setUser(u);

      const pro = await isLinkDropPro(u.id);
      setIsPro(pro);

      const { data: pagesData } = await supabase
        .from("ld_pages")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at");

      if (!pagesData || pagesData.length === 0) {
        router.push("/onboarding");
        return;
      }

      const allPages = pagesData as LdPage[];
      setPages(allPages);

      // Select page from query param or default to first
      const pageParam = searchParams.get("page");
      const initial = pageParam
        ? allPages.find((p) => p.id === pageParam) ?? allPages[0]
        : allPages[0];
      setSelectedPageId(initial.id);
    }
    load();
  }, [router, searchParams]);

  // Load links + stats when selected page changes
  useEffect(() => {
    if (!selectedPageId) return;

    async function loadPageData() {
      const { data: linksData } = await supabase
        .from("ld_links")
        .select("*")
        .eq("page_id", selectedPageId)
        .order("position");
      setLinks((linksData ?? []) as LdLink[]);

      const { count: totalClicksCount } = await supabase
        .from("ld_clicks")
        .select("id", { count: "exact", head: true })
        .eq("page_id", selectedPageId)
        .not("link_id", "is", null);

      const { count: pageViewsCount } = await supabase
        .from("ld_clicks")
        .select("id", { count: "exact", head: true })
        .eq("page_id", selectedPageId)
        .is("link_id", null);

      setStats({
        totalLinks: (linksData ?? []).length,
        totalClicks: totalClicksCount ?? 0,
        pageViews: pageViewsCount ?? 0,
      });

      setLoading(false);
    }
    loadPageData();
  }, [selectedPageId]);

  if (loading || pages.length === 0) return null;

  const page = pages.find((p) => p.id === selectedPageId) ?? pages[0];
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

      {/* Page Switcher — only visible when user has multiple pages */}
      {pages.length > 1 && (
        <div className="flex gap-3 mb-8 overflow-x-auto pb-1">
          {pages.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPageId(p.id)}
              className={`shrink-0 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                p.id === selectedPageId
                  ? "border-terracotta bg-surface-secondary"
                  : "border-border-light hover:border-border-default"
              }`}
            >
              <p className="font-[family-name:var(--font-display)] text-sm font-medium text-text-primary">
                {p.display_name}
              </p>
              <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-0.5">
                /{p.username}
              </p>
            </button>
          ))}
          {isPro && (
            <Link
              href="/onboarding"
              className="shrink-0 flex items-center justify-center rounded-xl border-2 border-dashed border-border-light px-4 py-3 text-text-tertiary hover:border-border-default hover:text-text-secondary transition-all"
            >
              <span className="font-[family-name:var(--font-ui)] text-sm">+ new page</span>
            </Link>
          )}
        </div>
      )}

      {/* Upgrade note for free users */}
      {!isPro && pages.length === 1 && (
        <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-6">
          upgrade to pro to create pages for multiple brands
        </p>
      )}

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
        <Link href={`/dashboard/editor?page=${page.id}`} className="btn btn-dark">
          edit page
        </Link>
        <button
          onClick={async () => {
            setQrLoading(true);
            setQrUrl(null);
            try {
              const res = await fetch("/api/glyph", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: `https://${pageUrl}`, title: page.display_name }),
              });
              const data = await res.json();
              if (data.tracking_url) {
                setQrUrl(data.tracking_url);
              } else if (data.short_code) {
                setQrUrl(`https://glyph.calyvent.com/q/${data.short_code}`);
              } else {
                setQrUrl(`https://glyph.calyvent.com?url=https://${pageUrl}`);
              }
            } catch {
              setQrUrl(`https://glyph.calyvent.com?url=https://${pageUrl}`);
            } finally {
              setQrLoading(false);
            }
          }}
          disabled={qrLoading}
          className="btn btn-outline disabled:opacity-50"
        >
          {qrLoading ? "creating..." : "create QR with Glyph"}
        </button>
      </div>

      {/* QR Result */}
      {qrUrl && (
        <div className="card mb-8 flex items-center justify-between animate-in">
          <div>
            <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-1">qr code created</p>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-ui)] text-sm text-terracotta hover:underline"
            >
              {qrUrl}
            </a>
          </div>
          <a
            href={qrUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline text-xs"
          >
            open
          </a>
        </div>
      )}

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
