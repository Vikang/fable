import assert from "node:assert/strict";
import { composeLocalStory } from "./localStory";

const baseCharacters = [
  { id: "mango", name: "Mango", description: "a curious ginger cat", mood: "happy" as const },
];

const firstBeat = composeLocalStory({
  utterance: ["dog", "run", "garden"],
  turnIndex: 1,
  characters: baseCharacters,
  branchUsed: false,
});

assert.match(firstBeat.narration, /Dog/);
assert.match(firstBeat.narration, /dog|garden|ran|run/i);
assert.doesNotMatch(firstBeat.narration, /Mango thought about it/i);
assert.equal(firstBeat.suggestedVocab.length, 9);
assert.ok(firstBeat.suggestedVocab.includes("tellStory"));
assert.ok(firstBeat.sceneTags.some((tag) => ["dog", "run", "garden"].includes(tag)));

const tensionBeat = composeLocalStory({
  utterance: ["cat", "hurt"],
  turnIndex: 2,
  characters: firstBeat.characterAnchors,
  branchUsed: false,
});

assert.match(tensionBeat.narration, /hurt|ache|tummy|sad|help/i);
assert.equal(tensionBeat.branchReachable, true);
assert.equal(tensionBeat.characterAnchors[0]?.mood, "hurt");

const selectedImagesBeat = composeLocalStory({
  utterance: ["mom", "drink", "water"],
  turnIndex: 1,
  characters: baseCharacters,
  branchUsed: false,
});

assert.match(selectedImagesBeat.narration, /Mom/);
assert.match(selectedImagesBeat.narration, /drink|sip|water/i);
assert.doesNotMatch(selectedImagesBeat.narration, /Mango stepped into the morning/i);
assert.equal(selectedImagesBeat.characterAnchors[0]?.name, "Mom");

const mismatchedActionObjectBeat = composeLocalStory({
  utterance: ["mom", "eat", "toy"],
  turnIndex: 1,
  characters: baseCharacters,
  branchUsed: false,
});

assert.match(mismatchedActionObjectBeat.narration, /Mom/);
assert.match(mismatchedActionObjectBeat.narration, /toy/i);
assert.doesNotMatch(mismatchedActionObjectBeat.narration, /eat the toy/i);
assert.doesNotMatch(mismatchedActionObjectBeat.narration, /wanted to eat/i);
