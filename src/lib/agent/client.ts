// The agent client is the seam at which a real Anthropic call would be made.
// Per decision 1 (option B), the demo runs fully in-browser using a scripted
// reasoning model so it never depends on a live network call. To swap in a
// real Claude call, replace `runAgent` with a fetch to /server/agent.ts that
// uses `@anthropic-ai/sdk` with a prompt-cached system message containing
// the symbol registry. The orchestrator (useAgentTurn) doesn't care which is
// in place.

import type { CharacterAnchor } from "../../types";

export interface PlanInput {
  utterance: string[];
  turnIndex: number;
  characters: CharacterAnchor[];
  branchUsed: boolean;
  branchChoiceId?: string;
}

export interface PlanOutput {
  narration: string;
  sceneTags: string[];
  characterAnchors: CharacterAnchor[];
  suggestedVocab: string[];
  branchReachable: boolean;
}

// Lightweight rule/scripted "reasoning" — enough to drive the rehearsed demo
// arc described in the spec while still emitting real trace events.
export async function runAgent(input: PlanInput): Promise<PlanOutput> {
  // Tiny artificial delay to feel like a model call, but bounded so the demo
  // doesn't drag.
  await new Promise((r) => setTimeout(r, 700));

  const { utterance, turnIndex, branchUsed, branchChoiceId } = input;
  const u = new Set(utterance);

  // Branch resolution turn (after the user has chosen a branch card).
  if (branchChoiceId) {
    return BRANCH_RESOLUTIONS[branchChoiceId];
  }

  // Turn 1: child taps Cat + Eat + Cake → introduces the conflict
  if (turnIndex === 1 && u.has("cat") && u.has("eat") && u.has("cake")) {
    return {
      narration:
        "Mango spotted a beautiful cake on the kitchen table. She couldn't resist — she gobbled up every last crumb!",
      sceneTags: ["cat", "eat", "cake"],
      characterAnchors: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "happy" },
      ],
      suggestedVocab: [
        "cat",
        "mom",
        "doctor",
        "hurt",
        "sad",
        "tellStory",
        "medicine",
        "hug",
        "bed",
      ],
      branchReachable: false,
    };
  }

  // Turn 2: child explores — usually Cat + Hurt or Cat + Sad → tummy ache
  if (turnIndex === 2 && u.has("cat") && (u.has("hurt") || u.has("sad"))) {
    return {
      narration:
        "Soon Mango's tummy began to hurt. She curled up tight and let out a tiny mew — what should we do?",
      sceneTags: ["cat", "hurt", "tummy"],
      characterAnchors: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "hurt" },
      ],
      suggestedVocab: [
        "doctor",
        "mom",
        "hug",
        "medicine",
        "sleep",
        "water",
        "bed",
        "sad",
        "cat",
      ],
      branchReachable: !branchUsed,
    };
  }

  // Generic fallback — keep the story moving, no branch.
  return {
    narration:
      utterance.length > 0
        ? `Mango thought about it. "${humanizeUtterance(utterance)}," she whispered, and the story carried on.`
        : "The story drifted on like a paper boat.",
    sceneTags: utterance,
    characterAnchors: input.characters,
    suggestedVocab: [
      "cat",
      "mom",
      "dad",
      "eat",
      "drink",
      "hug",
      "cake",
      "toy",
      "tellStory",
    ],
    branchReachable: false,
  };
}

function humanizeUtterance(ids: string[]): string {
  return ids.join(" ");
}

const BRANCH_RESOLUTIONS: Record<string, PlanOutput> = {
  comfort: {
    narration:
      "Mom scooped Mango up into the warmest hug. Slowly, the tummy-ache faded into a soft, sleepy purr.",
    sceneTags: ["comfort", "hug", "mom"],
    characterAnchors: [
      { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "comforted" },
      { id: "mom", name: "Mom", description: "Mango's mom", mood: "happy" },
    ],
    suggestedVocab: ["happy", "love", "sleep", "hug", "mom", "cat", "play", "garden", "tellStory"],
    branchReachable: false,
  },
  doctor: {
    narration:
      "Mom called the doctor right away. The doctor gave Mango a tiny spoon of medicine and a kind smile.",
    sceneTags: ["doctor", "medicine", "heal"],
    characterAnchors: [
      { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "healed" },
      { id: "doctor", name: "Doctor", description: "the kind doctor", mood: "happy" },
    ],
    suggestedVocab: [
      "happy",
      "love",
      "play",
      "mom",
      "doctor",
      "cat",
      "garden",
      "friend",
      "tellStory",
    ],
    branchReachable: false,
  },
  rest: {
    narration:
      "Mom tucked Mango into the softest bed with a sip of cool water. She closed her eyes and slept until the hurt drifted away.",
    sceneTags: ["rest", "sleep", "bed"],
    characterAnchors: [
      { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "tired" },
    ],
    suggestedVocab: ["happy", "love", "play", "mom", "cat", "garden", "friend", "toy", "tellStory"],
    branchReachable: false,
  },
};
