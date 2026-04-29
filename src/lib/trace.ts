import type { TraceEntry, TraceLevel } from "../types";

let counter = 0;

function nowStamp(): string {
  const d = new Date();
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

export interface TraceBuilderRow {
  label: string;
  marks?: { text: string; level: TraceLevel }[];
}

export function makeEntry(
  rows: TraceBuilderRow[],
  arrow?: { text: string; tone?: TraceLevel },
  opts: { live?: boolean } = {}
): TraceEntry {
  counter += 1;
  return {
    id: `trace-${counter}-${Math.random().toString(36).slice(2, 7)}`,
    ts: nowStamp(),
    rows,
    arrow,
    live: opts.live ?? false,
  };
}
