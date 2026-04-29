import type { BranchBundle } from "../types";
import { getSymbol } from "../lib/vocab/symbols";

const TONE_BG: Record<BranchBundle["tone"], string> = {
  warm: "linear-gradient(160deg, #fae0d0 0%, #f1bda1 100%)",
  sage: "linear-gradient(160deg, #dfecdf 0%, #b9d6c2 100%)",
  muted: "linear-gradient(160deg, #ece6dc 0%, #cabea4 100%)",
};

// Decision 10: thumbnail + symbol cluster + label.
// Recommended card lifts 4px and gets a coral 2px ring — quiet "agent's pick".
export function BranchCard({
  bundle,
  index,
  onChoose,
}: {
  bundle: BranchBundle;
  index: number;
  onChoose: (id: string) => void;
}) {
  const recommended = !!bundle.recommended;
  return (
    <button
      onClick={() => onChoose(bundle.id)}
      className="rounded-card flex flex-col items-center text-left px-4 pt-4 pb-3"
      style={{
        width: 230,
        background: "var(--surface)",
        border: recommended ? "2px solid var(--accent)" : "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        animation: `${recommended ? "cardRiseLifted" : "cardRise"} 0.45s ${index * 0.05}s var(--spring) both`,
        transform: recommended ? "translateY(-4px)" : "none",
        transition: "transform 0.25s var(--spring), box-shadow 0.25s var(--ease)",
      }}
      aria-label={`${bundle.label}${recommended ? ", agent's recommended pick" : ""}`}
    >
      <div
        className="w-full rounded-card flex items-center justify-center"
        style={{
          height: 110,
          background: TONE_BG[bundle.tone],
          marginBottom: 10,
        }}
        aria-hidden
      >
        <span style={{ fontSize: 60, filter: "drop-shadow(0 2px 6px rgba(43,40,37,0.18))" }}>
          {bundle.preview}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mb-2 self-start" aria-hidden>
        {bundle.cluster.map((id) => {
          const s = getSymbol(id);
          return (
            <span
              key={id}
              className="rounded-chip px-2 py-1 flex items-center gap-1 text-xs"
              style={{
                background: "rgba(43,40,37,0.05)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 14 }}>{s.glyph}</span>
            </span>
          );
        })}
      </div>
      <div
        className="self-start"
        style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}
      >
        {bundle.label}
      </div>
      <div
        className="self-start mt-1"
        style={{
          fontSize: 11,
          color: recommended ? "var(--accent)" : "var(--text-muted)",
          fontFamily: "JetBrains Mono",
          letterSpacing: "0.04em",
        }}
      >
        {bundle.pickCopy}
      </div>
    </button>
  );
}
