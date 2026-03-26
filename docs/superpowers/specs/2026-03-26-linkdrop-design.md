# LinkDrop — Design Specification

**Date:** 2026-03-26
**Status:** Approved
**Product:** Elegant link-in-bio pages under the Calyvent umbrella
**Domain:** linkdrop.calyvent.com

---

## Positioning

"Your links deserve better than a template."

LinkDrop is not a cheaper Linktree. It's the link-in-bio tool for people who care how their page looks. Every page — free or paid — looks like it was designed by a professional, because the onboarding flow generates a unique page based on who you are and what you do.

**Competitive advantages:**
1. Design quality — Quiet Luxury aesthetic, every page looks custom
2. AI-like onboarding — answer questions, get a beautiful page instantly
3. Glyph bridge — create QR codes from LinkDrop, add links from Glyph
4. Higher design ceiling on Pro (animations, scheduling, embeds, SEO)

---

## Target Users

- Creators/influencers who need a bio link page
- Small businesses/freelancers who want a micro-landing page

---

## Architecture

Single Next.js App Router monorepo deployed to Cloudflare Pages via OpenNext.

```
linkdrop/
├── src/app/
│   ├── [username]/page.tsx       → SSR public bio pages
│   ├── (dashboard)/
│   │   ├── page.tsx              → Dashboard home
│   │   ├── editor/page.tsx       → Link editor + profile
│   │   ├── analytics/page.tsx    → Click analytics (Pro)
│   │   └── settings/page.tsx     → Theme, domain, billing
│   ├── (auth)/login/page.tsx     → Email/password auth
│   ├── (marketing)/
│   │   ├── page.tsx              → Landing page
│   │   └── pricing/page.tsx      → Pricing + checkout
│   ├── onboarding/page.tsx       → Guided page creation flow
│   ├── api/
│   │   ├── checkout/route.ts     → Stripe checkout
│   │   ├── checkout/crypto/route.ts → Coinbase Commerce
│   │   ├── webhook/stripe/route.ts
│   │   ├── webhook/coinbase/route.ts
│   │   ├── links/route.ts        → CRUD
│   │   ├── links/reorder/route.ts → Drag reorder
│   │   └── glyph/route.ts        → Bridge: create QR in Glyph
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── src/components/
│   ├── bio-page.tsx              → Shared bio page renderer (SSR + preview)
│   ├── link-card.tsx
│   ├── social-icon.tsx
│   ├── theme-provider.tsx
│   └── nav.tsx
├── src/lib/
│   ├── supabase.ts               → Shared client (same instance as Glyph)
│   ├── themes.ts                 → Theme definitions
│   ├── detect-platform.ts        → Auto-detect social platforms from URL
│   └── onboarding-logic.ts       → Category detection + theme matching
├── public/
│   ├── logo.svg
│   └── favicon.ico
├── wrangler.jsonc
├── open-next.config.ts
└── .env.local
```

---

## Tech Stack

- **Framework:** Next.js (App Router) + OpenNext for Cloudflare
- **Frontend:** React, TypeScript, Tailwind CSS
- **Database:** Supabase Postgres (shared with Glyph, project: ppihdyxsegcllrsscbnt)
- **Auth:** Supabase Auth (email/password, shared with Glyph)
- **Payments:** Stripe (cards + CashApp) + Coinbase Commerce (BTC/ETH/SOL)
- **Hosting:** Cloudflare Pages (repo: BenGurWaves/linkdrop)
- **File Storage:** Supabase Storage (profile photos)

---

## Database Schema

New tables in shared Supabase (prefixed `ld_`):

