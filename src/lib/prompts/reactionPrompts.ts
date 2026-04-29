// Reaction-prompt registry.
//
// When the child taps a "trigger" symbol (e.g., `hurt`), the system surfaces
// a small inline question with 2–3 curated response chips ("How can we help?
// → [mom] [doctor] [hug]"). Tapping a chip adds that symbol to the utterance
// and dismisses the prompt.
//
// This is the same pattern as the BranchOverlay (decision 10) but smaller
// and more frequent — a gentle "what next?" between every meaningful tap,
// not just once per session.
//
// To add a new reaction prompt: append to PROMPTS. Keep options in current
// vocab where possible so the chips visually echo tiles the child already
// recognizes.

export interface ReactionPrompt {
  trigger: string; // SymbolId that surfaces this prompt
  question: string; // shown in the prompt card header
  options: string[]; // 2-3 SymbolIds offered as response chips
}

export const REACTION_PROMPTS: ReactionPrompt[] = [
  // ─── emotions: invite empathy + caregiving ─────────────────────────
  {
    trigger: "hurt",
    question: "How can we help Mango?",
    options: ["mom", "doctor", "hug"],
  },
  {
    trigger: "sad",
    question: "What does Mango need?",
    options: ["hug", "mom", "friend"],
  },
  {
    trigger: "scared",
    question: "Where is safe?",
    options: ["mom", "dad", "bed"],
  },
  {
    trigger: "happy",
    question: "What does Mango want to do?",
    options: ["play", "friend", "cake"],
  },

  // ─── actions: invite specificity + agency ──────────────────────────
  {
    trigger: "eat",
    question: "What should Mango eat?",
    options: ["cake", "water", "medicine"],
  },
  {
    trigger: "drink",
    question: "What does Mango drink?",
    options: ["water", "medicine"],
  },
  {
    trigger: "sleep",
    question: "Where will Mango rest?",
    options: ["bed", "mom", "dad"],
  },
  {
    trigger: "play",
    question: "Who plays with Mango?",
    options: ["friend", "mom", "dad"],
  },
  {
    trigger: "hug",
    question: "Who gives the hug?",
    options: ["mom", "dad", "friend"],
  },
];

const INDEX = new Map(REACTION_PROMPTS.map((p) => [p.trigger, p]));

export function findReactionPrompt(symbol: string): ReactionPrompt | null {
  return INDEX.get(symbol) ?? null;
}
