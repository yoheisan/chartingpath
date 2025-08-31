import { 
  calculateRollover, 
  shouldApplyRollover, 
  calculateSpreadCost, 
  convertPipsToPrice 
} from "../../engine/backtester-v2/core/fx";

describe("03 - FX Rollover and Spread Costs", () => {
  test("should calculate rollover correctly", () => {
    // Test positive rollover (earning interest)
    const rollover1 = calculateRollover(10000, 1.05, 0.02, 1); // 2% annual rate diff, 1 day
    expect(rollover1).toBeCloseTo(0.575, 2); // 10000 * 1.05 * 0.02 / 365

    // Test negative rollover (paying interest)
    const rollover2 = calculateRollover(10000, 1.05, -0.015, 1); // -1.5% annual rate diff
    expect(rollover2).toBeCloseTo(-0.431, 2);

    // Test multiple days
    const rollover3 = calculateRollover(10000, 1.05, 0.02, 7); // 7 days
    expect(rollover3).toBeCloseTo(4.027, 2);
  });

  test("should determine rollover timing correctly", () => {
    // Should apply rollover after 17:00
    expect(shouldApplyRollover("2023-01-01T18:00:00Z", "17:00")).toBe(true);
    expect(shouldApplyRollover("2023-01-01T16:00:00Z", "17:00")).toBe(false);
    
    // Should not apply if already applied today
    expect(shouldApplyRollover("2023-01-01T18:00:00Z", "17:00", "2023-01-01")).toBe(false);
    expect(shouldApplyRollover("2023-01-02T18:00:00Z", "17:00", "2023-01-01")).toBe(true);
  });

  test("should calculate spread costs for major pairs", () => {
    // EUR/USD with 1.2 pip spread
    const eurusdCost = calculateSpreadCost("EURUSD", 10000, 1.05);
    expect(eurusdCost).toBeCloseTo(0.126, 3); // 1.2 pips * 10000 * 1.05

    // USD/JPY with 1.0 pip spread  
    const usdjpyCost = calculateSpreadCost("USDJPY", 10000, 110.5);
    expect(usdjpyCost).toBeCloseTo(1.105, 3); // 1.0 pip * 10000 * 110.5

    // Unknown pair should return 0
    const unknownCost = calculateSpreadCost("UNKNOWN", 10000, 1.0);
    expect(unknownCost).toBe(0);
  });

  test("should convert pips to price correctly", () => {
    // Major pairs (4 decimal places)
    expect(convertPipsToPrice(10, "EURUSD")).toBe(0.001); // 10 pips = 0.001
    expect(convertPipsToPrice(50, "GBPUSD")).toBe(0.005); // 50 pips = 0.005

    // JPY pairs (2 decimal places)
    expect(convertPipsToPrice(10, "USDJPY")).toBe(0.1); // 10 pips = 0.1
    expect(convertPipsToPrice(25, "EURJPY")).toBe(0.25); // 25 pips = 0.25

    // Unknown pair
    expect(convertPipsToPrice(10, "UNKNOWN")).toBe(0);
  });

  test("should handle edge cases", () => {
    // Zero values
    expect(calculateRollover(0, 1.05, 0.02, 1)).toBe(0);
    expect(calculateRollover(10000, 0, 0.02, 1)).toBe(0);
    expect(calculateRollover(10000, 1.05, 0, 1)).toBe(0);

    // Negative position (short)
    const shortRollover = calculateRollover(-10000, 1.05, 0.02, 1);
    expect(shortRollover).toBeCloseTo(-0.575, 2);

    // Large position
    const largeRollover = calculateRollover(1000000, 1.05, 0.02, 1);
    expect(largeRollover).toBeCloseTo(57.534, 2);
  });

  test("should validate rollover business logic", () => {
    // Positive interest rate differential should benefit long positions
    const longPositiveRate = calculateRollover(10000, 1.05, 0.02, 1);
    expect(longPositiveRate).toBeGreaterThan(0);

    // Negative interest rate differential should cost long positions  
    const longNegativeRate = calculateRollover(10000, 1.05, -0.02, 1);
    expect(longNegativeRate).toBeLessThan(0);

    // Short positions should have opposite effect
    const shortPositiveRate = calculateRollover(-10000, 1.05, 0.02, 1);
    expect(shortPositiveRate).toBeLessThan(0);

    const shortNegativeRate = calculateRollover(-10000, 1.05, -0.02, 1);
    expect(shortNegativeRate).toBeGreaterThan(0);
  });
});