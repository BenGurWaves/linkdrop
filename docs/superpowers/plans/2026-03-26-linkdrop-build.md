# LinkDrop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build LinkDrop — an elegant link-in-bio product with guided onboarding, Quiet Luxury design, and Glyph QR bridge.

**Architecture:** Single Next.js App Router monorepo deployed to Cloudflare Pages via OpenNext. Shares Supabase instance with Glyph (project ppihdyxsegcllrsscbnt). Three route groups: (marketing) for landing/pricing, (auth) for login, (dashboard) for user management. Public bio pages served via dynamic [username] route with SSR.

**Tech Stack:** Next.js 16 + React 19 + TypeScript + Tailwind CSS 4 + Supabase + Stripe + Coinbase Commerce + OpenNext for Cloudflare

---

## File Map

### Config & Root
- `package.json` — dependencies matching Glyph (next 16, react 19, tailwind 4, supabase, opennext)
- `tsconfig.json` — TypeScript config with path aliases
- `next.config.ts` — images unoptimized (Cloudflare)
- `wrangler.jsonc` — Cloudflare worker config
- `open-next.config.ts` — OpenNext Cloudflare adapter
- `.env.local` — Supabase + Stripe + Coinbase keys
- `postcss.config.mjs` — Tailwind PostCSS

### Lib Layer (`src/lib/`)
- `supabase.ts` — Supabase client + TypeScript types for ld_pages, ld_links, ld_clicks
- `themes.ts` — 3 free themes + premium theme config type
- `detect-platform.ts` — URL → platform detection (instagram, youtube, etc.)
- `onboarding-logic.ts` — Category detection from bio text + theme matching

### Components (`src/components/`)
- `nav.tsx` — Top navigation bar (marketing + dashboard variants)
- `footer.tsx` — Footer with Calyvent branding
- `bio-page.tsx` — Shared bio page renderer (used in SSR + dashboard preview)
- `link-card.tsx` — Single link button on bio page
- `social-icon.tsx` — SVG icons for social platforms
- `theme-provider.tsx` — CSS variable injection based on theme config
- `badge.tsx` — "Made with LinkDrop" badge for free tier
- `glyph-promo.tsx` — Occasional Glyph cross-promo card

### App Routes (`src/app/`)
- `layout.tsx` — Root layout with fonts, JSON-LD, metadata
- `globals.css` — LinkDrop design system (organic pastels)
- `sitemap.ts` — Dynamic sitemap including user pages
- `robots.ts` — Crawler rules
- `(marketing)/page.tsx` — Landing page
- `(marketing)/pricing/page.tsx` — Pricing + checkout
- `(auth)/login/page.tsx` — Email/password auth
- `onboarding/page.tsx` — Guided page creation wizard
- `(dashboard)/layout.tsx` — Dashboard shell with nav
- `(dashboard)/page.tsx` — Dashboard home
- `(dashboard)/editor/page.tsx` — Link editor + profile
- `(dashboard)/analytics/page.tsx` — Click analytics (Pro)
- `(dashboard)/settings/page.tsx` — Theme, billing, domain
- `[username]/page.tsx` — Public bio page (SSR)
- `go/[id]/route.ts` — Click tracking redirect

### API Routes (`src/app/api/`)
- `checkout/route.ts` — Stripe checkout session
- `checkout/crypto/route.ts` — Coinbase Commerce charge
- `webhook/stripe/route.ts` — Stripe payment webhook
- `webhook/coinbase/route.ts` — Coinbase payment webhook
- `links/route.ts` — CRUD for links
- `links/reorder/route.ts` — Batch position update
- `glyph/route.ts` — Bridge: create QR via Glyph API

### Assets (`public/`)
- `logo.svg` — LinkDrop droplet logo (already exists)

---

## Task 1: Scaffold Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `wrangler.jsonc`, `open-next.config.ts`, `.env.local`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `public/logo.svg`

- [ ] **Step 1: Initialize Next.js project with dependencies**

