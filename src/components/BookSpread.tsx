import type { ReactNode } from "react";

// Decision 8: Soft book — implied spread.
// Single cream surface; faint 1px tonal divider where the gutter would be.
// No torn edges, no spine shadow — the "book" reads through composition.
export function BookSpread({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div
      className="relative flex w-full"
      style={{
        gap: 28,
        padding: "20px 28px 28px 28px",
        flex: 1,
        minHeight: 0,
      }}
    >
      <div style={{ flex: "0 0 58%", minWidth: 0 }} className="flex flex-col">
        {left}
      </div>
      <div
        aria-hidden
        style={{
          width: 1,
          flexShrink: 0,
          background: "var(--gutter-line)",
        }}
      />
      <div style={{ flex: "0 0 calc(42% - 28px - 1px)", minWidth: 0 }} className="flex flex-col">
        {right}
      </div>
    </div>
  );
}
