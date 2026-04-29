import type { CharacterAnchor } from "../../types";

export interface EvalResult {
  consistency: boolean;
  arc: boolean;
  age: boolean;
  notes: string[];
  // If consistency fails, this anchor description is the regen hint.
  regenAnchor?: string;
}

// Lightweight "self-check" — turn 2 deliberately fails consistency so the
// dev panel shows a realistic regen step (matches the mockup in decision 11
// and the rehearsed demo in the spec). All other turns pass cleanly.
export function evalTurn(turnIndex: number, characters: CharacterAnchor[]): EvalResult {
  if (turnIndex === 1) {
    const cat = characters.find((c) => c.id === "mango");
    return {
      consistency: false,
      arc: true,
      age: true,
      notes: ['anchor "ginger cat, white belly" missing in render'],
      regenAnchor: cat?.description ?? "ginger cat, white belly",
    };
  }
  return { consistency: true, arc: true, age: true, notes: [] };
}
