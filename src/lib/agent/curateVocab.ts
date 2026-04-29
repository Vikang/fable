// Curate the next set of tiles given the agent's suggestions, the active arc,
// and the available symbol registry. Always returns exactly 9 ids — the spec
// pins the demo grid to 3×3 (decision 7, open book layout).
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

export function curateVocab(suggested: string[]): string[] {
  const valid = new Set(symbols.map((s) => s.id));
  const out: string[] = [];

  for (const id of suggested) {
    if (valid.has(id) && !out.includes(id) && out.length < 9) out.push(id);
  }

  // Always end with "tellStory" so the action is reachable from any grid state.
  if (!out.includes("tellStory")) {
    if (out.length === 9) out[8] = "tellStory";
    else out.push("tellStory");
  }

  // Pad with fallback if the agent under-supplied.
  for (const id of FALLBACK_POOL) {
    if (out.length >= 9) break;
    if (!out.includes(id)) out.push(id);
  }

  // Ensure tellStory ends up last for predictable demo composition.
  const idx = out.indexOf("tellStory");
  if (idx !== 8 && idx !== -1) {
    out.splice(idx, 1);
    out.push("tellStory");
  }

  return out.slice(0, 9);
}
