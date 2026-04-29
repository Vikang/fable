import { useEffect } from "react";
import { create } from "zustand";
import { getSupabase } from "../lib/supabase";

// Soothing storyteller voice via the Supabase Edge Function `speech`, which
// routes to TokenRouter (openai/gpt-audio + shimmer voice). Falls back to the
// browser SpeechSynthesis API on any error so the demo never goes silent.
//
// State is a *singleton* via Zustand: every component that mounts this hook
// shares the same `speakingText`. That means clicking a tile's play button
// while narration plays cancels the narration audio (instead of layering two
// voices). Components can compare `speakingText` to their own text to know
// whether they're the one currently speaking.

interface SpeechResponse {
  audio: string;
  _meta?: { model: string; voice: string; latency_ms: number };
}

function pickBrowserVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const preferred = ["Samantha", "Karen", "Moira", "Tessa", "Google UK English Female", "Google US English"];
  for (const name of preferred) {
    const v = voices.find((x) => x.name === name);
    if (v) return v;
  }
  return voices.find((v) => v.lang?.startsWith("en")) ?? voices[0];
}

// Module-scope refs the singleton owns. Not in the store: they are imperative
// audio handles, not React state.
let currentAudio: HTMLAudioElement | null = null;
let currentAbort: AbortController | null = null;
let requestToken = 0;

function teardown() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

interface TTSStore {
  speakingText: string | null;
  speak: (text: string) => Promise<void>;
  stop: () => void;
}

export const useTTSStore = create<TTSStore>((set) => ({
  speakingText: null,

  stop() {
    requestToken++;
    teardown();
    set({ speakingText: null });
  },

  async speak(text: string) {
    const myToken = ++requestToken;
    teardown();
    set({ speakingText: text });

    const supabase = getSupabase();
    if (!supabase) {
      speakBrowserFallback(
        text,
        () => {
          if (myToken === requestToken) set({ speakingText: text });
        },
        () => {
          if (myToken === requestToken) set({ speakingText: null });
        },
      );
      return;
    }

    const ac = new AbortController();
    currentAbort = ac;

    try {
      const { data, error } = await supabase.functions.invoke<SpeechResponse>("speech", {
        body: { text },
      });
      if (myToken !== requestToken) return;
      if (error || !data?.audio) {
        throw error ?? new Error("No audio returned");
      }
      const audio = new Audio(data.audio);
      currentAudio = audio;
      audio.onplay = () => {
        if (myToken === requestToken) set({ speakingText: text });
      };
      audio.onended = () => {
        if (myToken === requestToken) {
          if (currentAudio === audio) currentAudio = null;
          set({ speakingText: null });
        }
      };
      audio.onerror = () => {
        if (myToken === requestToken) {
          if (currentAudio === audio) currentAudio = null;
          set({ speakingText: null });
        }
      };
      await audio.play();
    } catch (err) {
      if (myToken !== requestToken) return;
      if (import.meta.env.DEV) {
        console.warn("useTTS: edge speech failed, falling back to browser TTS:", err);
      }
      speakBrowserFallback(
        text,
        () => {
          if (myToken === requestToken) set({ speakingText: text });
        },
        () => {
          if (myToken === requestToken) set({ speakingText: null });
        },
      );
    }
  },
}));

function speakBrowserFallback(text: string, onStart: () => void, onEnd: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickBrowserVoice();
  if (voice) u.voice = voice;
  u.rate = 0.95;
  u.pitch = 1.05;
  u.onstart = onStart;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}

// Backwards-compatible hook used by Narration. Tiles can subscribe to the
// store directly to also read `speakingText`.
export function useTTS() {
  const speak = useTTSStore((s) => s.speak);
  const stop = useTTSStore((s) => s.stop);
  const speakingText = useTTSStore((s) => s.speakingText);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const handler = () => void 0;
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  return { speak, stop, speaking: speakingText !== null, speakingText };
}
