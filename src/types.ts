export type SymbolCategory = "people" | "action" | "object" | "emotion" | "animal";

export interface Symbol {
  id: string;
  glyph: string;
  label: string;
  category: SymbolCategory;
}

export type CharacterMood = "neutral" | "happy" | "hurt" | "tired" | "comforted" | "healed";

export interface CharacterAnchor {
  id: string;
  name: string;
  description: string;
  mood: CharacterMood;
}

export interface Turn {
  index: number;
  utterance: string[]; // SymbolIds
  narration: string;
  sceneId: string;
  characters: CharacterAnchor[];
}

export type BranchTone = "warm" | "sage" | "muted";

export interface BranchBundle {
  id: string;
  label: string;
  tone: BranchTone;
  preview: string; // emoji glyph for preview
  cluster: string[]; // 3 SymbolIds
  recommended?: boolean;
  pickCopy: string;
  // What this branch produces when chosen
  resolveTo: {
    narration: string;
    sceneId: string;
    characters: CharacterAnchor[];
    nextVocab: string[];
  };
}

export type TraceLevel = "ok" | "warn" | "err" | "note" | "live";

export interface TraceEntry {
  id: string;
  ts: string; // formatted
  rows: { label: string; marks?: { text: string; level: TraceLevel }[] }[];
  arrow?: { text: string; tone?: TraceLevel };
  live?: boolean;
}
