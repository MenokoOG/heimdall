import { describe, expect, it } from "vitest";
import { latencyBand, parseEvent } from "../src/shared/event";
import { byDay, summarize } from "../src/lib/aggregate";
import type { StoredEvent } from "../src/shared/event";

const good = { v: 1, agent: "banshee", mode: "live", degraded: false, latency: "lt500", error: "none", bucket: "D", path: "/work" };

describe("parseEvent", () => {
  it("accepts a valid event", () => {
    expect(parseEvent(good).ok).toBe(true);
  });

  it("rejects any field that could carry visitor text", () => {
    for (const extra of ["message", "query", "text", "hash", "length"]) {
      const r = parseEvent({ ...good, [extra]: "hello" });
      expect(r.ok).toBe(false);
    }
  });

  it("rejects a free-text path", () => {
    expect(parseEvent({ ...good, path: "/what is the price?" }).ok).toBe(false);
    expect(parseEvent({ ...good, path: "https://evil.example" }).ok).toBe(false);
  });

  it("rejects bad enums and non-objects", () => {
    expect(parseEvent({ ...good, agent: "ag3nt24" }).ok).toBe(false);
    expect(parseEvent({ ...good, bucket: "Z" }).ok).toBe(false);
    expect(parseEvent(null).ok).toBe(false);
    expect(parseEvent([good]).ok).toBe(false);
  });
});

describe("latencyBand", () => {
  it("bands at the edges", () => {
    expect(latencyBand(499)).toBe("lt500");
    expect(latencyBand(500)).toBe("lt1500");
    expect(latencyBand(4000)).toBe("gte4000");
  });
});

describe("aggregate", () => {
  const now = new Date("2026-10-07T12:00:00Z");
  const events: StoredEvent[] = [
    { ...(good as StoredEvent), ts: "2026-10-07T01:00:00Z" },
    { ...(good as StoredEvent), agent: "willow", error: "upstream", mode: "offline", ts: "2026-10-06T01:00:00Z" },
  ];

  it("summarizes per agent", () => {
    const s = summarize(events);
    expect(s.find((x) => x.agent === "banshee")?.buckets.D).toBe(1);
    expect(s.find((x) => x.agent === "willow")?.errors).toBe(1);
    expect(s.find((x) => x.agent === "twin")?.total).toBe(0);
  });

  it("buckets by UTC day", () => {
    const d = byDay(events, 2, now);
    expect(d.map((x) => x.day)).toEqual(["2026-10-06", "2026-10-07"]);
    expect(d[1]?.counts.banshee).toBe(1);
    expect(d[0]?.counts.willow).toBe(1);
  });
});
