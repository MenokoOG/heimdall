# Emit snippets

Each agent reports one counts-only event per request. Fire and forget, wrapped in try/catch, so the observer can never break the agent. Never pass visitor text.

Env vars on each agent's Netlify site: `HEIMDALL_URL` (the sink origin) and `HEIMDALL_KEY` (same value as the sink's `INGEST_KEY`).

## Shared helper (copy into each agent's `netlify/` folder)

```ts
type Band = "lt500" | "lt1500" | "lt4000" | "gte4000";

const band = (ms: number): Band =>
  ms < 500 ? "lt500" : ms < 1500 ? "lt1500" : ms < 4000 ? "lt4000" : "gte4000";

export function heimdall(evt: {
  agent: "twin" | "banshee" | "willow";
  mode: "live" | "offline";
  degraded: boolean;
  startedAt: number;
  error: "none" | "upstream" | "timeout" | "internal";
  bucket?: "A" | "B" | "C" | "D";
  path?: string;
}): void {
  try {
    const { startedAt, ...rest } = evt;
    void fetch(`${process.env.HEIMDALL_URL}/api/ingest`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-heimdall-key": process.env.HEIMDALL_KEY ?? "" },
      body: JSON.stringify({ v: 1, latency: band(Date.now() - startedAt), ...rest }),
    }).catch(() => {});
  } catch {
    /* never let the observer break the agent */
  }
}
```

On Netlify, a function can end before a fire-and-forget fetch finishes. Await it with a short timeout (`AbortSignal.timeout(800)`) just before returning the response.

## Where to call it

| Agent | File | Call site |
| --- | --- | --- |
| Banshee | `classhuman-org/netlify/functions/banshee.mjs` | Inside `emit()` at line 61, next to the existing `console.log`. Map `metric.bucket`, `metric.path`, `mode`, `degraded`. |
| Twin | `M3n0ko0g-Website/netlify/functions/chat.mts` | End of the stream, in the `done` and model-failure branches. `mode: "model"` maps to `live`, search-only fallback to `offline`. |
| Willow | `willow-bend/netlify/functions/willow.ts` | After the OpenAI response at line 107. A non-OK upstream is `error: "upstream"`. |

Each change is its own PR in that repo, on a `claude/*` branch.
