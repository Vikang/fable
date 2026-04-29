import { useEffect, useRef } from "react";
import { useSession } from "../lib/store";
import type { TraceLevel } from "../types";

// Decision 11: dark terminal card, monospace, color-coded.
// Devtools energy — high contrast against the cream background. Lives at
// fixed bottom-right and toggles via the topbar dev pill.
const LEVEL_COLOR: Record<TraceLevel, string> = {
  ok: "#7bab91",
  err: "#d97757",
  warn: "#e8b86d",
  note: "#c4baad",
  live: "#e8b86d",
};

export function DevPanel() {
  const open = useSession((s) => s.devOpen);
  const trace = useSession((s) => s.trace);
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [trace.length]);

  if (!open) return null;

  return (
    <aside
      aria-label="Agent trace"
      className="fixed z-40"
      style={{
        bottom: 16,
        right: 16,
        width: 340,
        background: "rgba(43,40,37,0.94)",
        color: "#f4ecd8",
        borderRadius: 12,
        boxShadow: "0 12px 36px rgba(0,0,0,0.32)",
        border: "1px solid rgba(255,255,255,0.06)",
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontSize: 11.5,
      }}
    >
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          letterSpacing: "0.12em",
        }}
      >
        <span style={{ color: "#e8b86d" }}>AGENT TRACE</span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>· · ·</span>
      </div>
      <div
        ref={scrollerRef}
        className="px-3 py-2 flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: 320 }}
      >
        {trace.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.45)" }}>
            ready · waiting for utterance
          </div>
        )}
        {trace.map((entry) => (
          <div
            key={entry.id}
            style={{
              borderLeft: entry.live ? "2px solid #e8b86d" : "2px solid transparent",
              paddingLeft: 8,
              animation: "traceIn 0.25s var(--ease)",
            }}
          >
            <div
              style={{
                color: entry.live ? "#e8b86d" : "rgba(244,236,216,0.55)",
                fontSize: 10.5,
              }}
            >
              {entry.ts}
              {entry.live ? " · live" : ""}
            </div>
            <div className="flex flex-wrap items-center gap-x-1">
              {entry.rows.map((row, i) => (
                <span key={i}>
                  {row.label}
                  {row.marks?.map((m, j) => (
                    <span
                      key={j}
                      style={{ color: LEVEL_COLOR[m.level], marginLeft: 4 }}
                    >
                      {m.text}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            {entry.arrow && (
              <div
                style={{
                  color: entry.arrow.tone
                    ? LEVEL_COLOR[entry.arrow.tone]
                    : "rgba(244,236,216,0.78)",
                }}
              >
                {entry.arrow.text}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
