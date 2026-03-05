import { AgentScore, EconomicEvent } from "./types";

export interface TimingConfig {
  /** How many calendar days ahead to check for high-impact events */
  eventLookaheadDays: number; // default 3
  /** Penalty per high-impact event in the window */
  highImpactPenalty: number; // default 8
  /** Penalty per medium-impact event */
  mediumImpactPenalty: number; // default 3
  /** Minimum days since last evaluation before re-scoring */
  freshnessWindowDays: number; // default 1
}

const DEFAULT_TIMING_CONFIG: TimingConfig = {
  eventLookaheadDays: 3,
  highImpactPenalty: 8,
  mediumImpactPenalty: 3,
  freshnessWindowDays: 1,
};

/**
 * Timing Agent — scores based on macro/economic event proximity.
 *
 * Scoring (0–25):
 *  - Base score: 25 (no events → full marks)
 *  - Deductions for upcoming high/medium impact events
 *  - Freshness validation (is the signal still timely?)
 */
export class TimingAgent {
  private config: TimingConfig;

  constructor(config?: Partial<TimingConfig>) {
    this.config = { ...DEFAULT_TIMING_CONFIG, ...config };
  }

  evaluate(
    currentDate: string,
    economicEvents: EconomicEvent[]
  ): AgentScore {
    const current = new Date(currentDate).getTime();
    const lookaheadMs = this.config.eventLookaheadDays * 24 * 60 * 60 * 1000;

    // Find events within the lookahead window
    const upcomingEvents = economicEvents.filter((ev) => {
      const evTime = new Date(ev.date).getTime();
      return evTime >= current && evTime <= current + lookaheadMs;
    });

    const highCount = upcomingEvents.filter((e) => e.impactLevel === "high").length;
    const mediumCount = upcomingEvents.filter((e) => e.impactLevel === "medium").length;

    const penalty =
      highCount * this.config.highImpactPenalty +
      mediumCount * this.config.mediumImpactPenalty;

    const score = Math.max(0, 25 - penalty);

    return {
      score: Math.round(score * 100) / 100,
      maxScore: 25,
      details: {
        upcomingHighImpact: highCount,
        upcomingMediumImpact: mediumCount,
        totalPenalty: penalty,
        eventNames: upcomingEvents.slice(0, 3).map((e) => e.eventName),
      },
    };
  }
}
