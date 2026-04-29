// Pre-bake AAC symbol and scene watercolor PNGs and persist them to
// Supabase Storage so the (slow, paid) TokenRouter image API is only ever
// called once per asset across every environment.
//
// Lookup order for each job:
//   1. Local /public/{symbols|scenes}/{id}.png  → skip generation, then
//      upload to Storage if not already there ("synced").
//   2. Supabase Storage `fable-art/{symbols|scenes}/{id}.png` →
//      download to local. ("cached", no API spend.)
//   3. TokenRouter image API → save local + upload Storage. ("saved".)
//
// Usage:
//   npm run generate-images                              # everything missing (any layer)
//   npm run generate-images -- --force                   # regenerate via API + re-upload
//   npm run generate-images -- --only=cat,intro
//   npm run generate-images -- --kind=symbols            # symbols only
//   npm run generate-images -- --kind=scenes             # scenes only
//   npm run generate-images -- --concurrency=4
//   npm run generate-images -- --sync-only               # no API calls; local→Storage only
//
// Env (read from .env.local via tsx --env-file):
//   TOKENROUTER_API_KEY        required for API path, server-side only
//   TOKENROUTER_MODEL_IMAGE    defaults to openai/gpt-5.4-image-2
//   VITE_SUPABASE_URL          required for Storage cache
//   VITE_SUPABASE_ANON_KEY     required for Storage cache (RLS allows anon write)

import { Buffer } from "node:buffer";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { buildSceneJobs, buildSymbolJobs, type ImageJob } from "./style-prompts";

const TOKENROUTER_URL = "https://api.tokenrouter.com/v1/responses";
const MODEL = process.env.TOKENROUTER_MODEL_IMAGE ?? "openai/gpt-5.4-image-2";
const API_KEY = process.env.TOKENROUTER_API_KEY;
const REQUEST_TIMEOUT_MS = 5 * 60 * 1000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const STORAGE_BUCKET = "fable-art";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SYMBOLS_DIR = join(ROOT, "public", "symbols");
const SCENES_DIR = join(ROOT, "public", "scenes");

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const syncOnly = argv.includes("--sync-only");
const onlyArg = argv.find((a) => a.startsWith("--only="))?.split("=")[1];
const only = onlyArg ? new Set(onlyArg.split(",").map((s) => s.trim())) : null;
const kindArg = argv.find((a) => a.startsWith("--kind="))?.split("=")[1];
const kind: "symbols" | "scenes" | "all" =
  kindArg === "symbols" || kindArg === "scenes" ? kindArg : "all";
const concurrencyArg = argv.find((a) => a.startsWith("--concurrency="))?.split("=")[1];
const concurrency = Math.max(1, Math.min(8, Number(concurrencyArg) || 3));

if (!syncOnly && !API_KEY) {
  console.error(
    "✗ TOKENROUTER_API_KEY is not set.\n" +
      "  Add it to .env.local and run via `npm run generate-images`. " +
      "(Use --sync-only to upload existing local files without calling the API.)",
  );
  process.exit(1);
}

const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
    : null;

if (!supabase) {
  console.warn(
    "⚠ Supabase env not set — Storage cache disabled. Generations will hit the API every run.",
  );
}

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
  output?: Array<{ type?: string; status?: string; result?: string }>;
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

// ---------- Storage helpers ----------

async function listStorage(folder: string): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { limit: 1000 });
  if (error) {
    console.warn(`  ⚠ Storage list(${folder}) failed: ${error.message}`);
    return new Set();
  }
  return new Set((data ?? []).map((f) => f.name));
}

async function downloadFromStorage(storagePath: string): Promise<Buffer | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(storagePath);
    if (error || !data) return null;
    return Buffer.from(await data.arrayBuffer());
  } catch {
    return null;
  }
}

async function uploadToStorage(storagePath: string, buf: Buffer): Promise<string | null> {
  if (!supabase) return "no-supabase";
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buf, {
    contentType: "image/png",
    upsert: true,
  });
  return error ? error.message : null;
}

// ---------- Job processing ----------

interface JobResult {
  id: string;
  outcome: "saved" | "skipped" | "synced" | "cached" | "failed";
  bytes?: number;
  ms?: number;
  error?: string;
}

