import type { CharacterAnchor, Symbol } from "../../types";
import type { PlanInput, PlanOutput } from "./client";
import { getSymbol } from "../vocab/symbols";

const DEFAULT_CHARACTER: CharacterAnchor = {
  id: "mango",
  name: "Mango",
  description: "a curious ginger cat",
  mood: "happy",
};

const DEFAULT_VOCAB = ["cat", "mom", "dad", "eat", "drink", "hug", "cake", "toy", "tellStory"];

export function composeLocalStory(input: PlanInput): PlanOutput {
  const symbols = input.utterance.map((id) => {
    try {
      return getSymbol(id);
    } catch {
      return null;
    }
  }).filter((symbol): symbol is NonNullable<typeof symbol> => Boolean(symbol));

  const ids = new Set(input.utterance);
  const storyParts = getStoryParts(symbols);
  const current = buildCharacter(storyParts.actor, input.characters[0]);
  const mood = inferMood(ids, current.mood);
  const characterAnchors = [
    {
      ...current,
      id: current.id || DEFAULT_CHARACTER.id,
      name: current.name || DEFAULT_CHARACTER.name,
      description: current.description || DEFAULT_CHARACTER.description,
      mood,
    },
  ];

  return {
    narration: buildNarration(input.turnIndex, ids, symbols, characterAnchors[0], storyParts),
    sceneTags: buildSceneTags(input.utterance, ids),
    sceneId: chooseSceneId(ids, input.turnIndex),
    characterAnchors,
    suggestedVocab: buildNextVocab(ids, mood),
    branchReachable: !input.branchUsed && mood === "hurt",
  };
}

interface StoryParts {
  actor?: Symbol;
  action?: Symbol;
  object?: Symbol;
  emotion?: Symbol;
}

function getStoryParts(symbols: Symbol[]): StoryParts {
  return {
    actor: symbols.find((symbol) => symbol.category === "people" || symbol.category === "animal"),
    action: symbols.find((symbol) => symbol.category === "action" && symbol.id !== "tellStory"),
    object: symbols.find((symbol) => symbol.category === "object"),
    emotion: symbols.find((symbol) => symbol.category === "emotion"),
  };
}

function buildCharacter(actor: Symbol | undefined, fallback: CharacterAnchor | undefined): CharacterAnchor {
  if (!actor) return fallback ?? DEFAULT_CHARACTER;

  const actorDescriptions: Partial<Record<string, string>> = {
    cat: "a curious cat",
    dog: "a bright-eyed dog",
    rabbit: "a soft little rabbit",
    bird: "a small singing bird",
    mom: "a gentle mom",
    dad: "a kind dad",
    doctor: "a helpful doctor",
    friend: "a cheerful friend",
  };

  return {
    id: actor.id,
    name: actor.label,
    description: actorDescriptions[actor.id] ?? `the ${actor.label.toLowerCase()}`,
    mood: fallback?.mood ?? DEFAULT_CHARACTER.mood,
  };
}

function inferMood(ids: Set<string>, fallback: CharacterAnchor["mood"]): CharacterAnchor["mood"] {
  if (ids.has("hurt") || ids.has("sad") || ids.has("scared")) return "hurt";
  if (ids.has("sleep") || ids.has("bed")) return "tired";
  if (ids.has("hug") || ids.has("love")) return "comforted";
  if (ids.has("doctor") || ids.has("medicine")) return "healed";
  if (ids.has("happy") || ids.has("play") || ids.has("run")) return "happy";
  return fallback;
}

function buildNarration(
  turnIndex: number,
  ids: Set<string>,
  symbols: ReturnType<typeof getSymbol>[],
  character: CharacterAnchor,
  storyParts: StoryParts
): string {
  const name = character.name || "Mango";
  const selectedStory = buildSelectedImagesNarration(turnIndex, name, storyParts);
  if (selectedStory) return selectedStory;

  if (ids.has("cat") && ids.has("eat") && ids.has("cake")) {
    return `${name} found a tiny cake glowing on the kitchen table. She took one brave bite, then another, and the room felt full of crumbs and wonder.`;
  }

  if (ids.has("hurt") || ids.has("sad") || ids.has("scared")) {
    return `${name} grew very still, with a little hurt feeling tucked inside her. She looked around softly, hoping someone would know how to help.`;
  }

  if (ids.has("doctor") || ids.has("medicine")) {
    return `A kind doctor listened to ${name} and offered a tiny spoon of medicine. Soon her whiskers lifted, as if the day had opened a small window.`;
  }

  if (ids.has("hug") || ids.has("love")) {
    return `${name} leaned into a warm hug and let the world become quiet. The story slowed down until her purr sounded like a little song.`;
  }

  if (ids.has("dog") || ids.has("garden") || ids.has("run")) {
    return `${name} met a bright-eyed dog near the garden path. Together they ran past flowers until a new adventure peeked from behind the gate.`;
  }

  if (ids.has("play") || ids.has("toy") || ids.has("ball")) {
    return `${name} batted a favorite toy across the sunny floor. It rolled into a secret corner where the next surprise was waiting.`;
  }

  if (ids.has("drink") || ids.has("water")) {
    return `${name} took a cool sip of water and blinked at the sparkling bowl. In the tiny ripples, she saw where the story wanted to go next.`;
  }

  if (symbols.length > 0) {
    const phrase = symbols.map((symbol) => symbol.label.toLowerCase()).join(", ");
    return turnIndex === 1
      ? `${name} stepped into the morning and noticed ${phrase}. The little clues gathered like stars, pointing her toward a new tale.`
      : `${name} remembered ${phrase} and followed the feeling forward. The tale turned gently, making room for the child's idea.`;
  }

  return `${name} paused in the warm light, listening for the next small sign. The story waited kindly, ready to begin again.`;
}

