import { useEffect, useRef, useState } from "react";
import { getSupabase } from "../lib/supabase";
import type { InteractionPair } from "../lib/interactions/pairs";

// In-memory cache so the same pair never round-trips to TokenRouter twice
// within a session. Keyed by InteractionPair.cacheKey.
const sessionCache = new Map<string, string>();

interface EdgeResponse {
  dataUrl: string;
  _meta?: { model: string; latency_ms: number; cacheKey: string };
}

interface UseInteractionImageState {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches a watercolor image for an active interaction pair.
 *
 * Strategy:
 *   1. Check session cache for cacheKey → instant hit.
 *   2. Try /interactions/<cacheKey>.png on disk (pre-baked) → cheap hit.
 *   3. Fallback: invoke `interaction-image` edge function → ~5-15s.
 *
 * The hook returns immediately with `loading: true`; the caller should keep
 * showing the instant emote layer while we wait.
 */
export function useInteractionImage(
  pair: InteractionPair | null,
): UseInteractionImageState {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();

    if (!pair) {
      setImageUrl(null);
      setLoading(false);
      setError(null);
      return;
    }

    const cached = sessionCache.get(pair.cacheKey);
    if (cached) {
      setImageUrl(cached);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    setImageUrl(null);
    setError(null);
    setLoading(true);

    (async () => {
      // Stage 1: try pre-baked PNG.
      const prebakedUrl = `/interactions/${pair.cacheKey}.png`;
      try {
        const head = await fetch(prebakedUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        if (head.ok) {
          if (cancelled) return;
          sessionCache.set(pair.cacheKey, prebakedUrl);
          setImageUrl(prebakedUrl);
          setLoading(false);
          return;
        }
      } catch {
        // ignore — fall through to edge function
      }

      // Stage 2: live generation via edge function.
      const supabase = getSupabase();
      if (!supabase) {
        if (!cancelled) {
          setError("Supabase not configured");
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error: fnError } =
          await supabase.functions.invoke<EdgeResponse>("interaction-image", {
            body: { prompt: pair.promptTemplate, cacheKey: pair.cacheKey },
          });
        if (cancelled) return;
        if (fnError) throw fnError;
        if (!data?.dataUrl) throw new Error("Edge response missing dataUrl");

        sessionCache.set(pair.cacheKey, data.dataUrl);
        setImageUrl(data.dataUrl);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "unknown error";
        if (import.meta.env.DEV) {
          console.warn("useInteractionImage: edge call failed:", message);
        }
        setError(message);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [pair]);

  return { imageUrl, loading, error };
}
