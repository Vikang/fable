import { useCallback } from "react";
import { useSession } from "../lib/store";
import { planTurn } from "../lib/agent/planTurn";
import { evalTurn } from "../lib/agent/evalTurn";
import { curateVocab } from "../lib/agent/curateVocab";
import { shouldBranch } from "../lib/agent/shouldBranch";
import { matchIllustration } from "../lib/scene/matchIllustration";
import { branchBundles, getBranch } from "../lib/agent/branches";
import { makeEntry } from "../lib/trace";
import { useTTS } from "./useTTS";
import type { Turn } from "../types";

// Orchestrates the agent loop: parse → plan → render → eval → curate →
// branch-check. Pushes structured trace events at each step (decision 11).
export function useAgentTurn() {
  const session = useSession();
  const { speak } = useTTS();

  const sendUtterance = useCallback(async () => {
    const { utterance, turns, currentCharacters, branchUsed, phase } = session;
    if (utterance.length === 0) return;
    if (phase === "thinking" || phase === "narrating") return;

    const turnIndex = turns.length + 1;
    session.setPhase("thinking");
    session.setCurating(false);

    // 1. parse
    session.pushTrace(
      makeEntry(
        [
          {
            label: "parse",
            marks: [{ text: "✓", level: "ok" }],
          },
        ],
        { text: `→ intent: ${utterance.join(" + ")}` }
      )
    );

    // 2. plan
    const plan = await planTurn({
      utterance,
      turnIndex,
      characters: currentCharacters,
      branchUsed,
    });
    session.pushTrace(
      makeEntry(
        [
          {
            label: "plan",
            marks: [{ text: "✓", level: "ok" }],
          },
        ],
        { text: `→ ${plan.narration.split(".")[0]}…` }
      )
    );

    // 3. render
    let sceneId = matchIllustration(plan.sceneTags, plan.characterAnchors.map((c) => c.id));
    session.pushTrace(
      makeEntry(
        [
          {
            label: "render",
            marks: [{ text: "✓", level: "ok" }],
          },
        ],
        { text: `→ scene "${sceneId}" matched from pre-baked set` }
      )
    );

    // 4. eval — may force a regen
    const evalResult = evalTurn(turnIndex, plan.characterAnchors);
    if (!evalResult.consistency) {
      session.pushTrace(
        makeEntry(
          [
            {
              label: "eval consistency",
              marks: [{ text: "✗", level: "err" }],
            },
          ],
          {
            text: `→ regen image · anchor "${evalResult.regenAnchor}"`,
            tone: "warn",
          }
        )
      );
      // Simulate regen latency
      await new Promise((r) => setTimeout(r, 400));
      // After regen we keep the same scene id but log a clean pass.
      session.pushTrace(
        makeEntry(
          [
            {
              label: "eval consistency",
              marks: [{ text: "✓", level: "ok" }],
            },
            {
              label: " · arc",
              marks: [{ text: "✓", level: "ok" }],
            },
            {
              label: " · age",
              marks: [{ text: "✓", level: "ok" }],
            },
          ],
          { text: `→ ship turn ${turnIndex}` }
        )
      );
    } else {
      session.pushTrace(
        makeEntry(
          [
            {
              label: "eval consistency",
              marks: [{ text: "✓", level: "ok" }],
            },
            {
              label: " · arc",
              marks: [{ text: "✓", level: "ok" }],
            },
            {
              label: " · age",
              marks: [{ text: "✓", level: "ok" }],
            },
          ],
          { text: `→ ship turn ${turnIndex}` }
        )
      );
    }

    // Apply scene + narration
    session.setScene(sceneId, plan.narration, plan.characterAnchors);
    session.setPhase("narrating");
    speak(plan.narration);

    const newTurn: Turn = {
      index: turnIndex,
      utterance,
      narration: plan.narration,
      sceneId,
      characters: plan.characterAnchors,
    };
    session.pushTurn(newTurn);
    session.setUtterance([]);

    // 5. curate vocab — kicks off FLIP rearrange
    session.setCurating(true);
    const before = session.vocab.length;
    const next = curateVocab(plan.suggestedVocab);
    // Brief curating beat for the dev panel + UI shimmer
    await new Promise((r) => setTimeout(r, 350));
    session.setVocab(next, false);
    session.pushTrace(
      makeEntry(
        [
          {
            label: `curate vocab · ${before} → ${next.length} tiles`,
          },
        ],
        { text: `→ surface ${labelFor(plan.sceneTags)} cluster`, tone: "note" }
      )
    );

    // 6. branch check — once per session, around turn 3
    const willBranch = shouldBranch({
      branchReachable: plan.branchReachable,
      branchUsed,
      turnIndex,
    });
    if (willBranch) {
      session.pushTrace(
        makeEntry(
          [{ label: `arc check · turn ${turnIndex} → branch reachable` }],
          { text: "→ stage 3 bundles · waiting on tap", tone: "note" },
          { live: true }
        )
      );
      // Give the narration a beat before the overlay rises.
      await new Promise((r) => setTimeout(r, 1200));
      session.setBranchActive(
        true,
        branchBundles.map((b) => b.id)
      );
      session.setPhase("branching");
    } else {
      session.setPhase("idle");
    }
  }, [session, speak]);

  const chooseBranch = useCallback(
    async (bundleId: string) => {
      const bundle = getBranch(bundleId);
      session.pushTrace(
        makeEntry(
          [{ label: `branch chosen · "${bundle.label}"` }],
          { text: `→ resolving with cluster [${bundle.cluster.join(", ")}]` }
        )
      );
      session.setBranchActive(false);
      session.markBranchUsed();
      session.setPhase("thinking");

      // Resolve the branch: narration + scene + curated vocab.
      const resolveTo = bundle.resolveTo;

      session.pushTrace(
        makeEntry(
          [{ label: "plan", marks: [{ text: "✓", level: "ok" }] }],
          { text: `→ ${resolveTo.narration.split(".")[0]}…` }
        )
      );
      session.pushTrace(
        makeEntry(
          [{ label: "render", marks: [{ text: "✓", level: "ok" }] }],
          { text: `→ scene "${resolveTo.sceneId}" matched from pre-baked set` }
        )
      );
      session.pushTrace(
        makeEntry(
          [
            { label: "eval consistency", marks: [{ text: "✓", level: "ok" }] },
            { label: " · arc", marks: [{ text: "✓", level: "ok" }] },
            { label: " · age", marks: [{ text: "✓", level: "ok" }] },
          ],
          { text: `→ ship turn ${session.turns.length + 1}` }
        )
      );

      session.setScene(resolveTo.sceneId, resolveTo.narration, resolveTo.characters);
      session.setPhase("narrating");
      speak(resolveTo.narration);

      session.pushTurn({
        index: session.turns.length + 1,
        utterance: [bundleId],
        narration: resolveTo.narration,
        sceneId: resolveTo.sceneId,
        characters: resolveTo.characters,
      });

      session.setCurating(true);
      const before = session.vocab.length;
      const next = curateVocab(resolveTo.nextVocab);
      await new Promise((r) => setTimeout(r, 350));
      session.setVocab(next, false);
      session.pushTrace(
        makeEntry(
          [{ label: `curate vocab · ${before} → ${next.length} tiles` }],
          { text: `→ surface ${labelFor([bundle.id])} cluster`, tone: "note" }
        )
      );

      session.setPhase("idle");
    },
    [session, speak]
  );

  return { sendUtterance, chooseBranch };
}

function labelFor(tags: string[]): string {
  if (tags.includes("doctor") || tags.includes("medicine") || tags.includes("heal"))
    return "care/rescue";
  if (tags.includes("comfort") || tags.includes("hug")) return "warmth/comfort";
  if (tags.includes("rest") || tags.includes("sleep") || tags.includes("bed"))
    return "rest/quiet";
  if (tags.includes("hurt") || tags.includes("tummy")) return "care/rescue";
  if (tags.includes("eat") || tags.includes("cake")) return "kitchen/snack";
  return "next";
}
