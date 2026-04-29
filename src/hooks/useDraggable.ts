import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

export interface DraggableOptions {
  // Reset offset to {0,0} whenever this key changes (e.g., when the
  // underlying character/emote swaps to a new pair).
  resetKey?: string | number | null;
  // Optional clamp bounds element. Drag offsets are clamped so the
  // draggable stays within this element's rect.
  boundsRef?: React.RefObject<HTMLElement | null>;
  // Fires when the user starts/ends the drag (useful for cosmetic state
  // like raising the element while held).
  onDragStart?: () => void;
  onDragEnd?: (offset: { x: number; y: number }) => void;
}

export interface DraggableState {
  offset: { x: number; y: number };
  dragging: boolean;
  // Spread onto the draggable element.
  handlers: {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
    onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => void;
    style: { touchAction: "none"; cursor: string };
  };
}

// Pointer-events drag with optional bounds clamping. Touch-first: uses
// setPointerCapture so the drag continues even if the finger leaves the
// element. Returns an offset (x, y) that callers apply via translate().
export function useDraggable({
  resetKey,
  boundsRef,
  onDragStart,
  onDragEnd,
}: DraggableOptions = {}): DraggableState {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const startRef = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null);

  // Reset position when the underlying subject changes.
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
  }, [resetKey]);

  const clampToBounds = useCallback(
    (target: HTMLElement, next: { x: number; y: number }) => {
      const bounds = boundsRef?.current;
      if (!bounds) return next;
      const targetRect = target.getBoundingClientRect();
      const boundsRect = bounds.getBoundingClientRect();
      // Current rect already includes the *previous* offset, so derive the
      // base (untransformed) center, then clamp the new offset against it.
      const baseLeft = targetRect.left - offset.x;
      const baseTop = targetRect.top - offset.y;
      const minX = boundsRect.left - baseLeft;
      const maxX = boundsRect.right - baseLeft - targetRect.width;
      const minY = boundsRect.top - baseTop;
      const maxY = boundsRect.bottom - baseTop - targetRect.height;
      return {
        x: Math.min(Math.max(next.x, minX), maxX),
        y: Math.min(Math.max(next.y, minY), maxY),
      };
    },
    [boundsRef, offset.x, offset.y],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      startRef.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
      setDragging(true);
      onDragStart?.();
    },
    [offset.x, offset.y, onDragStart],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const start = startRef.current;
      if (!start) return;
      const next = {
        x: start.offsetX + (e.clientX - start.pointerX),
        y: start.offsetY + (e.clientY - start.pointerY),
      };
      setOffset(clampToBounds(e.currentTarget, next));
    },
    [clampToBounds],
  );

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!startRef.current) return;
      startRef.current = null;
      setDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      onDragEnd?.(offset);
    },
    [offset, onDragEnd],
  );

  return {
    offset,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
      style: { touchAction: "none", cursor: dragging ? "grabbing" : "grab" },
    },
  };
}
