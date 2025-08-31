import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { generateSyntheticPrices } from "./utils/synth";

describe("02 - FX Trading Costs", () => {
  const prices = generateSyntheticPrices("2023-01-01", "2023-01-31", 1.05, 0.01, 0.0001);
  const mockProvider = new MockProvider({
    "EURUSD": {
      index: prices.map(p => p.date),
      columns: ["EURUSD"],
      data: prices.map(p => [p.price]),
      meta: { provider: "mock" }
    }
  });

  test("should apply trading costs correctly", async () => {
    const backtester = new BacktesterV2(mockProvider);
    
    const baseConfig = {
      mode: "single" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      initialCapital: 100000,
      slippage: 0,
      strategy: {
        tradableSymbol: "EURUSD",
        longThreshold: 1.04,
        shortThreshold: 1.06,
        positionSize: 10000
      }
    };

    // Run with zero costs
    const resultNoCosts = await backtester.runSingle({
      ...baseConfig,
      tradingCost: 0
    });

    // Run with 0.1% costs
    const resultWithCosts = await backtester.runSingle({
      ...baseConfig,
      tradingCost: 0.001
    });

    // Final equity should be lower with costs
    const finalNoCosts = resultNoCosts.equity[resultNoCosts.equity.length - 1].value;
    const finalWithCosts = resultWithCosts.equity[resultWithCosts.equity.length - 1].value;
    
    expect(finalWithCosts).toBeLessThan(finalNoCosts);

    // Total costs should equal the difference (approximately)
    const totalCosts = resultWithCosts.trades.reduce((sum, trade) => sum + trade.cost, 0);
    expect(totalCosts).toBeGreaterThan(0);
    
    // Difference should be close to total costs
    const equityDifference = finalNoCosts - finalWithCosts;
    expect(Math.abs(equityDifference - totalCosts)).toBeLessThan(100); // Within $100 tolerance
  });

  test("should apply slippage correctly", async () => {
    const backtester = new BacktesterV2(mockProvider);
    
    const baseConfig = {
      mode: "single" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      initialCapital: 100000,
      tradingCost: 0,
      strategy: {
        tradableSymbol: "EURUSD",
        longThreshold: 1.04,
        shortThreshold: 1.06,
        positionSize: 10000
      }
    };

    // Run with zero slippage
    const resultNoSlippage = await backtester.runSingle({
      ...baseConfig,
      slippage: 0
    });

    // Run with 0.05% slippage
    const resultWithSlippage = await backtester.runSingle({
      ...baseConfig,
      slippage: 0.0005
    });

    // Should have different results
    const finalNoSlippage = resultNoSlippage.equity[resultNoSlippage.equity.length - 1].value;
    const finalWithSlippage = resultWithSlippage.equity[resultWithSlippage.equity.length - 1].value;
    
    // Slippage should generally reduce performance
    if (resultWithSlippage.trades.length > 0) {
      expect(finalWithSlippage).not.toBe(finalNoSlippage);
    }
  });

  test("should handle high cost scenarios", async () => {
    const backtester = new BacktesterV2(mockProvider);
    
    const config = {
      mode: "single" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-31",
      initialCapital: 100000,
      tradingCost: 0.01, // 1% costs - very high
      slippage: 0.005, // 0.5% slippage - very high
      strategy: {
        tradableSymbol: "EURUSD",
        longThreshold: 1.04,
        shortThreshold: 1.06,
        positionSize: 10000
      }
    };

    const result = await backtester.runSingle(config);

    // Should complete without errors
    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.stats).toBeDefined();
    
    // High costs should significantly impact performance
    const finalEquity = result.equity[result.equity.length - 1].value;
    const totalCosts = result.trades.reduce((sum, trade) => sum + trade.cost, 0);
    
    // Total costs should be substantial
    if (result.trades.length > 0) {
      expect(totalCosts).toBeGreaterThan(1000); // At least $1000 in costs
    }
  });
});