async function processJob(
  job: ImageJob,
  outDir: string,
  inStorage: Set<string>,
): Promise<JobResult> {
  const outPath = join(outDir, `${job.id}.png`);
  const folder = job.kind === "symbol" ? "symbols" : "scenes";
  const storagePath = `${folder}/${job.id}.png`;
  const filename = `${job.id}.png`;
  const started = Date.now();

  const localExists = !force && (await exists(outPath));
  const storageExists = inStorage.has(filename);

  // 1. Have local file already.
  if (localExists) {
    if (storageExists) {
      return { id: job.id, outcome: "skipped" };
    }
    // Sync local → Storage.
    try {
      const buf = await readFile(outPath);
      const err = await uploadToStorage(storagePath, buf);
      if (err && err !== "no-supabase") {
        return {
          id: job.id,
          outcome: "failed",
          error: `upload: ${err}`,
          ms: Date.now() - started,
        };
      }
      inStorage.add(filename);
      return { id: job.id, outcome: "synced", bytes: buf.length, ms: Date.now() - started };
    } catch (err) {
      return {
        id: job.id,
        outcome: "failed",
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // 2. Have file in Storage but not local — pull it down (no API spend).
  if (!force && storageExists) {
    const buf = await downloadFromStorage(storagePath);
    if (buf) {
      await writeFile(outPath, buf);
      return { id: job.id, outcome: "cached", bytes: buf.length, ms: Date.now() - started };
    }
  }

  // 3. Sync-only mode means we never call the API.
  if (syncOnly) {
    return { id: job.id, outcome: "skipped" };
  }

  // 4. Generate via TokenRouter, then persist to both local and Storage.
  try {
    const buf = await fetchImage(job.prompt);
    await writeFile(outPath, buf);
    const err = await uploadToStorage(storagePath, buf);
    if (err && err !== "no-supabase") {
      console.warn(`  ⚠ Generated ${job.id} but Storage upload failed: ${err}`);
    } else if (!err) {
      inStorage.add(filename);
    }
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

  const allJobs: Array<{ job: ImageJob; outDir: string; folder: string }> = [];
  if (kind === "all" || kind === "scenes") {
    // Scenes first — the StoryCanvas falls back to a giant emoji until
    // intro.png exists, so generating scenes earliest gets the demo looking
    // right faster.
    for (const job of buildSceneJobs()) {
      if (only && !only.has(job.id)) continue;
      allJobs.push({ job, outDir: SCENES_DIR, folder: "scenes" });
    }
  }
  if (kind === "all" || kind === "symbols") {
    for (const job of buildSymbolJobs()) {
      if (only && !only.has(job.id)) continue;
      allJobs.push({ job, outDir: SYMBOLS_DIR, folder: "symbols" });
    }
  }

  // Snapshot existing Storage contents once so per-job lookup is O(1).
  const storageSets: Record<string, Set<string>> = {
    symbols: await listStorage("symbols"),
    scenes: await listStorage("scenes"),
  };

  console.log("──────────────────────────────────────────────");
  console.log(`  API endpoint:   ${TOKENROUTER_URL}`);
  console.log(`  Model:          ${MODEL}`);
  console.log(`  Storage bucket: ${supabase ? STORAGE_BUCKET : "(disabled)"}`);
  console.log(`  Force:          ${force}`);
  console.log(`  Sync-only:      ${syncOnly}`);
  console.log(`  Kind:           ${kind}`);
  console.log(`  Filter:         ${only ? Array.from(only).join(",") : "(all)"}`);
  console.log(`  Jobs:           ${allJobs.length}`);
  console.log(`  Concurrency:    ${concurrency}`);
  console.log(
    `  In Storage:     symbols=${storageSets.symbols.size}, scenes=${storageSets.scenes.size}`,
  );
  console.log("──────────────────────────────────────────────");

  const startedAll = Date.now();
  const tally = { saved: 0, skipped: 0, synced: 0, cached: 0, failed: 0 };
  let inFlight = 0;
  let completed = 0;

  await runWithConcurrency(
    allJobs,
    async ({ job, outDir, folder }) => {
      inFlight += 1;
      const label = `[${job.kind === "symbol" ? "symbol" : "scene "}]`;
      console.log(`▸ ${label} ${job.id} (in-flight: ${inFlight})`);
      const r = await processJob(job, outDir, storageSets[folder]);
      inFlight -= 1;
      completed += 1;
      tally[r.outcome] += 1;
      const summary =
        r.outcome === "saved"
          ? `✓ generated + uploaded ${(r.bytes! / 1024).toFixed(0)} KB in ${(r.ms! / 1000).toFixed(0)}s`
          : r.outcome === "synced"
            ? `↑ uploaded local→Storage ${(r.bytes! / 1024).toFixed(0)} KB`
            : r.outcome === "cached"
              ? `↓ cache hit, downloaded ${(r.bytes! / 1024).toFixed(0)} KB`
              : r.outcome === "skipped"
                ? "skip (already in local + Storage)"
                : `✗ FAILED in ${(r.ms! / 1000).toFixed(0)}s — ${r.error}`;
      console.log(`  ↳ ${job.id}: ${summary} [${completed}/${allJobs.length}]`);
    },
    concurrency,
  );

  const totalMin = ((Date.now() - startedAll) / 60000).toFixed(1);
  console.log("──────────────────────────────────────────────");
  console.log(
    `  saved=${tally.saved} cached=${tally.cached} synced=${tally.synced} ` +
      `skipped=${tally.skipped} failed=${tally.failed}  (${totalMin} min)`,
  );
  console.log("──────────────────────────────────────────────");

  if (tally.failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
