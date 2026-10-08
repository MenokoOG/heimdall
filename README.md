# Heimdall

The watcher. A free, open-source telemetry dashboard for the agents deployed on Lawrence's sites: the digital twin (M3n0ko0g-Website), Banshee (classhuman.org) and Willow (willow-bend demo).

**Counts only.** No visitor text is collected, hashed or measured. The ingest function rejects any field outside a fixed enum list (see `src/shared/event.ts`).

## Shape

```
agents (Netlify functions) --POST--> sink (Netlify: /api/ingest, Blobs)
                                       ^
dashboard (GitHub Pages) --GET /api/read, Bearer token--+
```

## Set up

Sink, on a new Netlify site from this repo:

| Env var | Purpose |
| --- | --- |
| `INGEST_KEY` | Secret the agents send as `x-heimdall-key`. |
| `READ_TOKEN` | Secret you type into the dashboard. |
| `DASHBOARD_ORIGIN` | Exact Pages origin, e.g. `https://menokoog.github.io`. |

Dashboard, in the GitHub repo settings: Pages source = GitHub Actions, and a repository variable `SINK_URL` = the Netlify site origin.

Agents: see [docs/emit-snippets.md](docs/emit-snippets.md).

## Develop

```bash
npm install
npm test
npm run dev
```

## License

MIT