function buildSelectedImagesNarration(
  turnIndex: number,
  name: string,
  storyParts: StoryParts
): string | null {
  const action = storyParts.action?.label.toLowerCase();
  const object = storyParts.object?.label.toLowerCase();
  const emotion = storyParts.emotion?.label.toLowerCase();
  const actionClause = action ? describeAction(action, object) : null;

  if (actionClause && object && emotion) {
    return `${name} felt ${emotion} and decided to ${actionClause}. The small choice changed the day, and the story opened a new path.`;
  }

  if (actionClause && object) {
    return `${name} wanted to ${actionClause}. So ${name.toLowerCase()} tried it carefully, and something bright began to happen.`;
  }

  if (actionClause && emotion) {
    return `${name} felt ${emotion}, then chose to ${actionClause}. The feeling softened as the next part of the story came closer.`;
  }

  if (object && emotion) {
    return `${name} found the ${object} while feeling ${emotion}. It became an important clue for what would happen next.`;
  }

  if (actionClause) {
    return `${name} chose to ${actionClause}. One little action was enough to move the whole story forward.`;
  }

  if (object) {
    return `${name} noticed the ${object}. It seemed ordinary at first, but stories know how to make ordinary things shine.`;
  }

  if (emotion) {
    return `${name} felt ${emotion}. The feeling became the first small lantern for the next page.`;
  }

  if (storyParts.actor && turnIndex === 1) {
    return `${name} stepped into the morning. A new story gathered quietly around them, ready for the next picture.`;
  }

  return null;
}

function describeAction(action: string, object: string | undefined): string {
  if (!object) return action;

  const objectPhrase = `the ${object}`;
  const actionPhrases: Partial<Record<string, string>> = {
    drink: `drink from ${objectPhrase}`,
    eat: `eat ${objectPhrase}`,
    hug: `hug ${objectPhrase}`,
    sleep: `sleep beside ${objectPhrase}`,
    play: `play with ${objectPhrase}`,
    run: `run toward ${objectPhrase}`,
    go: `go to ${objectPhrase}`,
  };

  return actionPhrases[action] ?? `${action} with ${objectPhrase}`;
}

function buildSceneTags(utterance: string[], ids: Set<string>): string[] {
  const tags = utterance.filter((id) => id !== "tellStory").slice(0, 4);
  if (tags.length > 0) return tags;
  if (ids.has("tellStory")) return ["cat", "morning"];
  return ["intro", "cat"];
}

function chooseSceneId(ids: Set<string>, turnIndex: number): string {
  if (ids.has("doctor") || ids.has("medicine")) return "doctor-visit";
  if (ids.has("hug") || ids.has("love")) return "comfort-hug";
  if (ids.has("sleep") || ids.has("bed")) return "rest-bed";
  if (ids.has("hurt") || ids.has("sad") || ids.has("scared")) return "tummy-ache";
  if (ids.has("eat") && ids.has("cake")) return "cat-eating-cake";
  if (ids.has("cake") || turnIndex === 1) return "kitchen-cake";
  return "intro";
}

function buildNextVocab(ids: Set<string>, mood: CharacterAnchor["mood"]): string[] {
  if (mood === "hurt") {
    return fillVocab(["doctor", "mom", "hug", "medicine", "water", "bed", "sad", "cat", "tellStory"]);
  }
  if (mood === "healed" || mood === "comforted") {
    return fillVocab(["happy", "love", "play", "mom", "cat", "garden", "friend", "toy", "tellStory"]);
  }
  if (ids.has("dog") || ids.has("garden") || ids.has("run")) {
    return fillVocab(["dog", "cat", "run", "play", "friend", "garden", "happy", "ball", "tellStory"]);
  }
  if (ids.has("eat") || ids.has("cake")) {
    return fillVocab(["cat", "mom", "doctor", "hurt", "happy", "water", "hug", "bed", "tellStory"]);
  }
  return fillVocab(DEFAULT_VOCAB);
}

function fillVocab(ids: string[]): string[] {
  const unique = [...new Set([...ids, ...DEFAULT_VOCAB])];
  const withoutTellStory = unique.filter((id) => id !== "tellStory");
  return [...withoutTellStory.slice(0, 8), "tellStory"];
}
