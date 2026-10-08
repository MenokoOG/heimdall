import type { StoredEvent } from "../shared/event";

/** Base URL of the Netlify sink, set at build time. */
const SINK = (import.meta.env.VITE_SINK_URL as string | undefined) ?? "";

/** The sink refused the token. The caller should sign the user out. */
export class AuthError extends Error {
  constructor() {
    super("Token rejected. Sign in again.");
    this.name = "AuthError";
  }
}

export async function fetchEvents(token: string, days: number): Promise<StoredEvent[]> {
  const res = await fetch(`${SINK}/api/read?days=${days}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (res.status === 401) throw new AuthError();
  if (!res.ok) throw new Error(`Sink returned ${res.status}.`);
  const body = (await res.json()) as { events: StoredEvent[] };
  return body.events;
}