Run from `/Users/bengur/linkdrop`:

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --no-import-alias --yes 2>/dev/null || true
```

Then replace `package.json`:

```json
{
  "name": "linkdrop",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
    "preview": "opennextjs-cloudflare build && opennextjs-cloudflare dev",
    "start": "next start"
  },
  "dependencies": {
    "@opennextjs/cloudflare": "^1.17.3",
    "@supabase/supabase-js": "^2.100.0",
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Create config files**

`next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
};

export default nextConfig;
```

`wrangler.jsonc`:
```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "linkdrop",
  "main": ".open-next/worker.js",
  "compatibility_date": "2025-04-01",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets"
  }
}
```

`open-next.config.ts`:
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
```

`postcss.config.mjs`:
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

- [ ] **Step 3: Create `.env.local`**

```bash
# Supabase (shared with Glyph)
NEXT_PUBLIC_SUPABASE_URL=https://ppihdyxsegcllrsscbnt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<copy from Glyph .env.local>

# Stripe (shared with Glyph)
STRIPE_SECRET_KEY=<copy from Glyph .env.local>

# Coinbase Commerce
COINBASE_COMMERCE_API_KEY=<copy from Glyph .env.local>

# Coupon
COUPON_CODE=ben28gur28waves28

# App
NEXT_PUBLIC_APP_URL=https://linkdrop.calyvent.com

# Glyph bridge
GLYPH_API_URL=https://glyph.calyvent.com
```

- [ ] **Step 4: Create `globals.css` with LinkDrop design system**

```css
@import "tailwindcss";

/* ─── LinkDrop Design System: Organic Luxury ─── */

:root {
  /* surfaces */
  --surface: #FFFFFF;
  --surface-cream: #F5F0EB;
  --surface-dark: #3A3A38;
  --surface-elevated: #FFFFFF;
  --surface-recessed: #F5F0EB;

  /* organic palette */
  --sage: #A8B5A0;
  --terracotta: #C4836A;
  --blush: #E0BFB8;
  --cream: #F5F0EB;
  --olive: #7A8370;
  --warm-gray: #B5AEA6;
  --charcoal: #3A3A38;

  /* text */
  --text-primary: #3A3A38;
  --text-secondary: #7A8370;
  --text-tertiary: #B5AEA6;
  --text-on-dark: #F5F0EB;

  /* accent (default sage) */
  --accent: #A8B5A0;
  --accent-hover: #96A68E;

  /* borders */
  --border: #E8E3DE;
  --border-subtle: #F0EBE6;

  /* radii */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* transitions */
  --transition-smooth: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 150ms ease-out;

  --background: var(--surface);
  --foreground: var(--text-primary);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-surface: var(--surface);
  --color-surface-cream: var(--surface-cream);
  --color-surface-dark: var(--surface-dark);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-sage: var(--sage);
  --color-terracotta: var(--terracotta);
  --color-blush: var(--blush);
  --color-cream: var(--cream);
  --color-olive: var(--olive);
  --color-warm-gray: var(--warm-gray);
  --color-charcoal: var(--charcoal);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-border: var(--border);
  --color-border-subtle: var(--border-subtle);
  --font-display: "Instrument Serif", Georgia, serif;
  --font-body: "DM Sans", system-ui, sans-serif;
  --font-ui: "Space Grotesk", system-ui, sans-serif;
}

body {
  background: var(--surface);
  color: var(--text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

/* ─── Utility Classes ─── */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}
.btn-outline:hover {
  background: var(--surface-cream);
}

.btn-dark {
  background: var(--charcoal);
  color: var(--cream);
}
.btn-dark:hover {
  background: #4a4a48;
}

.card {
  background: var(--surface-cream);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.card-elevated {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text-primary);
  background: #fff;
  outline: none;
  transition: border-color var(--transition-fast);
}
.input:focus {
  border-color: var(--accent);
}

.label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* ─── Animations ─── */

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-in {
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.stagger > * {
  opacity: 0;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 80ms; }
.stagger > *:nth-child(3) { animation-delay: 160ms; }
.stagger > *:nth-child(4) { animation-delay: 240ms; }
.stagger > *:nth-child(5) { animation-delay: 320ms; }
.stagger > *:nth-child(6) { animation-delay: 400ms; }
```

- [ ] **Step 5: Create root layout with fonts and JSON-LD**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Instrument_Serif, DM_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

export const metadata: Metadata = {
  title: "LinkDrop — Elegant Link-in-Bio Pages",
  description:
    "Your links deserve better than a template. LinkDrop creates beautiful, custom bio pages that look like they were designed for you. Free to start.",
  keywords: [
    "link in bio",
    "elegant link in bio page free",
    "linktree alternative",
    "bio link page",
    "link in bio page maker",
  ],
  metadataBase: new URL("https://linkdrop.calyvent.com"),
  openGraph: {
    title: "LinkDrop — Your links deserve better than a template",
    description:
      "Beautiful link-in-bio pages with guided onboarding. Answer a few questions, get a custom-designed page instantly.",
    url: "https://linkdrop.calyvent.com",
    siteName: "LinkDrop",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const jsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "LinkDrop",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://linkdrop.calyvent.com",
  description:
    "Elegant link-in-bio pages. Answer a few questions, get a custom-designed page. Free to start, Pro for $5/month.",
  offers: [
    { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free" },
    { "@type": "Offer", price: "5.00", priceCurrency: "USD", name: "Pro" },
  ],
  creator: {
    "@type": "Organization",
    name: "Calyvent",
    url: "https://calyvent.com",
  },
  datePublished: "2026-03-26",
  dateModified: "2026-03-26",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmSans.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          suppressHydrationWarning
        >
          {jsonLd}
        </script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 6: Copy logo.svg (already exists) and install deps**

```bash
cd /Users/bengur/linkdrop && pnpm install
```

- [ ] **Step 7: Verify build**

```bash
cd /Users/bengur/linkdrop && npm run build
```

Expected: Successful build with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: scaffold LinkDrop project with design system and config"
```

---

## Task 2: Database Tables

**Files:**
- Create: `src/lib/supabase.ts`

- [ ] **Step 1: Create Supabase tables via MCP tool**

Run these SQL migrations against project `ppihdyxsegcllrsscbnt`:

```sql
-- ld_pages
CREATE TABLE IF NOT EXISTS ld_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  category text DEFAULT 'other',
  theme text DEFAULT 'sage',
  accent_color text DEFAULT '#A8B5A0',
  dark_mode boolean DEFAULT false,
  custom_css jsonb DEFAULT '{}'::jsonb,
  seo_title text,
  seo_description text,
  og_image_url text,
  custom_domain text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

-- ld_links
CREATE TABLE IF NOT EXISTS ld_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES ld_pages(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  icon text,
  link_type text DEFAULT 'url' CHECK (link_type IN ('url', 'social', 'embed')),
  position integer DEFAULT 0,
  visible boolean DEFAULT true,
  schedule_start timestamptz,
  schedule_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ld_clicks
CREATE TABLE IF NOT EXISTS ld_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid REFERENCES ld_links(id) ON DELETE SET NULL,
  page_id uuid REFERENCES ld_pages(id) ON DELETE CASCADE,
  clicked_at timestamptz DEFAULT now(),
  country text,
  city text,
  device text,
  browser text,
  referrer text
);

-- RLS policies
ALTER TABLE ld_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ld_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ld_clicks ENABLE ROW LEVEL SECURITY;

-- ld_pages: owner can CRUD, anyone can read
CREATE POLICY "Public read pages" ON ld_pages FOR SELECT USING (true);
CREATE POLICY "Owner manages pages" ON ld_pages FOR ALL USING (auth.uid() = user_id);

-- ld_links: owner can CRUD, anyone can read (for public page rendering)
CREATE POLICY "Public read links" ON ld_links FOR SELECT USING (true);
CREATE POLICY "Owner manages links" ON ld_links
  FOR ALL USING (
    page_id IN (SELECT id FROM ld_pages WHERE user_id = auth.uid())
  );

-- ld_clicks: insert allowed for everyone (tracking), read for page owner
CREATE POLICY "Anyone can insert clicks" ON ld_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner reads clicks" ON ld_clicks
  FOR SELECT USING (
    page_id IN (SELECT id FROM ld_pages WHERE user_id = auth.uid())
  );

-- Index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_ld_pages_username ON ld_pages(username);
CREATE INDEX IF NOT EXISTS idx_ld_links_page_id ON ld_links(page_id);
CREATE INDEX IF NOT EXISTS idx_ld_clicks_page_id ON ld_clicks(page_id);
CREATE INDEX IF NOT EXISTS idx_ld_clicks_link_id ON ld_clicks(link_id);
```

- [ ] **Step 2: Create `src/lib/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type LdPage = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  category: string;
  theme: string;
  accent_color: string;
  dark_mode: boolean;
  custom_css: Record<string, unknown>;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  custom_domain: string | null;
  created_at: string;
  expires_at: string | null;
};

export type LdLink = {
  id: string;
  page_id: string;
  title: string;
  url: string;
  icon: string | null;
  link_type: "url" | "social" | "embed";
  position: number;
  visible: boolean;
  schedule_start: string | null;
  schedule_end: string | null;
  created_at: string;
};

export type LdClick = {
  id: string;
  link_id: string | null;
  page_id: string;
  clicked_at: string;
  country: string | null;
  city: string | null;
  device: string | null;
  browser: string | null;
  referrer: string | null;
};
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts && git commit -m "feat: add database types and Supabase client"
```

---

## Task 3: Theme System + Platform Detection

**Files:**
- Create: `src/lib/themes.ts`, `src/lib/detect-platform.ts`, `src/lib/onboarding-logic.ts`

- [ ] **Step 1: Create `src/lib/themes.ts`**

```typescript
export type Theme = {
  key: string;
  name: string;
  bg: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  linkBg: string;
  linkText: string;
  dark: boolean;
  free: boolean;
};

export const themes: Record<string, Theme> = {
  sage: {
    key: "sage",
    name: "Sage",
    bg: "#F5F0EB",
    accent: "#A8B5A0",
    textPrimary: "#3A3A38",
    textSecondary: "#7A8370",
    linkBg: "#A8B5A0",
    linkText: "#FFFFFF",
    dark: false,
    free: true,
  },
  dusk: {
    key: "dusk",
    name: "Dusk",
    bg: "#3A3A38",
    accent: "#E0BFB8",
    textPrimary: "#F5F0EB",
    textSecondary: "#B5AEA6",
    linkBg: "#E0BFB8",
    linkText: "#3A3A38",
    dark: true,
    free: true,
  },
  terracotta: {
    key: "terracotta",
    name: "Terracotta",
    bg: "#F5F0EB",
    accent: "#C4836A",
    textPrimary: "#3A3A38",
    textSecondary: "#7A8370",
    linkBg: "#C4836A",
    linkText: "#FFFFFF",
    dark: false,
    free: true,
  },
};

export const freeThemeKeys = Object.keys(themes).filter(
  (k) => themes[k].free
);

export function getTheme(key: string): Theme {
  return themes[key] || themes.sage;
}

export function themeToCSS(theme: Theme, accentOverride?: string): Record<string, string> {
  const accent = accentOverride || theme.accent;
  return {
    "--bg": theme.bg,
    "--accent": accent,
    "--text-primary": theme.textPrimary,
    "--text-secondary": theme.textSecondary,
    "--link-bg": accentOverride || theme.linkBg,
    "--link-text": theme.linkText,
  };
}
```

- [ ] **Step 2: Create `src/lib/detect-platform.ts`**

```typescript
type Platform = {
  key: string;
  name: string;
  icon: string;
};

const platforms: { pattern: RegExp; platform: Platform }[] = [
  { pattern: /instagram\.com/i, platform: { key: "instagram", name: "Instagram", icon: "instagram" } },
  { pattern: /youtube\.com|youtu\.be/i, platform: { key: "youtube", name: "YouTube", icon: "youtube" } },
  { pattern: /tiktok\.com/i, platform: { key: "tiktok", name: "TikTok", icon: "tiktok" } },
  { pattern: /twitter\.com|x\.com/i, platform: { key: "twitter", name: "X / Twitter", icon: "twitter" } },
  { pattern: /open\.spotify\.com/i, platform: { key: "spotify", name: "Spotify", icon: "spotify" } },
  { pattern: /github\.com/i, platform: { key: "github", name: "GitHub", icon: "github" } },
  { pattern: /linkedin\.com/i, platform: { key: "linkedin", name: "LinkedIn", icon: "linkedin" } },
  { pattern: /twitch\.tv/i, platform: { key: "twitch", name: "Twitch", icon: "twitch" } },
  { pattern: /discord\.gg|discord\.com/i, platform: { key: "discord", name: "Discord", icon: "discord" } },
  { pattern: /soundcloud\.com/i, platform: { key: "soundcloud", name: "SoundCloud", icon: "soundcloud" } },
  { pattern: /pinterest\.com/i, platform: { key: "pinterest", name: "Pinterest", icon: "pinterest" } },
  { pattern: /behance\.net/i, platform: { key: "behance", name: "Behance", icon: "behance" } },
  { pattern: /dribbble\.com/i, platform: { key: "dribbble", name: "Dribbble", icon: "dribbble" } },
  { pattern: /mailto:/i, platform: { key: "email", name: "Email", icon: "email" } },
];

export function detectPlatform(url: string): Platform | null {
  for (const { pattern, platform } of platforms) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

export function generateTitle(url: string): string {
  const platform = detectPlatform(url);
  if (platform) return platform.name;
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return "Link";
  }
}

export function parseLinks(raw: string): { url: string; title: string; icon: string | null; link_type: "url" | "social" }[] {
  return raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((url) => {
      if (!url.startsWith("http") && !url.startsWith("mailto:")) {
        url = "https://" + url;
      }
      const platform = detectPlatform(url);
      return {
        url,
        title: generateTitle(url),
        icon: platform?.icon || null,
        link_type: platform ? "social" as const : "url" as const,
      };
    });
}
```

- [ ] **Step 3: Create `src/lib/onboarding-logic.ts`**

```typescript
type Category = "photographer" | "musician" | "artist" | "business" | "developer" | "creator" | "other";

const categoryKeywords: Record<Category, string[]> = {
  photographer: ["photo", "camera", "portrait", "wedding", "shoot", "film", "visual"],
  musician: ["music", "band", "song", "producer", "dj", "beats", "album", "sing", "guitar"],
  artist: ["art", "paint", "draw", "illustrat", "design", "creative", "sculpt"],
  business: ["business", "consult", "freelance", "agency", "founder", "ceo", "startup", "coach"],
  developer: ["develop", "code", "program", "software", "engineer", "web", "app", "tech"],
  creator: ["content", "creator", "influenc", "blog", "vlog", "stream", "podcast"],
};

export function detectCategory(bio: string): Category {
  const lower = bio.toLowerCase();
  let bestMatch: Category = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category as Category;
    }
  }

  return bestMatch;
}

export function suggestThemes(category: Category): string[] {
  switch (category) {
    case "photographer":
    case "artist":
      return ["sage", "dusk", "terracotta"];
    case "musician":
      return ["dusk", "terracotta", "sage"];
    case "business":
    case "developer":
      return ["sage", "terracotta", "dusk"];
    case "creator":
      return ["terracotta", "sage", "dusk"];
    default:
      return ["sage", "dusk", "terracotta"];
  }
}

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "")
    .slice(0, 20);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/ && git commit -m "feat: add themes, platform detection, and onboarding logic"
```

---

## Task 4: Shared Components

**Files:**
- Create: `src/components/nav.tsx`, `src/components/footer.tsx`, `src/components/social-icon.tsx`, `src/components/badge.tsx`, `src/components/link-card.tsx`, `src/components/bio-page.tsx`, `src/components/glyph-promo.tsx`

- [ ] **Step 1: Create `src/components/nav.tsx`**

```tsx
import Link from "next/link";

export function Nav({ dashboard = false }: { dashboard?: boolean }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
            <path d="M20 4C20 4 8 18 8 26a12 12 0 0 0 24 0C32 18 20 4 20 4z" fill="#3A3A38" />
            <rect x="15" y="18" width="10" height="5" rx="2.5" stroke="#F5F0EB" strokeWidth="1.8" />
            <rect x="15" y="24" width="10" height="5" rx="2.5" stroke="#F5F0EB" strokeWidth="1.8" />
            <line x1="18" y1="23" x2="18" y2="24" stroke="#F5F0EB" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="22" y1="23" x2="22" y2="24" stroke="#F5F0EB" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <span className="font-[family-name:var(--font-instrument-serif)] text-[18px] text-[var(--charcoal)] tracking-tight">
            LinkDrop
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {dashboard ? (
            <Link href="/dashboard" className="text-[13px] font-[family-name:var(--font-space-grotesk)] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] transition-colors">
              dashboard
            </Link>
          ) : (
            <>
              <Link href="/pricing" className="text-[13px] font-[family-name:var(--font-space-grotesk)] text-[var(--text-secondary)] no-underline hover:text-[var(--text-primary)] transition-colors lowercase">
                pricing
              </Link>
              <Link href="/login" className="btn btn-dark text-[12px] no-underline">
                sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create `src/components/footer.tsx`**

```tsx
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <span className="text-[11px] text-[var(--text-tertiary)] font-[family-name:var(--font-space-grotesk)] lowercase tracking-wide">
          linkdrop by{" "}
          <Link href="https://calyvent.com" target="_blank" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] no-underline transition-colors">
            calyvent
          </Link>
          {" "}&copy; {new Date().getFullYear()}
        </span>
        <div className="flex items-center gap-4 text-[11px] font-[family-name:var(--font-space-grotesk)] lowercase tracking-wide">
          <Link href="/pricing" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] no-underline transition-colors">pricing</Link>
          <a href="https://glyph.calyvent.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] no-underline transition-colors">glyph qr</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `src/components/social-icon.tsx`**

```tsx
const icons: Record<string, JSX.Element> = {
  instagram: <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  youtube: <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z" />,
  twitter: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />,
  github: <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />,
  linkedin: <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />,
  spotify: <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 0 1-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 1 1-.277-1.216c3.809-.87 7.076-.496 9.712 1.116a.623.623 0 0 1 .207.857zm1.224-2.719a.78.78 0 0 1-1.072.257c-2.687-1.652-6.786-2.131-9.965-1.166a.78.78 0 1 1-.452-1.493c3.63-1.102 8.14-.568 11.231 1.33a.78.78 0 0 1 .258 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.935.935 0 1 1-.543-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 1 1-.954 1.611z" />,
  tiktok: <path d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0 1 15.54 3h-3.09v12.4a2.592 2.592 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3s-1.88.09-3.24-1.48z" />,
  email: <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />,
  default: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />,
};

export function SocialIcon({ platform, size = 18, className = "" }: { platform: string; size?: number; className?: string }) {
  const path = icons[platform] || icons.default;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      {path}
    </svg>
  );
}
```

- [ ] **Step 4: Create `src/components/badge.tsx`**

```tsx
export function Badge() {
  return (
    <a
      href="https://linkdrop.calyvent.com"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 no-underline opacity-50 hover:opacity-70 transition-opacity"
    >
      <svg width="12" height="12" viewBox="0 0 40 40" fill="none">
        <path d="M20 4C20 4 8 18 8 26a12 12 0 0 0 24 0C32 18 20 4 20 4z" fill="currentColor" opacity="0.4" />
        <rect x="15" y="18" width="10" height="5" rx="2.5" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
        <rect x="15" y="24" width="10" height="5" rx="2.5" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
      </svg>
      <span className="font-[family-name:var(--font-space-grotesk)] text-[9px] tracking-[1.5px] uppercase">
        Made with LinkDrop
      </span>
    </a>
  );
}
```

- [ ] **Step 5: Create `src/components/glyph-promo.tsx`**

```tsx
export function GlyphPromo() {
  return (
    <a
      href="https://glyph.calyvent.com"
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-6 p-4 rounded-xl border border-[var(--border-subtle)] no-underline hover:border-[var(--border)] transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[var(--surface-cream)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <circle cx="17.5" cy="17.5" r="2.5" />
          </svg>
        </div>
        <div>
          <span className="text-[12px] font-[family-name:var(--font-space-grotesk)] font-medium opacity-60">
            Need a QR code?
          </span>
          <span className="text-[11px] opacity-40 ml-1">
            Try Glyph — free
          </span>
        </div>
      </div>
    </a>
  );
}
```

- [ ] **Step 6: Create `src/components/link-card.tsx`**

```tsx
import { SocialIcon } from "./social-icon";
import type { LdLink } from "@/lib/supabase";

export function LinkCard({
  link,
  style,
  trackingUrl,
}: {
  link: LdLink;
  style: { bg: string; text: string };
  trackingUrl?: string;
}) {
  const href = trackingUrl || link.url;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full p-3.5 rounded-xl text-center no-underline transition-all hover:scale-[1.02] hover:shadow-md"
      style={{ background: style.bg, color: style.text }}
    >
      <div className="flex items-center justify-center gap-2.5">
        {link.icon && (
          <SocialIcon platform={link.icon} size={16} />
        )}
        <span className="font-[family-name:var(--font-dm-sans)] text-[14px] font-medium tracking-wide">
          {link.title}
        </span>
      </div>
    </a>
  );
}
```

- [ ] **Step 7: Create `src/components/bio-page.tsx`**

```tsx
import type { LdPage, LdLink } from "@/lib/supabase";
import { getTheme, themeToCSS } from "@/lib/themes";
import { LinkCard } from "./link-card";
import { Badge } from "./badge";
import { GlyphPromo } from "./glyph-promo";

export function BioPage({
  page,
  links,
  isPro,
  showGlyphPromo = false,
}: {
  page: LdPage;
  links: LdLink[];
  isPro: boolean;
  showGlyphPromo?: boolean;
}) {
  const theme = getTheme(page.theme);
  const css = themeToCSS(theme, page.accent_color);

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ background: css["--bg"], color: css["--text-primary"] }}
    >
      <div className="w-full max-w-[420px] flex flex-col items-center gap-6">
        {/* Avatar */}
        {page.avatar_url && (
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Name + Bio */}
        <div className="text-center">
          <h1
            className="font-[family-name:var(--font-instrument-serif)] text-[32px] leading-tight"
            style={{ color: css["--text-primary"] }}
          >
            {page.display_name}
          </h1>
          {page.bio && (
            <p
              className="font-[family-name:var(--font-dm-sans)] text-[14px] mt-2 max-w-xs mx-auto leading-relaxed"
              style={{ color: css["--text-secondary"] }}
            >
              {page.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="w-full flex flex-col gap-3">
          {links.map((link) => (
            <LinkCard
              key={link.id}
              link={link}
              style={{ bg: css["--link-bg"], text: css["--link-text"] }}
              trackingUrl={`/go/${link.id}`}
            />
          ))}
        </div>

        {/* Glyph Promo (free tier, occasional) */}
        {!isPro && showGlyphPromo && <GlyphPromo />}

        {/* Badge (free tier) */}
        {!isPro && (
          <div className="mt-8 pt-6 border-t border-current/10 w-full flex justify-center">
            <Badge />
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/ && git commit -m "feat: add shared UI components (nav, footer, bio page, link card, icons)"
```

---

## Task 5: Auth (Login/Signup)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create login page**

`src/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push("/onboarding");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      // Check if user has a page
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: page } = await supabase
          .from("ld_pages")
          .select("id")
          .eq("user_id", user.id)
          .single();
        router.push(page ? "/dashboard" : "/onboarding");
      }
    }
  };

  return (
    <>
      <Nav />
      <main className="flex-1 pt-14 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-[28px]">
              {isSignUp ? "Create your page" : "Welcome back"}
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)] mt-2">
              {isSignUp
                ? "Sign up to build your link-in-bio page."
                : "Sign in to manage your links."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="label">email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="you@email.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="label">password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="input"
                placeholder="at least 6 characters"
              />
            </div>

            {error && (
              <p className="text-[12px] text-[var(--terracotta)]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-dark w-full disabled:opacity-50 mt-2"
            >
              {loading ? "..." : isSignUp ? "sign up" : "sign in"}
            </button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            className="w-full text-center text-[13px] text-[var(--text-secondary)] mt-4 hover:text-[var(--text-primary)] transition-colors"
          >
            {isSignUp ? "already have an account? sign in" : "need an account? sign up"}
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/ && git commit -m "feat: add login/signup page with Supabase Auth"
```

---

## Task 6: Onboarding Flow

**Files:**
- Create: `src/app/onboarding/page.tsx`

- [ ] **Step 1: Create guided onboarding wizard**

`src/app/onboarding/page.tsx` — this is a long file (~350 lines). It implements the 5-step conversational wizard:

1. "What should we call you?" (name + username)
2. "What do you do?" (bio + category detection)
3. "Drop your links" (paste + auto-parse)
4. "Pick your vibe" (3 theme previews)
5. "Your page is live" (URL + QR + dashboard links)

The full code for this component must be written by the implementing agent. Key behaviors:
- Step state managed via `useState<1|2|3|4|5>`
- Username availability checked via Supabase query on blur
- Bio text passed through `detectCategory()` to get theme suggestions
- Links parsed via `parseLinks()` from paste input
- Step 4 renders 3 mini `BioPage` previews with suggested themes
- Step 5 writes to Supabase: creates `ld_pages` row + `ld_links` rows
- Redirects to `/dashboard` after completion

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/onboarding/ && git commit -m "feat: add guided onboarding wizard"
```

---

## Task 7: Public Bio Page + Click Tracking

**Files:**
- Create: `src/app/[username]/page.tsx`, `src/app/go/[id]/route.ts`

- [ ] **Step 1: Create `src/app/[username]/page.tsx`**

```tsx
import { createClient } from "@supabase/supabase-js";
import { BioPage } from "@/components/bio-page";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { LdPage, LdLink } from "@/lib/supabase";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const { data: page } = await supabase
    .from("ld_pages")
    .select("display_name, bio, seo_title, seo_description, og_image_url")
    .eq("username", username)
    .single();

  if (!page) return { title: "Not Found" };

  return {
    title: page.seo_title || `${page.display_name} — LinkDrop`,
    description: page.seo_description || page.bio || `${page.display_name}'s links`,
    openGraph: {
      title: page.seo_title || page.display_name,
      description: page.seo_description || page.bio || undefined,
      images: page.og_image_url ? [page.og_image_url] : undefined,
    },
  };
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const { data: page } = await supabase
    .from("ld_pages")
    .select("*")
    .eq("username", username)
    .single<LdPage>();

  if (!page) notFound();

  // Check expiration
  if (page.expires_at && new Date(page.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F0EB] px-4">
        <div className="text-center max-w-sm">
          <h1 className="font-[family-name:var(--font-instrument-serif)] text-[28px] text-[#3A3A38]">
            This page has expired
          </h1>
          <p className="text-[14px] text-[#7A8370] mt-3">
            Free pages expire after 90 days. The owner can upgrade to Pro to keep it live forever.
          </p>
          <a href="https://linkdrop.calyvent.com" className="btn btn-dark mt-6 no-underline inline-block">
            create your own page
          </a>
        </div>
      </div>
    );
  }

  // Check subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", page.user_id)
    .eq("status", "active")
    .single();
  const isPro = sub?.plan === "pro";

  // Get visible links
  const now = new Date().toISOString();
  const { data: links } = await supabase
    .from("ld_links")
    .select("*")
    .eq("page_id", page.id)
    .eq("visible", true)
    .order("position", { ascending: true });

  // Filter scheduled links
  const visibleLinks = (links || []).filter((link: LdLink) => {
    if (!isPro) return true; // Free users don't have scheduling
    if (link.schedule_start && new Date(link.schedule_start) > new Date(now)) return false;
    if (link.schedule_end && new Date(link.schedule_end) < new Date(now)) return false;
    return true;
  });

  // Show Glyph promo ~every 5th page view (deterministic based on timestamp)
  const showGlyphPromo = !isPro && new Date().getMinutes() % 5 === 0;

  // Track page view (fire and forget)
  supabase.from("ld_clicks").insert({
    page_id: page.id,
    link_id: null,
    country: null,
    device: null,
    browser: null,
    referrer: null,
  });

  return (
    <BioPage
      page={page}
      links={visibleLinks}
      isPro={isPro}
      showGlyphPromo={showGlyphPromo}
    />
  );
}
```

- [ ] **Step 2: Create `src/app/go/[id]/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: link } = await supabase
    .from("ld_links")
    .select("url, page_id")
    .eq("id", id)
    .single();

  if (!link) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Track click
  const ua = request.headers.get("user-agent") || "";
  const referrer = request.headers.get("referer") || null;
  const country = request.headers.get("cf-ipcountry") || null;
  const city = request.headers.get("cf-ipcity") || null;

  let device = "desktop";
  if (/mobile/i.test(ua)) device = "mobile";
  else if (/tablet|ipad/i.test(ua)) device = "tablet";

  let browser = "other";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = "chrome";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "safari";
  else if (/firefox/i.test(ua)) browser = "firefox";
  else if (/edg/i.test(ua)) browser = "edge";

  // Fire and forget
  supabase.from("ld_clicks").insert({
    link_id: id,
    page_id: link.page_id,
    country,
    city,
    device,
    browser,
    referrer,
  });

  return NextResponse.redirect(link.url, 302);
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\[username\]/ src/app/go/ && git commit -m "feat: add public bio page renderer and click tracking"
```

---

## Task 8: Dashboard (Home + Editor + Settings)

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/page.tsx`, `src/app/(dashboard)/editor/page.tsx`, `src/app/(dashboard)/settings/page.tsx`, `src/app/(dashboard)/analytics/page.tsx`

