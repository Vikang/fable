// Supabase Edge Function: /functions/v1/interaction-image
// Generates a watercolor character-interaction image via TokenRouter using
// the model in env (TOKENROUTER_MODEL_IMAGE, defaults to openai/gpt-5.4-image-2).
//
// Request body: { prompt: string, cacheKey: string }
// Response:     { dataUrl: string, _meta: { model, latency_ms, cacheKey } }
//
// Secret required: TOKENROUTER_API_KEY.

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/images/generations";
const DEFAULT_MODEL = "openai/gpt-5.4-image-2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface InteractionImageRequest {
  prompt: string;
  cacheKey: string;
}

interface ImageApiResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isInteractionImageRequest(x: unknown): x is InteractionImageRequest {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  return typeof o.prompt === "string" && typeof o.cacheKey === "string";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("TOKENROUTER_API_KEY");
  if (!apiKey) {
    return jsonResponse({ error: "TOKENROUTER_API_KEY not configured" }, 500);
  }
  const model = Deno.env.get("TOKENROUTER_MODEL_IMAGE") ?? DEFAULT_MODEL;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid JSON" }, 400);
  }
  if (!isInteractionImageRequest(body)) {
    return jsonResponse(
      { error: "expected { prompt: string, cacheKey: string }" },
      400,
    );
  }

  const { prompt, cacheKey } = body;
  const started = performance.now();

  try {
    const upstream = await fetch(TOKENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        size: "1024x1024",
        n: 1,
        response_format: "b64_json",
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return jsonResponse(
        { error: `TokenRouter ${upstream.status}: ${text.slice(0, 400)}` },
        502,
      );
    }

    const data = (await upstream.json()) as ImageApiResponse;
    const b64 = data.data?.[0]?.b64_json;
    const url = data.data?.[0]?.url;

    let dataUrl: string;
    if (b64) {
      dataUrl = `data:image/png;base64,${b64}`;
    } else if (url) {
      dataUrl = url;
    } else {
      return jsonResponse({ error: "no image in response" }, 502);
    }

    return jsonResponse({
      dataUrl,
      _meta: {
        model,
        latency_ms: Math.round(performance.now() - started),
        cacheKey,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return jsonResponse({ error: message }, 500);
  }
});
