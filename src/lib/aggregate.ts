import { AGENTS, type Agent, type StoredEvent } from "../shared/event";

export interface AgentSummary {
  agent: Agent;
  total: number;
  errors: number;
  offline: number;
  degraded: number;
  slow: number;
  buckets: Record<string, number>;
}

export interface DayCount {
  day: string;
  counts: Record<Agent, number>;
}

export function summarize(events: StoredEvent[]): AgentSummary[] {
  return AGENTS.map((agent) => {
    const mine = events.filter((e) => e.agent === agent);
    const buckets: Record<string, number> = {};
    for (const e of mine) if (e.bucket) buckets[e.bucket] = (buckets[e.bucket] ?? 0) + 1;
    return {
      agent,
      total: mine.length,
      errors: mine.filter((e) => e.error !== "none").length,
      offline: mine.filter((e) => e.mode === "offline").length,
      degraded: mine.filter((e) => e.degraded).length,
      slow: mine.filter((e) => e.latency === "gte4000").length,
      buckets,
    };
  });
}

export function byDay(events: StoredEvent[], days: number, now = new Date()): DayCount[] {
  const out: DayCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10);
    out.push({ day: d, counts: { twin: 0, banshee: 0, willow: 0 } });
  }
  const index = new Map(out.map((d) => [d.day, d]));
  for (const e of events) {
    const row = index.get(e.ts.slice(0, 10));
    if (row) row.counts[e.agent] += 1;
  }
  return out;
}

export const pct = (part: number, whole: number): string =>
  whole === 0 ? "0%" : `${Math.round((part / whole) * 100)}%`;
