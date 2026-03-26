export type Platform = {
  key: string;
  name: string;
  icon: string;
};

const platformPatterns: { pattern: RegExp; platform: Platform }[] = [
  {
    pattern: /instagram\.com/i,
    platform: { key: "instagram", name: "Instagram", icon: "instagram" },
  },
  {
    pattern: /youtube\.com|youtu\.be/i,
    platform: { key: "youtube", name: "YouTube", icon: "youtube" },
  },
  {
    pattern: /tiktok\.com/i,
    platform: { key: "tiktok", name: "TikTok", icon: "tiktok" },
  },
  {
    pattern: /twitter\.com|x\.com/i,
    platform: { key: "twitter", name: "X", icon: "twitter" },
  },
  {
    pattern: /spotify\.com|open\.spotify/i,
    platform: { key: "spotify", name: "Spotify", icon: "spotify" },
  },
  {
    pattern: /github\.com/i,
    platform: { key: "github", name: "GitHub", icon: "github" },
  },
  {
    pattern: /linkedin\.com/i,
    platform: { key: "linkedin", name: "LinkedIn", icon: "linkedin" },
  },
  {
    pattern: /twitch\.tv/i,
    platform: { key: "twitch", name: "Twitch", icon: "twitch" },
  },
  {
    pattern: /discord\.gg|discord\.com/i,
    platform: { key: "discord", name: "Discord", icon: "discord" },
  },
  {
    pattern: /soundcloud\.com/i,
    platform: { key: "soundcloud", name: "SoundCloud", icon: "soundcloud" },
  },
  {
    pattern: /pinterest\.com/i,
    platform: { key: "pinterest", name: "Pinterest", icon: "pinterest" },
  },
  {
    pattern: /behance\.net/i,
    platform: { key: "behance", name: "Behance", icon: "behance" },
  },
  {
    pattern: /dribbble\.com/i,
    platform: { key: "dribbble", name: "Dribbble", icon: "dribbble" },
  },
  {
    pattern: /^mailto:/i,
    platform: { key: "email", name: "Email", icon: "email" },
  },
];

export function detectPlatform(url: string): Platform | null {
  for (const { pattern, platform } of platformPatterns) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

export function generateTitle(url: string): string {
  const platform = detectPlatform(url);
  if (platform) return platform.name;

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return hostname;
  } catch {
    return url;
  }
}

export function parseLinks(
  raw: string
): { url: string; title: string; icon: string | null; link_type: "url" | "social" }[] {
  const lines = raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return lines.map((line) => {
    let url = line;
    if (!url.startsWith("http") && !url.startsWith("mailto:")) {
      url = `https://${url}`;
    }
    const platform = detectPlatform(url);
    return {
      url,
      title: generateTitle(url),
      icon: platform?.icon ?? null,
      link_type: platform ? "social" : "url",
    };
  });
}
