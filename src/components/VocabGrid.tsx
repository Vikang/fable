import { useSession } from "../lib/store";
import { getSymbol } from "../lib/vocab/symbols";
import { SymbolTile } from "./SymbolTile";
import { useFlipGrid } from "../hooks/useFlipGrid";
import { useAgentTurn } from "../hooks/useAgentTurn";

// 3×3 grid (decision 7 — open book layout). FLIP rearranges when curate
// updates the active vocab list (decision 9 / spec).
export function VocabGrid() {
  const vocab = useSession((s) => s.vocab);
  const utterance = useSession((s) => s.utterance);
  const setUtterance = useSession((s) => s.setUtterance);
  const curating = useSession((s) => s.curating);
  const phase = useSession((s) => s.phase);

  const { containerRef } = useFlipGrid(vocab, (id) => id);
  const { sendUtterance } = useAgentTurn();

  const onTap = (id: string) => {
    if (phase === "thinking" || phase === "narrating" || phase === "branching") return;
    if (id === "tellStory") {
      if (utterance.length > 0) sendUtterance();
      return;
    }
    // Toggle: re-tapping a selected tile removes it instead of duplicating.
    if (utterance.includes(id)) {
      setUtterance(utterance.filter((x) => x !== id));
      return;
    }
    setUtterance([...utterance, id]);
  };

  return (
    <section className="flex flex-col gap-2 mt-3 w-full" aria-label="Symbol vocabulary">
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span style={{ fontFamily: "JetBrains Mono", letterSpacing: "0.06em" }}>
          VOCABULARY · curated for this moment
        </span>
        {curating && (
          <span className="flex items-center gap-1">
            <span
              className="inline-block rounded-full"
              style={{
                width: 6,
                height: 6,
                background: "var(--accent)",
                animation: "shimmer 1.2s ease-in-out infinite",
              }}
            />
            curating…
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className="grid grid-cols-3 w-full"
        style={{
          gap: 8,
          opacity: curating ? 0.55 : 1,
          transition: "opacity 0.25s var(--ease)",
        }}
        role="grid"
      >
        {vocab.map((id) => {
          const sym = getSymbol(id);
          return (
            <SymbolTile
              key={id}
              symbol={sym}
              onTap={onTap}
              pressed={utterance.includes(id)}
            />
          );
        })}
      </div>
    </section>
  );
}
