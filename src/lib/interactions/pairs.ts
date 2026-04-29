// Character-pair interaction registry.
//
// A "pair" is two symbols the child has tapped together that should produce
// a visible emotional reaction. Pairs are keyed by sorted "a|b" so that
// (mom, dad) and (dad, mom) resolve to the same entry.
//
// Two pair shapes are supported:
//   - character + character  (mom + dad   → ❤️)
//   - character + emotion    (cat + hurt  → 😟)
//
// Each pair carries:
//   - emote:           an instant glyph that pops over the scene (~0ms)
//   - label:           accessibility text + narration hint
//   - promptTemplate:  watercolor image prompt for TokenRouter
//   - cacheKey:        stable id used for /public/interactions/<key>.png + edge cache
//
// To add a new pair: append to PAIRS. Order of `chars` doesn't matter — the
// lookup sorts. Keep cacheKey lowercase + hyphen-separated.

export type PairKind = "character-character" | "character-emotion";

export interface InteractionPair {
  chars: [string, string];
  kind: PairKind;
  emote: string;
  label: string;
  promptTemplate: string;
  cacheKey: string;
}

const STYLE =
  "soft watercolor picture-book illustration, warm pastel palette, gentle " +
  "morning light, paper texture, hand-painted brush strokes, no text, " +
  "centered composition, in the style of a quiet children's storybook";

export const PAIRS: InteractionPair[] = [
  // ─── character + character ────────────────────────────────────────────
  {
    chars: ["mom", "dad"],
    kind: "character-character",
    emote: "❤️",
    label: "love between mom and dad",
    promptTemplate: `A mom and dad smiling at each other with a soft floating heart between them. ${STYLE}`,
    cacheKey: "mom-dad-love",
  },
  {
    chars: ["mom", "cat"],
    kind: "character-character",
    emote: "🤗",
    label: "mom hugging the cat",
    promptTemplate: `A kind mom gently cradling a small ginger cat named Mango in her arms, both peaceful. ${STYLE}`,
    cacheKey: "mom-cat-hug",
  },
  {
    chars: ["dad", "cat"],
    kind: "character-character",
    emote: "🤗",
    label: "dad holding the cat",
    promptTemplate: `A warm dad lifting a small ginger cat named Mango up to his shoulder, both smiling. ${STYLE}`,
    cacheKey: "dad-cat-hug",
  },
  {
    chars: ["doctor", "cat"],
    kind: "character-character",
    emote: "💊",
    label: "doctor healing the cat",
    promptTemplate: `A gentle doctor with a stethoscope kneeling beside a small ginger cat named Mango, offering medicine on a tiny spoon. ${STYLE}`,
    cacheKey: "doctor-cat-heal",
  },
  {
    chars: ["friend", "cat"],
    kind: "character-character",
    emote: "🎈",
    label: "friend playing with the cat",
    promptTemplate: `A small child friend holding a balloon, laughing as a ginger cat named Mango chases the string. ${STYLE}`,
    cacheKey: "friend-cat-play",
  },
  {
    chars: ["mom", "doctor"],
    kind: "character-character",
    emote: "🩺",
    label: "mom and the doctor talking",
    promptTemplate: `A worried mom and a kind doctor talking softly together, the doctor reassuring her. ${STYLE}`,
    cacheKey: "mom-doctor-care",
  },

  // ─── character + emotion ──────────────────────────────────────────────
  {
    chars: ["cat", "hurt"],
    kind: "character-emotion",
    emote: "😟",
    label: "the cat is hurt",
    promptTemplate: `A small ginger cat named Mango curled up with a tummy-ache, ears low, looking poorly but not frightening. ${STYLE}`,
    cacheKey: "cat-hurt",
  },
  {
    chars: ["cat", "sad"],
    kind: "character-emotion",
    emote: "🥺",
    label: "the cat is sad",
    promptTemplate: `A small ginger cat named Mango sitting alone with a single sparkling tear on her cheek, gentle and tender. ${STYLE}`,
    cacheKey: "cat-sad",
  },
  {
    chars: ["cat", "happy"],
    kind: "character-emotion",
    emote: "✨",
    label: "the cat is happy",
    promptTemplate: `A small ginger cat named Mango leaping with joy among soft falling petals, tail high, eyes bright. ${STYLE}`,
    cacheKey: "cat-happy",
  },
  {
    chars: ["cat", "scared"],
    kind: "character-emotion",
    emote: "🫂",
    label: "the cat is scared",
    promptTemplate: `A small ginger cat named Mango hiding under a soft blanket, only her wide eyes peeking out, comforting and safe-feeling. ${STYLE}`,
    cacheKey: "cat-scared",
  },
  {
    chars: ["mom", "hurt"],
    kind: "character-emotion",
    emote: "🩹",
    label: "mom caring for someone hurt",
    promptTemplate: `A caring mom kneeling with a small bandage in hand, an expression of tender concern. ${STYLE}`,
    cacheKey: "mom-hurt-care",
  },
  {
    chars: ["dad", "hurt"],
    kind: "character-emotion",
    emote: "🩹",
    label: "dad caring for someone hurt",
    promptTemplate: `A gentle dad holding out a small bandage, soft worried smile, ready to help. ${STYLE}`,
    cacheKey: "dad-hurt-care",
  },
];

// Build a fast lookup map keyed by sorted "a|b".
const pairKey = (a: string, b: string): string =>
  [a, b].sort().join("|");

const PAIR_INDEX: ReadonlyMap<string, InteractionPair> = new Map(
  PAIRS.map((p) => [pairKey(p.chars[0], p.chars[1]), p]),
);

export function findPair(a: string, b: string): InteractionPair | null {
  return PAIR_INDEX.get(pairKey(a, b)) ?? null;
}
