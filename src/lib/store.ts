import { create } from "zustand";
import type { CharacterAnchor, TraceEntry, Turn } from "../types";

export type SessionPhase =
  | "idle"
  | "composing"
  | "thinking"
  | "narrating"
  | "branching"
  | "ended";

export interface SessionState {
  // App state
  phase: SessionPhase;
  utterance: string[]; // SymbolIds tapped but not yet sent
  vocab: string[]; // currently surfaced tile IDs (3x3 = 9 visible)
  curating: boolean;

  // Story state
  turns: Turn[];
  currentSceneId: string;
  currentNarration: string;
  currentCharacters: CharacterAnchor[];

  // Active reaction prompt — the SymbolId that triggered the inline
  // "what next?" card, or null if no prompt is open.
  activePromptTrigger: string | null;

  // Branch state
  branchUsed: boolean;
  branchActive: boolean;
  branchBundleIds: string[]; // ids into a bundle registry
  pendingBranchTurnIndex: number | null;

  // Dev panel + UI toggles
  devOpen: boolean;
  trace: TraceEntry[];

  // mutators
  setPhase: (p: SessionPhase) => void;
  setUtterance: (ids: string[]) => void;
  setVocab: (ids: string[], curating?: boolean) => void;
  pushTurn: (t: Turn) => void;
  setScene: (sceneId: string, narration: string, chars: CharacterAnchor[]) => void;
  setCurating: (b: boolean) => void;

  setActivePrompt: (trigger: string | null) => void;

  setBranchActive: (active: boolean, bundleIds?: string[]) => void;
  markBranchUsed: () => void;

  toggleDev: () => void;
  pushTrace: (entry: TraceEntry) => void;
  clearLive: () => void;

  reset: () => void;
}

const INITIAL_VOCAB = ["cat", "mom", "dad", "eat", "drink", "hug", "cake", "toy", "tellStory"];

export const useSession = create<SessionState>((set) => ({
  phase: "idle",
  utterance: [],
  vocab: INITIAL_VOCAB,
  curating: false,

  turns: [],
  currentSceneId: "intro",
  currentNarration:
    "Once upon a morning, a curious little cat named Mango woke up to a sunny kitchen…",
  currentCharacters: [
    { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "happy" },
  ],

  activePromptTrigger: null,

  branchUsed: false,
  branchActive: false,
  branchBundleIds: [],
  pendingBranchTurnIndex: null,

  devOpen: true,
  trace: [],

  setPhase: (p) => set({ phase: p }),
  setUtterance: (ids) => set({ utterance: ids }),
  setVocab: (ids, curating = false) => set({ vocab: ids, curating }),
  pushTurn: (t) => set((s) => ({ turns: [...s.turns, t] })),
  setScene: (sceneId, narration, chars) =>
    set({ currentSceneId: sceneId, currentNarration: narration, currentCharacters: chars }),
  setCurating: (b) => set({ curating: b }),

  setActivePrompt: (trigger) => set({ activePromptTrigger: trigger }),

  setBranchActive: (active, bundleIds) =>
    set((s) => ({
      branchActive: active,
      branchBundleIds: bundleIds ?? s.branchBundleIds,
    })),
  markBranchUsed: () => set({ branchUsed: true }),

  toggleDev: () => set((s) => ({ devOpen: !s.devOpen })),
  pushTrace: (entry) =>
    set((s) => ({
      // Demote any prior "live" entries — only the latest is live.
      trace: [...s.trace.map((t) => ({ ...t, live: false })), entry],
    })),
  clearLive: () => set((s) => ({ trace: s.trace.map((t) => ({ ...t, live: false })) })),

  reset: () =>
    set({
      phase: "idle",
      utterance: [],
      vocab: INITIAL_VOCAB,
      curating: false,
      turns: [],
      currentSceneId: "intro",
      currentNarration:
        "Once upon a morning, a curious little cat named Mango woke up to a sunny kitchen…",
      currentCharacters: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "happy" },
      ],
      activePromptTrigger: null,
      branchUsed: false,
      branchActive: false,
      branchBundleIds: [],
      pendingBranchTurnIndex: null,
      trace: [],
    }),
}));
