export type Category =
  | "photographer"
  | "musician"
  | "artist"
  | "business"
  | "developer"
  | "creator"
  | "other";

const categoryKeywords: Record<Category, string[]> = {
  photographer: [
    "photo",
    "photography",
    "photographer",
    "camera",
    "portrait",
    "wedding photo",
    "shoot",
    "lightroom",
    "capture",
  ],
  musician: [
    "music",
    "musician",
    "singer",
    "band",
    "producer",
    "dj",
    "songwriter",
    "rapper",
    "beats",
    "guitar",
    "piano",
    "drums",
    "vocalist",
    "soundcloud",
    "spotify",
  ],
  artist: [
    "artist",
    "art",
    "painter",
    "illustrator",
    "sculptor",
    "gallery",
    "canvas",
    "drawing",
    "sketch",
    "creative",
    "design",
    "graphic",
  ],
  business: [
    "business",
    "founder",
    "ceo",
    "entrepreneur",
    "startup",
    "company",
    "brand",
    "agency",
    "consulting",
    "marketing",
    "coach",
    "freelance",
  ],
  developer: [
    "developer",
    "engineer",
    "programming",
    "code",
    "coder",
    "software",
    "frontend",
    "backend",
    "fullstack",
    "devops",
    "github",
    "open source",
    "web dev",
  ],
  creator: [
    "creator",
    "content",
    "influencer",
    "youtuber",
    "streamer",
    "blogger",
    "vlogger",
    "podcast",
    "tiktok",
    "twitch",
  ],
  other: [],
};

export function detectCategory(bio: string): Category {
  const lower = bio.toLowerCase();
  let bestCategory: Category = "other";
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(categoryKeywords) as [
    Category,
    string[],
  ][]) {
    if (category === "other") continue;
    const score = keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

const themeSuggestions: Record<Category, string[]> = {
  photographer: ["dusk", "sage", "terracotta"],
  musician: ["dusk", "terracotta", "sage"],
  artist: ["terracotta", "sage", "dusk"],
  business: ["sage", "terracotta", "dusk"],
  developer: ["dusk", "sage", "terracotta"],
  creator: ["terracotta", "dusk", "sage"],
  other: ["sage", "dusk", "terracotta"],
};

export function suggestThemes(category: Category): string[] {
  return themeSuggestions[category] ?? themeSuggestions.other;
}

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "")
    .slice(0, 20);
}
