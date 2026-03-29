import { SignalSet } from "../exec/execution";
import { AnalystAgent, AnalystConfig } from "../agents/AnalystAgent";
import { RiskAgent, RiskConfig } from "../agents/RiskAgent";
import { TimingAgent, TimingConfig } from "../agents/TimingAgent";
import { PortfolioAgent, PortfolioConfig } from "../agents/PortfolioAgent";
import {
  AgentWeights,
  VerdictCutoffs,
  CompositeVerdict,
  PatternStatEntry,
  EconomicEvent,
  DEFAULT_WEIGHTS,
  DEFAULT_CUTOFFS,
  Verdict,
} from "../agents/types";

export interface AgentOrchestratedParams {
  symbols: string[];
  agentWeights?: Partial<AgentWeights>;
  verdictCutoffs?: Partial<VerdictCutoffs>;
  rebalanceFrequencyDays: number; // how often to re-evaluate (default 1 = daily)

  // Pre-loaded data
  patternStats: Record<string, PatternStatEntry>;
  economicEvents: EconomicEvent[];

  // Per-agent configs (optional overrides)
  analystConfig?: Partial<AnalystConfig>;
  riskConfig?: Partial<RiskConfig>;
  timingConfig?: Partial<TimingConfig>;
  portfolioConfig?: Partial<PortfolioConfig>;
}

export class AgentOrchestratedPolicy {
  private analyst: AnalystAgent;
  private risk: RiskAgent;
  private timing: TimingAgent;
  private portfolioAgent: PortfolioAgent;

  private weights: AgentWeights;
  private cutoffs: VerdictCutoffs;
  private lastEvalDate?: string;

  /** Accumulated verdicts for audit trail */
  public verdicts: CompositeVerdict[] = [];

  constructor(private params: AgentOrchestratedParams) {
    this.weights = { ...DEFAULT_WEIGHTS, ...params.agentWeights };
    this.cutoffs = { ...DEFAULT_CUTOFFS, ...params.verdictCutoffs };

    // Normalize weights so they sum to 100
    const totalWeight = Object.values(this.weights).reduce((a, b) => a + b, 0);
    if (totalWeight !== 100) {
      const factor = 100 / totalWeight;
      this.weights.analyst *= factor;
      this.weights.risk *= factor;
      this.weights.timing *= factor;
      this.weights.portfolio *= factor;
    }

    this.analyst = new AnalystAgent(params.analystConfig);
    this.risk = new RiskAgent(params.riskConfig);
    this.timing = new TimingAgent(params.timingConfig);
    this.portfolioAgent = new PortfolioAgent(params.portfolioConfig);
  }

  generateSignals(
    date: string,
    prices: Record<string, number>,
    portfolioValue: number,
    currentWeights: Record<string, number>
  ): SignalSet {
    const signals: SignalSet = { signals: [] };

    // Feed prices to risk agent for ATR calculation
    for (const symbol of this.params.symbols) {
      if (prices[symbol]) {
        // Synthesize bar from close price — will use true range when OHLC data is available
        const close = prices[symbol];
        this.risk.updatePrice(symbol, { high: close, low: close, close });
      }
    }

    // Check rebalance frequency
    if (this.lastEvalDate && !this.shouldEvaluate(date)) {
      return signals;
    }
    this.lastEvalDate = date;

    const openPositionCount = Object.keys(currentWeights).filter(
      (s) => Math.abs(currentWeights[s]) > 0.001
    ).length;

    for (const symbol of this.params.symbols) {
      const price = prices[symbol];
      if (!price) continue;

      // --- Run all 4 agents ---
      const analystScore = this.analyst.evaluate(symbol, this.params.patternStats);
      const analystWinRate = this.params.patternStats[symbol]?.winRate ?? 0.5;
      const riskScore = this.risk.evaluate(symbol, price, analystWinRate);
      const timingScore = this.timing.evaluate(date, this.params.economicEvents);
      const portfolioScore = this.portfolioAgent.evaluate(
        symbol,
        currentWeights,
        portfolioValue,
        openPositionCount
      );

      // --- Composite score (weighted) ---
      const composite =
        (analystScore.score / analystScore.maxScore) * this.weights.analyst +
        (riskScore.score / riskScore.maxScore) * this.weights.risk +
        (timingScore.score / timingScore.maxScore) * this.weights.timing +
        (portfolioScore.score / portfolioScore.maxScore) * this.weights.portfolio;

      const compositeRounded = Math.round(composite * 100) / 100;

      // --- Verdict ---
      let verdict: Verdict;
      if (compositeRounded >= this.cutoffs.take) {
        verdict = "TAKE";
      } else if (compositeRounded >= this.cutoffs.watch) {
        verdict = "WATCH";
      } else {
        verdict = "SKIP";
      }

      // Record verdict for audit
      this.verdicts.push({
        date,
        symbol,
        verdict,
        compositeScore: compositeRounded,
        agentScores: {
          analyst: analystScore,
          risk: riskScore,
          timing: timingScore,
          portfolio: portfolioScore,
        },
      });

      // --- Generate trading signal ---
      const hasPosition = Math.abs(currentWeights[symbol] || 0) > 0.001;

      if (verdict === "TAKE" && !hasPosition) {
        // Kelly-based position sizing from risk agent
        const kellySizePct = riskScore.details.kelly || 0.02;
        const positionValue = portfolioValue * Math.min(kellySizePct, 0.25);
        const quantity = Math.floor(positionValue / price);

        if (quantity > 0) {
          signals.signals.push({
            symbol,
            action: "BUY",
            quantity,
            tag: `agent_take_${compositeRounded}`,
          });
        }
      } else if (verdict === "SKIP" && hasPosition) {
        // Close existing position
        signals.signals.push({
          symbol,
          action: "CLOSE",
          tag: `agent_skip_${compositeRounded}`,
        });
      }
      // WATCH → no action
    }

    return signals;
  }

  private shouldEvaluate(currentDate: string): boolean {
    if (!this.lastEvalDate) return true;
    const d1 = new Date(this.lastEvalDate).getTime();
    const d2 = new Date(currentDate).getTime();
    const daysDiff = (d2 - d1) / (1000 * 60 * 60 * 24);
    return daysDiff >= this.params.rebalanceFrequencyDays;
  }

  getVerdicts(): CompositeVerdict[] {
    return this.verdicts;
  }
}
