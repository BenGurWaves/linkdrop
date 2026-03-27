"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes, freeThemeKeys, getTheme, themeToCSS } from "@/lib/themes";
import type { LdPage, LdLink } from "@/lib/supabase";
import Link from "next/link";
import { isLinkDropPro } from "@/lib/check-pro";
import BioPage from "@/components/bio-page";

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [page, setPage] = useState<LdPage | null>(null);
  const [links, setLinks] = useState<LdLink[]>([]);
  const [isPro, setIsPro] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("sage");
  const [accentColor, setAccentColor] = useState("#C4836A");
  const [darkMode, setDarkMode] = useState(false);
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
      setSeoTitle(p.seo_title ?? "");
      setSeoDescription(p.seo_description ?? "");

      // Fetch links for preview
      const { data: linksData } = await supabase
        .from("ld_links")
        .select("*")
        .eq("page_id", p.id)
        .order("position");
      setLinks((linksData ?? []) as LdLink[]);

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

  // Build preview page reflecting current settings state
  const customCssPreview: Record<string, string> = {};
  if (isPro) {
    if (proBgColor) customCssPreview.bgColor = proBgColor;
    if (proLinkColor) customCssPreview.linkColor = proLinkColor;
    if (proLinkTextColor) customCssPreview.linkTextColor = proLinkTextColor;
    if (proTextColor) customCssPreview.textColor = proTextColor;
  }

  const previewPage: LdPage = {
    ...page,
    theme: selectedTheme,
    accent_color: accentColor,
    dark_mode: darkMode,
    custom_css: customCssPreview,
  };

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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Settings Controls */}
        <div className="flex-1 flex flex-col gap-6">
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
                      setAccentColor(theme.accent);
                      if (isPro) {
                        setProBgColor(theme.bg);
                        setProLinkColor(theme.linkBg);
                        setProLinkTextColor(theme.linkText);
                        setProTextColor(theme.textPrimary);
                      }
                    }}
                    className={`rounded-xl border-2 p-3 transition-all overflow-hidden ${
                      selectedTheme === key
                        ? "border-terracotta ring-1 ring-terracotta"
                        : "border-border-light hover:border-border-default"
                    }`}
                    style={{ backgroundColor: css["--ld-bg"] }}
                  >
                    {/* Mini template preview */}
                    <div className="flex flex-col items-center gap-1.5 mb-2">
                      <div className="w-6 h-6 rounded-full" style={{ backgroundColor: css["--ld-accent"], opacity: 0.7 }} />
                      <div className="w-12 h-1 rounded-full" style={{ backgroundColor: css["--ld-text-primary"], opacity: 0.4 }} />
                      <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: css["--ld-text-secondary"], opacity: 0.3 }} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="h-4 w-full rounded-md" style={{ backgroundColor: css["--ld-link-bg"] }} />
                      <div className="h-4 w-full rounded-md" style={{ backgroundColor: css["--ld-link-bg"], opacity: 0.7 }} />
                    </div>
                    <p
                      className="font-[family-name:var(--font-ui)] text-[10px] mt-2 text-center"
                      style={{ color: css["--ld-text-primary"] }}
                    >
                      {theme.name}{!themes[key].free ? " ✦" : ""}
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
                <div className="opacity-60">
                  <p className="label mb-2">custom domain</p>
                  <p className="font-[family-name:var(--font-body)] text-sm text-text-secondary">
                    custom domains are coming soon. you&apos;ll be able to use your own domain like links.yourbrand.com.
                  </p>
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

        {/* Live Preview */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="card p-0 overflow-hidden sticky top-20">
            <div className="border-b border-border-light px-4 py-2">
              <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                preview
              </p>
            </div>
            <div className="max-h-[520px] overflow-y-auto" style={{ transform: "scale(0.85)", transformOrigin: "top center" }}>
              <BioPage page={previewPage} links={links} isPro={isPro} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
