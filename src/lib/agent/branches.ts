import type { BranchBundle } from "../../types";

// The three story bundles surfaced by the branch overlay (decision 10).
// Middle card is the agent's recommended pick.
export const branchBundles: BranchBundle[] = [
  {
    id: "comfort",
    label: "comfort the cat",
    tone: "warm",
    preview: "🤗",
    cluster: ["hug", "mom", "bed"],
    pickCopy: "tap to choose",
    resolveTo: {
      narration:
        "Mom scooped Mango up into the warmest hug. Slowly, the tummy-ache faded into a soft, sleepy purr.",
      sceneId: "comfort-hug",
      characters: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "comforted" },
      ],
      nextVocab: ["happy", "love", "sleep", "hug", "mom", "play", "cat", "garden", "tellStory"],
    },
  },
  {
    id: "doctor",
    label: "call the doctor",
    tone: "sage",
    preview: "👩‍⚕️",
    cluster: ["doctor", "medicine", "go"],
    recommended: true,
    pickCopy: "agent's pick",
    resolveTo: {
      narration:
        "Mom called the doctor right away. The doctor gave Mango a tiny spoon of medicine and a kind smile.",
      sceneId: "doctor-visit",
      characters: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "healed" },
        { id: "doctor", name: "Doctor", description: "the kind doctor", mood: "happy" },
      ],
      nextVocab: ["happy", "love", "play", "mom", "doctor", "cat", "garden", "friend", "tellStory"],
    },
  },
  {
    id: "rest",
    label: "let cat rest",
    tone: "muted",
    preview: "😴",
    cluster: ["sleep", "bed", "water"],
    pickCopy: "tap to choose",
    resolveTo: {
      narration:
        "Mom tucked Mango into the softest bed with a sip of cool water. She closed her eyes and slept until the hurt drifted away.",
      sceneId: "rest-bed",
      characters: [
        { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "tired" },
      ],
      nextVocab: ["happy", "love", "play", "mom", "cat", "garden", "friend", "toy", "tellStory"],
    },
  },
];

export function getBranch(id: string): BranchBundle {
  const b = branchBundles.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown branch id: ${id}`);
  return b;
}
