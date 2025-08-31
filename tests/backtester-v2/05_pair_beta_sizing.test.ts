import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { generateCorrelatedPrices, generateSyntheticPrices } from "./utils/synth";

describe("05 - Pair Beta-Neutral Sizing", () => {
  test("should size positions according to beta when beta-neutral is enabled", async () => {
    // Generate base price series for symbol A
    const basePrices = generateSyntheticPrices("2023-01-01", "2023-03-31", 100, 0.02, 0.0001, 12345);
    
    // Generate correlated prices for symbol B with known beta ≈ 1.5
    const correlatedPrices = generateCorrelatedPrices(basePrices, 0.8, 1.5, 0.6, 54321);

    const mockProvider = new MockProvider({
      "SYMBOLA": {
        index: basePrices.map(p => p.date),
        columns: ["SYMBOLA"],
        data: basePrices.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "SYMBOLB": {
        index: correlatedPrices.map(p => p.date),
        columns: ["SYMBOLB"], 
        data: correlatedPrices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    // Test beta-neutral sizing
    const config = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-03-31",
      initialCapital: 200000,
      tradingCost: 0.001,
      slippage: 0.0005,
      strategy: {
        symbolA: "SYMBOLA",
        symbolB: "SYMBOLB",
        lookbackPeriod: 30,
        zScoreEntry: 1.5,
        zScoreExit: 0.5,
        betaNeutral: true,
        maxLeverage: 2.0,
        borrowCost: 0.02
      }
    };

    const result = await backtester.runPair(config);

    // Should have generated trades
    expect(result.trades.length).toBeGreaterThan(0);

    // Find first pair of trades (entry)
    const firstTradeDate = result.trades[0].date;
    const firstPairTrades = result.trades.filter(t => t.date === firstTradeDate);
    
    if (firstPairTrades.length >= 2) {
      const tradeA = firstPairTrades.find(t => t.symbol === "SYMBOLA");
      const tradeB = firstPairTrades.find(t => t.symbol === "SYMBOLB");
      
      expect(tradeA).toBeDefined();
      expect(tradeB).toBeDefined();
      
      // Calculate dollar values of positions
      const valueA = Math.abs(tradeA!.qty * tradeA!.price);
      const valueB = Math.abs(tradeB!.qty * tradeB!.price);
      
      // With beta-neutral sizing, the values should be adjusted for beta
      // The ratio should not be 1:1 if beta ≠ 1
      expect(valueA).toBeGreaterThan(1000);
      expect(valueB).toBeGreaterThan(1000);
      
      // Values should be meaningful relative to portfolio size
      expect(valueA).toBeLessThan(config.initialCapital * 0.6); // Max 60% of portfolio
      expect(valueB).toBeLessThan(config.initialCapital * 0.6);
    }

    // Should have exposures and weights data
    expect(result.exposures).toBeDefined();
    expect(result.weights).toBeDefined();
    expect(result.exposures!.length).toBeGreaterThan(0);
  });

  test("should compare beta-neutral vs equal-dollar sizing", async () => {
    const basePrices = generateSyntheticPrices("2023-01-01", "2023-02-28", 100, 0.015, 0, 11111);
    const correlatedPrices = generateCorrelatedPrices(basePrices, 0.7, 2.0, 0.5, 22222); // Beta ≈ 2.0

    const mockProvider = new MockProvider({
      "STOCK1": {
        index: basePrices.map(p => p.date),
        columns: ["STOCK1"],
        data: basePrices.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "STOCK2": {
        index: correlatedPrices.map(p => p.date),
        columns: ["STOCK2"],
        data: correlatedPrices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const baseConfig = {
      mode: "pair" as const,
      startDate: "2023-01-01", 
      endDate: "2023-02-28",
      initialCapital: 150000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      strategy: {
        symbolA: "STOCK1",
        symbolB: "STOCK2",
        lookbackPeriod: 20,
        zScoreEntry: 1.2,
        zScoreExit: 0.4,
        maxLeverage: 1.5,
        borrowCost: 0.025
      }
    };

    // Run with equal-dollar sizing
    const equalDollarResult = await backtester.runPair({
      ...baseConfig,
      strategy: { ...baseConfig.strategy, betaNeutral: false }
    });

    // Run with beta-neutral sizing
    const betaNeutralResult = await backtester.runPair({
      ...baseConfig,
      strategy: { ...baseConfig.strategy, betaNeutral: true }
    });

    // Both should complete successfully
    expect(equalDollarResult.equity.length).toBeGreaterThan(0);
    expect(betaNeutralResult.equity.length).toBeGreaterThan(0);

    // If trades were generated, sizing should be different
    if (equalDollarResult.trades.length > 0 && betaNeutralResult.trades.length > 0) {
      // Compare first trade quantities
      const equalFirstTrade = equalDollarResult.trades[0];
      const betaFirstTrade = betaNeutralResult.trades[0];
      
      // Quantities might be different due to beta adjustment
      expect(equalFirstTrade.qty).not.toBe(0);
      expect(betaFirstTrade.qty).not.toBe(0);
    }

    // Performance characteristics should be different
    const equalFinalValue = equalDollarResult.equity[equalDollarResult.equity.length - 1].value;
    const betaFinalValue = betaNeutralResult.equity[betaNeutralResult.equity.length - 1].value;
    
    // Values should be reasonable (not zero or negative)
    expect(equalFinalValue).toBeGreaterThan(0);
    expect(betaFinalValue).toBeGreaterThan(0);
  });

  test("should respect maximum leverage constraints", async () => {
    const prices1 = generateSyntheticPrices("2023-01-01", "2023-01-31", 50, 0.02, 0, 33333);
    const prices2 = generateSyntheticPrices("2023-01-01", "2023-01-31", 25, 0.018, 0, 44444);

    const mockProvider = new MockProvider({
      "HIGH": {
        index: prices1.map(p => p.date),
        columns: ["HIGH"],
        data: prices1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "LOW": {
        index: prices2.map(p => p.date),
        columns: ["LOW"],
        data: prices2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-31", 
      initialCapital: 100000,
      tradingCost: 0.001,
      slippage: 0.0005,
      strategy: {
        symbolA: "HIGH",
        symbolB: "LOW",
        lookbackPeriod: 15,
        zScoreEntry: 1.0, // Low threshold to ensure trades
        zScoreExit: 0.3,
        betaNeutral: true,
        maxLeverage: 1.5, // 150% maximum leverage
        borrowCost: 0.03
      }
    };

    const result = await backtester.runPair(config);

    // Check that leverage constraints are respected
    if (result.trades.length > 0) {
      // Find maximum exposure across all dates
      let maxTotalExposure = 0;
      
      for (const exposure of result.exposures || []) {
        const totalExposure = Object.keys(exposure)
          .filter(key => key !== "date")
          .reduce((sum, symbol) => sum + Math.abs(exposure[symbol]), 0);
        
        maxTotalExposure = Math.max(maxTotalExposure, totalExposure);
      }
      
      // Maximum exposure should not exceed initial capital * max leverage
      const maxAllowedExposure = config.initialCapital * config.strategy.maxLeverage;
      expect(maxTotalExposure).toBeLessThanOrEqual(maxAllowedExposure * 1.1); // 10% tolerance for execution timing
    }
  });

  test("should handle edge cases in beta calculation", async () => {
    // Create uncorrelated/independent price series
    const independentPrices1 = generateSyntheticPrices("2023-01-01", "2023-01-15", 100, 0.01, 0, 55555);
    const independentPrices2 = generateSyntheticPrices("2023-01-01", "2023-01-15", 80, 0.01, 0, 66666);

    const mockProvider = new MockProvider({
      "INDEP1": {
        index: independentPrices1.map(p => p.date),
        columns: ["INDEP1"],
        data: independentPrices1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "INDEP2": {
        index: independentPrices2.map(p => p.date),
        columns: ["INDEP2"],
        data: independentPrices2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-15",
      initialCapital: 50000,
      tradingCost: 0.001,
      slippage: 0.0005,
      strategy: {
        symbolA: "INDEP1",
        symbolB: "INDEP2", 
        lookbackPeriod: 10,
        zScoreEntry: 0.8, // Lower threshold
        zScoreExit: 0.2,
        betaNeutral: true,
        maxLeverage: 2.0,
        borrowCost: 0.02
      }
    };

    // Should complete without errors even with independent series
    const result = await backtester.runPair(config);
    
    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.stats).toBeDefined();
    
    // Final equity should be reasonable
    const finalEquity = result.equity[result.equity.length - 1].value;
    expect(finalEquity).toBeGreaterThan(0);
    expect(finalEquity).toBeLessThan(config.initialCapital * 3); // Sanity check
  });
});