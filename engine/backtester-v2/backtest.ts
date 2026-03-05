import { Portfolio } from "./core/accounting";
import { calculateMetrics, calculateDailyReturns } from "./core/metrics";
import { SimpleExecutionEngine, alignPriceData, forwardFillPrices } from "./exec/execution";
import { SingleCrossTriggerStrategy, SingleCrossTriggerParams } from "./strategies/SingleCrossTrigger";
import { PairZScoreStrategy, PairZScoreParams } from "./strategies/PairZScore";
import { EqualWeightDCAPolicy, EqualWeightDCAParams } from "./policies/EqualWeightDCA";
import { AgentOrchestratedPolicy, AgentOrchestratedParams } from "./policies/AgentOrchestrated";
import { CompositeVerdict } from "./agents/types";
import { PriceProvider } from "./data/provider";
import { BacktestResult } from "./data/types";

export interface BacktestConfig {
  mode: "single" | "pair" | "basket" | "agent";
  startDate: string;
  endDate: string;
  initialCapital: number;
  tradingCost: number;
  slippage: number;
}

export interface SingleBacktestConfig extends BacktestConfig {
  mode: "single";
  strategy: SingleCrossTriggerParams;
}

export interface PairBacktestConfig extends BacktestConfig {
  mode: "pair";
  strategy: PairZScoreParams;
}

export interface BasketBacktestConfig extends BacktestConfig {
  mode: "basket";
  policy: EqualWeightDCAParams;
}

export interface AgentBacktestConfig extends BacktestConfig {
  mode: "agent";
  policy: AgentOrchestratedParams;
}

export interface AgentBacktestResult extends BacktestResult {
  verdicts: CompositeVerdict[];
  agentScoreSummary: {
    avgComposite: number;
    takeCount: number;
    watchCount: number;
    skipCount: number;
  };
}

export class BacktesterV2 {
  constructor(private dataProvider: PriceProvider) {}

  async runSingle(config: SingleBacktestConfig): Promise<BacktestResult> {
    const symbols = [config.strategy.tradableSymbol];
    if (config.strategy.triggerSymbol) {
      symbols.push(config.strategy.triggerSymbol);
    }

    const priceFrame = await this.dataProvider.loadEOD(symbols, config.startDate, config.endDate);
    const alignedData = alignPriceData(priceFrame, symbols);
    const filledData = forwardFillPrices(alignedData, symbols);

    const portfolio = new Portfolio(config.initialCapital);
    const executionEngine = new SimpleExecutionEngine(config.tradingCost, config.slippage);
    const strategy = new SingleCrossTriggerStrategy(config.strategy);

    const equity: Array<{date: string, value: number}> = [];
    const dates = Object.keys(filledData).sort();

    for (const date of dates) {
      const prices = filledData[date];
      
      // Generate signals
      const signals = strategy.generateSignals(date, prices);
      
      // Execute trades
      executionEngine.execute(date, signals, portfolio, prices);
      
      // Record equity
      const totalValue = portfolio.getTotalValue(prices);
      equity.push({ date, value: totalValue });
    }

    const stats = calculateMetrics(equity, portfolio.trades, config.initialCapital);
    const dailyReturns = calculateDailyReturns(equity);

    return {
      equity,
      dailyReturns,
      stats,
      trades: portfolio.trades
    };
  }

  async runPair(config: PairBacktestConfig): Promise<BacktestResult> {
    const symbols = [config.strategy.symbolA, config.strategy.symbolB];
    const priceFrame = await this.dataProvider.loadEOD(symbols, config.startDate, config.endDate);
    const alignedData = alignPriceData(priceFrame, symbols);
    const filledData = forwardFillPrices(alignedData, symbols);

    const portfolio = new Portfolio(config.initialCapital);
    const executionEngine = new SimpleExecutionEngine(config.tradingCost, config.slippage);
    const strategy = new PairZScoreStrategy(config.strategy);

    const equity: Array<{date: string, value: number}> = [];
    const exposures: Array<{date: string} & Record<string, number>> = [];
    const weights: Array<{date: string} & Record<string, number>> = [];
    const dates = Object.keys(filledData).sort();

    for (const date of dates) {
      const prices = filledData[date];
      const portfolioValue = portfolio.getTotalValue(prices);
      
      // Generate signals
      const signals = strategy.generateSignals(date, prices, portfolioValue);
      
      // Execute trades
      executionEngine.execute(date, signals, portfolio, prices);
      
      // Record metrics
      const totalValue = portfolio.getTotalValue(prices);
      equity.push({ date, value: totalValue });
      
      const currentExposures = portfolio.getExposures();
      exposures.push({ date, ...currentExposures } as {date: string} & Record<string, number>);
      
      const currentWeights = portfolio.getWeights(totalValue);
      weights.push({ date, ...currentWeights } as {date: string} & Record<string, number>);
    }

    const stats = calculateMetrics(equity, portfolio.trades, config.initialCapital);
    const dailyReturns = calculateDailyReturns(equity);

    return {
      equity,
      dailyReturns,
      stats,
      trades: portfolio.trades,
      exposures,
      weights
    };
  }

