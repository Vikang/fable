// Supabase Edge Function: /functions/v1/agent
// Receives a PlanInput, calls TokenRouter (anthropic/claude-opus-4.7) via the
// OpenAI-compatible chat completions endpoint, and returns a PlanOutput.
//
// Secret required: TOKENROUTER_API_KEY.

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/chat/completions";
const MODEL = "anthropic/claude-opus-4.7";

const VOCAB = [
  "cat", "dog", "rabbit", "bird",
  "mom", "dad", "doctor", "friend",
  "eat", "drink", "hug", "sleep", "play", "run", "tellStory", "go",
  "cake", "medicine", "bed", "water", "toy", "ball", "house", "garden",
  "happy", "sad", "hurt", "love", "scared",
];

const MOODS = ["neutral", "happy", "hurt", "tired", "comforted", "healed"];

const SCENE_IDS = [
  "intro",
  "kitchen-cake",
  "cat-eating-cake",
  "tummy-ache",
  "doctor-visit",
  "comfort-hug",
  "rest-bed",
];

interface PlanInput {
  utterance: string[];
  turnIndex: number;
  characters: { id: string; name: string; description: string; mood: string }[];
  branchUsed: boolean;
  branchChoiceId?: string;
}

const SYSTEM_PROMPT = `You are the narrator engine for Fable, a tablet AAC (Augmentative & Alternative Communication) storybook for children. A child taps picture symbols; you co-author the next beat of an illustrated tale.

VOICE & STYLE:
- Tone: warm, gentle, slightly whimsical — like Antoine de Saint-Exupéry's "The Little Prince". Quiet wonder, never saccharine.
- Audience: pre-readers, ages 3-7. Vocabulary they can hear and feel.
- Length: 1-2 short sentences. Max ~30 words. Read aloud beautifully.
- Build a real arc across turns: setup → tension → resolution. Don't just describe what was tapped — *use* the taps to advance the story.

CONTINUITY:
- Protagonist: a curious ginger cat named "Mango". Establish her on turn 1 if she isn't already in the characters list.
- Reuse character ids/names/descriptions across turns; only update mood as the story progresses.
- The narration must be a direct continuation of the prior turn — read the existing characters list.

INPUT REFLECTION:
- The child's tapped symbols are an *intent*, not a script. Weave them in naturally.
- If the taps are sparse or unclear (one tap, mismatched), invent gracefully without breaking the arc.
- DO NOT quote the tapped words back. Never write things like 'Mango whispered "cat dad mom"'. Translate intent into prose: e.g. taps [cat, mom, dad] → "Mango sat between Mom and Dad on the porch, listening to the evening hum." Treat taps as gestures, not dialogue.
- DO NOT include narrator commentary like '...and the story carried on' or '...she thought about it'. Each beat moves the story forward concretely with new action, image, or feeling.

NEXT-TURN VOCAB:
- Suggest exactly 9 symbol ids the child is most likely to want next, based on what the story now offers.
- Mix categories: include 2-3 emotion or character symbols (so the child can name how it feels), 2-3 actions, 2-3 objects, and ALWAYS include "tellStory" so the child can advance.

BRANCH:
- Set branchReachable=true ONLY if (a) the story has built genuine tension (e.g. character is "hurt" or "sad" or in trouble) AND (b) branchUsed=false. Otherwise false.

VOCAB POOL (only these symbol ids exist): ${VOCAB.join(", ")}
MOODS (only these): ${MOODS.join(", ")}
SCENE IDS (pick the best match for the current beat): ${SCENE_IDS.join(", ")}

RESPOND WITH STRICT JSON (no markdown, no commentary):
{
  "narration": string,                  // 1-2 sentences, ~30 words max
  "sceneTags": string[],                // 2-4 ids from VOCAB describing the visual
  "sceneId": string,                    // best match from SCENE IDS for the current beat
  "characterAnchors": [{"id": string, "name": string, "description": string, "mood": one of MOODS}],
  "suggestedVocab": string[],           // 9 ids from VOCAB the child might tap next
  "branchReachable": boolean
}`;

function buildUserPrompt(input: PlanInput): string {
  const parts: string[] = [];
  parts.push(`Turn ${input.turnIndex}.`);
  parts.push(`Child tapped: [${input.utterance.join(", ") || "(nothing)"}]`);
  if (input.characters.length > 0) {
    parts.push(`Existing characters: ${JSON.stringify(input.characters)}`);
  } else {
    parts.push(`No characters yet — establish Mango if appropriate.`);
  }
  parts.push(`Branch already used this session: ${input.branchUsed}`);
  if (input.branchChoiceId) {
    parts.push(`Child chose branch: "${input.branchChoiceId}". Resolve the conflict warmly and conclude this beat.`);
  }
  parts.push(`Return JSON only.`);
  return parts.join("\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders(req) });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("TOKENROUTER_API_KEY");
  if (!apiKey) {
    return json({ error: "TOKENROUTER_API_KEY not configured" }, 500);
  }

  let input: PlanInput;
  try {
    input = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const started = Date.now();
  try {
    const trRes = await fetch(TOKENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(input) },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
        max_tokens: 700,
      }),
    });

    if (!trRes.ok) {
      const body = await trRes.text();
      return json(
        { error: `TokenRouter ${trRes.status}`, detail: body.slice(0, 500) },
        502,
      );
    }

    const data = await trRes.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return json({ error: "Unexpected TokenRouter response shape" }, 502);
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return json({ error: "Model returned non-JSON content", content }, 502);
    }

    return json(
      {
        ...(parsed as object),
        _meta: {
          model: MODEL,
          latency_ms: Date.now() - started,
        },
      },
      200,
    );
  } catch (err) {
    return json(
      { error: "Edge function error", detail: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});

function corsHeaders(req?: Request): HeadersInit {
  // Echo the browser's requested headers back so we never block on a header
  // the supabase-js client (or any future client) decides to send.
  const requested = req?.headers.get("Access-Control-Request-Headers");
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      requested ?? "authorization, apikey, content-type, x-client-info",
    "Access-Control-Max-Age": "600",
  };
}

function json(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}
