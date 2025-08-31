import { BacktesterV2 } from "../../engine/backtester-v2/backtest";
import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { generateSyntheticPrices } from "./utils/synth";

describe("08 - Basket DCA (Dollar Cost Averaging)", () => {
  test("should implement monthly DCA contributions", async () => {
    // Create 6-month price series
    const asset1 = generateSyntheticPrices("2023-01-01", "2023-06-30", 100, 0.02, 0.0002, 12345);
    const asset2 = generateSyntheticPrices("2023-01-01", "2023-06-30", 60, 0.018, -0.0001, 54321);

    const mockProvider = new MockProvider({
      "DCA1": {
        index: asset1.map(p => p.date),
        columns: ["DCA1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "DCA2": {
        index: asset2.map(p => p.date),
        columns: ["DCA2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-06-30",
      initialCapital: 10000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      policy: {
        symbols: ["DCA1", "DCA2"],
        contributionAmount: 2000, // $2000 monthly
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "none" as const,
        driftThreshold: 1.0,
        tradingCost: 0.0005
      }
    };

    const result = await backtester.runBasket(config);

    expect(result.equity.length).toBeGreaterThan(0);
    expect(result.trades.length).toBeGreaterThan(2); // Initial + monthly contributions

    // Count contribution trades (should be multiple sets of 2 trades per month)
    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    expect(dcaTrades.length).toBeGreaterThan(4); // At least initial + several months

    // Group trades by date to see monthly patterns
    const tradesByDate = new Map<string, any[]>();
    dcaTrades.forEach(trade => {
      if (!tradesByDate.has(trade.date)) {
        tradesByDate.set(trade.date, []);
      }
      tradesByDate.get(trade.date)!.push(trade);
    });

    // Each DCA date should have 2 trades (one per asset)
    for (const [date, trades] of tradesByDate) {
      expect(trades.length).toBe(2);
      
      // Each trade should be approximately $1000 (half of $2000 contribution)
      for (const trade of trades) {
        const tradeValue = Math.abs(trade.qty * trade.price);
        expect(tradeValue).toBeCloseTo(1000, -1); // Within $100
      }
    }

    // Total invested should be initial + contributions
    const totalContributions = Array.from(tradesByDate.keys()).length * 2000;
    const expectedTotal = config.initialCapital + totalContributions;

    // Final equity should reflect total investments plus/minus performance
    const finalEquity = result.equity[result.equity.length - 1].value;
    expect(finalEquity).toBeGreaterThan(expectedTotal * 0.7); // Allow for poor performance
    expect(finalEquity).toBeLessThan(expectedTotal * 1.5); // Sanity check for extreme gains
  });

  test("should handle weekly DCA frequency", async () => {
    // Create 2-month series with daily data
    const asset1 = generateSyntheticPrices("2023-01-01", "2023-02-28", 80, 0.015, 0, 11111);

    const mockProvider = new MockProvider({
      "WEEKLY": {
        index: asset1.map(p => p.date),
        columns: ["WEEKLY"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-02-28",
      initialCapital: 5000,
      tradingCost: 0.0003,
      slippage: 0.0001,
      policy: {
        symbols: ["WEEKLY"],
        contributionAmount: 500, // $500 weekly
        contributionFrequency: "weekly" as const,
        rebalanceFrequency: "none" as const,
        driftThreshold: 1.0,
        tradingCost: 0.0003
      }
    };

    const result = await backtester.runBasket(config);

    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    
    // Should have weekly contributions (~8 weeks in 2 months)
    expect(dcaTrades.length).toBeGreaterThan(6);
    expect(dcaTrades.length).toBeLessThan(12);

    // Each contribution should be $500
    for (const trade of dcaTrades) {
      const tradeValue = Math.abs(trade.qty * trade.price);
      expect(tradeValue).toBeCloseTo(500, -1);
    }
  });

  test("should handle quarterly DCA frequency", async () => {
    // Create 1-year series  
    const asset1 = generateSyntheticPrices("2023-01-01", "2023-12-31", 120, 0.012, 0.0001, 22222);
    const asset2 = generateSyntheticPrices("2023-01-01", "2023-12-31", 40, 0.016, -0.0002, 33333);

    const mockProvider = new MockProvider({
      "Q1": {
        index: asset1.map(p => p.date),
        columns: ["Q1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "Q2": {
        index: asset2.map(p => p.date),
        columns: ["Q2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      initialCapital: 20000,
      tradingCost: 0.0004,
      slippage: 0.0002,
      policy: {
        symbols: ["Q1", "Q2"],
        contributionAmount: 6000, // $6000 quarterly
        contributionFrequency: "quarterly" as const,
        rebalanceFrequency: "none" as const,
        driftThreshold: 1.0,
        tradingCost: 0.0004
      }
    };

    const result = await backtester.runBasket(config);

    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    
    // Should have 4 quarterly contributions × 2 assets = 8 trades
    expect(dcaTrades.length).toBeCloseTo(8, 2); // Allow some tolerance

    // Group by date
    const contributionDates = new Set(dcaTrades.map(t => t.date));
    expect(contributionDates.size).toBeCloseTo(4, 1); // 4 quarterly dates

    // Each quarterly contribution should be $3000 per asset
    const tradesByDate = new Map<string, any[]>();
    dcaTrades.forEach(trade => {
      if (!tradesByDate.has(trade.date)) {
        tradesByDate.set(trade.date, []);
      }
      tradesByDate.get(trade.date)!.push(trade);
    });

    for (const [date, trades] of tradesByDate) {
      expect(trades.length).toBe(2); // 2 assets
      for (const trade of trades) {
        const tradeValue = Math.abs(trade.qty * trade.price);
        expect(tradeValue).toBeCloseTo(3000, -1); // $3000 per asset
      }
    }
  });

  test("should combine DCA with equal weight allocation", async () => {
    // Create 3-asset portfolio
    const asset1 = generateSyntheticPrices("2023-01-01", "2023-04-30", 90, 0.018, 0.0003, 44444);
    const asset2 = generateSyntheticPrices("2023-01-01", "2023-04-30", 150, 0.014, -0.0001, 55555);
    const asset3 = generateSyntheticPrices("2023-01-01", "2023-04-30", 30, 0.022, 0.0005, 66666);

    const mockProvider = new MockProvider({
      "EQUAL1": {
        index: asset1.map(p => p.date),
        columns: ["EQUAL1"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "EQUAL2": {
        index: asset2.map(p => p.date),
        columns: ["EQUAL2"],
        data: asset2.map(p => [p.price]),
        meta: { provider: "mock" }
      },
      "EQUAL3": {
        index: asset3.map(p => p.date),
        columns: ["EQUAL3"],
        data: asset3.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-04-30",
      initialCapital: 15000,
      tradingCost: 0.0006,
      slippage: 0.0003,
      policy: {
        symbols: ["EQUAL1", "EQUAL2", "EQUAL3"],
        contributionAmount: 3000, // Monthly
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "none" as const,
        driftThreshold: 1.0,
        tradingCost: 0.0006
      }
    };

    const result = await backtester.runBasket(config);

    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    
    // Group trades by date
    const tradesByDate = new Map<string, any[]>();
    dcaTrades.forEach(trade => {
      if (!tradesByDate.has(trade.date)) {
        tradesByDate.set(trade.date, []);
      }
      tradesByDate.get(trade.date)!.push(trade);
    });

    // Each DCA date should have 3 trades (equal weight across 3 assets)
    for (const [date, trades] of tradesByDate) {
      expect(trades.length).toBe(3);
      
      // Each trade should be approximately $1000 (1/3 of $3000)
      for (const trade of trades) {
        const tradeValue = Math.abs(trade.qty * trade.price);
        expect(tradeValue).toBeCloseTo(1000, -1);
      }
    }

    // Check that assets maintain roughly equal weights over time
    const finalWeights = result.weights![result.weights!.length - 1];
    const weightValues = Object.keys(finalWeights)
      .filter(k => k !== "date")
      .map(symbol => finalWeights[symbol]);

    // Each weight should be approximately 1/3 (may drift slightly)
    for (const weight of weightValues) {
      expect(Math.abs(weight - 1/3)).toBeLessThan(0.1); // Within 10%
    }
  });

  test("should handle edge cases and zero contributions", async () => {
    const asset1 = generateSyntheticPrices("2023-01-01", "2023-03-31", 100, 0.01, 0, 77777);

    const mockProvider = new MockProvider({
      "ZERO": {
        index: asset1.map(p => p.date),
        columns: ["ZERO"],
        data: asset1.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const backtester = new BacktesterV2(mockProvider);

    // Test zero contribution (pure buy & hold)
    const config = {
      mode: "basket" as const,
      startDate: "2023-01-01",
      endDate: "2023-03-31",
      initialCapital: 10000,
      tradingCost: 0.0005,
      slippage: 0.0002,
      policy: {
        symbols: ["ZERO"],
        contributionAmount: 0, // No DCA
        contributionFrequency: "monthly" as const,
        rebalanceFrequency: "none" as const,
        driftThreshold: 1.0,
        tradingCost: 0.0005
      }
    };

    const result = await backtester.runBasket(config);

    // Should only have initial trade, no DCA trades
    expect(result.trades.length).toBe(1);
    expect(result.trades[0].tag).toBeUndefined(); // Initial trade has no tag
    
    const dcaTrades = result.trades.filter(t => t.tag === "dca_contribution");
    expect(dcaTrades.length).toBe(0);

    // Should still work correctly
    expect(result.equity.length).toBeGreaterThan(0);
    const finalEquity = result.equity[result.equity.length - 1].value;
    expect(finalEquity).toBeGreaterThan(0);
  });
});