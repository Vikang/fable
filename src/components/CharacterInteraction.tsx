import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "../lib/store";
import { detectInteraction } from "../lib/interactions/detectInteraction";
import type { InteractionPair } from "../lib/interactions/pairs";
import { useInteractionImage } from "../hooks/useInteractionImage";
import { useDraggable } from "../hooks/useDraggable";

// Two-stage reactive overlay:
//   Stage 1 — emote burst the moment a registered pair appears in the
//             utterance buffer (~0ms feedback, motor-friendly).
//   Stage 2 — TokenRouter-generated watercolor crossfades in once ready
//             (background, 5-15s). The emote stays anchored as a corner badge
//             while the image takes over the canvas, so the feeling never
//             disappears even if the network is slow.
//
// The overlay auto-clears 6s after the emote first appeared, OR when the
// child sends the utterance, OR when the underlying pair changes.

const AUTO_CLEAR_MS = 6000;
const EMOTE_DEBOUNCE_MS = 250;

export function CharacterInteraction() {
  const utterance = useSession((s) => s.utterance);
  const phase = useSession((s) => s.phase);

  const detected = useMemo(() => detectInteraction(utterance), [utterance]);

  const [activePair, setActivePair] = useState<InteractionPair | null>(null);
  const [visible, setVisible] = useState(false);

  // Debounce emote: avoid flicker when the child quickly toggles symbols.
  useEffect(() => {
    if (!detected) {
      setVisible(false);
      const t = window.setTimeout(() => setActivePair(null), 350);
      return () => clearTimeout(t);
    }
    if (detected.cacheKey === activePair?.cacheKey) return;

    const t = window.setTimeout(() => {
      setActivePair(detected);
      setVisible(true);
    }, EMOTE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [detected, activePair?.cacheKey]);

  // Clear when the child commits the utterance (story moves on).
  useEffect(() => {
    if (phase === "thinking" || phase === "narrating") {
      setVisible(false);
    }
  }, [phase]);

  // Auto-clear after a beat so the scene reclaims the canvas.
  useEffect(() => {
    if (!visible || !activePair) return;
    const t = window.setTimeout(() => setVisible(false), AUTO_CLEAR_MS);
    return () => clearTimeout(t);
  }, [visible, activePair]);

  const { imageUrl, loading } = useInteractionImage(visible ? activePair : null);

  const boundsRef = useRef<HTMLDivElement>(null);
  // Reset offset whenever the underlying pair OR the layout (centered ↔
  // corner) changes — base position shifts so the old offset would teleport.
  const resetKey = `${activePair?.cacheKey ?? ""}:${imageUrl ? "corner" : "center"}`;
  const { offset, dragging, handlers } = useDraggable({ resetKey, boundsRef });

  if (!activePair) return null;

  return (
    <div
      ref={boundsRef}
      role="img"
      aria-label={`Interaction: ${activePair.label}`}
      aria-live="polite"
      className="absolute inset-0 pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.45s var(--ease)",
      }}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: "cover",
            animation: "fadeIn 0.7s var(--ease)",
          }}
        />
      )}

      <div
        role="button"
        aria-label={`Drag ${activePair.label}`}
        tabIndex={0}
        className="absolute select-none pointer-events-auto"
        {...handlers}
        style={{
          top: imageUrl ? "auto" : "50%",
          left: imageUrl ? 16 : "50%",
          bottom: imageUrl ? 16 : "auto",
          // Compose base centering with the user's drag offset.
          transform: imageUrl
            ? `translate(${offset.x}px, ${offset.y}px)`
            : `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
          fontSize: imageUrl ? 56 : 128,
          filter: dragging
            ? "drop-shadow(0 10px 22px rgba(43,40,37,0.42))"
            : "drop-shadow(0 4px 14px rgba(43,40,37,0.28))",
          animation: dragging ? undefined : "emotePop 0.55s var(--spring)",
          // Snap during drag, ease back to layout changes when idle.
          transition: dragging
            ? "filter 0.15s var(--ease)"
            : "top 0.5s var(--spring), left 0.5s var(--spring), bottom 0.5s var(--spring), font-size 0.5s var(--spring), filter 0.2s var(--ease)",
          ...handlers.style,
        }}
      >
        {activePair.emote}
      </div>

      {loading && !imageUrl && (
        <div
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-chip text-xs"
          style={{
            background: "rgba(43,40,37,0.55)",
            color: "#fbf7f0",
            fontFamily: "JetBrains Mono",
            letterSpacing: "0.04em",
          }}
        >
          painting…
        </div>
      )}
    </div>
  );
}