  async runBasket(config: BasketBacktestConfig): Promise<BacktestResult> {
    const symbols = config.policy.symbols;
    const priceFrame = await this.dataProvider.loadEOD(symbols, config.startDate, config.endDate);
    const alignedData = alignPriceData(priceFrame, symbols);
    const filledData = forwardFillPrices(alignedData, symbols);

    const portfolio = new Portfolio(config.initialCapital);
    const executionEngine = new SimpleExecutionEngine(config.tradingCost, config.slippage);
    const policy = new EqualWeightDCAPolicy(config.policy);

    const equity: Array<{date: string, value: number}> = [];
    const exposures: Array<{date: string} & Record<string, number>> = [];
    const weights: Array<{date: string} & Record<string, number>> = [];
    const dates = Object.keys(filledData).sort();

    for (const date of dates) {
      const prices = filledData[date];
      const portfolioValue = portfolio.getTotalValue(prices);
      const currentWeights = portfolio.getWeights(portfolioValue);
      
      // Generate signals
      const signals = policy.generateSignals(date, prices, portfolioValue, currentWeights);
      
      // Execute trades
      executionEngine.execute(date, signals, portfolio, prices);
      
      // Record metrics
      const totalValue = portfolio.getTotalValue(prices);
      equity.push({ date, value: totalValue });
      
      const currentExposures = portfolio.getExposures();
      exposures.push({ date, ...currentExposures } as {date: string} & Record<string, number>);
      
      const updatedWeights = portfolio.getWeights(totalValue);
      weights.push({ date, ...updatedWeights } as {date: string} & Record<string, number>);
    }

    const stats = calculateMetrics(equity, portfolio.trades, config.initialCapital);
    const dailyReturns = calculateDailyReturns(equity);

    return {
      equity,
      dailyReturns,
      stats,
      trades: portfolio.trades,
      exposures,
      weights
    };
  }

  async runAgent(config: AgentBacktestConfig): Promise<AgentBacktestResult> {
    const symbols = config.policy.symbols;
    const priceFrame = await this.dataProvider.loadEOD(symbols, config.startDate, config.endDate);
    const alignedData = alignPriceData(priceFrame, symbols);
    const filledData = forwardFillPrices(alignedData, symbols);

    const portfolio = new Portfolio(config.initialCapital);
    const executionEngine = new SimpleExecutionEngine(config.tradingCost, config.slippage);
    const policy = new AgentOrchestratedPolicy(config.policy);

    const equity: Array<{date: string, value: number}> = [];
    const exposures: Array<{date: string} & Record<string, number>> = [];
    const weights: Array<{date: string} & Record<string, number>> = [];
    const dates = Object.keys(filledData).sort();

    for (const date of dates) {
      const prices = filledData[date];
      const portfolioValue = portfolio.getTotalValue(prices);
      const currentWeights = portfolio.getWeights(portfolioValue);

      // Generate signals via multi-agent orchestration
      const signals = policy.generateSignals(date, prices, portfolioValue, currentWeights);

      // Execute trades
      executionEngine.execute(date, signals, portfolio, prices);

      // Record metrics
      const totalValue = portfolio.getTotalValue(prices);
      equity.push({ date, value: totalValue });

      const currentExposures = portfolio.getExposures();
      exposures.push({ date, ...currentExposures } as {date: string} & Record<string, number>);

      const updatedWeights = portfolio.getWeights(totalValue);
      weights.push({ date, ...updatedWeights } as {date: string} & Record<string, number>);
    }

    const stats = calculateMetrics(equity, portfolio.trades, config.initialCapital);
    const dailyReturns = calculateDailyReturns(equity);

    // Summarize verdicts
    const verdicts = policy.getVerdicts();
    const takeCount = verdicts.filter(v => v.verdict === "TAKE").length;
    const watchCount = verdicts.filter(v => v.verdict === "WATCH").length;
    const skipCount = verdicts.filter(v => v.verdict === "SKIP").length;
    const avgComposite = verdicts.length > 0
      ? Math.round(verdicts.reduce((s, v) => s + v.compositeScore, 0) / verdicts.length * 100) / 100
      : 0;

    return {
      equity,
      dailyReturns,
      stats,
      trades: portfolio.trades,
      exposures,
      weights,
      verdicts,
      agentScoreSummary: { avgComposite, takeCount, watchCount, skipCount },
    };
  }
}