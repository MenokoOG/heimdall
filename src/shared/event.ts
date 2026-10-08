/* The Heimdall event contract. COUNTS ONLY.
   Visitor text is never accepted: every field is an enum, a boolean, or a route
   path from our own site. Unknown keys are rejected, so a future caller cannot
   smuggle a message, a hash or a length through. Mirrors the Banshee ruling of
   2026-08-30. If you are here to add a free-text field, the answer is no. */

export const AGENTS = ["twin", "banshee", "willow"] as const;
export const MODES = ["live", "offline"] as const;
export const BUCKETS = ["A", "B", "C", "D"] as const;
export const LATENCY_BANDS = ["lt500", "lt1500", "lt4000", "gte4000"] as const;
export const ERROR_CLASSES = ["none", "upstream", "timeout", "internal"] as const;

export type Agent = (typeof AGENTS)[number];
export type Mode = (typeof MODES)[number];
export type Bucket = (typeof BUCKETS)[number];
export type LatencyBand = (typeof LATENCY_BANDS)[number];
export type ErrorClass = (typeof ERROR_CLASSES)[number];

export interface HeimdallEvent {
  v: 1;
  agent: Agent;
  mode: Mode;
  degraded: boolean;
  latency: LatencyBand;
  error: ErrorClass;
  /** Banshee routing bucket. Other agents omit it. */
  bucket?: Bucket;
  /** A route on our own site, e.g. "/work". Never visitor input. */
  path?: string;
}

export type StoredEvent = HeimdallEvent & { ts: string };

export type ParseResult =
  | { ok: true; event: HeimdallEvent }
  | { ok: false; reason: string };

const ALLOWED_KEYS = new Set(["v", "agent", "mode", "degraded", "latency", "error", "bucket", "path"]);
const PATH_RE = /^\/[a-z0-9/_-]{0,63}$/;

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T =>
  typeof value === "string" && (list as readonly string[]).includes(value);

export function latencyBand(ms: number): LatencyBand {
  if (ms < 500) return "lt500";
  if (ms < 1500) return "lt1500";
  if (ms < 4000) return "lt4000";
  return "gte4000";
}

export function parseEvent(input: unknown): ParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, reason: "body must be an object" };
  }
  const o = input as Record<string, unknown>;

  for (const key of Object.keys(o)) {
    if (!ALLOWED_KEYS.has(key)) return { ok: false, reason: `unknown field: ${key}` };
  }
  if (o.v !== 1) return { ok: false, reason: "v must be 1" };
  if (!oneOf(AGENTS, o.agent)) return { ok: false, reason: "bad agent" };
  if (!oneOf(MODES, o.mode)) return { ok: false, reason: "bad mode" };
  if (typeof o.degraded !== "boolean") return { ok: false, reason: "degraded must be boolean" };
  if (!oneOf(LATENCY_BANDS, o.latency)) return { ok: false, reason: "bad latency" };
  if (!oneOf(ERROR_CLASSES, o.error)) return { ok: false, reason: "bad error" };
  if (o.bucket !== undefined && !oneOf(BUCKETS, o.bucket)) return { ok: false, reason: "bad bucket" };
  if (o.path !== undefined && (typeof o.path !== "string" || !PATH_RE.test(o.path))) {
    return { ok: false, reason: "bad path" };
  }

  return {
    ok: true,
    event: {
      v: 1,
      agent: o.agent,
      mode: o.mode,
      degraded: o.degraded,
      latency: o.latency,
      error: o.error,
      ...(o.bucket !== undefined ? { bucket: o.bucket } : {}),
      ...(o.path !== undefined ? { path: o.path as string } : {}),
    },
  };
}
