import { getSupabase, getSessionId } from "../supabase";
import type { PlanInput, PlanOutput } from "./client";

export interface LogTurnParams {
  input: PlanInput;
  output: PlanOutput;
  model: string;
  latencyMs: number;
}

export function logTurn({ input, output, model, latencyMs }: LogTurnParams): void {
  const supabase = getSupabase();
  if (!supabase) return;

  const row = {
    session_id: getSessionId(),
    turn_index: input.turnIndex,
    utterance: input.utterance,
    plan_input: input,
    plan_output: output,
    trace_events: [],
    model,
    latency_ms: latencyMs,
  };

  void supabase
    .from("turns")
    .insert(row)
    .then((res) => {
      if (res.error && import.meta.env.DEV) {
        console.warn("logTurn failed:", res.error.message);
      }
    });
}
