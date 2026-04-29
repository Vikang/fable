// Registry of pre-baked illustrations (decision 1, option B).
// In a production demo these would be hand-prepped watercolor PNGs in
// /public/scenes. Here we describe each scene with declarative SVG primitives
// — palette, primary motif, secondary motif — so the StoryCanvas can compose
// a consistent visual without external assets.

export interface Illustration {
  id: string;
  // Soft watercolor backdrop gradient stops
  sky: [string, string];
  ground: string;
  // primary motif emoji (rendered large + watercolor-filtered in canvas)
  primary: string;
  // up to 3 supporting motifs floating around
  supporting: string[];
  // soft accent dot (kitchen lamp, sun, etc.)
  accent: string;
  // descriptive sceneTags this illustration matches against
  tags: string[];
}

export const illustrations: Illustration[] = [
  {
    id: "kitchen-cake",
    sky: ["#fdeec9", "#f7d9b1"],
    ground: "#e6caa4",
    primary: "🐱",
    supporting: ["🍰", "🪟"],
    accent: "#f6c478",
    tags: ["cat", "cake", "kitchen", "find"],
  },
  {
    id: "cat-eating-cake",
    sky: ["#f9e1be", "#eecaa1"],
    ground: "#dcb585",
    primary: "🐱",
    supporting: ["🍰", "✨"],
    accent: "#f1b176",
    tags: ["cat", "eat", "cake", "gobble"],
  },
  {
    id: "tummy-ache",
    sky: ["#f4d6c2", "#e6b69b"],
    ground: "#cf9678",
    primary: "🐱",
    supporting: ["💫", "🤕"],
    accent: "#d99478",
    tags: ["cat", "hurt", "tummy", "ache"],
  },
  {
    id: "doctor-visit",
    sky: ["#dfecdf", "#bfd9c2"],
    ground: "#a4c1ab",
    primary: "👩‍⚕️",
    supporting: ["🐱", "💊"],
    accent: "#7bab91",
    tags: ["doctor", "medicine", "visit", "heal"],
  },
  {
    id: "comfort-hug",
    sky: ["#fae0d0", "#f1bda1"],
    ground: "#d99c7c",
    primary: "🤗",
    supporting: ["🐱", "👩"],
    accent: "#d97757",
    tags: ["comfort", "hug", "mom", "warm"],
  },
  {
    id: "rest-bed",
    sky: ["#e7e0d0", "#cabea4"],
    ground: "#a89d83",
    primary: "🛏️",
    supporting: ["🐱", "😴"],
    accent: "#7a736b",
    tags: ["rest", "sleep", "bed", "quiet"],
  },
  {
    id: "intro",
    sky: ["#fdf3df", "#f4e1bd"],
    ground: "#e6caa4",
    primary: "🐱",
    supporting: ["🌷", "☀️"],
    accent: "#e8b86d",
    tags: ["intro", "cat", "morning"],
  },
];

export function getIllustration(id: string): Illustration {
  const found = illustrations.find((i) => i.id === id);
  if (!found) throw new Error(`Unknown illustration id: ${id}`);
  return found;
}
