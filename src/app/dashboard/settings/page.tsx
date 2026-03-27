"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes, getTheme, themeToCSS } from "@/lib/themes";
import type { LdPage } from "@/lib/supabase";
import Link from "next/link";
import { isLinkDropPro } from "@/lib/check-pro";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<LdPage | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("sage");
  const [accentColor, setAccentColor] = useState("#C4836A");
  const [darkMode, setDarkMode] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const pro = await isLinkDropPro(authData.user.id);
      setIsPro(pro);

      const pageParam = searchParams.get("page");

      let pageData;
      if (pageParam) {
        const { data } = await supabase
          .from("ld_pages")
          .select("*")
          .eq("id", pageParam)
          .eq("user_id", authData.user.id)
          .single();
        pageData = data;
      }

      if (!pageData) {
        const { data } = await supabase
          .from("ld_pages")
          .select("*")
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

      const p = pageData as LdPage;
      setPage(p);
      setSelectedTheme(p.theme);
      setAccentColor(p.accent_color);
      setDarkMode(p.dark_mode);
      setCustomDomain(p.custom_domain ?? "");
      setSeoTitle(p.seo_title ?? "");
      setSeoDescription(p.seo_description ?? "");
    }
    load();
  }, [router, searchParams]);

  async function save() {
    if (!page) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from("ld_pages")
      .update({
        theme: selectedTheme,
        accent_color: accentColor,
        dark_mode: darkMode,
        ...(isPro
          ? {
              custom_domain: customDomain || null,
              seo_title: seoTitle || null,
              seo_description: seoDescription || null,
            }
          : {}),
      })
      .eq("id", page.id);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (!page) return null;

  const themeKeys = Object.keys(themes);

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary">
          settings
        </h1>
        <button
          onClick={save}
          disabled={saving}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? "saving..." : saved ? "saved" : "save changes"}
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Theme */}
        <div className="card">
          <p className="label mb-4">theme</p>
          <div className="grid grid-cols-3 gap-3">
            {themeKeys.map((key) => {
              const theme = getTheme(key);
              const css = themeToCSS(theme);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setSelectedTheme(key);
                    setDarkMode(theme.dark);
                  }}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    selectedTheme === key
                      ? "border-terracotta"
                      : "border-border-light hover:border-border-default"
                  }`}
                  style={{ backgroundColor: css["--ld-bg"] }}
                >
                  <div
                    className="h-2 w-full rounded-full mb-2"
                    style={{ backgroundColor: css["--ld-accent"] }}
                  />
                  <p
                    className="font-[family-name:var(--font-ui)] text-xs"
                    style={{ color: css["--ld-text-primary"] }}
                  >
                    {theme.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Accent Color */}
        <div className="card">
          <p className="label mb-3">accent color</p>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
            />
            <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
              {accentColor}
            </span>
          </div>
        </div>

        {/* Dark Mode */}
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="label mb-0">dark mode</p>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`w-10 h-5 rounded-full transition-colors ${
                darkMode ? "bg-sage" : "bg-border-default"
              }`}
            >
              <span
                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                  darkMode ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pro Section */}
        <div className="card">
          <p className="label mb-4">pro features</p>
          {isPro ? (
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="customDomain" className="label">
                  custom domain
                </label>
                <input
                  id="customDomain"
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="links.yourdomain.com"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="seoTitle" className="label">
                  seo title
                </label>
                <input
                  id="seoTitle"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="your page title for search engines"
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="seoDesc" className="label">
                  seo description
                </label>
                <textarea
                  id="seoDesc"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="a short description for search results"
                  rows={2}
                  className="input resize-none"
                />
              </div>
              <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                link scheduling is available in the editor. set start/end dates on individual links.
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="font-[family-name:var(--font-body)] text-sm text-text-secondary mb-4">
                custom domains, advanced SEO, and link scheduling are available on pro.
              </p>
              <Link href="/pricing" className="btn btn-dark">
                upgrade to pro
              </Link>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="card">
          <p className="label mb-3">account</p>
          <button onClick={signOut} className="btn btn-outline">
            sign out
          </button>
        </div>
      </div>
    </div>
  );
}
