import type { Agent } from "../shared/event";

/** One row per agent. Add a row here when a new agent starts emitting. */
export const AGENT_INFO: Record<Agent, { label: string; blurb: string }> = {
  twin: { label: "Digital twin", blurb: "M3n0ko0g-Website" },
  banshee: { label: "Banshee", blurb: "classhuman.org" },
  willow: { label: "Willow", blurb: "willow-bend demo" },
};
