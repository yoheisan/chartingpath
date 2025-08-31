import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { PriceFrame } from "../../engine/backtester-v2/data/types";
import goldenData from "./fixtures/legacyFx.golden.json";

describe("01 - FX Golden Test", () => {
  const mockProvider = new MockProvider({
    "EURUSD": {
      index: goldenData.mockPrices.map(p => p.date),
      columns: ["EURUSD"],
      data: goldenData.mockPrices.map(p => [p.price]),
      meta: { provider: "mock" }
    }
  });

  test("should match legacy FX backtest results exactly", async () => {
    const backtester = new BacktesterV2(mockProvider);
    
    const config = {
      mode: "single" as const,
      startDate: goldenData.config.startDate,
      endDate: goldenData.config.endDate,
      initialCapital: goldenData.config.initialCapital,
      tradingCost: 0.0001,
      slippage: 0.00005,
      strategy: {
        tradableSymbol: goldenData.config.symbol,
        longThreshold: 1.0500,
        shortThreshold: 1.0550,
        positionSize: goldenData.config.positionSize,
        stopLoss: goldenData.config.stopLoss / 10000, // Convert pips to decimal
        takeProfit: goldenData.config.takeProfit / 10000
      }
    };

    const result = await backtester.runSingle(config);

    // Verify key metrics match golden expectations (within tolerance)
    expect(result.equity[result.equity.length - 1].value).toBeCloseTo(
      goldenData.expectedResult.finalEquity, 
      2
    );
    expect(result.trades.length).toBe(goldenData.expectedResult.totalTrades);
    expect(Math.abs(result.stats.maxDD)).toBeCloseTo(
      goldenData.expectedResult.maxDrawdown, 
      3
    );
    expect(result.stats.sharpe).toBeCloseTo(
      goldenData.expectedResult.sharpeRatio, 
      1
    );

    // Verify trade structure
    expect(result.trades[0]).toHaveProperty("date");
    expect(result.trades[0]).toHaveProperty("symbol", "EURUSD");
    expect(result.trades[0]).toHaveProperty("qty");
    expect(result.trades[0]).toHaveProperty("price");
    expect(result.trades[0]).toHaveProperty("side");

    // Verify equity curve structure
    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.equity[0].value).toBe(goldenData.config.initialCapital);
  });

  test("should generate consistent results across multiple runs", async () => {
    const backtester = new BacktesterV2(mockProvider);
    
    const config = {
      mode: "single" as const,
      startDate: "2023-01-01",
      endDate: "2023-01-10",
      initialCapital: 10000,
      tradingCost: 0.0001,
      slippage: 0.00005,
      strategy: {
        tradableSymbol: "EURUSD",
        longThreshold: 1.0500,
        shortThreshold: 1.0550,
        positionSize: 10000
      }
    };

    const result1 = await backtester.runSingle(config);
    const result2 = await backtester.runSingle(config);

    // Results should be identical
    expect(result1.equity).toEqual(result2.equity);
    expect(result1.trades).toEqual(result2.trades);
    expect(result1.stats).toEqual(result2.stats);
  });
});