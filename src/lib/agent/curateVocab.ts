// Curate the next set of tiles given the agent's suggestions, the active arc,
// and the available symbol registry. Always returns exactly 9 ids — the spec
// pins the demo grid to 3×3 (decision 7, open book layout).
//
// `exclude` removes ids that the child has just tapped this turn, so the next
// grid presents fresh choices instead of repeating items already used in the
// current utterance.
import { symbols } from "../vocab/symbols";

const FALLBACK_POOL = [
  "cat",
  "mom",
  "dad",
  "eat",
  "drink",
  "hug",
  "cake",
  "toy",
  "tellStory",
];

// Broader top-up pool used when both suggested and FALLBACK_POOL items have been
// excluded. Drawn from the full symbol registry, in stable order, so the grid
// always fills to 9 even when the LLM under-supplies and many tiles are excluded.
const FULL_POOL = symbols.map((s) => s.id);

export function curateVocab(suggested: string[], exclude: Iterable<string> = []): string[] {
  const valid = new Set(symbols.map((s) => s.id));
  const blocked = new Set(exclude);
  // "tellStory" is the action verb — never block it, even if it was just tapped.
  blocked.delete("tellStory");

  const out: string[] = [];

  const tryAdd = (id: string) => {
    if (out.length >= 9) return;
    if (!valid.has(id)) return;
    if (blocked.has(id)) return;
    if (out.includes(id)) return;
    out.push(id);
  };

  for (const id of suggested) tryAdd(id);
  for (const id of FALLBACK_POOL) tryAdd(id);
  for (const id of FULL_POOL) tryAdd(id);

  // Always end with "tellStory" so the action is reachable from any grid state.
  if (!out.includes("tellStory")) {
    if (out.length === 9) out[8] = "tellStory";
    else out.push("tellStory");
  }

  // Ensure tellStory ends up last for predictable demo composition.
  const idx = out.indexOf("tellStory");
  if (idx !== 8 && idx !== -1) {
    out.splice(idx, 1);
    out.push("tellStory");
  }

  return out.slice(0, 9);
}
