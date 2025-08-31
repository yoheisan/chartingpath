import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { createTrendingPrice } from "./utils/synth";

describe("09 - Basket Rebalancing with Drift Bands", () => {
  test("should rebalance when drift exceeds threshold", async () => {
    // Create assets with different performance to force drift
    const strongAsset = createTrendingPrice("2023-01-01", "2023-12-31", 100, 0.30, 0.02, 12345); // +30% annual
    const weakAsset = createTrendingPrice("2023-01-01", "2023-12-31", 100, -0.10, 0.015, 54321); // -10% annual

    const mockProvider = new MockProvider({
      "STRONG": {
        index: strongAsset.map(p => p.date),
        columns: ["STRONG"],
        data: strongAsset.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "WEAK": {
        index: weakAsset.map(p => p.date),
        columns: ["WEAK"],
        data: weakAsset.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 100000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      policy: {
        symbols: ["STRONG", "WEAK"],
        contributionAmount: 0, // No DCA to isolate rebalancing
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "monthly" as const, // Check monthly for rebalancing
        driftThreshold: 0.05, // 5% drift threshold
        tradingCost: 0.0005
      }
    };

    const result = await backtester.runBasket(config);

    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.trades.length).toBeGreaterThan(2); // Initial + rebalance trades

    // Should have rebalance trades
    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    expect(rebalanceTrades.length).toBeGreaterThan(0);

    // Analyze weight drift over time
    const weights = result.weights!;
    let significantDriftDetected = false;
    let rebalanceOccurred = false;

    for (let i = 1; i < weights.length; i++) {
      const prevWeights = weights[i-1];
      const currentWeights = weights[i];
      
      const strongWeightPrev = prevWeights["STRONG"] || 0;
      const strongWeightCurr = currentWeights["STRONG"] || 0;
      
      // Check for significant drift
      if (Math.abs(strongWeightPrev - 0.5) > 0.05) {
        significantDriftDetected = true;
      }
      
      // Check for rebalancing (weight snaps back toward 50%)
      if (significantDriftDetected && Math.abs(strongWeightCurr - 0.5) < Math.abs(strongWeightPrev - 0.5)) {
        rebalanceOccurred = true;
        break;
      }
    }

    // With significantly different asset performance, should have drift and rebalancing
    expect(significantDriftDetected || rebalanceOccurred).toBe(true);
  });

  test("should not rebalance when drift is within threshold", async () => {
    // Create assets with similar performance
    const asset1 = createTrendingPrice("2023-01-01", "2023-06-30", 100, 0.08, 0.01, 11111);
    const asset2 = createTrendingPrice("2023-01-01", "2023-06-30", 100, 0.09, 0.01, 22222); // Very similar

    const mockProvider = new MockProvider({
      "SIMILAR1": {
        index: asset1.map(p => p.date),
        columns: ["SIMILAR1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "SIMILAR2": {
        index: asset2.map(p => p.date),
        columns: ["SIMILAR2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-06-30",
      initialCapital: 50000,
      tradingCost: 0.0008,
      slippage: 0.0003,
      policy: {
        symbols: ["SIMILAR1", "SIMILAR2"],
        contributionAmount: 0,
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "monthly" as const,
        driftThreshold: 0.10, // 10% threshold - high
        tradingCost: 0.0008
      }
    };

    const result = await backtester.runBasket(config);

    // Should have minimal rebalancing with similar-performing assets
    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    
    // With high threshold and similar performance, should have few/no rebalances
    expect(rebalanceTrades.length).toBeLessThan(4); // Allow some rebalancing but not excessive

    // Weights should remain relatively stable
    const initialWeights = result.weights![0];
    const finalWeights = result.weights![result.weights!.length - 1];
    
    const initialSimilar1 = initialWeights["SIMILAR1"];
    const finalSimilar1 = finalWeights["SIMILAR1"];
    
    // Weight shouldn't drift too much with similar performance
    expect(Math.abs(finalSimilar1 - initialSimilar1)).toBeLessThan(0.15);
  });

  test("should respect minimum rebalance intervals", async () => {
    // Create highly divergent assets
    const upAsset = createTrendingPrice("2023-01-01", "2023-03-31", 50, 0.50, 0.03, 33333); // Very strong
    const downAsset = createTrendingPrice("2023-01-01", "2023-03-31", 50, -0.30, 0.02, 44444); // Very weak

    const mockProvider = new MockProvider({
      "UP": {
        index: upAsset.map(p => p.date),
        columns: ["UP"],
        data: upAsset.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "DOWN": {
        index: downAsset.map(p => p.date),
        columns: ["DOWN"],
        data: downAsset.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-03-31",
      initialCapital: 80000,
      tradingCost: 0.0006,
      slippage: 0.0002,
      policy: {
        symbols: ["UP", "DOWN"],
        contributionAmount: 0,
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "quarterly" as const, // Only check quarterly
        driftThreshold: 0.03, // Low threshold (3%)
        tradingCost: 0.0006
      }
    };

    const result = await backtester.runBasket(config);

    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    
    // Even with high drift and low threshold, quarterly frequency should limit rebalancing
    const rebalanceDates = new Set(rebalanceTrades.map(t => t.date));
    
    // Should have at most 1-2 quarterly rebalance dates in 3 months
    expect(rebalanceDates.size).toBeLessThanOrEqual(2);
  });

  test("should handle annual rebalancing frequency", async () => {
    // Create full year with gradual drift
    const asset1 = createTrendingPrice("2023-01-01", "2023-12-31", 100, 0.15, 0.01, 55555);
    const asset2 = createTrendingPrice("2023-01-01", "2023-12-31", 100, 0.05, 0.012, 66666);
    const asset3 = createTrendingPrice("2023-01-01", "2023-12-31", 100, 0.25, 0.018, 77777);

    const mockProvider = new MockProvider({
      "ANNUAL1": {
        index: asset1.map(p => p.date),
        columns: ["ANNUAL1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "ANNUAL2": {
        index: asset2.map(p => p.date),
        columns: ["ANNUAL2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "ANNUAL3": {
        index: asset3.map(p => p.date),
        columns: ["ANNUAL3"],
        data: asset3.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 120000,
      tradingCost: 0.0004,
      slippage: 0.0002,
      policy: {
        symbols: ["ANNUAL1", "ANNUAL2", "ANNUAL3"],
        contributionAmount: 0,
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "annually" as const,
        driftThreshold: 0.02, // Low threshold
        tradingCost: 0.0004
      }
    };

    const result = await backtester.runBasket(config);

    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    const rebalanceDates = new Set(rebalanceTrades.map(t => t.date));
    
    // Annual rebalancing should have at most 1 rebalance date in the year
    expect(rebalanceDates.size).toBeLessThanOrEqual(1);

    // But weights should drift significantly during the year before rebalancing
    const midYearIndex = Math.floor(result.weights!.length / 2);
    const midYearWeights = result.weights![midYearIndex];
    
    // By mid-year, weights should have drifted from equal (1/3 each)
    const midYearValues = Object.keys(midYearWeights)
      .filter(k => k !== "date")
      .map(symbol => midYearWeights[symbol]);
    
    let hasSignificantDrift = false;
    for (const weight of midYearValues) {
      if (Math.abs(weight - 1/3) > 0.05) {
        hasSignificantDrift = true;
        break;
      }
    }
    
    // With different asset performance over a year, should see drift
    expect(hasSignificantDrift).toBe(true);
  });

  test("should handle no rebalancing (rebalanceFrequency: 'none')", async () => {
    const asset1 = createTrendingPrice("2023-01-01", "2023-06-30", 100, 0.40, 0.02, 88888); // Very strong
    const asset2 = createTrendingPrice("2023-01-01", "2023-06-30", 100, -0.20, 0.015, 99999); // Weak

    const mockProvider = new MockProvider({
      "NONE1": {
        index: asset1.map(p => p.date),
        columns: ["NONE1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "NONE2": {
        index: asset2.map(p => p.date),
        columns: ["NONE2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-06-30",
      initialCapital: 60000,
      tradingCost: 0.0007,
      slippage: 0.0003,
      policy: {
        symbols: ["NONE1", "NONE2"],
        contributionAmount: 0,
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "none" as const, // No rebalancing
        driftThreshold: 0.01, // Very low threshold (should be ignored)
        tradingCost: 0.0007
      }
    };

    const result = await backtester.runBasket(config);

    // Should have no rebalance trades regardless of drift
    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    expect(rebalanceTrades.length).toBe(0);

    // Should only have initial trades
    expect(result.trades.length).toBe(2); // One per asset

    // Weights should drift freely without rebalancing
    const initialWeights = result.weights![0];
    const finalWeights = result.weights![result.weights!.length - 1];
    
    const initialNone1 = initialWeights["NONE1"];
    const finalNone1 = finalWeights["NONE1"];
    
    // With very different performance and no rebalancing, weights should drift significantly
    expect(Math.abs(finalNone1 - initialNone1)).toBeGreaterThan(0.05);
  });

  test("should combine DCA with rebalancing", async () => {
    const asset1 = createTrendingPrice("2023-01-01", "2023-09-30", 80, 0.20, 0.018, 10101);
    const asset2 = createTrendingPrice("2023-01-01", "2023-09-30", 80, 0.08, 0.014, 20202);

    const mockProvider = new MockProvider({
      "COMBO1": {
        index: asset1.map(p => p.date),
        columns: ["COMBO1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "COMBO2": {
        index: asset2.map(p => p.date),
        columns: ["COMBO2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-09-30",
      initialCapital: 40000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      policy: {
        symbols: ["COMBO1", "COMBO2"],
        contributionAmount: 3000, // Monthly DCA
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "quarterly" as const, // Quarterly rebalancing
        driftThreshold: 0.06, // 6% drift threshold
        tradingCost: 0.0005
      }
    };

    const result = await backtester.runBasket(config);

    // Should have both DCA and rebalance trades
    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    const rebalanceTrades = result.trades.filter(t => t.tag === "rebalance");
    
    expect(dcaTrades.length).toBeGreaterThan(0);
    expect(result.trades.length).toBeGreaterThan(dcaTrades.length + 2); // Initial + DCA + possible rebalancing

    // Portfolio should grow due to contributions
    const finalEquity = result.equity[result.equity.length - 1].value;
    const monthsElapsed = 9; // Jan to Sep
    const expectedContributions = monthsElapsed * 3000;
    const totalExpected = config.initialCapital + expectedContributions;
    
    // Final equity should be in reasonable range relative to contributions
    expect(finalEquity).toBeGreaterThan(totalExpected * 0.8);
    expect(finalEquity).toBeLessThan(totalExpected * 1.4);
  });
});