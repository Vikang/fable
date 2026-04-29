import { useSession } from "../lib/store";
import { branchBundles } from "../lib/agent/branches";
import { BranchCard } from "./BranchCard";
import { useAgentTurn } from "../hooks/useAgentTurn";

export function BranchOverlay() {
  const active = useSession((s) => s.branchActive);
  const { chooseBranch } = useAgentTurn();

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "rgba(43,40,37,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "overlayIn 0.35s var(--ease)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose what happens next"
    >
      <div className="text-center mb-7">
        <div
          className="text-2xl font-medium"
          style={{ color: "#fbf7f0", fontSize: 26, letterSpacing: "-0.005em" }}
        >
          What happens next?
        </div>
        <div
          className="mt-2 text-sm"
          style={{
            color: "rgba(251,247,240,0.7)",
            fontFamily: "JetBrains Mono",
            letterSpacing: "0.04em",
          }}
        >
          tap a path to keep telling the story
        </div>
      </div>
      <div className="flex items-stretch" style={{ gap: 22 }}>
        {branchBundles.map((b, i) => (
          <BranchCard key={b.id} bundle={b} index={i} onChoose={chooseBranch} />
        ))}
      </div>
    </div>
  );
}
