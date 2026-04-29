// Style configuration for AI-generated AAC imagery.
//
// The MASTER_STYLE prefix is prepended to every prompt so all symbols and
// scenes share one visual language. Tune this string to dial the look up or
// down — every other prompt inherits from it.
//
// Run `npm run generate-images` to (re)bake the PNGs into /public/symbols
// and /public/scenes. Add `-- --only=cat,dog` to target specific ids and
// `-- --force` to overwrite existing files.

export const MASTER_STYLE =
  "Soft watercolor children's book illustration in the gentle style of " +
  "Antoine de Saint-Exupéry's Le Petit Prince. " +
  "Hand-drawn with thin slightly imperfect black ink outlines and loose, " +
  "dreamy watercolor washes. " +
  "Pastel palette: muted sage greens, soft golden yellows, dusty sky blues, " +
  "pale rose, warm ochers, cream. " +
  "Three to five tiny yellow five-pointed stars scattered in the negative " +
  "space around the subject. " +
  "A small painted ground beneath the subject when it makes sense " +
  "(a soft hill, a tiny round planet, or a patch of grass with little flowers). " +
  "Pure cream watercolor paper background, visible paper texture. " +
  "Subjects rendered in their own natural watercolor colors on plain cream " +
  "paper — no global colored wash, no tinted overlay, no orange or warm " +
  "filter across the whole illustration. Normal brightness and saturation. " +
  "Childlike charm, warm and tender, story-book quality, generous airy " +
  "negative space. No text, no labels, no border, no signature, no frame.";

export const SYMBOL_STYLE =
  `${MASTER_STYLE} ` +
  "Square composition. A single readable subject occupying about 50-60% of " +
  "the frame, centered. Clear silhouette suitable for a 3- to 7-year-old " +
  "to recognize at a glance.";

export const SCENE_STYLE =
  `${MASTER_STYLE} ` +
  "Wide cinematic storybook scene. Composition leaves the bottom-left " +
  "clear for a small narration overlay. Soft foreground, gentle middle " +
  "ground, hazy atmospheric background.";

// Per-symbol prompts — describe the subject ONLY. The MASTER_STYLE handles
// the artistic look (watercolor, stars, palette, paper). Keep prompts short
// and concrete. Match the AAC vocabulary in src/lib/vocab/symbols.ts.
//
// "Mango" — the recurring protagonist — is rendered as a small ginger tabby
// cat in this style. For action symbols she is the actor when sensible, so
// the visual language stays coherent across the storybook.
export const symbolPrompts: Record<string, string> = {
  // animals
  cat: "A small ginger tabby cat sitting upright on a tiny round planet, looking curious, white chest, alert green dot eyes. Cream and orange watercolor fur with thin ink whiskers.",
  dog: "A small friendly puppy with floppy ears and a wagging tail, sitting on a soft green hill. Tan and cream watercolor fur, gentle expression.",
  rabbit: "A small white rabbit with long ears sitting on its hind legs in a patch of grass, twitching nose, soft pink ear linings.",
  bird: "A tiny round bluebird perched on a slender curved twig, wings tucked, pale sky-blue feathers with a single dot eye.",

  // people
  mom: "A kind young woman with shoulder-length brown hair in a soft cardigan, smiling warmly, holding her hands gently together. Half-figure, watercolor.",
  dad: "A gentle man with a short beard and tousled hair in a knit sweater, friendly half-smile. Half-figure, soft watercolor.",
  doctor: "A doctor in a white coat with a stethoscope around the neck, kind reassuring smile, neatly tied-back hair. Half-figure.",
  friend: "A small child with rosy cheeks and round eyes in a yellow scarf and green tunic, holding hands open in welcome.",

  // actions / verbs
  eat: "A small wooden spoon resting in a round cream ceramic bowl, with a single curl of steam rising. Tiny watercolor crumbs scattered.",
  drink: "A small ceramic mug of cool water with a curved handle, a single droplet on the rim, pale-blue watercolor wash.",
  hug: "A small ginger cat being gently embraced by a kind woman in a soft cardigan, both with closed peaceful eyes. Warm tender watercolor.",
  sleep: "A fluffed pillow with a tiny crescent moon and a single shooting star floating above it. Soft blue and lavender tones.",
  play: "Three colorful balloons drifting upward on thin strings — pink, yellow, sky-blue — over a small grassy hill.",
  run: "A small ginger cat mid-run with paws lifted, soft motion lines behind, on a winding dirt path leading off into the distance.",
  tellStory: "An open storybook with golden watercolor light spilling from the pages, two small birds floating up from the spread.",
  go: "A small leather suitcase standing beside a winding path that disappears toward a tiny round planet on the horizon.",

  // objects
  cake: "A round birthday cake with one lit candle on a wooden table, soft pink frosting, two small berries on top, a thin wisp of candle smoke.",
  medicine: "A tiny brown glass apothecary bottle with a dropper, a single drop of golden syrup hovering below, soft watercolor sparkles.",
  bed: "A small wooden child's bed with a folded patchwork quilt and a soft pillow, a tiny crescent moon floating above.",
  water: "A single round droplet of clear blue water, suspended mid-fall, with a tiny ripple beneath. Soft sky-blue wash.",
  toy: "A well-loved teddy bear with one slightly worn ear, sitting cross-legged on a small patch of grass, soft button eyes.",
  ball: "A red-and-cream striped ball on a soft green hill, simple and bright, casting a soft watercolor shadow.",
  house: "A small cottage with a triangular roof, a single round window, and a curl of smoke from the chimney. A path leads to the door.",
  garden: "Three tulips in a row — pink, yellow, lavender — with green stems, a single butterfly nearby. Patch of grass beneath.",

  // emotions
  happy: "A small ginger cat with closed eyes and a wide gentle smile, head tilted slightly upward, tiny watercolor sparkles around it.",
  sad: "A small ginger cat sitting with ears slightly drooped and a single watercolor tear at its cheek. Soft blue-gray cloud overhead.",
  hurt: "A small ginger cat with a tiny bandage on its head, a small red heart on the bandage, soft worried expression.",
  love: "A simple watercolor heart, soft pink fading to dusty rose, hand-painted brushstroke style, with two tiny yellow stars beside.",
  scared: "A small ginger cat peeking from behind a tall blade of grass, wide round eyes, ears alert. Tiny worry-mark hovering above.",
};