### ld_pages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid FK → auth.users | |
| username | text UNIQUE | URL slug |
| display_name | text | |
| bio | text | |
| avatar_url | text | Supabase Storage |
| category | text | creator/business/artist/musician/developer/other |
| theme | text DEFAULT 'sage' | Theme key |
| accent_color | text DEFAULT '#A8B5A0' | Free: 1 color pick |
| dark_mode | boolean DEFAULT false | |
| custom_css | jsonb | Pro: full palette, fonts, animations config |
| seo_title | text | Pro: custom meta title |
| seo_description | text | Pro: custom meta description |
| og_image_url | text | Pro: custom OG image |
| custom_domain | text | Pro: e.g. links.sarah.com |
| created_at | timestamptz | |
| expires_at | timestamptz | Free: created_at + 90 days, Pro: null |

### ld_links
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| page_id | uuid FK → ld_pages | |
| title | text | |
| url | text | |
| icon | text | Platform key or emoji |
| link_type | text | 'url' / 'social' / 'embed' |
| position | integer | Drag-to-reorder |
| visible | boolean DEFAULT true | |
| schedule_start | timestamptz | Pro: appear at |
| schedule_end | timestamptz | Pro: disappear at |
| created_at | timestamptz | |

### ld_clicks
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| link_id | uuid FK → ld_links | |
| page_id | uuid FK → ld_pages | For page view tracking |
| clicked_at | timestamptz | |
| country | text | |
| city | text | |
| device | text | |
| browser | text | |
| referrer | text | |

Shared existing tables: `auth.users`, `subscriptions`, `coupon_activations`

---

## Design System

### Colors (Organic Pastels)
- Sage: #A8B5A0
- Terracotta: #C4836A
- Blush: #E0BFB8
- Cream: #F5F0EB
- Olive: #7A8370
- Warm Gray: #B5AEA6
- Charcoal: #3A3A38

### Typography
- **Display:** Instrument Serif (headlines, user names)
- **Body:** DM Sans (descriptions, paragraphs)
- **UI:** Space Grotesk (buttons, labels, navigation)

### Logo
Droplet shape with chain link inside. SVG, works at all sizes. Charcoal on light, cream on dark.

### Free Themes (3 curated)
1. **Sage** — cream background, sage accent links, light mode
2. **Dusk** — charcoal background, blush accent, dark mode
3. **Terracotta** — cream background, terracotta accent, light mode

---

## Onboarding Flow (Guided Page Creation)

A conversational, step-by-step wizard that creates a beautiful page automatically.

### Step 1: "What should we call you?"
- Input: display name
- Auto-suggest username from name (lowercase, no spaces)
- Username availability check in real-time

### Step 2: "What do you do?"
- Input: short bio (1-2 sentences)
- Category detection from bio text:
  - photographer/videographer → earthy palette suggestion
  - musician/artist → moody palette suggestion
  - business/freelancer → clean palette suggestion
  - developer/tech → minimal palette suggestion
  - default → sage

### Step 3: "Drop your links"
- Large paste box — user dumps all their URLs at once
- Auto-parse: split by newline, detect platform from URL
- Auto-detect: Instagram, YouTube, TikTok, Twitter/X, Spotify, GitHub, LinkedIn, website
- Pull favicon and generate title from URL where possible
- User can reorder and edit titles before continuing

### Step 4: "Pick your vibe"
- Show 3 generated page previews side-by-side
- Each uses a different theme matched to their category
- User clicks to select, sees it applied live
- Option to pick accent color

### Step 5: Page is live
- Show the live URL: linkdrop.calyvent.com/username
- "Create a QR code with Glyph" button (bridge)
- "Edit in dashboard" button

Key: user never sees an empty page. First thing they see is their populated, styled bio page.

---

## Glyph Bridge (Cross-Product Integration)

Shared Supabase + shared auth enables seamless cross-product features.

### From LinkDrop → Glyph
- "Create QR code" button on dashboard
- Calls Glyph's QR API (`POST glyph.calyvent.com/api/qr`) with the user's LinkDrop page URL
- Returns QR code image for download
- QR is also saved to user's Glyph dashboard (if they have a Glyph account — same auth)

