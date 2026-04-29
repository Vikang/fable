import { useEffect, useRef, useState } from "react";
import { useSession } from "../lib/store";
import { useLongPress } from "../hooks/useLongPress";
import { CharacterInteraction } from "./CharacterInteraction";

// Watercolor-style illustration: pre-baked watercolor PNG layered over an SVG
// fallback. The SVG composition (gradient sky + motif glyphs with a subtle
// turbulence filter) remains as the graceful fallback if the PNG hasn't been
// generated yet, so the demo never shows a broken image.
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
      className="relative overflow-hidden rounded-card shadow-canvas w-full"
      style={{
        flex: "1 1 auto",
        minHeight: 320,
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
      {...longPress}
    >
      {prevSceneId && <SceneLayer id={prevSceneId} fading kenBurns />}
      <SceneLayer id={sceneId} kenBurns />

      <CharacterInteraction />

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
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div
      className="absolute inset-0"
      style={{
        animation: fading ? "fadeOut 0.7s var(--ease) forwards" : "fadeIn 0.7s var(--ease)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.7s var(--ease)",
      }}
    >
      {imageFailed ? (
        <SceneSvgFallback id={id} kenBurns={kenBurns} />
      ) : (
        <img
          src={`/scenes/${id}.png`}
          alt=""
          aria-hidden="true"
          onError={() => setImageFailed(true)}
          loading="eager"
          decoding="async"
          className="w-full h-full"
          style={{
            objectFit: "cover",
            animation: kenBurns ? "kenburns 6s var(--ease) forwards" : "none",
            transformOrigin: "center",
          }}
        />
      )}
    </div>
  );
}

// Until the watercolor scene PNG is generated, render a calm Le Petit Prince
// placeholder (cream paper, tiny green planet with a small prince silhouette,
// scattered yellow stars). One placeholder for every scene id — once the PNG
// lands in /public/scenes it covers this entirely. No emoji, no per-scene
// glyphs: those looked jarring at full canvas size.
function SceneSvgFallback({ id, kenBurns }: { id: string; kenBurns: boolean }) {
  return (
    <svg
      viewBox="0 0 600 360"
      preserveAspectRatio="xMidYMid slice"
      className="w-full h-full"
      style={{
        animation: kenBurns ? "kenburns 6s var(--ease) forwards" : "none",
        transformOrigin: "center",
      }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`paper-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbf7f0" />
          <stop offset="100%" stopColor="#f5eddd" />
        </linearGradient>
        <radialGradient id={`planet-${id}`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#d8eadf" />
          <stop offset="100%" stopColor="#a9c8b6" />
        </radialGradient>
        <filter id={`paint-${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="3" />
        </filter>
      </defs>

      <rect width="600" height="360" fill={`url(#paper-${id})`} />

      <g fill="#e8b86d" opacity="0.85">
        <Star cx={92} cy={62} r={3.5} />
        <Star cx={186} cy={106} r={2.6} />
        <Star cx={418} cy={48} r={3.2} />
        <Star cx={520} cy={96} r={2.4} />
        <Star cx={300} cy={36} r={2.8} />
        <Star cx={68} cy={188} r={2.4} />
        <Star cx={544} cy={184} r={3} />
      </g>

      <g filter={`url(#paint-${id})`}>
        <circle cx="300" cy="338" r="78" fill={`url(#planet-${id})`} />
        <path
          d="M256 312 Q272 296 286 312"
          stroke="#7a9d83"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M318 318 Q336 296 354 318"
          stroke="#7a9d83"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
      </g>

      <g transform="translate(296,232)" opacity="0.92">
        <ellipse cx="0" cy="38" rx="14" ry="22" fill="#a9c79a" />
        <path d="M-12 28 q12 -6 24 0 l4 14 q-16 8 -32 0z" fill="#e8b86d" opacity="0.82" />
        <circle cx="0" cy="6" r="14" fill="#f4dca8" />
        <path
          d="M-13 -2 q4 -10 13 -10 q9 0 13 10 q-6 4 -13 4 q-7 0 -13 -4z"
          fill="#e8b86d"
        />
        <circle cx="-5" cy="6" r="1.2" fill="#2b2825" />
        <circle cx="5" cy="6" r="1.2" fill="#2b2825" />
        <path d="M-3 11 q3 2 6 0" stroke="#2b2825" strokeWidth="1" fill="none" strokeLinecap="round" />
      </g>

      <text
        x="300"
        y="84"
        textAnchor="middle"
        fontFamily="JetBrains Mono, ui-monospace, monospace"
        fontSize="11"
        fill="#7a736b"
        letterSpacing="0.18em"
        style={{ animation: "shimmer 2s ease-in-out infinite" }}
      >
        watercolor scene loading…
      </text>
    </svg>
  );
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * i) / 5 - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.42;
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return <polygon points={points.join(" ")} />;
}
