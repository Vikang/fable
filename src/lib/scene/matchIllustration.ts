import { illustrations } from "./illustrations";

// Match a set of scene tags + character anchors to a pre-baked illustration.
// Decision 1, option B: we never call an image model live — we pick the best
// pre-baked PNG for the moment by tag overlap.
export function matchIllustration(sceneTags: string[], characterIds: string[] = []): string {
  const wants = new Set([...sceneTags, ...characterIds].map((t) => t.toLowerCase()));
  let best = illustrations[0];
  let bestScore = -1;
  for (const ill of illustrations) {
    let score = 0;
    for (const t of ill.tags) if (wants.has(t.toLowerCase())) score++;
    if (score > bestScore) {
      bestScore = score;
      best = ill;
    }
  }
  return best.id;
}