### From Glyph → LinkDrop
- After creating a QR code, prompt: "Add this to your LinkDrop page?"
- If user has a LinkDrop page, adds the destination URL as a new link
- If they don't have a page, prompts to create one (links to LinkDrop onboarding)

### Shared Auth
- Sign up on either product → account works on both
- Same email/password, same user_id in auth.users
- Subscription status checked per-product (can be free on one, pro on other)

---

## Feature Matrix

| Feature | Free | Pro ($5/mo) |
|---|---|---|
| Guided onboarding (auto page creation) | Yes | Yes |
| Profile photo + name + bio | Yes | Yes |
| Unlimited links + social icons | Yes | Yes |
| 1 accent color + dark/light mode | Yes | Yes |
| 3 curated themes | Yes | Yes |
| linkdrop.calyvent.com/username | Yes | Yes |
| Glyph QR bridge | Yes | Yes |
| Glyph cross-promo (subtle, occasional) | Yes | No |
| LinkDrop badge in footer | Yes | No |
| Links expire after 90 days | Yes | No |
| Full color palette control | No | Yes |
| Custom fonts from library | No | Yes |
| Premium themes | No | Yes |
| Entrance animations + hover effects | No | Yes |
| Embeds (Spotify, YouTube, email signup) | No | Yes |
| Link scheduling (appear/disappear) | No | Yes |
| SEO tools (meta title, OG image) | No | Yes |
| Click analytics + visitor geography | No | Yes |
| Custom domain (self-service DNS) | No | Yes |

---

## Payments

- **Stripe:** Cards + CashApp (native), $5/mo subscription
- **Coinbase Commerce:** BTC, ETH, SOL — auto-upgrade via webhook
- **Coupon:** `ben28gur28waves28` = 100% off
- Same Stripe + Coinbase accounts as Glyph
- Product name in Stripe: "LinkDrop Pro"
- Webhook endpoints: `/api/webhook/stripe`, `/api/webhook/coinbase`
- Auto-upgrade: webhook updates `subscriptions` table

---

## SEO & GEO

- JSON-LD: SoftwareApplication + FAQPage schemas
- XML sitemap (dynamic — includes public user pages)
- robots.txt: allow all crawlers including GPTBot/ClaudeBot/PerplexityBot
- Each public bio page gets: proper meta title, description, OG tags
- Answer-first landing page content
- Long-tail keyword: "elegant link in bio page free"

---

## Public Bio Page Rendering ([username])

Server-side rendered on every request:

1. Extract username from URL
2. Query `ld_pages` WHERE username = :username
3. If not found → 404
4. If found, check `expires_at` — if expired → show "page expired, upgrade to keep it" CTA
5. Query `ld_links` WHERE page_id = :id, visible = true, ORDER BY position
6. Filter scheduled links (Pro: only show if now between schedule_start and schedule_end)
7. Render with theme, colors, fonts from page config
8. If free tier: append LinkDrop badge footer + occasional Glyph promo
9. If Pro with custom SEO: use their meta title/description/OG image
10. Track page view in ld_clicks (page_id, no link_id)

---

## Link Click Tracking

Public bio page link clicks go through a redirect:
- `linkdrop.calyvent.com/go/:link_id`
- Logs click to `ld_clicks` (link_id, country, device, browser, referrer)
- Redirects to actual URL
- This enables analytics without client-side JS tracking

---

## Build Sequence

1. Scaffold Next.js project + Tailwind + Supabase client
2. Create database tables (ld_pages, ld_links, ld_clicks)
3. Auth (login/signup page, shared Supabase Auth)
4. Onboarding flow (guided page creation)
5. Public bio page renderer ([username])
6. Dashboard (editor, reorder, profile settings)
7. Themes (3 free + premium system)
8. Landing page + pricing
9. Payments (Stripe + Coinbase Commerce)
10. Analytics (Pro)
11. Glyph bridge
12. SEO infrastructure
13. Deploy to Cloudflare Pages
