import { useSession } from "../lib/store";
import { getSymbol } from "../lib/vocab/symbols";
import { useAgentTurn } from "../hooks/useAgentTurn";

export function UtteranceStrip() {
  const utterance = useSession((s) => s.utterance);
  const setUtterance = useSession((s) => s.setUtterance);
  const phase = useSession((s) => s.phase);
  const { sendUtterance } = useAgentTurn();

  const canSend = utterance.length > 0 && phase !== "thinking" && phase !== "narrating";

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-tile)",
        minHeight: 64,
      }}
      aria-label="Utterance strip"
    >
      <div className="flex-1 flex items-center gap-2 flex-wrap min-h-[40px]">
        {utterance.length === 0 && (
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
            tap symbols below to begin…
          </span>
        )}
        {utterance.map((id, i) => {
          const s = getSymbol(id);
          return (
            <button
              key={`${id}-${i}`}
              onClick={() => setUtterance(utterance.filter((_, j) => j !== i))}
              className="flex items-center gap-2 px-3 py-1.5 rounded-pill"
              style={{
                background: "rgba(217,119,87,0.10)",
                border: "1px solid rgba(217,119,87,0.32)",
                color: "var(--text)",
                animation: "chipIn 0.25s var(--spring)",
              }}
              aria-label={`${s.label}, tap to remove`}
            >
              <span aria-hidden style={{ fontSize: 18 }}>
                {s.glyph}
              </span>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{s.label}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={sendUtterance}
        disabled={!canSend}
        className="rounded-pill px-5 py-2 flex items-center gap-2"
        style={{
          background: canSend ? "var(--accent)" : "rgba(217,119,87,0.30)",
          color: canSend ? "#fff" : "rgba(255,255,255,0.85)",
          fontWeight: 600,
          fontSize: 15,
          cursor: canSend ? "pointer" : "not-allowed",
          transition: "background 0.18s var(--ease)",
        }}
      >
        tell story
        <span aria-hidden>▶</span>
      </button>
    </div>
  );
}
