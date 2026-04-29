// Supabase Edge Function: /functions/v1/speech
// Soothing TTS via TokenRouter (openai/gpt-audio) → returns base64 audio.
//
// Secret required: TOKENROUTER_API_KEY.

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/audio/speech";
const MODEL = "openai/gpt-audio";
const VOICE = "shimmer"; // soft, calm storyteller voice

interface SpeechInput {
  text: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("TOKENROUTER_API_KEY");
  if (!apiKey) {
    return json({ error: "TOKENROUTER_API_KEY not configured" }, 500);
  }

  let body: SpeechInput;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const text = (body.text ?? "").toString().trim();
  if (!text) {
    return json({ error: "Missing 'text' field" }, 400);
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
        voice: VOICE,
        input: text,
        response_format: "mp3",
        // Slightly slower than default for a soothing storyteller cadence.
        speed: 0.92,
      }),
    });

    if (!trRes.ok) {
      const detail = await trRes.text();
      return json(
        { error: `TokenRouter ${trRes.status}`, detail: detail.slice(0, 500) },
        502,
      );
    }

    const arrayBuf = await trRes.arrayBuffer();
    const base64 = bufferToBase64(arrayBuf);

    return json(
      {
        audio: `data:audio/mpeg;base64,${base64}`,
        _meta: {
          model: MODEL,
          voice: VOICE,
          bytes: arrayBuf.byteLength,
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

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}