This is the largest task. The implementing agent must build:

- [ ] **Step 1: Dashboard layout** (`(dashboard)/layout.tsx`) — nav with dashboard mode, auth guard, redirect to /login if not authenticated
- [ ] **Step 2: Dashboard home** (`(dashboard)/page.tsx`) — page preview, quick stats (total clicks, link count), "create QR with Glyph" button, edit link
- [ ] **Step 3: Editor page** (`(dashboard)/editor/page.tsx`) — form for name/bio/avatar, link list with add/edit/delete/reorder (drag), save to Supabase
- [ ] **Step 4: Settings page** (`(dashboard)/settings/page.tsx`) — theme picker (3 free), accent color picker, dark mode toggle, Pro features gated (custom domain, SEO fields), billing section with upgrade CTA
- [ ] **Step 5: Analytics page** (`(dashboard)/analytics/page.tsx`) — Pro only, shows click data from ld_clicks grouped by link, country, device, and time
- [ ] **Step 6: Verify build and commit**

```bash
npm run build && git add src/app/\(dashboard\)/ && git commit -m "feat: add dashboard with editor, settings, and analytics"
```

---

## Task 9: Landing Page + Pricing

**Files:**
- Create: `src/app/(marketing)/page.tsx`, `src/app/(marketing)/pricing/page.tsx`

