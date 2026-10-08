// GET /api/read?days=7: returns stored events for the last N UTC days.
// Auth: Authorization: Bearer <READ_TOKEN>. CORS limited to DASHBOARD_ORIGIN.
import { getStore } from "@netlify/blobs";
import type { StoredEvent } from "../../src/shared/event";
import { safeEqual } from "../../src/shared/auth";

const MAX_DAYS = 30;
const MAX_EVENTS = 5000;

const cors = (): Record<string, string> => ({
  "access-control-allow-origin": process.env.DASHBOARD_ORIGIN ?? "",
  "access-control-allow-headers": "authorization",
  vary: "origin",
});

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...cors() },
  });

export default async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors() });
  if (req.method !== "GET") return json(405, { error: "method_not_allowed" });

  const token = process.env.READ_TOKEN;
  if (!token) return json(503, { error: "not_configured" });
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!safeEqual(given, token)) return json(401, { error: "unauthorized" });

  const asked = Number(new URL(req.url).searchParams.get("days") ?? "7");
  const days = Number.isInteger(asked) ? Math.min(Math.max(asked, 1), MAX_DAYS) : 7;

  const store = getStore("events");
  const events: StoredEvent[] = [];
  for (let i = 0; i < days && events.length < MAX_EVENTS; i++) {
    const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    const { blobs } = await store.list({ prefix: `${day}/` });
    const rows = await Promise.all(blobs.map((b) => store.get(b.key, { type: "json" })));
    for (const row of rows) if (row) events.push(row as StoredEvent);
  }

  return json(200, { days, truncated: events.length >= MAX_EVENTS, events: events.slice(0, MAX_EVENTS) });
};

export const config = { path: "/api/read" };
