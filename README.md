# Fable — AAC Narrative Engine

Tablet-first agentic AAC app. A child taps picture symbols and an agentic
narrator co-authors an illustrated, voiced storybook in response.

This is the demo-ready slice for a 90-second hack-day pitch — three pillars:

1. **Open-book main board** (illustration + narration + utterance + 3×3 vocab)
2. **Branch choice overlay** (mid-story fork once per session, around turn 3)
3. **Self-eval dev panel** (dark terminal trace of the agent loop)

## Run

```sh
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + vite build
```

## Watercolor imagery (Little Prince style)

Symbol tiles and story scenes use AI-generated watercolor PNGs in the visual
language of Saint-Exupéry's *Le Petit Prince* — soft washes, cream paper,
hand-drawn ink, scattered yellow stars. Images are pre-baked into
`/public/symbols` and `/public/scenes` so they ship as static assets and
render instantly.

```sh
# Bake everything (skips files that already exist)
npm run generate-images

# Re-bake specific ids after tweaking prompts
npm run generate-images -- --only=cat,dog,kitchen-cake --force

# Adjust parallel requests (each call ≈ 3 min, ~$0.22)
npm run generate-images -- --concurrency=4
```

The artistic direction lives in [`scripts/style-prompts.ts`](scripts/style-prompts.ts).
Tune `MASTER_STYLE` to dial the look up or down — every per-symbol prompt
inherits from it. The script calls TokenRouter's `/v1/responses` endpoint with
the model from `TOKENROUTER_MODEL_IMAGE` (default `openai/gpt-5.4-image-2`).
Tiles fall back to the emoji glyph if a PNG is missing, so the demo never
breaks mid-bake.

## Demo arc

1. Tap **Cat → Eat → Cake → tell story** — narration plays, vocabulary FLIP-rearranges.
2. Tap **Cat → Hurt → tell story** — branch overlay rises with three cards.
3. Pick **call the doctor** (agent's pick), **comfort the cat**, or **let cat rest**.

Long-press the canvas to see the character-state badge. Toggle the `dev` pill in
the top bar to show/hide the agent trace.

## Architecture

- `src/lib/agent/` — the agent loop (parse → plan → render → eval → curate → branch).
  `client.ts` is the seam where a real Anthropic call would land; the demo runs a
  scripted reasoner so it never depends on a network call.
- `src/lib/scene/` — pre-baked illustration registry + tag-based matcher.
- `src/lib/vocab/` — symbol registry (~30 demo entries; ~60 in production).
- `src/lib/store.ts` — zustand session state.
- `src/lib/trace.ts` — devtools event log feeding `DevPanel`.
- `src/components/` — `TopBar`, `BookSpread`, `StoryCanvas`, `Narration`,
  `UtteranceStrip`, `VocabGrid`, `SymbolTile`, `BranchOverlay`, `BranchCard`,
  `DevPanel`.
- `src/hooks/` — `useAgentTurn`, `useFlipGrid`, `useTTS`, `useLongPress`.
