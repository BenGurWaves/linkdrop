"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { parseLinks } from "@/lib/detect-platform";
import {
  detectCategory,
  suggestThemes,
  generateUsername,
  type Category,
} from "@/lib/onboarding-logic";
import { getTheme, themeToCSS } from "@/lib/themes";
import { isLinkDropPro } from "@/lib/check-pro";
import Nav from "@/components/nav";
import BioPage from "@/components/bio-page";
import type { LdPage, LdLink } from "@/lib/supabase";

type ParsedLink = {
  url: string;
  title: string;
  icon: string | null;
  link_type: "url" | "social";
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Step 2
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState<Category>("other");

  // Step 3
  const [rawLinks, setRawLinks] = useState("");
  const [parsedLinks, setParsedLinks] = useState<ParsedLink[]>([]);

  // Step 4
  const [selectedTheme, setSelectedTheme] = useState("sage");
  const [accentColor, setAccentColor] = useState("#C4836A");

  // Step 5
  const [saving, setSaving] = useState(false);
  const [liveUrl, setLiveUrl] = useState("");
  const [newPageId, setNewPageId] = useState<string | null>(null);

  // Auth guard — Pro users can create additional pages, free users with a page get redirected
  useEffect(() => {
    async function checkAccess() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUserId(data.user.id);

      // Check if user already has a page
      const { data: existingPage } = await supabase
        .from("ld_pages")
        .select("id")
        .eq("user_id", data.user.id)
        .limit(1)
        .single();

      if (existingPage) {
        // Has a page already — only Pro users can create more
        const pro = await isLinkDropPro(data.user.id);
        if (!pro) {
          router.push("/dashboard");
        }
      }
    }
    checkAccess();
  }, [router]);

  // Username availability check (debounced)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const checkUsername = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("ld_pages")
        .select("id")
        .eq("username", value)
        .limit(1)
        .single();
      setUsernameAvailable(!data);
      setCheckingUsername(false);
    }, 400);
  }, []);

  // Auto-generate username from display name
  function handleDisplayNameChange(value: string) {
    setDisplayName(value);
    if (!usernameEdited) {
      const gen = generateUsername(value);
      setUsername(gen);
      checkUsername(gen);
    }
  }

  function handleUsernameChange(value: string) {
    const clean = value.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);
    setUsername(clean);
    setUsernameEdited(true);
    checkUsername(clean);
  }

  // Bio change -> detect category
  function handleBioChange(value: string) {
    setBio(value);
    setCategory(detectCategory(value));
  }

  // Links parsing
  function handleLinksChange(value: string) {
    setRawLinks(value);
    if (value.trim()) {
      setParsedLinks(parseLinks(value));
    } else {
      setParsedLinks([]);
    }
  }

  // Inline title edit
  function updateLinkTitle(index: number, title: string) {
    setParsedLinks((prev) =>
      prev.map((l, i) => (i === index ? { ...l, title } : l))
    );
  }

  // Reorder
  function moveLink(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= parsedLinks.length) return;
    setParsedLinks((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // Step 5: save to Supabase
  async function savePage() {
    if (!userId) return;
    setSaving(true);

    const { data: page, error: pageError } = await supabase
      .from("ld_pages")
      .insert({
        user_id: userId,
        username,
        display_name: displayName,
        bio: bio || null,
        category,
        theme: selectedTheme,
        accent_color: accentColor,
        dark_mode: getTheme(selectedTheme).dark,
      })
      .select()
      .single();

    if (pageError || !page) {
      setSaving(false);
      return;
    }

    if (parsedLinks.length > 0) {
      const linksToInsert = parsedLinks.map((l, i) => ({
        page_id: page.id,
        title: l.title,
        url: l.url,
        icon: l.icon,
        link_type: l.link_type,
        position: i,
        visible: true,
      }));

      await supabase.from("ld_links").insert(linksToInsert);
    }

    setLiveUrl(`linkdrop.calyvent.com/${username}`);
    setNewPageId(page.id);
    setSaving(false);
  }

  // Enter step 5 triggers save (guard against double-fire)
  const savedRef = useRef(false);
  useEffect(() => {
    if (step === 5 && !savedRef.current) {
      savedRef.current = true;
      savePage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Theme suggestions
  const suggestedThemes = suggestThemes(category);

  // Build a mock LdPage for preview
  function buildPreviewPage(themeKey: string): LdPage {
    return {
      id: "preview",
      user_id: "",
      username,
      display_name: displayName || "Your Name",
      bio: bio || null,
      avatar_url: null,
      category,
      theme: themeKey,
      accent_color: accentColor,
      dark_mode: getTheme(themeKey).dark,
      custom_css: {},
      seo_title: null,
      seo_description: null,
      og_image_url: null,
      custom_domain: null,
      created_at: "",
      expires_at: null,
    };
  }

  function buildPreviewLinks(): LdLink[] {
    return parsedLinks.map((l, i) => ({
      id: `preview-${i}`,
      page_id: "preview",
      title: l.title,
      url: l.url,
      icon: l.icon,
      link_type: l.link_type,
      position: i,
      visible: true,
      schedule_start: null,
      schedule_end: null,
      created_at: "",
    }));
  }

  const canAdvance: Record<number, boolean> = {
    1: displayName.length >= 1 && username.length >= 2 && usernameAvailable === true,
    2: true,
    3: true,
    4: true,
  };

  if (!userId) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      <main className="flex flex-1 flex-col items-center px-5 pt-24 pb-16">
        <div className="w-full max-w-lg">
          {/* Step 1 */}
          {step === 1 && (
            <div className="animate-in">
              <h1 className="mb-8 font-[family-name:var(--font-display)] text-4xl text-text-primary">
                what should we call you?
              </h1>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="displayName" className="label">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    placeholder="Jane Doe"
                    className="input"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="username" className="label">
                    Username
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-[family-name:var(--font-ui)] text-sm text-text-tertiary">
                      linkdrop.calyvent.com/
                    </span>
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className="input flex-1"
                      maxLength={20}
                    />
                  </div>
                  {username.length >= 2 && (
                    <p
                      className={`mt-1.5 font-[family-name:var(--font-ui)] text-xs ${
                        checkingUsername
                          ? "text-text-tertiary"
                          : usernameAvailable
                            ? "text-sage"
                            : "text-terracotta"
                      }`}
                    >
                      {checkingUsername
                        ? "checking..."
                        : usernameAvailable
                          ? "available"
                          : "taken"}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canAdvance[1]}
                  className="btn btn-primary mt-4 w-full disabled:opacity-40"
                >
                  next
                </button>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="animate-in">
              <h1 className="mb-8 font-[family-name:var(--font-display)] text-4xl text-text-primary">
                what do you do?
              </h1>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="bio" className="label">
                    Short Bio
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    placeholder="photographer based in Brooklyn, shooting film + digital"
                    rows={3}
                    className="input resize-none"
                    autoFocus
                  />
                  {category !== "other" && (
                    <p className="mt-1.5 font-[family-name:var(--font-ui)] text-xs text-text-tertiary">
                      detected: {category}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="btn btn-outline flex-1"
                  >
                    back
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="btn btn-primary flex-1"
                  >
                    next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="animate-in">
              <h1 className="mb-8 font-[family-name:var(--font-display)] text-4xl text-text-primary">
                drop your links
              </h1>

              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="links" className="label">
                    Paste your links, one per line
                  </label>
                  <textarea
                    id="links"
                    value={rawLinks}
                    onChange={(e) => handleLinksChange(e.target.value)}
                    placeholder={"instagram.com/yourname\nyoutube.com/@channel\nyourwebsite.com"}
                    rows={5}
                    className="input resize-none font-mono text-xs"
                    autoFocus
                  />
                </div>

                {parsedLinks.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="label">Parsed Links</p>
                    {parsedLinks.map((link, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-lg border border-border-light px-3 py-2"
                      >
                        <span className="font-[family-name:var(--font-ui)] text-xs text-text-tertiary shrink-0">
                          {link.icon ?? "link"}
                        </span>
                        <input
                          type="text"
                          value={link.title}
                          onChange={(e) => updateLinkTitle(i, e.target.value)}
                          className="input flex-1 !border-0 !p-0 !shadow-none text-sm"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => moveLink(i, -1)}
                            disabled={i === 0}
                            className="px-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                            aria-label="Move up"
                          >
                            &uarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLink(i, 1)}
                            disabled={i === parsedLinks.length - 1}
                            className="px-1 text-text-tertiary hover:text-text-primary disabled:opacity-30"
                            aria-label="Move down"
                          >
                            &darr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="btn btn-outline flex-1"
                  >
                    back
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="btn btn-primary flex-1"
                  >
                    next
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && (
            <div className="animate-in">
              <h1 className="mb-8 font-[family-name:var(--font-display)] text-4xl text-text-primary">
                pick your vibe
              </h1>

              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-3 gap-3">
                  {suggestedThemes.map((themeKey) => {
                    const theme = getTheme(themeKey);
                    const css = themeToCSS(theme, accentColor);
                    return (
                      <button
                        key={themeKey}
                        type="button"
                        onClick={() => setSelectedTheme(themeKey)}
                        className={`overflow-hidden rounded-xl border-2 transition-all ${
                          selectedTheme === themeKey
                            ? "border-terracotta scale-[1.02]"
                            : "border-border-light hover:border-border-default"
                        }`}
                      >
                        <div
                          className="h-48 overflow-hidden"
                          style={{ transform: "scale(0.45)", transformOrigin: "top center" }}
                        >
                          <BioPage
                            page={buildPreviewPage(themeKey)}
                            links={buildPreviewLinks()}
                            isPro={false}
                          />
                        </div>
                        <div
                          className="border-t px-2 py-1.5 text-center font-[family-name:var(--font-ui)] text-xs"
                          style={{
                            backgroundColor: css["--ld-bg"],
                            color: css["--ld-text-primary"],
                            borderColor: css["--ld-text-secondary"] + "20",
                          }}
                        >
                          {theme.name}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="accent" className="label">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="accent"
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

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(3)}
                    className="btn btn-outline flex-1"
                  >
                    back
                  </button>
                  <button
                    onClick={() => setStep(5)}
                    className="btn btn-primary flex-1"
                  >
                    create my page
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5 */}
          {step === 5 && (
            <div className="animate-in text-center">
              <h1 className="mb-4 font-[family-name:var(--font-display)] text-5xl text-text-primary">
                your page is live
              </h1>

              {saving ? (
                <p className="font-[family-name:var(--font-body)] text-text-secondary">
                  setting things up...
                </p>
              ) : (
                <div className="flex flex-col items-center gap-6 mt-6">
                  <a
                    href={`https://${liveUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-[family-name:var(--font-ui)] text-lg text-terracotta underline underline-offset-4 hover:text-accent-hover transition-colors"
                  >
                    {liveUrl}
                  </a>

                  <div className="flex flex-col gap-3 w-full max-w-xs">
                    <a
                      href={`https://glyph.calyvent.com?url=https://${liveUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline w-full"
                    >
                      create a QR code with Glyph
                    </a>
                    <button
                      onClick={() => router.push(newPageId ? `/dashboard?page=${newPageId}` : "/dashboard")}
                      className="btn btn-primary w-full"
                    >
                      edit in dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