// Per-scene prompts — describe full storybook scene compositions.
// These produce the wide watercolor backdrops behind the StoryCanvas.
// They share the same MASTER_STYLE so the canvas and tile art are coherent.
export const scenePrompts: Record<string, string> = {
  intro:
    "A small ginger cat in a sunlit kitchen morning, looking out a round window at tulips in a garden. " +
    "A wooden table, a single steaming teacup. Tiny yellow stars drifting in. Peaceful start of a story.",
  "kitchen-cake":
    "A small ginger cat staring up longingly at a pink birthday cake on a wooden kitchen table. " +
    "A round window with soft morning light behind. Cozy, tempting, warm ochre tones. A few tiny stars overhead.",
  "cat-eating-cake":
    "A small ginger cat happily nibbling crumbs of pink cake on the kitchen floor, eyes closed in delight. " +
    "Crumbs scattered, tiny watercolor sparkles of joy and yellow stars floating in the air.",
  "tummy-ache":
    "A small ginger cat curled up tight with paws over its tummy, looking sad and uncomfortable. " +
    "Soft worried expression, dusty rose and pale ocher tones, a single floating watercolor worry-swirl above.",
  "doctor-visit":
    "A kind doctor in a white coat gently examining a small ginger cat with a stethoscope. " +
    "A small bottle of medicine on a side table, soft sage-green walls, warm reassuring scene.",
  "comfort-hug":
    "A mother in a soft cardigan cradling a small ginger cat in her arms, both with peaceful faces. " +
    "Wrapped in a knitted patchwork blanket, dusty pink and golden tones, evening light. A few yellow stars drifting.",
  "rest-bed":
    "A small ginger cat asleep on a tiny wooden bed, tucked under a patchwork quilt. " +
    "A glass of water nearby. Moonlight through a window, soft blue and lavender tones, three tiny stars in the sky.",
};

export type ImageJob = {
  kind: "symbol" | "scene";
  id: string;
  prompt: string;
};

export function buildSymbolJobs(): ImageJob[] {
  return Object.entries(symbolPrompts).map(([id, subject]) => ({
    kind: "symbol",
    id,
    prompt: `${SYMBOL_STYLE}\n\nSubject: ${subject}`,
  }));
}

export function buildSceneJobs(): ImageJob[] {
  return Object.entries(scenePrompts).map(([id, scene]) => ({
    kind: "scene",
    id,
    prompt: `${SCENE_STYLE}\n\nScene: ${scene}`,
  }));
}
