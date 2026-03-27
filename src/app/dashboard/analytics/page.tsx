"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { LdClick } from "@/lib/supabase";
import Link from "next/link";
import { isLinkDropPro } from "@/lib/check-pro";

type ClickRow = LdClick & { link_title?: string };

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState(0);
  const [linkClicks, setLinkClicks] = useState(0);
  const [topLinks, setTopLinks] = useState<{ title: string; clicks: number }[]>([]);
  const [byCountry, setByCountry] = useState<{ country: string; count: number }[]>([]);
  const [byDevice, setByDevice] = useState<{ device: string; count: number }[]>([]);
  const [recentClicks, setRecentClicks] = useState<ClickRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const pro = await isLinkDropPro(authData.user.id);

      if (!pro) {
        setIsPro(false);
        setLoading(false);
        return;
      }
      setIsPro(true);

      const pageParam = searchParams.get("page");

      let pageData;
      if (pageParam) {
        const { data } = await supabase
          .from("ld_pages")
          .select("id")
          .eq("id", pageParam)
          .eq("user_id", authData.user.id)
          .single();
        pageData = data;
      }

      if (!pageData) {
        const { data } = await supabase
          .from("ld_pages")
          .select("id")
          .eq("user_id", authData.user.id)
          .order("created_at")
          .limit(1)
          .single();
        pageData = data;
      }

      if (!pageData) {
        router.push("/onboarding");
        return;
      }

      // Get all clicks (limited to 5000 for performance)
      const { data: clicks } = await supabase
        .from("ld_clicks")
        .select("*")
        .eq("page_id", pageData.id)
        .order("clicked_at", { ascending: false })
        .limit(5000);

      const all = (clicks ?? []) as LdClick[];

      // Get links for title mapping
      const { data: linksData } = await supabase
        .from("ld_links")
        .select("id, title")
        .eq("page_id", pageData.id);
      const linkMap = new Map((linksData ?? []).map((l: { id: string; title: string }) => [l.id, l.title]));

      // Page views vs link clicks
      const pv = all.filter((c) => !c.link_id);
      const lc = all.filter((c) => c.link_id);
      setPageViews(pv.length);
      setLinkClicks(lc.length);

      // Top links
      const linkCounts: Record<string, { title: string; clicks: number }> = {};
      for (const c of lc) {
        if (!c.link_id) continue;
        if (!linkCounts[c.link_id]) {
          linkCounts[c.link_id] = { title: linkMap.get(c.link_id) ?? "unknown", clicks: 0 };
        }
        linkCounts[c.link_id].clicks++;
      }
      setTopLinks(
        Object.values(linkCounts)
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10)
      );

      // By country
      const countryCounts: Record<string, number> = {};
      for (const c of all) {
        const country = c.country ?? "unknown";
        countryCounts[country] = (countryCounts[country] ?? 0) + 1;
      }
      setByCountry(
        Object.entries(countryCounts)
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      // By device
      const deviceCounts: Record<string, number> = {};
      for (const c of all) {
        const device = c.device ?? "unknown";
        deviceCounts[device] = (deviceCounts[device] ?? 0) + 1;
      }
      setByDevice(
        Object.entries(deviceCounts)
          .map(([device, count]) => ({ device, count }))
          .sort((a, b) => b.count - a.count)
      );

      // Recent clicks
      setRecentClicks(
        all.slice(0, 20).map((c) => ({
          ...c,
          link_title: c.link_id ? linkMap.get(c.link_id) ?? "page view" : "page view",
        }))
      );

      setLoading(false);
    }
    load();
  }, [router, searchParams]);

  if (loading) return null;

  if (!isPro) {
    return (
      <div className="animate-in text-center py-16">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary mb-4">
          analytics
        </h1>
        <p className="font-[family-name:var(--font-body)] text-sm text-text-secondary mb-6">
          detailed analytics are available on pro. see who clicks, from where, and on what device.
        </p>
        <Link href="/pricing" className="btn btn-dark">
          upgrade to pro
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary mb-8">
        analytics
      </h1>

      {/* Overview */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-text-primary">
            {pageViews}
          </p>
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-1">
            page views
          </p>
        </div>
        <div className="card text-center">
          <p className="font-[family-name:var(--font-display)] text-3xl text-text-primary">
            {linkClicks}
          </p>
          <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mt-1">
            link clicks
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Links */}
        <div className="card">
          <p className="label mb-3">top links</p>
          {topLinks.length === 0 ? (
            <p className="font-[family-name:var(--font-body)] text-sm text-text-tertiary">
              no clicks yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {topLinks.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-body)] text-sm text-text-primary truncate">
                    {l.title}
                  </span>
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary ml-2 shrink-0">
                    {l.clicks}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Country */}
        <div className="card">
          <p className="label mb-3">by country</p>
          {byCountry.length === 0 ? (
            <p className="font-[family-name:var(--font-body)] text-sm text-text-tertiary">
              no data yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {byCountry.map((c, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-body)] text-sm text-text-primary">
                    {c.country}
                  </span>
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {c.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Device */}
        <div className="card">
          <p className="label mb-3">by device</p>
          {byDevice.length === 0 ? (
            <p className="font-[family-name:var(--font-body)] text-sm text-text-tertiary">
              no data yet
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {byDevice.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-body)] text-sm text-text-primary">
                    {d.device}
                  </span>
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Clicks */}
      <div className="card">
        <p className="label mb-3">recent clicks</p>
        {recentClicks.length === 0 ? (
          <p className="font-[family-name:var(--font-body)] text-sm text-text-tertiary">
            no clicks yet
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-light">
                  <th className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-text-tertiary pb-2 pr-4">
                    link
                  </th>
                  <th className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-text-tertiary pb-2 pr-4">
                    country
                  </th>
                  <th className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-text-tertiary pb-2 pr-4">
                    device
                  </th>
                  <th className="font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-text-tertiary pb-2">
                    time
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentClicks.map((c, i) => (
                  <tr key={i} className="border-b border-border-light last:border-0">
                    <td className="font-[family-name:var(--font-body)] text-sm text-text-primary py-2 pr-4">
                      {c.link_title}
                    </td>
                    <td className="font-[family-name:var(--font-body)] text-sm text-text-secondary py-2 pr-4">
                      {c.country ?? "\u2014"}
                    </td>
                    <td className="font-[family-name:var(--font-body)] text-sm text-text-secondary py-2 pr-4">
                      {c.device ?? "\u2014"}
                    </td>
                    <td className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary py-2">
                      {new Date(c.clicked_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
