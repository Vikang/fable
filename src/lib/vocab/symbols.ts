import type { Symbol } from "../../types";

// Curated demo vocabulary. Each entry stands in for one of the ~60 watercolor
// symbols mentioned in decision 3; the glyph field is an emoji placeholder
// that pre-baked watercolor PNGs will replace pre-demo.
export const symbols: Symbol[] = [
  // animals
  { id: "cat", glyph: "🐱", label: "Cat", category: "animal" },
  { id: "dog", glyph: "🐶", label: "Dog", category: "animal" },
  { id: "rabbit", glyph: "🐰", label: "Rabbit", category: "animal" },
  { id: "bird", glyph: "🐦", label: "Bird", category: "animal" },

  // people
  { id: "mom", glyph: "👩", label: "Mom", category: "people" },
  { id: "dad", glyph: "👨", label: "Dad", category: "people" },
  { id: "doctor", glyph: "👩‍⚕️", label: "Doctor", category: "people" },
  { id: "friend", glyph: "🧒", label: "Friend", category: "people" },

  // actions / verbs
  { id: "eat", glyph: "🍴", label: "Eat", category: "action" },
  { id: "drink", glyph: "🥤", label: "Drink", category: "action" },
  { id: "hug", glyph: "🤗", label: "Hug", category: "action" },
  { id: "sleep", glyph: "😴", label: "Sleep", category: "action" },
  { id: "play", glyph: "🎈", label: "Play", category: "action" },
  { id: "run", glyph: "🏃", label: "Run", category: "action" },
  { id: "tellStory", glyph: "📖", label: "Tell story", category: "action" },
  { id: "go", glyph: "🚶", label: "Go", category: "action" },

  // objects
  { id: "cake", glyph: "🍰", label: "Cake", category: "object" },
  { id: "medicine", glyph: "💊", label: "Medicine", category: "object" },
  { id: "bed", glyph: "🛏️", label: "Bed", category: "object" },
  { id: "water", glyph: "💧", label: "Water", category: "object" },
  { id: "toy", glyph: "🧸", label: "Toy", category: "object" },
  { id: "ball", glyph: "⚽", label: "Ball", category: "object" },
  { id: "house", glyph: "🏠", label: "House", category: "object" },
  { id: "garden", glyph: "🌷", label: "Garden", category: "object" },

  // emotions
  { id: "happy", glyph: "😊", label: "Happy", category: "emotion" },
  { id: "sad", glyph: "😢", label: "Sad", category: "emotion" },
  { id: "hurt", glyph: "🤕", label: "Hurt", category: "emotion" },
  { id: "love", glyph: "❤️", label: "Love", category: "emotion" },
  { id: "scared", glyph: "😨", label: "Scared", category: "emotion" },
];

const byId = new Map(symbols.map((s) => [s.id, s]));

export function getSymbol(id: string): Symbol {
  const s = byId.get(id);
  if (!s) throw new Error(`Unknown symbol id: ${id}`);
  return s;
}

export function getSymbols(ids: string[]): Symbol[] {
  return ids.map(getSymbol);
}
