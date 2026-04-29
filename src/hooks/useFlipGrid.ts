import { useLayoutEffect, useRef } from "react";

// FLIP rearrange for the vocab grid (decision 9 / spec).
// Captures previous bounding rects keyed by tile id, then on the next layout
// pass diffs the new rects and animates each tile from old → new with a
// spring transform. Honors prefers-reduced-motion.
export function useFlipGrid<T>(items: T[], _keyOf: (t: T) => string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  const itemsRef = useRef<T[]>(items);

  // Capture rects BEFORE the new render commits.
  // (Done implicitly: we record after every render and use the prior map.)
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const next = new Map<string, DOMRect>();
    const tiles = container.querySelectorAll<HTMLElement>("[data-flip-id]");
    tiles.forEach((el) => {
      const id = el.dataset.flipId!;
      next.set(id, el.getBoundingClientRect());
    });

    if (!prefersReduced) {
      tiles.forEach((el) => {
        const id = el.dataset.flipId!;
        const prev = prevRects.current.get(id);
        const now = next.get(id);
        if (!prev || !now) return;
        const dx = prev.left - now.left;
        const dy = prev.top - now.top;
        if (dx === 0 && dy === 0) return;
        el.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ],
          { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "both" }
        );
      });
    }

    prevRects.current = next;
    itemsRef.current = items;
  }, [items]);

  return { containerRef };
}
