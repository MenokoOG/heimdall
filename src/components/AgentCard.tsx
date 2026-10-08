import { pct, type AgentSummary } from "../lib/aggregate";
import { AGENT_INFO } from "../lib/agents";

interface Props {
  summary: AgentSummary;
  /** Daily request counts for this agent, oldest first. */
  series: number[];
  active: boolean;
  onToggle: () => void;
}

function Spark({ series }: { series: number[] }) {
  const max = Math.max(1, ...series);
  const step = series.length > 1 ? 100 / (series.length - 1) : 100;
  const pts = series.map((v, i) => `${(i * step).toFixed(1)},${(22 - (v / max) * 20).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function AgentCard({ summary: s, series, active, onToggle }: Props) {
  const info = AGENT_INFO[s.agent];
  const errorShare = s.total === 0 ? 0 : (s.errors / s.total) * 100;
  return (
    <article className={`card ${s.agent}${active ? "" : " off"}`}>
      <button type="button" className="card-head" onClick={onToggle} aria-pressed={active}>
        <span>
          <h2>{info.label}</h2>
          <small>{info.blurb}</small>
        </span>
        <span className="pill">{active ? "Shown" : "Hidden"}</span>
      </button>
      <div className="row between">
        <p className="big">{s.total}</p>
        <Spark series={series} />
      </div>
      <div
        className="meter"
        role="img"
        aria-label={`Error rate ${pct(s.errors, s.total)}`}
        title={`Error rate ${pct(s.errors, s.total)}`}
      >
        <span style={{ width: `${errorShare}%` }} />
      </div>
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
  );
}
