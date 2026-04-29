import { useCallback, useRef } from "react";

// Long-press for character-state badge (decision 7 / canvas).
export function useLongPress(callback: () => void, delay = 500) {
  const timer = useRef<number | null>(null);

  const start = useCallback(() => {
    if (timer.current != null) return;
    timer.current = window.setTimeout(() => {
      callback();
      timer.current = null;
    }, delay);
  }, [callback, delay]);

  const clear = useCallback(() => {
    if (timer.current != null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}
