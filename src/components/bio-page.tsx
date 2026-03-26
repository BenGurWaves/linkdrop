import type { LdPage, LdLink } from "@/lib/supabase";
import { getTheme, themeToCSS } from "@/lib/themes";
import LinkCard from "./link-card";
import GlyphPromo from "./glyph-promo";
import Badge from "./badge";

export default function BioPage({
  page,
  links,
  isPro,
  showGlyphPromo,
}: {
  page: LdPage;
  links: LdLink[];
  isPro: boolean;
  showGlyphPromo?: boolean;
}) {
  const theme = getTheme(page.theme);
  const cssVars = themeToCSS(theme, page.accent_color || undefined);

  const visibleLinks = links
    .filter((l) => l.visible)
    .sort((a, b) => a.position - b.position);

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-start px-4 py-12"
      style={{
        ...cssVars,
        backgroundColor: cssVars["--ld-bg"],
        color: cssVars["--ld-text-primary"],
      }}
    >
      <div className="w-full max-w-[420px] flex flex-col items-center gap-6 mx-auto">
        {/* Avatar */}
        {page.avatar_url && (
          <img
            src={page.avatar_url}
            alt={page.display_name}
            className="h-20 w-20 rounded-full object-cover"
            style={{
              border: `2px solid ${cssVars["--ld-accent"]}`,
            }}
          />
        )}

        {/* Display Name */}
        <h1
          className="font-[family-name:var(--font-display)] text-[32px] leading-tight text-center"
          style={{ color: cssVars["--ld-text-primary"] }}
        >
          {page.display_name}
        </h1>

        {/* Bio */}
        {page.bio && (
          <p
            className="font-[family-name:var(--font-body)] text-sm text-center max-w-xs leading-relaxed"
            style={{ color: cssVars["--ld-text-secondary"] }}
          >
            {page.bio}
          </p>
        )}

        {/* Links */}
        <div className="w-full flex flex-col gap-3 mt-2 stagger">
          {visibleLinks.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              style={{
                bg: cssVars["--ld-link-bg"],
                text: cssVars["--ld-link-text"],
              }}
              trackingUrl={`/go/${link.id}`}
            />
          ))}
        </div>

        {/* Glyph Promo */}
        {!isPro && showGlyphPromo && (
          <div className="mt-4 w-full" style={{ color: cssVars["--ld-text-secondary"] }}>
            <GlyphPromo />
          </div>
        )}

        {/* Badge */}
        {!isPro && (
          <div
            className="mt-8 w-full border-t pt-5 flex justify-center"
            style={{
              borderColor: `${cssVars["--ld-text-secondary"]}20`,
              color: cssVars["--ld-text-secondary"],
            }}
          >
            <Badge />
          </div>
        )}
      </div>
    </div>
  );
}
