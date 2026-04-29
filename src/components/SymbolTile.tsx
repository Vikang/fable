import { useState } from "react";
import type { Symbol } from "../types";
import { categoryTint } from "../lib/vocab/categories";
import { useTTSStore } from "../hooks/useTTS";

// Decision 9: illustration-dominant + small label.
// Watercolor patch fills ~75% of the tile, label in Lexend below.
// Visible label is intentional accessibility: AAC users span pre-readers and
// emerging readers; we never hide labels behind hover/long-press.
//
// The play button (top-right) speaks the label without committing the symbol
// to the utterance — useful for caregivers previewing words and for emerging
// readers learning sound→symbol associations. It lives as a sibling to the
// main tile button (not nested) so HTML stays valid and screen readers can
// reach both targets independently.
//
// When `size` is omitted the tile fills its grid cell (width: 100%, square).
export function SymbolTile({
  symbol,
  onTap,
  pressed = false,
  size,
  compact = false,
}: {
  symbol: Symbol;
  onTap?: (id: string) => void;
  pressed?: boolean;
  size?: number;
  compact?: boolean;
}) {
  const fluid = size === undefined;
  const labelSize = compact ? 13 : 17;
  const speak = useTTSStore((s) => s.speak);
  const stop = useTTSStore((s) => s.stop);
  const isPlaying = useTTSStore((s) => s.speakingText === symbol.label);

  const handleSpeak = () => {
    if (isPlaying) {
      stop();
      return;
    }
    void speak(symbol.label);
  };

  const speakerSize = compact ? 22 : 28;
  const inset = compact ? 4 : 6;

  return (
    <div
      className="relative"
      data-flip-id={symbol.id}
      style={{
        width: fluid ? "100%" : size,
        height: fluid ? undefined : size,
        aspectRatio: fluid ? "1 / 1" : undefined,
      }}
    >
      <button
        type="button"
        aria-label={symbol.label}
        onClick={() => onTap?.(symbol.id)}
        className="rounded-tile flex flex-col items-center justify-center bg-surface select-none"
        style={{
          width: "100%",
          height: "100%",
          background: "var(--surface)",
          border: pressed ? "2px solid var(--accent)" : "1px solid var(--border)",
          boxShadow: "var(--shadow-tile)",
          padding: compact ? 6 : 10,
          gap: compact ? 2 : 6,
          transition: "transform 0.18s var(--spring), border-color 0.18s var(--ease)",
          transform: pressed ? "scale(0.96)" : "none",
        }}
      >
        <SymbolArt symbol={symbol} compact={compact} />
        <span
          className="font-medium text-center leading-tight"
          style={{ fontSize: labelSize, color: "var(--text)" }}
        >
          {symbol.label}
        </span>
      </button>

      <button
        type="button"
        aria-label={isPlaying ? `Stop ${symbol.label}` : `Hear ${symbol.label}`}
        aria-pressed={isPlaying}
        onClick={(e) => {
          e.stopPropagation();
          handleSpeak();
        }}
        className="absolute flex items-center justify-center rounded-pill"
        style={{
          top: inset,
          right: inset,
          width: speakerSize,
          height: speakerSize,
          background: isPlaying ? "var(--accent)" : "rgba(255,255,255,0.92)",
          color: isPlaying ? "#ffffff" : "var(--text-muted)",
          border: `1px solid ${isPlaying ? "var(--accent)" : "var(--border)"}`,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          transition:
            "background 0.18s var(--ease), color 0.18s var(--ease), border-color 0.18s var(--ease)",
          animation: isPlaying ? "shimmer 1.4s ease-in-out infinite" : "none",
        }}
      >
        <SpeakerIcon size={compact ? 11 : 13} active={isPlaying} />
      </button>
    </div>
  );
}

// Pre-baked watercolor PNG, falling back to the emoji glyph if the file
// isn't on disk yet (eg. before `npm run generate-images` has run, or for
// newly added symbols). The fallback keeps the demo functional at any stage
// of the asset pipeline.
function SymbolArt({ symbol, compact }: { symbol: Symbol; compact: boolean }) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="rounded-tile flex items-center justify-center overflow-hidden"
      style={{
        width: "78%",
        aspectRatio: "1",
        background: categoryTint[symbol.category],
      }}
    >
      {imageFailed ? (
        <span
          aria-hidden="true"
          style={{ fontSize: compact ? 28 : 44, lineHeight: 1 }}
        >
          {symbol.glyph}
        </span>
      ) : (
        <img
          src={`/symbols/${symbol.id}.png`}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          loading="lazy"
          decoding="async"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            mixBlendMode: "multiply",
          }}
        />
      )}
    </div>
  );
}

function SpeakerIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2 6h2.6L8 3.5v9L4.6 10H2z" fill="currentColor" />
      <path
        d="M10.4 6.4c.6.5 1 1 1 1.6 0 .6-.4 1.1-1 1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {active && (
        <path
          d="M12.4 4.7c1 .9 1.6 1.9 1.6 3.3s-.6 2.4-1.6 3.3"
          stroke="currentColor"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
