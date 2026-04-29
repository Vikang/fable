import type { CharacterAnchor } from "../../types";
import { runAgent } from "./client";

export interface PlannedTurn {
  narration: string;
  sceneTags: string[];
  characterAnchors: CharacterAnchor[];
  suggestedVocab: string[];
  branchReachable: boolean;
}

export async function planTurn(args: {
  utterance: string[];
  turnIndex: number;
  characters: CharacterAnchor[];
  branchUsed: boolean;
  branchChoiceId?: string;
}): Promise<PlannedTurn> {
  return runAgent(args);
}
