import { useCallback, useEffect, useMemo, useState } from "react";
import { AgentCard } from "./components/AgentCard";
import { DayChart } from "./components/DayChart";
import { Login } from "./components/Login";
import { AuthError, fetchEvents } from "./lib/api";
import { byDay, summarize } from "./lib/aggregate";
import { clearToken, readToken, writeToken } from "./lib/session";
import { AGENTS, type Agent, type StoredEvent } from "./shared/event";

const REFRESH_MS = 30_000;

export function App() {
  const [token, setToken] = useState(readToken);
  const [notice, setNotice] = useState("");
  const [days, setDays] = useState(7);
  const [events, setEvents] = useState<StoredEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [auto, setAuto] = useState(false);
  const [hidden, setHidden] = useState<Agent[]>([]);

  const signOut = useCallback((why = "Signed out.") => {
    clearToken();
    setToken("");
    setEvents([]);
    setError("");
    setUpdated(null);
    setAuto(false);
    setNotice(why);
  }, []);

  const signIn = (t: string) => {
    writeToken(t);
    setNotice("");
    setToken(t);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setEvents(await fetchEvents(token, days));
      setUpdated(new Date());
    } catch (e) {
      if (e instanceof AuthError) signOut(e.message);
      else setError(e instanceof Error ? e.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, [token, days, signOut]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      if (!document.hidden) void load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [auto, load]);

  const summary = useMemo(() => summarize(events), [events]);
  const daily = useMemo(() => byDay(events, days), [events, days]);
  const visible = AGENTS.filter((a) => !hidden.includes(a));
  const toggle = (a: Agent) =>
    setHidden((h) => (h.includes(a) ? h.filter((x) => x !== a) : [...h, a]));

  if (!token) return <Login notice={notice} onSubmit={signIn} />;

  return (
    <main className="shell">
      <header className="row between">
        <div>
          <h1>Heimdall</h1>
          <small role="status">
            {loading ? "Loading..." : updated ? `Updated ${updated.toLocaleTimeString()}` : ""}
          </small>
        </div>
        <div className="row">
          <select aria-label="Window" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {[1, 7, 14, 30].map((d) => (
              <option key={d} value={d}>{d === 1 ? "Today" : `${d} days`}</option>
            ))}
          </select>
          <label className="check">
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
            Auto-refresh
          </label>
          <button onClick={() => void load()} disabled={loading}>Refresh</button>
          <button className="ghost" onClick={() => signOut()}>Sign out</button>
        </div>
      </header>
      {error && <p role="alert" className="error">{error}</p>}

      <section className="grid" aria-label="Agents">
        {summary.map((s) => (
          <AgentCard
            key={s.agent}
            summary={s}
            series={daily.map((d) => d.counts[s.agent])}
            active={!hidden.includes(s.agent)}
            onToggle={() => toggle(s.agent)}
          />
        ))}
      </section>

      <DayChart daily={daily} visible={visible} />

      <p className="muted">Counts only. No visitor text is collected or shown.</p>
    </main>
  );
}
