import { useSession } from "../lib/store";
import { useTTS } from "../hooks/useTTS";

export function Narration() {
  const text = useSession((s) => s.currentNarration);
  const { speak, stop, speaking } = useTTS();

  return (
    <section
      aria-label="Narration"
      className="rounded-card px-5 py-4 mt-3"
      style={{
        flexShrink: 0,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-tile)",
      }}
    >
      <p className="m-0" style={{ fontSize: 22, lineHeight: 1.4, color: "var(--text)" }}>
        {text}
      </p>
      <div className="flex items-center gap-3 mt-3">
        <button
          aria-label={speaking ? "Stop narration" : "Play narration"}
          onClick={() => (speaking ? stop() : speak(text))}
          className="rounded-pill flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
            background: speaking ? "var(--accent)" : "rgba(217,119,87,0.12)",
            color: speaking ? "#fff" : "var(--accent)",
            border: "1px solid rgba(217,119,87,0.35)",
          }}
        >
          {speaking ? "■" : "▶"}
        </button>
        <Waveform speaking={speaking} />
        <span className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "JetBrains Mono" }}>
          {speaking ? "playing" : "tap to replay"}
        </span>
      </div>
    </section>
  );
}

function Waveform({ speaking }: { speaking: boolean }) {
  const bars = Array.from({ length: 18 });
  return (
    <div className="flex items-end gap-[3px] h-6">
      {bars.map((_, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            width: 3,
            height: "100%",
            background: speaking ? "var(--accent)" : "rgba(122,115,107,0.35)",
            transformOrigin: "bottom",
            animation: speaking
              ? `barPulse ${0.7 + (i % 5) * 0.12}s ease-in-out infinite`
              : "none",
            transform: speaking ? undefined : "scaleY(0.4)",
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
