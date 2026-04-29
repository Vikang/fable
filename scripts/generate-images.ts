// Pre-bake AAC symbol and scene watercolor PNGs by calling TokenRouter.
//
// Uses the OpenAI Responses API endpoint (/v1/responses) which is what
// TokenRouter exposes for the "image-generation" endpoint type. The model
// openai/gpt-5.4-image-2 takes ~3 min per image at ~$0.22 per call, so we
// run a small concurrency window and skip files that already exist.
//
// Usage:
//   npm run generate-images                              # everything missing
//   npm run generate-images -- --force                   # regenerate all
//   npm run generate-images -- --only=cat,dog,kitchen-cake
//   npm run generate-images -- --kind=symbols            # symbols only
//   npm run generate-images -- --kind=scenes             # scenes only
//   npm run generate-images -- --concurrency=4           # parallel requests
//
// Env (read from .env.local via tsx --env-file):
//   TOKENROUTER_API_KEY        required, server-side only
//   TOKENROUTER_MODEL_IMAGE    defaults to openai/gpt-5.4-image-2

import { Buffer } from "node:buffer";
import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { buildSceneJobs, buildSymbolJobs, type ImageJob } from "./style-prompts";

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/responses";
const MODEL = process.env.TOKENROUTER_MODEL_IMAGE ?? "openai/gpt-5.4-image-2";
const API_KEY = process.env.TOKENROUTER_API_KEY;
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes per image

if (!API_KEY) {
  console.error(
    "✗ TOKENROUTER_API_KEY is not set.\n" +
      "  Add it to .env.local and run via `npm run generate-images` " +
      "(which uses tsx --env-file=.env.local).",
  );
  process.exit(1);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SYMBOLS_DIR = join(ROOT, "public", "symbols");
const SCENES_DIR = join(ROOT, "public", "scenes");

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const onlyArg = argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const kindArg = argv.find((a) => a.startsWith("--kind="))?.split("=")[1];
const kind: "symbols" | "scenes" | "all" =
  kindArg === "symbols" || kindArg === "scenes" ? kindArg : "all";
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1];
const concurrency = Math.max(1, Math.min(8, Number(concurrencyArg) || 3));

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

interface ResponsesApiResponse {
  status?: string;
  output?: Array<{
    type?: string;
    status?: string;
    result?: string;
  }>;
  error?: { message?: string } | null;
}

async function fetchImage(prompt: string): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(TOKENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ model: MODEL, input: prompt }),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`TokenRouter ${res.status}: ${body.slice(0, 400)}`);
  }

  const json = (await res.json()) as ResponsesApiResponse;
  if (json.error?.message) throw new Error(`Model error: ${json.error.message}`);

  const imgPart = json.output?.find((o) => o.type === "image_generation_call");
  const result = imgPart?.result;
  if (!result) {
    throw new Error(
      `No image in response (status=${json.status}): ${JSON.stringify(json).slice(0, 300)}`,
    );
  }

  const match = result.match(/^data:[^;]+;base64,(.+)$/);
  const b64 = match ? match[1] : result;
  return Buffer.from(b64, "base64");
}

interface JobResult {
  id: string;
  outcome: "saved" | "skipped" | "failed";
  bytes?: number;
  ms?: number;
  error?: string;
}

async function processJob(job: ImageJob, outDir: string): Promise<JobResult> {
  const outPath = join(outDir, `${job.id}.png`);
  if (!force && (await exists(outPath))) {
    return { id: job.id, outcome: "skipped" };
  }
  const started = Date.now();
  try {
    const buf = await fetchImage(job.prompt);
    await writeFile(outPath, buf);
    return { id: job.id, outcome: "saved", bytes: buf.length, ms: Date.now() - started };
  } catch (err) {
    return {
      id: job.id,
      outcome: "failed",
      ms: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function runWithConcurrency<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  limit: number,
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: limit }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      await worker(items[i], i);
    }
  });
  await Promise.all(runners);
}

async function run(): Promise<void> {
  await mkdir(SYMBOLS_DIR, { recursive: true });
  await mkdir(SCENES_DIR, { recursive: true });

  const allJobs: Array<{ job: ImageJob; outDir: string }> = [];
  if (kind === "all" || kind === "symbols") {
    for (const job of buildSymbolJobs()) {
      if (only && !only.has(job.id)) continue;
      allJobs.push({ job, outDir: SYMBOLS_DIR });
    }
  }
  if (kind === "all" || kind === "scenes") {
    for (const job of buildSceneJobs()) {
      if (only && !only.has(job.id)) continue;
      allJobs.push({ job, outDir: SCENES_DIR });
    }
  }

  console.log("──────────────────────────────────────────────");
  console.log(`  Endpoint:    ${TOKENROUTER_URL}`);
  console.log(`  Model:       ${MODEL}`);
  console.log(`  Force:       ${force}`);
  console.log(`  Kind:        ${kind}`);
  console.log(`  Filter:      ${only ? Array.from(only).join(",") : "(all)"}`);
  console.log(`  Jobs:        ${allJobs.length}`);
  console.log(`  Concurrency: ${concurrency}`);
  console.log(`  Timeout:     ${Math.round(REQUEST_TIMEOUT_MS / 1000)}s per image`);
  console.log("──────────────────────────────────────────────");

  const startedAll = Date.now();
  const tally = { saved: 0, skipped: 0, failed: 0 };
  let inFlight = 0;
  let completed = 0;

  await runWithConcurrency(
    allJobs,
    async ({ job, outDir }) => {
      inFlight += 1;
      const label = `[${job.kind === "symbol" ? "symbol" : "scene "}]`;
      console.log(`▸ ${label} ${job.id} (in-flight: ${inFlight})`);
      const r = await processJob(job, outDir);
      inFlight -= 1;
      completed += 1;
      tally[r.outcome] += 1;
      const summary =
        r.outcome === "saved"
          ? `saved ${(r.bytes! / 1024).toFixed(0)} KB in ${(r.ms! / 1000).toFixed(0)}s`
          : r.outcome === "skipped"
            ? "skip (exists)"
            : `FAILED in ${(r.ms! / 1000).toFixed(0)}s — ${r.error}`;
      console.log(`  ↳ ${job.id}: ${summary} [${completed}/${allJobs.length}]`);
    },
    concurrency,
  );

  const totalMin = ((Date.now() - startedAll) / 60000).toFixed(1);
  console.log("──────────────────────────────────────────────");
  console.log(`  saved=${tally.saved} skipped=${tally.skipped} failed=${tally.failed}  (${totalMin} min)`);
  console.log("──────────────────────────────────────────────");

  if (tally.failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
