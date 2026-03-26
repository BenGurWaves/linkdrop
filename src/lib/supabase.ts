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
