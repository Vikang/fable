import type { CharacterAnchor } from "../../types";
import { getSupabase } from "../supabase";
import { logTurn } from "./logTurn";

export interface PlanInput {
  utterance: string[];
  turnIndex: number;
  characters: CharacterAnchor[];
  branchUsed: boolean;
  branchChoiceId?: string;
  // Story-so-far context. Up to the last 5 turns of narration text and the
  // tapped utterances that produced them, in chronological order. Lets the
  // model continue the actual tale instead of starting a fresh beat.
  priorNarration?: string[];
  priorUtterances?: string[][];
}

export interface PlanOutput {
  narration: string;
  sceneTags: string[];
  // Optional LLM-emitted scene id from the fixed catalog. If present and
  // valid, the orchestrator uses it directly instead of running tag matching.
  sceneId?: string;
  characterAnchors: CharacterAnchor[];
  suggestedVocab: string[];
  branchReachable: boolean;
}

interface EdgeAgentMeta {
  model: string;
  latency_ms: number;
}

interface EdgeAgentResponse extends PlanOutput {
  _meta?: EdgeAgentMeta;
}

const MOODS = new Set<CharacterAnchor["mood"]>([
  "neutral",
  "happy",
  "hurt",
  "tired",
  "comforted",
  "healed",
]);

// Real model call via the Supabase Edge Function `agent`, which routes to
// TokenRouter (anthropic/claude-opus-4.5). Falls back to the scripted reasoner
// on any error so the demo never bricks.
export async function runAgent(input: PlanInput): Promise<PlanOutput> {
  const started = performance.now();

  try {
    const live = await callEdgeAgent(input);
    const output = sanitize(live, input);
    logTurn({
      input,
      output,
      model: live._meta?.model ?? "tokenrouter:anthropic/claude-opus-4.5",
      latencyMs: Math.round(live._meta?.latency_ms ?? performance.now() - started),
    });
    return output;
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn("runAgent: edge call failed, falling back to scripted:", err);
    }
    const output = scriptedRunAgent(input);
    logTurn({
      input,
      output,
      model: "scripted-fallback",
      latencyMs: Math.round(performance.now() - started),
    });
    return output;
  }
}

async function callEdgeAgent(input: PlanInput): Promise<EdgeAgentResponse> {
  const supabase = getSupabase();
  if (!supabase) {
    throw new Error("Supabase client not configured (missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)");
  }
  const { data, error } = await supabase.functions.invoke<EdgeAgentResponse>("agent", {
    body: input,
  });
  if (error) throw error;
  if (!data) throw new Error("Edge function returned no data");
  if (typeof data.narration !== "string") {
    throw new Error("Edge response missing narration");
  }
  return data;
}

// Defensive normalization: clamp moods to known values, ensure arrays exist.
// Lets us tolerate small model deviations without breaking the renderer.
const KNOWN_SCENES = new Set([
  "intro",
  "kitchen-cake",
  "cat-eating-cake",
  "tummy-ache",
  "doctor-visit",
  "comfort-hug",
  "rest-bed",
]);

function sanitize(raw: EdgeAgentResponse, input: PlanInput): PlanOutput {
  return {
    narration: raw.narration,
    sceneTags: Array.isArray(raw.sceneTags) ? raw.sceneTags.slice(0, 4) : input.utterance,
    sceneId: typeof raw.sceneId === "string" && KNOWN_SCENES.has(raw.sceneId) ? raw.sceneId : undefined,
    characterAnchors: Array.isArray(raw.characterAnchors) && raw.characterAnchors.length > 0
      ? raw.characterAnchors.map((c) => ({
          id: String(c.id ?? "mango"),
          name: String(c.name ?? "Mango"),
          description: String(c.description ?? "a curious ginger cat"),
          mood: MOODS.has(c.mood as CharacterAnchor["mood"])
            ? (c.mood as CharacterAnchor["mood"])
            : "neutral",
        }))
      : input.characters.length > 0
        ? input.characters
        : [{ id: "mango", name: "Mango", description: "a curious ginger cat", mood: "neutral" }],
    suggestedVocab: Array.isArray(raw.suggestedVocab) ? raw.suggestedVocab.slice(0, 9) : [],
    branchReachable: Boolean(raw.branchReachable) && !input.branchUsed,
  };
}

// ---- Scripted fallback (preserved verbatim from the demo's original logic) --

function scriptedRunAgent(input: PlanInput): PlanOutput {
  const { utterance, turnIndex, branchUsed, branchChoiceId } = input;
  const u = new Set(utterance);

  if (branchChoiceId) {
    return BRANCH_RESOLUTIONS[branchChoiceId];
  }

  if (turnIndex === 1 && u.has("cat") && u.has("eat") && u.has("cake")) {
    return {
      narration:
        "Mango spotted a beautiful cake on the kitchen table. She couldn't resist — she gobbled up every last crumb!",
      sceneTags: ["cat", "eat", "cake"],
      characterAnchors: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "happy" },
      ],
      suggestedVocab: [
        "cat", "mom", "doctor", "hurt", "sad", "tellStory", "medicine", "hug", "bed",
      ],
      branchReachable: false,
    };
  }

  if (turnIndex === 2 && u.has("cat") && (u.has("hurt") || u.has("sad"))) {
    return {
      narration:
        "Soon Mango's tummy began to hurt. She curled up tight and let out a tiny mew — what should we do?",
      sceneTags: ["cat", "hurt", "tummy"],
      characterAnchors: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "hurt" },
      ],
      suggestedVocab: [
        "doctor", "mom", "hug", "medicine", "sleep", "water", "bed", "sad", "cat",
      ],
      branchReachable: !branchUsed,
    };
  }

  return {
    narration:
      utterance.length > 0
        ? `Mango thought about it. "${humanizeUtterance(utterance)}," she whispered, and the story carried on.`
        : "The story drifted on like a paper boat.",
    sceneTags: utterance,
    characterAnchors: input.characters,
    suggestedVocab: ["cat", "mom", "dad", "eat", "drink", "hug", "cake", "toy", "tellStory"],
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
      "happy", "love", "play", "mom", "doctor", "cat", "garden", "friend", "tellStory",
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