- [ ] **Step 1: Landing page** — hero with tagline "your links deserve better than a template", demo preview, features grid, pricing comparison, FAQ section with JSON-LD, Quiet Luxury design throughout
- [ ] **Step 2: Pricing page** — free vs pro comparison, Stripe checkout form (same pattern as Glyph), Coinbase crypto checkout button, coupon field
- [ ] **Step 3: Verify build and commit**

```bash
npm run build && git add src/app/\(marketing\)/ && git commit -m "feat: add landing page and pricing"
```

---

## Task 10: Payment API Routes

**Files:**
- Create: `src/app/api/checkout/route.ts`, `src/app/api/checkout/crypto/route.ts`, `src/app/api/webhook/stripe/route.ts`, `src/app/api/webhook/coinbase/route.ts`

- [ ] **Step 1: Stripe checkout** — same pattern as Glyph, product name "LinkDrop Pro", $500 cents/month, payment_method_types: card + cashapp, coupon support
- [ ] **Step 2: Coinbase Commerce checkout** — same pattern as Glyph, $5 charge, metadata with email
- [ ] **Step 3: Stripe webhook** — checkout.session.completed → upsert subscription, customer.subscription.deleted → cancel
- [ ] **Step 4: Coinbase webhook** — charge:confirmed → upsert subscription
- [ ] **Step 5: Verify build and commit**

