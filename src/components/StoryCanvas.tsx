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
  // Splash on first mount only: the Le Petit Prince loading watercolor sits
  // on top of the scene for a beat before crossfading out, giving the demo
  // a deliberate "opening the book" moment.
  const [splashAlive, setSplashAlive] = useState(true);
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

  // Show the splash for ~2.2s, fade for 0.8s, then unmount it. The total
  // (3s) matches the natural reading beat before the first agent turn.
  useEffect(() => {
    const t = window.setTimeout(() => setSplashAlive(false), 3000);
    return () => clearTimeout(t);
  }, []);

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
  const turnLabel = phase === "branching" ? "choose a path" : `Page ${turnIndex}`;

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

      {splashAlive && <IntroSplash />}

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
        <SceneLoading kenBurns={kenBurns} />
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

// First-mount splash: shows the Le Petit Prince loading watercolor on top
// of the real scene for ~2.2s, then fades out over 0.8s, then unmounts.
// Sits at z-index 5 so the turn label and badge still render on top, but
// above both SceneLayer instances. After this dies once, scene changes
// crossfade through SceneLayer's normal fadeIn/fadeOut, not the splash.
function IntroSplash() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      aria-hidden="true"
      style={{
        zIndex: 5,
        animation: "fadeOut 0.8s var(--ease) 2.2s forwards",
      }}
    >
      <img
        src="/loading.png"
        alt=""
        loading="eager"
        decoding="async"
        className="w-full h-full"
        style={{
          objectFit: "cover",
          transformOrigin: "center",
          animation: "sceneBreath 4.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// Persistent loading screen used by SceneLayer when a scene PNG is missing.
// Same image as IntroSplash but stays put — no auto-fade — so the user
// always has a watercolor on screen while a missing scene PNG is being
// generated in the background.
function SceneLoading({ kenBurns }: { kenBurns: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <img
        src="/loading.png"
        alt=""
        loading="eager"
        decoding="async"
        className="w-full h-full"
        style={{
          objectFit: "cover",
          transformOrigin: "center",
          animation: kenBurns
            ? "kenburns 6s var(--ease) forwards, sceneBreath 4.5s ease-in-out infinite"
            : "sceneBreath 4.5s ease-in-out infinite",
        }}
      />
    </div>
  );
}
