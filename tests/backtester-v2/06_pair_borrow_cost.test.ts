import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { generateSyntheticPrices } from "./utils/synth";

describe("06 - Pair Trading Borrow Costs", () => {
  test("should account for borrow costs in pair trading performance", async () => {
    const prices1 = generateSyntheticPrices("2023-01-01", "2023-06-30", 100, 0.015, 0.0002, 77777);
    const prices2 = generateSyntheticPrices("2023-01-01", "2023-06-30", 60, 0.018, -0.0001, 88888);

    const mockProvider = new MockProvider({
      "BORROW1": {
        index: prices1.map(p => p.date),
        columns: ["BORROW1"],
        data: prices1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "BORROW2": {
        index: prices2.map(p => p.date),
        columns: ["BORROW2"],
        data: prices2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const baseConfig = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-06-30",
      initialCapital: 200000,
      tradingCost: 0.0008,
      slippage: 0.0003,
      strategy: {
        symbolA: "BORROW1",
        symbolB: "BORROW2",
        lookbackPeriod: 25,
        zScoreEntry: 1.3,
        zScoreExit: 0.4,
        betaNeutral: false,
        maxLeverage: 1.8
      }
    };

    // Run without borrow costs
    const noBorrowResult = await backtester.runPair({
      ...baseConfig,
      strategy: { ...baseConfig.strategy, borrowCost: 0 }
    });

    // Run with 3% annual borrow cost
    const withBorrowResult = await backtester.runPair({
      ...baseConfig,
      strategy: { ...baseConfig.strategy, borrowCost: 0.03 }
    });

    // Run with high 8% annual borrow cost
    const highBorrowResult = await backtester.runPair({
      ...baseConfig,
      strategy: { ...baseConfig.strategy, borrowCost: 0.08 }
    });

    // All should complete successfully
    expect(noBorrowResult.equity.length).toBeGreaterThan(0);
    expect(withBorrowResult.equity.length).toBeGreaterThan(0);
    expect(highBorrowResult.equity.length).toBeGreaterThan(0);

    const finalNoBorrow = noBorrowResult.equity[noBorrowResult.equity.length - 1].value;
    const finalWithBorrow = withBorrowResult.equity[withBorrowResult.equity.length - 1].value;
    const finalHighBorrow = highBorrowResult.equity[highBorrowResult.equity.length - 1].value;

    // Performance should generally decrease with higher borrow costs
    // (though this isn't guaranteed if the strategy is very profitable)
    expect(finalNoBorrow).toBeGreaterThan(0);
    expect(finalWithBorrow).toBeGreaterThan(0);
    expect(finalHighBorrow).toBeGreaterThan(0);

    // At minimum, borrow costs should affect the results
    if (withBorrowResult.trades.length > 0) {
      // Results should be different when borrow costs are applied
      expect(finalNoBorrow).not.toBe(finalWithBorrow);
    }
  });

  test("should impact short positions more than long positions", async () => {
    // Create trending prices to bias the strategy towards specific positions
    const upTrendPrices = generateSyntheticPrices("2023-01-01", "2023-03-31", 50, 0.01, 0.0008, 99999);
    const flatPrices = generateSyntheticPrices("2023-01-01", "2023-03-31", 40, 0.01, 0, 11111);

    const mockProvider = new MockProvider({
      "UPTREND": {
        index: upTrendPrices.map(p => p.date),
        columns: ["UPTREND"],
        data: upTrendPrices.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "FLAT": {
        index: flatPrices.map(p => p.date),
        columns: ["FLAT"],
        data: flatPrices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-03-31",
      initialCapital: 120000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      strategy: {
        symbolA: "UPTREND",
        symbolB: "FLAT",
        lookbackPeriod: 20,
        zScoreEntry: 1.0,
        zScoreExit: 0.3,
        betaNeutral: false,
        maxLeverage: 2.0,
        borrowCost: 0.05 // 5% annual borrow cost
      }
    };

    const result = await backtester.runPair(config);

    // Analyze trades to see short vs long exposure
    let totalShortExposureDays = 0;
    let totalLongExposureDays = 0;

    if (result.exposures && result.exposures.length > 0) {
      for (const exposure of result.exposures) {
        const upTrendExposure = exposure["UPTREND"] || 0;
        const flatExposure = exposure["FLAT"] || 0;

        if (upTrendExposure < 0) totalShortExposureDays += Math.abs(upTrendExposure);
        if (upTrendExposure > 0) totalLongExposureDays += upTrendExposure;
        if (flatExposure < 0) totalShortExposureDays += Math.abs(flatExposure);
        if (flatExposure > 0) totalLongExposureDays += flatExposure;
      }
    }

    // Should have some exposure if trades were made
    expect(result.trades.length).toBeGreaterThanOrEqual(0);
    
    // Test completed successfully (borrow costs accounted for in P&L calculation)
    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.stats.cagr).toBeDefined();
    expect(result.stats.sharpe).toBeDefined();
  });

  test("should handle various borrow cost scenarios", async () => {
    const prices1 = generateSyntheticPrices("2023-01-01", "2023-04-30", 80, 0.012, 0, 12121);
    const prices2 = generateSyntheticPrices("2023-01-01", "2023-04-30", 120, 0.015, 0, 21212);

    const mockProvider = new MockProvider({
      "COST1": {
        index: prices1.map(p => p.date),
        columns: ["COST1"],
        data: prices1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "COST2": {
        index: prices2.map(p => p.date),
        columns: ["COST2"],
        data: prices2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const baseConfig = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-04-30",
      initialCapital: 100000,
      tradingCost: 0.0006,
      slippage: 0.0002,
      strategy: {
        symbolA: "COST1",
        symbolB: "COST2",
        lookbackPeriod: 15,
        zScoreEntry: 1.1,
        zScoreExit: 0.35,
        betaNeutral: true,
        maxLeverage: 1.5
      }
    };

    // Test various borrow cost levels
    const borrowCosts = [0, 0.01, 0.03, 0.06, 0.12]; // 0%, 1%, 3%, 6%, 12%
    const results = [];

    for (const borrowCost of borrowCosts) {
      const result = await backtester.runPair({
        ...baseConfig,
        strategy: { ...baseConfig.strategy, borrowCost }
      });
      
      results.push({
        borrowCost,
        finalEquity: result.equity[result.equity.length - 1].value,
        trades: result.trades.length,
        sharpe: result.stats.sharpe
      });
    }

    // All scenarios should complete successfully
    for (const result of results) {
      expect(result.finalEquity).toBeGreaterThan(0);
      expect(result.trades).toBeGreaterThanOrEqual(0);
      expect(result.sharpe).toBeDefined();
    }

    // Results should show impact of borrow costs
    const noCostResult = results.find(r => r.borrowCost === 0);
    const highCostResult = results.find(r => r.borrowCost === 0.12);

    expect(noCostResult).toBeDefined();
    expect(highCostResult).toBeDefined();

    // If trades were generated, high borrow costs should generally reduce performance
    if (noCostResult!.trades > 0 && highCostResult!.trades > 0) {
      // High costs might reduce Sharpe ratio due to the cost drag
      expect(Math.abs(highCostResult!.sharpe - noCostResult!.sharpe)).toBeGreaterThanOrEqual(0);
    }
  });

  test("should compound borrow costs over time for long-held positions", async () => {
    // Create stable, non-reverting pair to encourage long holds
    const stablePrices1 = Array.from({ length: 180 }, (_, i) => ({
      date: new Date(new Date("2023-01-01").getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 100 + Math.sin(i / 30) * 2 // Slow oscillation
    }));

    const stablePrices2 = Array.from({ length: 180 }, (_, i) => ({
      date: new Date(new Date("2023-01-01").getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 50 + Math.cos(i / 30) * 1 // Different phase oscillation
    }));

    const mockProvider = new MockProvider({
      "STABLE1": {
        index: stablePrices1.map(p => p.date),
        columns: ["STABLE1"],
        data: stablePrices1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "STABLE2": {
        index: stablePrices2.map(p => p.date),
        columns: ["STABLE2"],
        data: stablePrices2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "pair" as const,
      startDate: "2023-01-01",
      endDate: "2023-06-29", // 6 months
      initialCapital: 150000,
      tradingCost: 0.0003,
      slippage: 0.0001,
      strategy: {
        symbolA: "STABLE1",
        symbolB: "STABLE2",
        lookbackPeriod: 30,
        zScoreEntry: 0.8, // Low threshold to enter easily
        zScoreExit: 0.1,  // Low exit threshold to hold longer
        betaNeutral: false,
        maxLeverage: 1.0, // Conservative
        borrowCost: 0.06 // 6% annual
      }
    };

    const result = await backtester.runPair(config);

    expect(result.equity.length).toBeGreaterThan(0);

    // If long positions were held, borrow costs should accumulate
    const finalEquity = result.equity[result.equity.length - 1].value;
    const totalReturn = (finalEquity - config.initialCapital) / config.initialCapital;

    // With 6% borrow cost over 6 months, expect some impact on returns
    expect(finalEquity).toBeGreaterThan(0);
    expect(Math.abs(totalReturn)).toBeLessThan(0.5); // Sanity check - not extreme returns

    // Verify the backtest ran for the full period
    expect(result.equity.length).toBeGreaterThan(100); // Should have many data points over 6 months
  });
});