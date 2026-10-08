// POST /api/ingest: agents report one counts-only event per request.
// Auth: x-heimdall-key must equal INGEST_KEY. Storage: Netlify Blobs, one blob
// per event (race-free, no read-modify-write), keyed by UTC day.
import { getStore } from "@netlify/blobs";
import { safeEqual } from "../../src/shared/auth";
import { parseEvent } from "../../src/shared/event";

const MAX_BODY = 1024;

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const key = process.env.INGEST_KEY;
  if (!key) return json(503, { error: "not_configured" });
  if (!safeEqual(req.headers.get("x-heimdall-key") ?? "", key)) return json(401, { error: "unauthorized" });

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json(413, { error: "too_large" });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "bad_json" });
  }

  const parsed = parseEvent(body);
  if (!parsed.ok) return json(400, { error: "invalid_event", reason: parsed.reason });

  const ts = new Date().toISOString();
  const store = getStore("events");
  await store.setJSON(`${ts.slice(0, 10)}/${ts}-${crypto.randomUUID()}`, { ...parsed.event, ts });
  return json(202, { ok: true });
};

export const config = { path: "/api/ingest" };
