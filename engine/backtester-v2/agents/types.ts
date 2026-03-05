/** Shared types for the multi-agent scoring pipeline */

export interface AgentScore {
  score: number;       // 0–25 (default max per agent)
  maxScore: number;    // The max possible for this agent
  details: Record<string, any>; // Agent-specific breakdown
}

export interface AgentWeights {
  analyst: number;   // default 25
  risk: number;      // default 25
  timing: number;    // default 25
  portfolio: number; // default 25
}

export interface VerdictCutoffs {
  take: number;  // default 70
  watch: number; // default 50
}

export type Verdict = "TAKE" | "WATCH" | "SKIP";

export interface CompositeVerdict {
  date: string;
  symbol: string;
  verdict: Verdict;
  compositeScore: number;
  agentScores: {
    analyst: AgentScore;
    risk: AgentScore;
    timing: AgentScore;
    portfolio: AgentScore;
  };
}

/** Pre-loaded lookup for a symbol's historical pattern statistics */
export interface PatternStatEntry {
  winRate: number;       // 0–1
  expectancyR: number;   // avg R-multiple
  sampleSize: number;    // total trades
  avgRR: number;         // average risk-reward ratio
}

/** Pre-loaded economic event for timing agent */
export interface EconomicEvent {
  date: string;           // ISO date
  impactLevel: "high" | "medium" | "low";
  eventName: string;
}

export const DEFAULT_WEIGHTS: AgentWeights = {
  analyst: 25,
  risk: 25,
  timing: 25,
  portfolio: 25,
};

export const DEFAULT_CUTOFFS: VerdictCutoffs = {
  take: 70,
  watch: 50,
};
