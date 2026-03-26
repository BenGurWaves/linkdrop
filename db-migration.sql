-- LinkDrop Database Migration
-- Run this in Supabase SQL Editor for project: Glyph (ppihdyxsegcllrsscbnt)

-- ld_pages
CREATE TABLE ld_pages (
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
CREATE TABLE ld_links (
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
CREATE TABLE ld_clicks (
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

-- RLS
ALTER TABLE ld_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ld_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ld_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pages" ON ld_pages FOR SELECT USING (true);
CREATE POLICY "Owner manages pages" ON ld_pages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public read links" ON ld_links FOR SELECT USING (true);
CREATE POLICY "Owner manages links" ON ld_links FOR ALL USING (page_id IN (SELECT id FROM ld_pages WHERE user_id = auth.uid()));
CREATE POLICY "Anyone can insert clicks" ON ld_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY "Owner reads clicks" ON ld_clicks FOR SELECT USING (page_id IN (SELECT id FROM ld_pages WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX idx_ld_pages_username ON ld_pages(username);
CREATE INDEX idx_ld_links_page_id ON ld_links(page_id);
CREATE INDEX idx_ld_clicks_page_id ON ld_clicks(page_id);
CREATE INDEX idx_ld_clicks_link_id ON ld_clicks(link_id);