```bash
npm run build && git add src/app/api/ && git commit -m "feat: add Stripe and Coinbase payment routes"
```

---

## Task 11: Glyph Bridge

**Files:**
- Create: `src/app/api/glyph/route.ts`
- Modify: Glyph's `src/app/page.tsx` and dashboard to add LinkDrop prompts

- [ ] **Step 1: Create LinkDrop → Glyph bridge API**

`src/app/api/glyph/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, title } = body;

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const glyphUrl = process.env.GLYPH_API_URL || "https://glyph.calyvent.com";

    // Get auth header to pass through (shared Supabase auth)
    const authHeader = request.headers.get("authorization");

    const res = await fetch(`${glyphUrl}/api/qr`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        destination_url: url,
        title: title || "LinkDrop Page",
        qr_type: "dynamic",
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bridge error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Update Glyph to prompt "Add to LinkDrop"** after QR creation (modify Glyph's QR generator component to show a link to `linkdrop.calyvent.com/onboarding` or add to existing page)

- [ ] **Step 3: Commit both repos**

```bash
cd /Users/bengur/linkdrop && git add src/app/api/glyph/ && git commit -m "feat: add Glyph QR bridge API"
cd /Users/bengur/glyph && git add -A && git commit -m "feat: add LinkDrop bridge prompt after QR creation"
```

---

## Task 12: SEO Infrastructure

**Files:**
- Create: `src/app/sitemap.ts`, `src/app/robots.ts`

- [ ] **Step 1: Create dynamic sitemap**

```typescript
import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://linkdrop.calyvent.com";
  const lastModified = new Date();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: pages } = await supabase
    .from("ld_pages")
    .select("username, created_at")
    .is("expires_at", null)
    .order("created_at", { ascending: false })
    .limit(1000);

  const userPages = (pages || []).map((p) => ({
    url: `${baseUrl}/${p.username}`,
    lastModified: new Date(p.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/login`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    ...userPages,
  ];
}
```

- [ ] **Step 2: Create robots.ts**

```typescript
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard", "/api/", "/onboarding"] },
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
    ],
    sitemap: "https://linkdrop.calyvent.com/sitemap.xml",
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/sitemap.ts src/app/robots.ts && git commit -m "feat: add dynamic sitemap and robots.txt"
```

---

## Task 13: Deploy to Cloudflare Pages

- [ ] **Step 1: Verify full build**

```bash
cd /Users/bengur/linkdrop && npm run build
```

- [ ] **Step 2: Set Cloudflare secrets**

```bash
echo "sk_live_..." | npx wrangler secret put STRIPE_SECRET_KEY
echo "cdc2a68b-..." | npx wrangler secret put COINBASE_COMMERCE_API_KEY
echo "ben28gur28waves28" | npx wrangler secret put COUPON_CODE
```

- [ ] **Step 3: Deploy**

```bash
npm run deploy
```

- [ ] **Step 4: Add custom domain**

In Cloudflare dashboard: Workers & Pages → linkdrop → Custom domains → add `linkdrop.calyvent.com`

- [ ] **Step 5: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 6: Verify live site**

Visit `https://linkdrop.calyvent.com` and confirm landing page renders.

---

## Summary

| Task | Description | Files |
|---|---|---|
| 1 | Scaffold project | 10 config + root files |
| 2 | Database tables | 1 lib file + SQL migration |
| 3 | Theme + detection | 3 lib files |
| 4 | Shared components | 7 component files |
| 5 | Auth | 1 page |
| 6 | Onboarding | 1 page (large) |
| 7 | Public bio page + tracking | 2 files |
| 8 | Dashboard | 5 pages |
| 9 | Landing + pricing | 2 pages |
| 10 | Payment routes | 4 API routes |
| 11 | Glyph bridge | 1 API route + Glyph updates |
| 12 | SEO | 2 files |
| 13 | Deploy | Config + secrets |
