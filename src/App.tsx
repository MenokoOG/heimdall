import { useCallback, useEffect, useState } from "react";
import { fetchEvents } from "./lib/api";
import { byDay, pct, summarize } from "./lib/aggregate";
import type { Agent, StoredEvent } from "./shared/event";

const LABELS: Record<Agent, string> = { twin: "Digital twin", banshee: "Banshee", willow: "Willow" };
const TOKEN_KEY = "heimdall.token";

const readToken = (): string => {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
};

export function App() {
  const [token, setToken] = useState(readToken);
  const [draft, setDraft] = useState("");
  const [days, setDays] = useState(7);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setEvents(await fetchEvents(token, days));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [token, days]);

  useEffect(() => {
    void load();
  }, [load]);

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      sessionStorage.setItem(TOKEN_KEY, draft);
    } catch {
      /* storage blocked: token lives in memory for this tab only */
    }
    setToken(draft);
  };

  if (!token) {
    return (
      <main className="shell">
        <h1>Heimdall</h1>
        <p className="muted">Enter the read token to watch the bridge.</p>
        <form onSubmit={signIn} className="row">
          <input
            type="password"
            aria-label="Read token"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
          <button type="submit" disabled={!draft}>Open</button>
        </form>
      </main>
    );
  }

  const summary = summarize(events);
  const daily = byDay(events, days);
  const peak = Math.max(1, ...daily.map((d) => d.counts.twin + d.counts.banshee + d.counts.willow));

  return (
    <main className="shell">
      <header className="row between">
        <h1>Heimdall</h1>
        <div className="row">
          <select aria-label="Window" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 7, 14, 30].map((d) => (
              <option key={d} value={d}>{d === 1 ? "Today" : `${d} days`}</option>
            ))}
          </select>
          <button onClick={() => void load()} disabled={loading}>{loading ? "Loading" : "Refresh"}</button>
        </div>
      </header>
      {error && <p role="alert" className="error">{error}</p>}

      <section className="grid" aria-label="Agents">
        {summary.map((s) => (
          <article key={s.agent} className={`card ${s.agent}`}>
            <h2>{LABELS[s.agent]}</h2>
            <p className="big">{s.total}</p>
            <dl>
              <dt>Errors</dt><dd>{s.errors} ({pct(s.errors, s.total)})</dd>
              <dt>Offline fallback</dt><dd>{s.offline} ({pct(s.offline, s.total)})</dd>
              <dt>Degraded</dt><dd>{s.degraded}</dd>
              <dt>Slow (4s+)</dt><dd>{s.slow}</dd>
              {s.agent === "banshee" && (
                <>
                  <dt>Asked for a human</dt><dd>{s.buckets.A ?? 0}</dd>
                  <dt>No signal</dt><dd>{s.buckets.B ?? 0}</dd>
                  <dt>Weak signal</dt><dd>{s.buckets.C ?? 0}</dd>
                  <dt>Routed</dt><dd>{s.buckets.D ?? 0}</dd>
                </>
              )}
            </dl>
          </article>
        ))}
      </section>

      <section aria-label="Requests per day">
        <h2>Requests per day</h2>
        <ol className="bars">
          {daily.map((d) => {
            const total = d.counts.twin + d.counts.banshee + d.counts.willow;
            return (
              <li key={d.day} title={`${d.day}: ${total}`}>
                <div className="stack" style={{ height: `${(total / peak) * 100}%` }}>
                  {(Object.keys(d.counts) as Agent[]).map((a) => (
                    <span key={a} className={a} style={{ flexGrow: d.counts[a] }} />
                  ))}
                </div>
                <small>{d.day.slice(5)}</small>
              </li>
            );
          })}
        </ol>
      </section>

      <p className="muted">Counts only. No visitor text is collected or shown.</p>
    </main>
  );
}
