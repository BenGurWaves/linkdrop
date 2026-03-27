"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes, freeThemeKeys, getTheme, themeToCSS } from "@/lib/themes";
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
  const [proBgColor, setProBgColor] = useState("");
  const [proLinkColor, setProLinkColor] = useState("");
  const [proLinkTextColor, setProLinkTextColor] = useState("");
  const [proTextColor, setProTextColor] = useState("");

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

      // Load Pro custom color overrides
      const css = p.custom_css ?? {};
      if (typeof css.bgColor === "string") setProBgColor(css.bgColor);
      if (typeof css.linkColor === "string") setProLinkColor(css.linkColor);
      if (typeof css.linkTextColor === "string") setProLinkTextColor(css.linkTextColor);
      if (typeof css.textColor === "string") setProTextColor(css.textColor);
    }
    load();
  }, [router, searchParams]);

  async function save() {
    if (!page) return;
    setSaving(true);
    setSaved(false);

    // Build custom_css overrides for Pro
    const customCss: Record<string, string> = {};
    if (isPro) {
      if (proBgColor) customCss.bgColor = proBgColor;
      if (proLinkColor) customCss.linkColor = proLinkColor;
      if (proLinkTextColor) customCss.linkTextColor = proLinkTextColor;
      if (proTextColor) customCss.textColor = proTextColor;
    }

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
              custom_css: customCss,
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

  const themeKeys = isPro ? Object.keys(themes) : freeThemeKeys;

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
          <p className="label mb-4">theme{isPro ? "" : " (upgrade to pro for more)"}</p>
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
                    {theme.name}{!themes[key].free ? " (pro)" : ""}
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

        {/* Pro Full Color Palette */}
        {isPro && (
          <div className="card">
            <p className="label mb-3">custom colors</p>
            <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-3">
              override individual colors. leave blank to use theme defaults.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={proBgColor || getTheme(selectedTheme).bg}
                    onChange={(e) => setProBgColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                  />
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {proBgColor || "default"}
                  </span>
                  {proBgColor && (
                    <button type="button" onClick={() => setProBgColor("")} className="text-xs text-terracotta">
                      reset
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="label">link color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={proLinkColor || getTheme(selectedTheme).linkBg}
                    onChange={(e) => setProLinkColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                  />
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {proLinkColor || "default"}
                  </span>
                  {proLinkColor && (
                    <button type="button" onClick={() => setProLinkColor("")} className="text-xs text-terracotta">
                      reset
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="label">link text</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={proLinkTextColor || getTheme(selectedTheme).linkText}
                    onChange={(e) => setProLinkTextColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                  />
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {proLinkTextColor || "default"}
                  </span>
                  {proLinkTextColor && (
                    <button type="button" onClick={() => setProLinkTextColor("")} className="text-xs text-terracotta">
                      reset
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="label">text color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={proTextColor || getTheme(selectedTheme).textPrimary}
                    onChange={(e) => setProTextColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                  />
                  <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                    {proTextColor || "default"}
                  </span>
                  {proTextColor && (
                    <button type="button" onClick={() => setProTextColor("")} className="text-xs text-terracotta">
                      reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
                <ol className="mt-2 font-[family-name:var(--font-ui)] text-xs text-text-tertiary list-decimal list-inside flex flex-col gap-1">
                  <li>add a CNAME record in your DNS provider</li>
                  <li>point it to: <code className="font-mono text-text-secondary">linkdrop.calyvent.com</code></li>
                  <li>enter your domain above and save</li>
                  <li>allow up to 24 hours for DNS propagation</li>
                </ol>
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
