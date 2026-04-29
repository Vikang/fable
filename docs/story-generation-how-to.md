# Story Generation How-To

This app turns selected picture tiles into the next beat of a story. The child does not type a prompt. Instead, each tapped image adds a symbol id to the current utterance, and the story generator interprets those selected images as the ingredients for the next narration.

## Main Flow

1. The child taps picture tiles in the vocabulary grid.
2. `VocabGrid` stores the selected symbol ids in `session.utterance`.
3. When the child taps `Tell story`, `useAgentTurn` sends that utterance to `planTurn`.
4. `planTurn` calls `runAgent`.
5. `runAgent` first tries the Supabase Edge Function, which can call TokenRouter for a model-generated story.
6. If the live agent is not available, `runAgent` uses `composeLocalStory`.
7. The returned plan updates the narration, scene, character anchors, next vocabulary, and branch state.

The important files are:

- `src/components/VocabGrid.tsx`: records selected image tiles.
- `src/hooks/useAgentTurn.ts`: sends the selected ids into the story loop.
- `src/lib/agent/client.ts`: chooses live model generation or local fallback generation.
- `src/lib/agent/localStory.ts`: builds a story directly from the selected images when the live model is unavailable.
- `src/lib/vocab/symbols.ts`: defines every available image tile and its category.

## What Gets Sent

The selected pictures are represented as symbol ids. For example:

```ts
["mom", "drink", "water"]
```

Those ids map to symbol records in `src/lib/vocab/symbols.ts`:

```ts
{ id: "mom", label: "Mom", category: "people" }
{ id: "drink", label: "Drink", category: "action" }
{ id: "water", label: "Water", category: "object" }
```

The generator uses the symbol categories to understand what role each image should play in the story.

## Symbol Roles

The local story composer groups selected images into these roles:

- `people` or `animal`: the actor of the story beat.
- `action`: what the actor is trying to do.
- `object`: the thing, place, or item involved.
- `emotion`: the feeling or mood of the beat.

For example, `Mom + Drink + Water` becomes a story about Mom drinking water. `Dog + Run + Garden` becomes a story about Dog running toward the garden. `Cat + Hurt` becomes a hurt/tension beat and can trigger branching.

## Local Story Composer

`composeLocalStory` in `src/lib/agent/localStory.ts` creates a full `PlanOutput`:

```ts
{
  narration,
  sceneTags,
  sceneId,
  characterAnchors,
  suggestedVocab,
  branchReachable
}
```

It does five main things.

First, it converts selected ids into symbol records with `getSymbol`. Unknown ids are ignored so a bad tile cannot break the app.

Second, it extracts story parts with `getStoryParts`. This picks the first selected actor, action, object, and emotion from the selected images.

Third, it builds the active character with `buildCharacter`. If the child selected a person or animal, that selected image becomes the main character for the beat. If no actor was selected, it keeps the previous character, or falls back to Mango.

Fourth, it builds narration with `buildSelectedImagesNarration`. This is the key piece that makes the story based on selected images instead of hardcoded demo text. It combines the selected actor, action, object, and emotion into a readable story sentence.

Fifth, it returns scene tags, a scene id, next vocabulary suggestions, and branch information so the rest of the app can update.

The composer also checks whether an action/object pair makes sense. For example, `Eat + Cake` can become "eat the cake", but `Eat + Toy` should not become "eat the toy". When a pair is mismatched, the story still honors both selected images, but it pivots into a safer sentence about noticing the object and turning it into part of the story.

## Examples

`["mom", "drink", "water"]` produces a story beat centered on Mom and water:

```txt
Mom wanted to drink from the water. So mom tried it carefully, and something bright began to happen.
```

`["dog", "run", "garden"]` produces a beat centered on Dog and the garden:

```txt
Dog wanted to run toward the garden. So dog tried it carefully, and something bright began to happen.
```

`["cat", "hurt"]` produces a tension beat:

```txt
Cat felt hurt. The feeling became the first small lantern for the next page.
```

Because `hurt` maps to the `hurt` mood, the plan can set `branchReachable` to `true` when branching has not already been used.

## Live Model vs Local Fallback

The live path lives in `src/lib/agent/client.ts`. `runAgent` tries to call the Supabase Edge Function named `agent`. That Edge Function can use TokenRouter to generate richer narration.

If the live call fails because Supabase is not configured, the network is unavailable, or the Edge Function returns an error, the app does not go back to canned demo lines. It calls `composeLocalStory(input)` instead.

That fallback still uses the selected image tiles, so story generation remains functional during local development and demos.

## Adding New Image Tiles

To add a new image tile:

1. Add the symbol to `src/lib/vocab/symbols.ts`.
2. Pick the correct category: `people`, `animal`, `action`, `object`, or `emotion`.
3. If it is a person or animal and needs nicer narration, add a description in `buildCharacter`.
4. If it is an action that needs special grammar with objects, add it to `describeAction`.
5. If it only makes sense with certain objects, update `isCompatibleActionObject`.
6. If it should influence mood, add it to `inferMood`.
7. If it should affect scene choice or next vocabulary, update `chooseSceneId` or `buildNextVocab`.

## Testing

The focused test is:

```sh
npx tsx src/lib/agent/localStory.test.ts
```

The test checks that selected images produce story text based on those images. For example, `Mom + Drink + Water` must mention Mom and water, and must not fall back to a generic Mango line.

Run the full verification with:

```sh
npm run typecheck
npm run build
```
