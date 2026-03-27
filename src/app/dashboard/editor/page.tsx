"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes, freeThemeKeys, getTheme, themeToCSS } from "@/lib/themes";
import type { LdPage, LdLink } from "@/lib/supabase";
import Link from "next/link";
import BioPage from "@/components/bio-page";
import { isLinkDropPro } from "@/lib/check-pro";

type EditableLink = {
  id: string | null;
  title: string;
  url: string;
  visible: boolean;
  position: number;
  schedule_start?: string | null;
  schedule_end?: string | null;
  _deleted?: boolean;
};

const FONT_OPTIONS = [
  { key: "instrument-serif", name: "Instrument Serif", preview: "font-[family-name:var(--font-display)]" },
  { key: "dm-sans", name: "DM Sans", preview: "font-[family-name:var(--font-body)]" },
  { key: "space-grotesk", name: "Space Grotesk", preview: "font-[family-name:var(--font-ui)]" },
  { key: "system", name: "System", preview: "font-sans" },
];

type SectionKey = "profile" | "links" | "design" | "colors" | "fonts" | "seo";

export default function EditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data
  const [page, setPage] = useState<LdPage | null>(null);
  const [isPro, setIsPro] = useState(false);

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Links
  const [editLinks, setEditLinks] = useState<EditableLink[]>([]);

  // Design
  const [selectedTheme, setSelectedTheme] = useState("sage");
  const [darkMode, setDarkMode] = useState(false);

  // Colors
  const [accentColor, setAccentColor] = useState("#C4836A");
  const [proBgColor, setProBgColor] = useState("");
  const [proLinkColor, setProLinkColor] = useState("");
  const [proLinkTextColor, setProLinkTextColor] = useState("");
  const [proTextColor, setProTextColor] = useState("");

  // Fonts
  const [proFont, setProFont] = useState("instrument-serif");
  const [proBodyFont, setProBodyFont] = useState("dm-sans");

  // SEO
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  // UI
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    profile: true,
    links: true,
    design: false,
    colors: false,
    fonts: false,
    seo: false,
  });

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Load page data
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

      // Profile
      setDisplayName(p.display_name);
      setBio(p.bio ?? "");
      setAvatarUrl(p.avatar_url ?? "");

      // Design
      setSelectedTheme(p.theme);
      setDarkMode(p.dark_mode);
      setAccentColor(p.accent_color);

      // SEO
      setSeoTitle(p.seo_title ?? "");
      setSeoDescription(p.seo_description ?? "");

      // Pro custom overrides
      const css = p.custom_css ?? {};
      if (typeof css.bgColor === "string") setProBgColor(css.bgColor);
      if (typeof css.linkColor === "string") setProLinkColor(css.linkColor);
      if (typeof css.linkTextColor === "string") setProLinkTextColor(css.linkTextColor);
      if (typeof css.textColor === "string") setProTextColor(css.textColor);
      if (typeof css.font === "string") setProFont(css.font);
      if (typeof css.bodyFont === "string") setProBodyFont(css.bodyFont);

      // Links
      const { data: linksData } = await supabase
        .from("ld_links")
        .select("*")
        .eq("page_id", p.id)
        .order("position");

      setEditLinks(
        (linksData ?? []).map((l: LdLink) => ({
          id: l.id,
          title: l.title,
          url: l.url,
          visible: l.visible,
          position: l.position,
          schedule_start: l.schedule_start,
          schedule_end: l.schedule_end,
        }))
      );
    }
    load();
  }, [router, searchParams]);

  // Link helpers
  function updateLink(index: number, field: keyof EditableLink, value: string | boolean) {
    setEditLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  }

  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= editLinks.length) return;
    setEditLinks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((l, i) => ({ ...l, position: i }));
    });
  }

  function deleteLink(index: number) {
    setEditLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, _deleted: true } : l))
    );
  }

  function addLink() {
    setEditLinks((prev) => [
      ...prev,
      { id: null, title: "", url: "", visible: true, position: prev.length },
    ]);
  }

  // Save everything
  async function save() {
    if (!page) return;
    setSaving(true);
    setSaved(false);

    // Build custom_css
    const customCss: Record<string, string> = {};
    if (isPro) {
      if (proBgColor) customCss.bgColor = proBgColor;
      if (proLinkColor) customCss.linkColor = proLinkColor;
      if (proLinkTextColor) customCss.linkTextColor = proLinkTextColor;
      if (proTextColor) customCss.textColor = proTextColor;
      if (proFont && proFont !== "instrument-serif") customCss.font = proFont;
      if (proBodyFont && proBodyFont !== "dm-sans") customCss.bodyFont = proBodyFont;
    }

    // Update page (profile + design + seo)
    await supabase
      .from("ld_pages")
      .update({
        display_name: displayName,
        bio: bio || null,
        avatar_url: avatarUrl || null,
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

    // Delete removed links
    const toDelete = editLinks.filter((l) => l._deleted && l.id);
    await Promise.all(
      toDelete.map((l) => supabase.from("ld_links").delete().eq("id", l.id!))
    );

    // Upsert remaining links
    const remaining = editLinks.filter((l) => !l._deleted);
    await Promise.all(
      remaining.map((l, i) => {
        const scheduleFields = isPro
          ? {
              schedule_start: l.schedule_start || null,
              schedule_end: l.schedule_end || null,
            }
          : {};
        if (l.id) {
          return supabase
            .from("ld_links")
            .update({ title: l.title, url: l.url, visible: l.visible, position: i, ...scheduleFields })
            .eq("id", l.id);
        } else {
          return supabase.from("ld_links").insert({
            page_id: page.id,
            title: l.title,
            url: l.url,
            visible: l.visible,
            position: i,
            link_type: "url",
            ...scheduleFields,
          });
        }
      })
    );

    // Update local page for preview
    setPage((prev) =>
      prev
        ? {
            ...prev,
            display_name: displayName,
            bio: bio || null,
            avatar_url: avatarUrl || null,
            theme: selectedTheme,
            accent_color: accentColor,
            dark_mode: darkMode,
            custom_css: customCss,
          }
        : null
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const visibleLinks = editLinks.filter((l) => !l._deleted);

  // Build preview links
  function buildPreviewLinks(): LdLink[] {
    return visibleLinks.map((l, i) => ({
      id: l.id ?? `new-${i}`,
      page_id: page?.id ?? "",
      title: l.title || "untitled",
      url: l.url,
      icon: null,
      link_type: "url" as const,
      position: i,
      visible: l.visible,
      schedule_start: null,
      schedule_end: null,
      created_at: "",
    }));
  }

  if (!page) return null;

  // Build preview custom_css
  const customCssPreview: Record<string, string> = {};
  if (isPro) {
    if (proBgColor) customCssPreview.bgColor = proBgColor;
    if (proLinkColor) customCssPreview.linkColor = proLinkColor;
    if (proLinkTextColor) customCssPreview.linkTextColor = proLinkTextColor;
    if (proTextColor) customCssPreview.textColor = proTextColor;
    if (proFont && proFont !== "instrument-serif") customCssPreview.font = proFont;
    if (proBodyFont && proBodyFont !== "dm-sans") customCssPreview.bodyFont = proBodyFont;
  }

  const previewPage: LdPage = {
    ...page,
    display_name: displayName || page.display_name,
    bio: bio || null,
    avatar_url: avatarUrl || null,
    theme: selectedTheme,
    accent_color: accentColor,
    dark_mode: darkMode,
    custom_css: customCssPreview,
  };

  const themeKeys = isPro ? Object.keys(themes) : freeThemeKeys;

  // Collapsible section header
  function SectionHeader({ sectionKey, label, badge }: { sectionKey: SectionKey; label: string; badge?: string }) {
    return (
      <button
        type="button"
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between py-0.5"
      >
        <span className="label mb-0 flex items-center gap-2">
          {label}
          {badge && (
            <span className="rounded-full bg-sage/20 px-1.5 py-0.5 font-[family-name:var(--font-ui)] text-[9px] font-medium text-sage uppercase tracking-wider">
              {badge}
            </span>
          )}
        </span>
        <span className="text-text-tertiary text-sm">
          {openSections[sectionKey] ? "\u2212" : "+"}
        </span>
      </button>
    );
  }

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary">
          edit page
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
        {/* Controls */}
        <div className="flex-1 flex flex-col gap-4">

          {/* 1. Profile */}
          <div className="card">
            <SectionHeader sectionKey="profile" label="profile" />
            {openSections.profile && (
              <div className="flex flex-col gap-3 mt-3">
                <div>
                  <label htmlFor="displayName" className="label">display name</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="bio" className="label">bio</label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="input resize-none"
                  />
                </div>
                <div>
                  <label htmlFor="avatar" className="label">avatar url</label>
                  <input
                    id="avatar"
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    className="input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Links */}
          <div className="card">
            <SectionHeader sectionKey="links" label="links" />
            {openSections.links && (
              <div className="flex flex-col gap-3 mt-3">
                {visibleLinks.map((link, i) => (
                  <div
                    key={link.id ?? `new-${i}`}
                    className="flex items-start gap-2 rounded-lg border border-border-light p-3"
                  >
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => {
                          const realIndex = editLinks.indexOf(link);
                          updateLink(realIndex, "title", e.target.value);
                        }}
                        placeholder="link title"
                        className="input text-sm"
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => {
                          const realIndex = editLinks.indexOf(link);
                          updateLink(realIndex, "url", e.target.value);
                        }}
                        placeholder="https://"
                        className="input text-sm"
                      />
                      {isPro && (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="font-[family-name:var(--font-ui)] text-[10px] text-text-tertiary">
                              show from
                            </label>
                            <input
                              type="datetime-local"
                              value={link.schedule_start ?? ""}
                              onChange={(e) => {
                                const realIndex = editLinks.indexOf(link);
                                updateLink(realIndex, "schedule_start", e.target.value);
                              }}
                              className="input text-xs"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="font-[family-name:var(--font-ui)] text-[10px] text-text-tertiary">
                              hide after
                            </label>
                            <input
                              type="datetime-local"
                              value={link.schedule_end ?? ""}
                              onChange={(e) => {
                                const realIndex = editLinks.indexOf(link);
                                updateLink(realIndex, "schedule_end", e.target.value);
                              }}
                              className="input text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => moveLink(editLinks.indexOf(link), -1)}
                        className="px-1 text-text-tertiary hover:text-text-primary text-sm"
                        aria-label="Move up"
                      >
                        &uarr;
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const realIndex = editLinks.indexOf(link);
                          updateLink(realIndex, "visible", !link.visible);
                        }}
                        className={`w-8 h-4 rounded-full transition-colors ${
                          link.visible ? "bg-sage" : "bg-border-default"
                        }`}
                        aria-label="Toggle visibility"
                      >
                        <span
                          className={`block h-3 w-3 rounded-full bg-white transition-transform ${
                            link.visible ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveLink(editLinks.indexOf(link), 1)}
                        className="px-1 text-text-tertiary hover:text-text-primary text-sm"
                        aria-label="Move down"
                      >
                        &darr;
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteLink(editLinks.indexOf(link))}
                        className="px-1 text-terracotta hover:text-accent-hover text-xs mt-1"
                        aria-label="Delete"
                      >
                        &times;
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addLink}
                  className="btn btn-outline w-full"
                >
                  + add link
                </button>
              </div>
            )}
          </div>

          {/* 3. Design (themes + dark mode) */}
          <div className="card">
            <SectionHeader sectionKey="design" label="design" />
            {openSections.design && (
              <div className="mt-3">
                <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-3">
                  {isPro ? "all themes available" : "upgrade to pro for more themes"}
                </p>
                <div className="grid grid-cols-3 gap-3 mb-4">
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
                          {theme.name}{!themes[key].free ? " \u2726" : ""}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-border-light">
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
            )}
          </div>

          {/* 4. Colors */}
          <div className="card">
            <SectionHeader sectionKey="colors" label="colors" badge={isPro ? undefined : "pro"} />
            {openSections.colors && (
              <div className="mt-3">
                {!isPro ? (
                  <>
                    <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-2">
                      changes link button color
                    </p>
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
                    <p className="font-[family-name:var(--font-body)] text-xs text-text-tertiary mt-3">
                      upgrade to pro for full color control
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-3">
                      customize every color. themes set defaults -- tweak from there.
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
                            {proBgColor || "theme"}
                          </span>
                          {proBgColor && (
                            <button type="button" onClick={() => setProBgColor("")} className="text-xs text-terracotta">reset</button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="label">link buttons</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={proLinkColor || getTheme(selectedTheme).linkBg}
                            onChange={(e) => { setProLinkColor(e.target.value); setAccentColor(e.target.value); }}
                            className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                          />
                          <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                            {proLinkColor || "theme"}
                          </span>
                          {proLinkColor && (
                            <button type="button" onClick={() => { setProLinkColor(""); setAccentColor(getTheme(selectedTheme).accent); }} className="text-xs text-terracotta">reset</button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="label">button text</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={proLinkTextColor || getTheme(selectedTheme).linkText}
                            onChange={(e) => setProLinkTextColor(e.target.value)}
                            className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                          />
                          <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                            {proLinkTextColor || "theme"}
                          </span>
                          {proLinkTextColor && (
                            <button type="button" onClick={() => setProLinkTextColor("")} className="text-xs text-terracotta">reset</button>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="label">heading & bio</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={proTextColor || getTheme(selectedTheme).textPrimary}
                            onChange={(e) => setProTextColor(e.target.value)}
                            className="h-9 w-9 cursor-pointer rounded-md border border-border-light"
                          />
                          <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                            {proTextColor || "theme"}
                          </span>
                          {proTextColor && (
                            <button type="button" onClick={() => setProTextColor("")} className="text-xs text-terracotta">reset</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 5. Fonts (Pro) */}
          <div className="card">
            <SectionHeader sectionKey="fonts" label="fonts" badge={isPro ? undefined : "pro"} />
            {openSections.fonts && (
              <div className="mt-3">
                {!isPro ? (
                  <div className="text-center py-3">
                    <p className="font-[family-name:var(--font-body)] text-sm text-text-secondary mb-3">
                      custom fonts are available on pro.
                    </p>
                    <Link href="/pricing" className="btn btn-dark text-xs">
                      upgrade to pro
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Heading font */}
                    <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-2">
                      heading font (display name)
                    </p>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setProFont(f.key)}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            proFont === f.key
                              ? "border-terracotta"
                              : "border-border-light hover:border-border-default"
                          }`}
                        >
                          <span className={`${f.preview} text-lg text-text-primary`}>Aa</span>
                          <p className="font-[family-name:var(--font-ui)] text-[10px] text-text-tertiary mt-1">
                            {f.name}
                          </p>
                        </button>
                      ))}
                    </div>

                    {/* Body font */}
                    <p className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary mb-2">
                      body font (bio & link text)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_OPTIONS.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setProBodyFont(f.key)}
                          className={`rounded-lg border-2 p-3 text-left transition-all ${
                            proBodyFont === f.key
                              ? "border-terracotta"
                              : "border-border-light hover:border-border-default"
                          }`}
                        >
                          <span className={`${f.preview} text-sm text-text-primary`}>The quick brown fox</span>
                          <p className="font-[family-name:var(--font-ui)] text-[10px] text-text-tertiary mt-1">
                            {f.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 6. SEO (Pro) */}
          <div className="card">
            <SectionHeader sectionKey="seo" label="seo" badge={isPro ? undefined : "pro"} />
            {openSections.seo && (
              <div className="mt-3">
                {!isPro ? (
                  <div className="text-center py-3">
                    <p className="font-[family-name:var(--font-body)] text-sm text-text-secondary mb-3">
                      custom SEO fields are available on pro.
                    </p>
                    <Link href="/pricing" className="btn btn-dark text-xs">
                      upgrade to pro
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="seoTitle" className="label">seo title</label>
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
                      <label htmlFor="seoDesc" className="label">seo description</label>
                      <textarea
                        id="seoDesc"
                        value={seoDescription}
                        onChange={(e) => setSeoDescription(e.target.value)}
                        placeholder="a short description for search results"
                        rows={2}
                        className="input resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
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
              <BioPage page={previewPage} links={buildPreviewLinks()} isPro={isPro} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
