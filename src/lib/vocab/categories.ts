import type { SymbolCategory } from "../../types";

// Unified cream watercolor-paper backing for every tile, mirroring the
// Le Petit Prince reference (all tiles share one paper; the illustration
// carries the category, not the background). The hex pair is a very subtle
// vertical paper gradient so the tile reads as paper, not flat fill.
const PAPER = "linear-gradient(180deg, #fbf7f0 0%, #f5eddd 100%)";

export const categoryTint: Record<SymbolCategory, string> = {
  people: PAPER,
  action: PAPER,
  object: PAPER,
  emotion: PAPER,
  animal: PAPER,
};
