"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { LdPage, LdLink } from "@/lib/supabase";
import BioPage from "@/components/bio-page";

type EditableLink = {
  id: string | null;
  title: string;
  url: string;
  visible: boolean;
  position: number;
  _deleted?: boolean;
};

export default function EditorPage() {
  const router = useRouter();
  const [page, setPage] = useState<LdPage | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [editLinks, setEditLinks] = useState<EditableLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: pageData } = await supabase
        .from("ld_pages")
        .select("*")
        .eq("user_id", authData.user.id)
        .limit(1)
        .single();

      if (!pageData) {
        router.push("/onboarding");
        return;
      }

      const p = pageData as LdPage;
      setPage(p);
      setDisplayName(p.display_name);
      setBio(p.bio ?? "");
      setAvatarUrl(p.avatar_url ?? "");

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
        }))
      );
    }
    load();
  }, [router]);

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
      prev.map((l, i) =>
        i === index ? { ...l, _deleted: true } : l
      )
    );
  }

  function addLink() {
    setEditLinks((prev) => [
      ...prev,
      { id: null, title: "", url: "", visible: true, position: prev.length },
    ]);
  }

  async function save() {
    if (!page) return;
    setSaving(true);
    setSaved(false);

    // Update page
    await supabase
      .from("ld_pages")
      .update({
        display_name: displayName,
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", page.id);

    // Delete removed links
    const toDelete = editLinks.filter((l) => l._deleted && l.id);
    for (const l of toDelete) {
      await supabase.from("ld_links").delete().eq("id", l.id!);
    }

    // Upsert remaining links
    const remaining = editLinks.filter((l) => !l._deleted);
    for (let i = 0; i < remaining.length; i++) {
      const l = remaining[i];
      if (l.id) {
        await supabase
          .from("ld_links")
          .update({ title: l.title, url: l.url, visible: l.visible, position: i })
          .eq("id", l.id);
      } else {
        await supabase.from("ld_links").insert({
          page_id: page.id,
          title: l.title,
          url: l.url,
          visible: l.visible,
          position: i,
          link_type: "url",
        });
      }
    }

    // Update local page for preview
    setPage((prev) =>
      prev
        ? { ...prev, display_name: displayName, bio: bio || null, avatar_url: avatarUrl || null }
        : null
    );

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const visibleLinks = editLinks.filter((l) => !l._deleted);

  // Build preview data
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

  const previewPage: LdPage = {
    ...page,
    display_name: displayName || page.display_name,
    bio: bio || null,
    avatar_url: avatarUrl || null,
  };

  return (
    <div className="animate-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[family-name:var(--font-display)] text-[28px] font-medium text-text-primary">
          edit links
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
        {/* Editor */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Profile */}
          <div className="card">
            <p className="label mb-3">profile</p>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="displayName" className="label">
                  display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="bio" className="label">
                  bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div>
                <label htmlFor="avatar" className="label">
                  avatar url
                </label>
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
          </div>

          {/* Links */}
          <div className="card">
            <p className="label mb-3">links</p>
            <div className="flex flex-col gap-3">
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
              <BioPage page={previewPage} links={buildPreviewLinks()} isPro={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
