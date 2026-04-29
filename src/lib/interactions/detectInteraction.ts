import { getSymbol } from "../vocab/symbols";
import type { SymbolCategory } from "../../types";
import type { InteractionPair } from "./pairs";
import { findPair } from "./pairs";

// Both `people` and `animal` symbols act as story characters that can pair
// with each other or with an emotion.
const CHARACTER_CATEGORIES: ReadonlySet<SymbolCategory> = new Set<SymbolCategory>([
  "people",
  "animal",
]);

interface SymbolInfo {
  id: string;
  category: SymbolCategory;
}

function classify(ids: string[]): SymbolInfo[] {
  const out: SymbolInfo[] = [];
  for (const id of ids) {
    try {
      const s = getSymbol(id);
      out.push({ id: s.id, category: s.category });
    } catch {
      // skip unknown symbol ids defensively
    }
  }
  return out;
}

/**
 * Scan the utterance for the most recent valid pair.
 *
 * Rules:
 *   - At least one symbol must be a character (people | animal).
 *   - The other can be a character OR an emotion.
 *   - We walk pairs from the END of the utterance so the latest tap wins.
 *   - Returns null if no registered pair matches — caller decides whether to
 *     skip silently or invoke an LLM fallback.
 */
export function detectInteraction(utterance: string[]): InteractionPair | null {
  if (utterance.length < 2) return null;

  const symbols = classify(utterance);
  if (symbols.length < 2) return null;

  for (let i = symbols.length - 1; i > 0; i--) {
    for (let j = i - 1; j >= 0; j--) {
      const a = symbols[i];
      const b = symbols[j];
      const aIsChar = CHARACTER_CATEGORIES.has(a.category);
      const bIsChar = CHARACTER_CATEGORIES.has(b.category);
      const aIsEmote = a.category === "emotion";
      const bIsEmote = b.category === "emotion";

      const validShape =
        (aIsChar && bIsChar) ||
        (aIsChar && bIsEmote) ||
        (aIsEmote && bIsChar);
      if (!validShape) continue;

      const pair = findPair(a.id, b.id);
      if (pair) return pair;
    }
  }

  return null;
}
