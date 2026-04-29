import { useEffect, useRef, useState } from "react";
import { useSession } from "../lib/store";
import { getIllustration } from "../lib/scene/illustrations";
import { useLongPress } from "../hooks/useLongPress";

// Watercolor-style illustration: SVG backdrop + floating motif glyphs with a
// gentle turbulence filter to imply paint texture, plus crossfade + ken-burns
// between scenes.
export function StoryCanvas() {
  const sceneId = useSession((s) => s.currentSceneId);
  const characters = useSession((s) => s.currentCharacters);
  const turns = useSession((s) => s.turns);
  const phase = useSession((s) => s.phase);

  const [prevSceneId, setPrevSceneId] = useState<string | null>(null);
  const [showBadge, setShowBadge] = useState(false);
  const prevRef = useRef(sceneId);

  // On scene change, hold the previous scene for a crossfade frame.
  useEffect(() => {
    if (prevRef.current !== sceneId) {
      setPrevSceneId(prevRef.current);
      prevRef.current = sceneId;
      const t = window.setTimeout(() => setPrevSceneId(null), 750);
      return () => clearTimeout(t);
    }
  }, [sceneId]);

  const longPress = useLongPress(() => {
    setShowBadge(true);
    window.setTimeout(() => setShowBadge(false), 2200);
  }, 450);

  const character = characters[0];
  const moodCopy: Record<string, string> = {
    happy: `${character?.name ?? "the cat"} is feeling cheerful`,
    hurt: `${character?.name ?? "the cat"} has a tummy ache`,
    tired: `${character?.name ?? "the cat"} is sleepy`,
    comforted: `${character?.name ?? "the cat"} feels safe in mom's arms`,
    healed: `${character?.name ?? "the cat"} feels much better`,
    neutral: `${character?.name ?? "the cat"} is thinking`,
  };

  const turnIndex = turns.length === 0 ? 1 : turns.length;
  const turnLabel = phase === "branching" ? "choose a path" : `turn ${turnIndex}`;

  return (
    <div
      role="img"
      aria-label={`Story scene: ${moodCopy[character?.mood ?? "neutral"] ?? "scene"}`}
      aria-live="polite"
      className="relative overflow-hidden rounded-card shadow-canvas"
      style={{
        height: 360,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
      {...longPress}
    >
      {prevSceneId && <SceneLayer id={prevSceneId} fading kenBurns />}
      <SceneLayer id={sceneId} kenBurns />

      <div
        className="absolute top-3 left-3 px-2.5 py-1 rounded-chip text-xs"
        style={{
          background: "rgba(43,40,37,0.55)",
          color: "#fbf7f0",
          fontFamily: "JetBrains Mono",
          letterSpacing: "0.04em",
        }}
      >
        {turnLabel}
      </div>

      {showBadge && character && (
        <div
          className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-chip flex items-center gap-2"
          style={{
            background: "rgba(43,40,37,0.85)",
            color: "#fbf7f0",
            animation: "badgePop 0.3s var(--spring)",
          }}
        >
          <span
            className="inline-block rounded-full"
            style={{
              width: 8,
              height: 8,
              background: "#d97757",
              animation: "shimmer 1.2s ease-in-out infinite",
            }}
          />
          <span className="text-sm">{moodCopy[character.mood] ?? `${character.name} is here`}</span>
        </div>
      )}
    </div>
  );
}

function SceneLayer({
  id,
  fading = false,
  kenBurns = false,
}: {
  id: string;
  fading?: boolean;
  kenBurns?: boolean;
}) {
  const ill = getIllustration(id);
  return (
    <div
      className="absolute inset-0"
      style={{
        animation: fading ? "fadeOut 0.7s var(--ease) forwards" : "fadeIn 0.7s var(--ease)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s var(--ease)",
      }}
    >
      <svg
        viewBox="0 0 600 360"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full"
        style={{
          animation: kenBurns ? "kenburns 6s var(--ease) forwards" : "none",
          transformOrigin: "center",
        }}
      >
        <defs>
          <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ill.sky[0]} />
            <stop offset="100%" stopColor={ill.sky[1]} />
          </linearGradient>
          <filter id={`watercolor-${id}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="6" />
          </filter>
        </defs>
        <rect width="600" height="360" fill={`url(#sky-${id})`} />
        <ellipse cx="300" cy="320" rx="360" ry="90" fill={ill.ground} opacity="0.85" />
        <circle cx="500" cy="80" r="40" fill={ill.accent} opacity="0.55" />
        <g filter={`url(#watercolor-${id})`}>
          <text
            x="300"
            y="220"
            textAnchor="middle"
            fontSize="160"
            style={{ filter: "drop-shadow(0 2px 6px rgba(43,40,37,0.18))" }}
          >
            {ill.primary}
          </text>
          {ill.supporting[0] && (
            <text x="120" y="260" textAnchor="middle" fontSize="80" opacity="0.85">
              {ill.supporting[0]}
            </text>
          )}
          {ill.supporting[1] && (
            <text x="490" y="260" textAnchor="middle" fontSize="60" opacity="0.85">
              {ill.supporting[1]}
            </text>
          )}
          {ill.supporting[2] && (
            <text x="300" y="120" textAnchor="middle" fontSize="44" opacity="0.7">
              {ill.supporting[2]}
            </text>
          )}
        </g>
      </svg>
    </div>
  );
}
