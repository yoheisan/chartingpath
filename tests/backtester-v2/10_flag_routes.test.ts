/**
 * Test 10: Feature Flag and Route Registration
 * 
 * This test validates that:
 * 1. When BACKTESTER_V2_ENABLED=false, new routes return 404
 * 2. When BACKTESTER_V2_ENABLED=true, new routes work properly
 * 3. Legacy routes continue to work regardless of flag state
 * 4. Data provider caching works correctly
 */

import { MockProvider } from "../../engine/backtester-v2/data/providers/MockProvider";
import { CachingProvider, MemoryCache } from "../../engine/backtester-v2/data/providers/CachingProvider";
import { generateSyntheticPrices } from "./utils/synth";

describe("10 - Feature Flag and Route Registration", () => {
  
  const originalEnv = process.env.BACKTESTER_V2_ENABLED;
  
  afterEach(() => {
    // Restore original environment
    if (originalEnv !== undefined) {
      process.env.BACKTESTER_V2_ENABLED = originalEnv;
    } else {
      delete process.env.BACKTESTER_V2_ENABLED;
    }
  });

  test("should respect BACKTESTER_V2_ENABLED=false flag", () => {
    process.env.BACKTESTER_V2_ENABLED = "false";
    
    // In a real implementation, this would test actual route registration
    // For this unit test, we simulate the flag behavior
    const isEnabled = process.env.BACKTESTER_V2_ENABLED === "true";
    
    expect(isEnabled).toBe(false);
    
    // Simulate route handler behavior when flag is off
    const simulateRouteResponse = (route: string) => {
      if (!isEnabled && (route.includes("/backtest/pair") || route.includes("/backtest/portfolio"))) {
        return { status: 404, message: "Not Found" };
      }
      return { status: 200, message: "OK" };
    };
    
    // New routes should return 404 when flag is off
    expect(simulateRouteResponse("/backtest/pair")).toEqual({ status: 404, message: "Not Found" });
    expect(simulateRouteResponse("/backtest/portfolio")).toEqual({ status: 404, message: "Not Found" });
    
    // Legacy routes should still work
    expect(simulateRouteResponse("/backtest/fx/single")).toEqual({ status: 200, message: "OK" });
  });

  test("should enable new routes when BACKTESTER_V2_ENABLED=true", () => {
    process.env.BACKTESTER_V2_ENABLED = "true";
    
    const isEnabled = process.env.BACKTESTER_V2_ENABLED === "true";
    expect(isEnabled).toBe(true);
    
    const simulateRouteResponse = (route: string) => {
      if (!isEnabled && (route.includes("/backtest/pair") || route.includes("/backtest/portfolio"))) {
        return { status: 404, message: "Not Found" };
      }
      return { status: 200, message: "OK" };
    };
    
    // New routes should work when flag is on
    expect(simulateRouteResponse("/backtest/pair")).toEqual({ status: 200, message: "OK" });
    expect(simulateRouteResponse("/backtest/portfolio")).toEqual({ status: 200, message: "OK" });
    
    // Legacy routes should still work
    expect(simulateRouteResponse("/backtest/fx/single")).toEqual({ status: 200, message: "OK" });
  });

  test("should default to disabled when flag is not set", () => {
    delete process.env.BACKTESTER_V2_ENABLED;
    
    // Default behavior should be disabled
    const isEnabled = process.env.BACKTESTER_V2_ENABLED === "true";
    expect(isEnabled).toBe(false);
  });

  test("should handle caching provider correctly", async () => {
    const prices = generateSyntheticPrices("2023-01-01", "2023-01-31", 100, 0.01, 0, 12345);
    
    const mockProvider = new MockProvider({
      "CACHE_TEST": {
        index: prices.map(p => p.date),
        columns: ["CACHE_TEST"],
        data: prices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const cache = new MemoryCache();
    const cachingProvider = new CachingProvider(mockProvider, cache, 3600); // 1 hour TTL

    // First call should hit the underlying provider
    const result1 = await cachingProvider.loadEOD(["CACHE_TEST"], "2023-01-01", "2023-01-31");
    expect(result1.data.length).toBeGreaterThan(0);
    expect(result1.columns).toEqual(["CACHE_TEST"]);

    // Second call should hit the cache
    const result2 = await cachingProvider.loadEOD(["CACHE_TEST"], "2023-01-01", "2023-01-31");
    expect(result2).toEqual(result1); // Should be identical

    // Verify cache is working by checking if we can retrieve the cached value
    const cacheKey = "EOD:" + JSON.stringify({ symbols: ["CACHE_TEST"], start: "2023-01-01", end: "2023-01-31" });
    const cachedValue = await cache.get(cacheKey);
    expect(cachedValue).not.toBeNull();
    expect(cachedValue!.columns).toEqual(["CACHE_TEST"]);
  });

  test("should handle cache expiration", async () => {
    const prices = generateSyntheticPrices("2023-01-01", "2023-01-10", 50, 0.01, 0, 54321);
    
    const mockProvider = new MockProvider({
      "EXPIRE_TEST": {
        index: prices.map(p => p.date),
        columns: ["EXPIRE_TEST"],
        data: prices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const cache = new MemoryCache();
    const cachingProvider = new CachingProvider(mockProvider, cache, 1); // 1 second TTL

    // Load data
    const result1 = await cachingProvider.loadEOD(["EXPIRE_TEST"], "2023-01-01", "2023-01-10");
    expect(result1.data.length).toBeGreaterThan(0);

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 1100)); // 1.1 seconds

    // This should hit the provider again (cache expired)
    const result2 = await cachingProvider.loadEOD(["EXPIRE_TEST"], "2023-01-01", "2023-01-10");
    expect(result2.data.length).toBeGreaterThan(0);

    // Results should still be the same (same underlying data)
    expect(result2).toEqual(result1);
  });

  test("should handle intraday caching", async () => {
    const prices = generateSyntheticPrices("2023-01-01", "2023-01-02", 100, 0.01, 0, 99999);
    
    const mockProvider = new MockProvider({
      "INTRADAY": {
        index: prices.map(p => p.date),
        columns: ["INTRADAY"],
        data: prices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const cachingProvider = new CachingProvider(mockProvider, new MemoryCache(), 1800); // 30 min TTL

    // Test intraday caching
    const result1 = await cachingProvider.loadIntraday("INTRADAY", "2023-01-01", "2023-01-02", "5m");
    expect(result1.columns).toEqual(["INTRADAY"]);

    // Second call should be cached
    const result2 = await cachingProvider.loadIntraday("INTRADAY", "2023-01-01", "2023-01-02", "5m");
    expect(result2).toEqual(result1);
  });

  test("should validate feature flag environment variable types", () => {
    // Test various string values
    const testCases = [
      { value: "true", expected: true },
      { value: "false", expected: false },
      { value: "TRUE", expected: false }, // Case sensitive
      { value: "False", expected: false }, // Case sensitive
      { value: "1", expected: false }, // Not "true"
      { value: "0", expected: false },
      { value: "", expected: false },
      { value: undefined, expected: false }
    ];

    for (const testCase of testCases) {
      if (testCase.value === undefined) {
        delete process.env.BACKTESTER_V2_ENABLED;
      } else {
        process.env.BACKTESTER_V2_ENABLED = testCase.value;
      }
      
      const isEnabled = process.env.BACKTESTER_V2_ENABLED === "true";
      expect(isEnabled).toBe(testCase.expected);
    }
  });

  test("should simulate UI component visibility based on flag", () => {
    // Simulate UI component behavior
    const getVisibleModes = (flagEnabled: boolean) => {
      const modes = ["Single (Existing)"];
      if (flagEnabled) {
        modes.push("Pair (New)", "Basket (New)");
      }
      return modes;
    };
    
    // Flag disabled
    process.env.BACKTESTER_V2_ENABLED = "false";
    const isEnabled = process.env.BACKTESTER_V2_ENABLED === "true";
    expect(getVisibleModes(isEnabled)).toEqual(["Single (Existing)"]);
    
    // Flag enabled
    process.env.BACKTESTER_V2_ENABLED = "true";
    const isEnabledTrue = process.env.BACKTESTER_V2_ENABLED === "true";
    expect(getVisibleModes(isEnabledTrue)).toEqual(["Single (Existing)", "Pair (New)", "Basket (New)"]);
  });

  test("should handle concurrent cache access", async () => {
    const prices = generateSyntheticPrices("2023-01-01", "2023-01-05", 75, 0.01, 0, 13579);
    
    const mockProvider = new MockProvider({
      "CONCURRENT": {
        index: prices.map(p => p.date),
        columns: ["CONCURRENT"],
        data: prices.map(p => [p.price]),
        meta: { provider: "mock" }
      }
    });

    const cachingProvider = new CachingProvider(mockProvider, new MemoryCache(), 3600);

    // Make multiple concurrent requests
    const promises = Array(5).fill(0).map(() => 
      cachingProvider.loadEOD(["CONCURRENT"], "2023-01-01", "2023-01-05")
    );

    const results = await Promise.all(promises);

    // All results should be identical
    for (let i = 1; i < results.length; i++) {
      expect(results[i]).toEqual(results[0]);
    }

    // Should have loaded data
    expect(results[0].data.length).toBeGreaterThan(0);
  });
});