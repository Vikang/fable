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
