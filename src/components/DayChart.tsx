import { useState } from "react";
import type { DayCount } from "../lib/aggregate";
import { AGENT_INFO } from "../lib/agents";
import type { Agent } from "../shared/event";

interface Props {
  daily: DayCount[];
  visible: Agent[];
}

export function DayChart({ daily, visible }: Props) {
  const [focus, setFocus] = useState<string | null>(null);
  const totalOf = (d: DayCount) => visible.reduce((n, a) => n + d.counts[a], 0);
  const peak = Math.max(1, ...daily.map(totalOf));
  const picked = daily.find((d) => d.day === focus);

  return (
    <section aria-label="Requests per day">
      <h2>Requests per day</h2>
      <p className="readout" aria-live="polite">
        {picked
          ? `${picked.day}: ${totalOf(picked)} total. ${visible
              .map((a) => `${AGENT_INFO[a].label} ${picked.counts[a]}`)
              .join(", ")}`
          : "Hover or focus a bar for the day's counts."}
      </p>
      <ol className="bars">
        {daily.map((d) => (
          <li key={d.day}>
            <button
              type="button"
              className={d.day === focus ? "bar on" : "bar"}
              aria-label={`${d.day}: ${totalOf(d)} requests`}
              onMouseEnter={() => setFocus(d.day)}
              onMouseLeave={() => setFocus(null)}
              onFocus={() => setFocus(d.day)}
              onBlur={() => setFocus(null)}
            >
              <span className="stack" style={{ height: `${(totalOf(d) / peak) * 100}%` }}>
                {visible.map((a) => (
                  <span key={a} className={a} style={{ flexGrow: d.counts[a] }} />
                ))}
              </span>
            </button>
            <small>{d.day.slice(5)}</small>
          </li>
        ))}
      </ol>
    </section>
  );
}
