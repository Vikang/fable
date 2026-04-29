import { useSession } from "../lib/store";

export function TopBar() {
  const turns = useSession((s) => s.turns);
  const branchActive = useSession((s) => s.branchActive);
  const branchUsed = useSession((s) => s.branchUsed);
  const devOpen = useSession((s) => s.devOpen);
  const toggleDev = useSession((s) => s.toggleDev);

  const turnLabel =
    turns.length === 0
      ? "turn 1 · “the cat who ate too much cake”"
      : `turn ${turns.length + (branchActive ? 0 : 1)} · “the cat who ate too much cake”`;

  return (
    <header
      className="flex items-center justify-between px-7 py-3 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-baseline gap-1">
        <span
          className="font-semibold tracking-[0.18em]"
          style={{ fontSize: 18, color: "var(--text)" }}
        >
          FABLE
        </span>
        <span style={{ color: "var(--accent)" }}>.</span>
      </div>
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {turnLabel}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="px-3 py-1 rounded-pill text-xs"
          style={{
            background: branchUsed ? "rgba(123,171,145,0.18)" : "rgba(217,119,87,0.12)",
            color: branchUsed ? "var(--secondary)" : "var(--accent)",
            border: branchUsed
              ? "1px solid rgba(123,171,145,0.35)"
              : "1px solid rgba(217,119,87,0.35)",
          }}
        >
          ⌁ branch
        </span>
        <button
          className="flex items-center gap-2 px-3 py-1 rounded-pill text-xs"
          onClick={toggleDev}
          aria-pressed={devOpen}
          style={{
            background: devOpen ? "rgba(43,40,37,0.94)" : "transparent",
            color: devOpen ? "#f7e7c5" : "var(--text-muted)",
            border: `1px solid ${devOpen ? "rgba(43,40,37,0.94)" : "var(--border)"}`,
            fontFamily: "var(--mono, 'JetBrains Mono')",
          }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 7,
              height: 7,
              background: devOpen ? "#e8b86d" : "var(--text-muted)",
              animation: devOpen ? "shimmer 1.6s ease-in-out infinite" : "none",
            }}
          />
          dev
        </button>
      </div>
    </header>
  );
}
