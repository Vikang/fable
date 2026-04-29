import type { Symbol } from "../types";
import { categoryTint } from "../lib/vocab/categories";

// Decision 9: illustration-dominant + small label.
// Watercolor patch fills ~75% of the 96×96 tile, label in 16px Lexend below.
// Visible label is intentional accessibility: AAC users span pre-readers and
// emerging readers; we never hide labels behind hover/long-press.
export function SymbolTile({
  symbol,
  onTap,
  pressed = false,
  size = 96,
  compact = false,
}: {
  symbol: Symbol;
  onTap?: (id: string) => void;
  pressed?: boolean;
  size?: number;
  compact?: boolean;
}) {
  const labelSize = compact ? 13 : 16;
  return (
    <button
      type="button"
      aria-label={symbol.label}
      onClick={() => onTap?.(symbol.id)}
      data-flip-id={symbol.id}
      className="rounded-tile flex flex-col items-center justify-center bg-surface select-none"
      style={{
        width: size,
        height: size,
        background: "var(--surface)",
        border: pressed ? "2px solid var(--accent)" : "1px solid var(--border)",
        boxShadow: "var(--shadow-tile)",
        padding: compact ? 6 : 8,
        gap: compact ? 2 : 4,
        transition: "transform 0.18s var(--spring), border-color 0.18s var(--ease)",
        transform: pressed ? "scale(0.96)" : "none",
      }}
    >
      <div
        className="rounded-tile flex items-center justify-center"
        style={{
          width: "78%",
          aspectRatio: "1",
          background: categoryTint[symbol.category],
          fontSize: compact ? 28 : 38,
          lineHeight: 1,
        }}
      >
        <span aria-hidden="true">{symbol.glyph}</span>
      </div>
      <span
        className="font-medium text-center leading-tight"
        style={{ fontSize: labelSize, color: "var(--text)" }}
      >
        {symbol.label}
      </span>
    </button>
  );
}
