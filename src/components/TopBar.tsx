import { useSession } from "../lib/store";
import { useTTSStore } from "../hooks/useTTS";

export function TopBar() {
  const turns = useSession((s) => s.turns);
  const branchActive = useSession((s) => s.branchActive);
  const branchUsed = useSession((s) => s.branchUsed);
  const reset = useSession((s) => s.reset);

  const turnLabel =
    turns.length === 0
      ? "Page 1 · “the cat who ate too much cake”"
      : `Page ${turns.length + (branchActive ? 0 : 1)} · “the cat who ate too much cake”`;

  const onLogoClick = () => {
    useTTSStore.getState().stop();
    reset();
  };

  return (
    <header
      className="flex items-center justify-between px-7 py-3 border-b"
      style={{ borderColor: "var(--border)" }}
    >
      <button
        type="button"
        onClick={onLogoClick}
        aria-label="Start a new story"
        title="New story"
        className="flex items-baseline gap-1 group"
        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
      >
        <span
          className="font-semibold tracking-[0.18em]"
          style={{ fontSize: 18, color: "var(--text)" }}
        >
          FABLE
        </span>
        <span
          style={{
            color: "var(--accent)",
            transition: "transform 0.18s var(--spring)",
          }}
          className="group-hover:scale-150"
        >
          .
        </span>
      </button>
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
      </div>
    </header>
  );
}
