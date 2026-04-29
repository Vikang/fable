import type { SymbolCategory } from "../../types";

// Each category gets a tinted radial-gradient backing for the tile art patch.
export const categoryTint: Record<SymbolCategory, string> = {
  people: "radial-gradient(circle at 30% 30%, #d8eadf 0%, #b9d8c5 100%)",
  action: "radial-gradient(circle at 30% 30%, #fce8bf 0%, #efce86 100%)",
  object: "radial-gradient(circle at 30% 30%, #f4eee2 0%, #e0d6c4 100%)",
  emotion: "radial-gradient(circle at 30% 30%, #fad9c8 0%, #f0b59a 100%)",
  animal: "radial-gradient(circle at 30% 30%, #f1cdb8 0%, #d99a78 100%)",
};
