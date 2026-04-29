import type { CharacterAnchor } from "../../types";
import { getSupabase } from "../supabase";
import { logTurn } from "./logTurn";
import { composeLocalStory } from "./localStory";

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
// TokenRouter. If the edge function is unavailable locally, compose a real
// story beat from the child's taps instead of dropping to canned demo lines.
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
      console.warn("runAgent: edge call failed, using local story composer:", err);
    }
    const output = composeLocalStory(input);
    logTurn({
      input,
      output,
      model: "local-story-fallback",
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
