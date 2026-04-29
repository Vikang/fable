import { useEffect } from "react";
import { useSession } from "../lib/store";
import { findReactionPrompt } from "../lib/prompts/reactionPrompts";
import { getSymbol } from "../lib/vocab/symbols";

// Small inline "what next?" card that surfaces between turns.
//
// Triggered when the child taps a symbol that has a registered prompt
// (see lib/prompts/reactionPrompts.ts). Shows a question + 2-3 chips.
// Tapping a chip adds that symbol to the utterance and dismisses.
//
// Auto-dismisses when the agent starts thinking/narrating/branching —
// the moment is over, the question no longer applies.
export function ReactionPrompt() {
  const trigger = useSession((s) => s.activePromptTrigger);
  const phase = useSession((s) => s.phase);
  const utterance = useSession((s) => s.utterance);
  const setUtterance = useSession((s) => s.setUtterance);
  const setActivePrompt = useSession((s) => s.setActivePrompt);

  // Auto-dismiss when the story moves on.
  useEffect(() => {
    if (phase === "thinking" || phase === "narrating" || phase === "branching") {
      setActivePrompt(null);
    }
  }, [phase, setActivePrompt]);

  if (!trigger) return null;
  const prompt = findReactionPrompt(trigger);
  if (!prompt) return null;

  const choose = (symbol: string) => {
    if (!utterance.includes(symbol)) {
      setUtterance([...utterance, symbol]);
    }
    setActivePrompt(null);
  };

  return (
    <div
      className="rounded-card px-4 py-3 mb-2"
      role="group"
      aria-label={prompt.question}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--accent)",
        boxShadow: "var(--shadow-card)",
        animation: "promptSlideIn 0.4s var(--spring)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          style={{
            fontSize: 14,
            color: "var(--text)",
            lineHeight: 1.35,
            fontWeight: 500,
          }}
        >
          {prompt.question}
        </div>
        <button
          onClick={() => setActivePrompt(null)}
          aria-label="Dismiss prompt"
          className="rounded-full"
          style={{
            width: 22,
            height: 22,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: 12,
            lineHeight: 1,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {prompt.options.map((id, i) => {
          const s = getSymbol(id);
          const already = utterance.includes(id);
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              disabled={already}
              className="rounded-chip px-3 py-1.5 flex items-center gap-2"
              style={{
                background: already ? "rgba(43,40,37,0.04)" : "var(--surface)",
                border: `1px solid ${already ? "var(--border)" : "var(--accent)"}`,
                color: already ? "var(--text-muted)" : "var(--text)",
                fontSize: 13,
                cursor: already ? "default" : "pointer",
                animation: `chipIn 0.35s ${i * 0.05 + 0.05}s var(--spring) both`,
                transition: "transform 0.15s var(--spring), background 0.2s var(--ease)",
              }}
              aria-label={`Add ${s.label} to your story`}
            >
              <span style={{ fontSize: 18 }} aria-hidden>
                {s.glyph}
              </span>
              <span style={{ fontFamily: "JetBrains Mono", letterSpacing: "0.02em" }}>
                {s.label.toLowerCase()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
