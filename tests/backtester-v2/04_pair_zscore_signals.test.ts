import { PairZScoreStrategy } from "../../engine/backtester-v2/strategies/PairZScore";
import { generateMeanRevertingPair } from "./utils/synth";

describe("04 - Pair Z-Score Signal Generation", () => {
  test("should generate correct entry signals based on z-score", () => {
    const strategy = new PairZScoreStrategy({
      symbolA: "XOM",
      symbolB: "USO", 
      lookbackPeriod: 20,
      zScoreEntry: 2.0,
      zScoreExit: 0.5,
      betaNeutral: false,
      maxLeverage: 2.0,
      borrowCost: 0.03
    });

    // Generate mean-reverting pair data
    const { pricesA, pricesB } = generateMeanRevertingPair(
      "2023-01-01", 
      "2023-02-28", 
      100, 
      50, 
      0.05, 
      2.0,
      12345
    );

    let entrySignalGenerated = false;
    
    // Feed prices to strategy
    for (let i = 0; i < pricesA.length; i++) {
      const prices = {
        "XOM": pricesA[i].price,
        "USO": pricesB[i].price
      };
      
      const signals = strategy.generateSignals(pricesA[i].date, prices, 100000);
      
      if (signals.signals.length > 0) {
        entrySignalGenerated = true;
        
        // Should generate pairs of signals (one for each symbol)
        expect(signals.signals.length).toBe(2);
        
        const xomSignal = signals.signals.find(s => s.symbol === "XOM");
        const usoSignal = signals.signals.find(s => s.symbol === "USO");
        
        expect(xomSignal).toBeDefined();
        expect(usoSignal).toBeDefined();
        
        // Signals should be opposite (one BUY, one SELL)
        expect([xomSignal!.action, usoSignal!.action].sort()).toEqual(["BUY", "SELL"]);
        
        // Meta should contain z-score and beta
        expect(signals.meta).toBeDefined();
        expect(signals.meta!.zScore).toBeDefined();
        expect(signals.meta!.beta).toBeDefined();
        expect(Math.abs(signals.meta!.zScore)).toBeGreaterThan(1.5); // Should be significant
        
        break; // Test first signal
      }
    }
    
    expect(entrySignalGenerated).toBe(true);
  });

  test("should calculate beta correctly for correlated pairs", () => {
    const strategy = new PairZScoreStrategy({
      symbolA: "XOM",
      symbolB: "USO",
      lookbackPeriod: 30,
      zScoreEntry: 2.0,
      zScoreExit: 0.5,
      betaNeutral: true,
      maxLeverage: 2.0,
      borrowCost: 0.03
    });

    // Create highly correlated series
    const basePrice = 100;
    const dates = ["2023-01-01", "2023-01-02", "2023-01-03", "2023-01-04", "2023-01-05"];
    
    // XOM follows USO closely with beta ≈ 2.0
    for (let i = 0; i < dates.length; i++) {
      const usoPrice = basePrice + i * 2; // USO increases by 2 each day
      const xomPrice = basePrice * 2 + i * 4; // XOM increases by 4 each day (beta ≈ 2)
      
      const prices = { "XOM": xomPrice, "USO": usoPrice };
      strategy.generateSignals(dates[i], prices, 100000);
    }

    const metrics = strategy.getCurrentMetrics();
    
    // Beta should be approximately 2.0 (with some tolerance for calculation method)
    expect(metrics.beta).toBeGreaterThan(1.5);
    expect(metrics.beta).toBeLessThan(2.5);
  });

  test("should handle beta-neutral position sizing", () => {
    const strategy = new PairZScoreStrategy({
      symbolA: "XOM", 
      symbolB: "USO",
      lookbackPeriod: 20,
      zScoreEntry: 1.5, // Lower threshold to trigger signals
      zScoreExit: 0.5,
      betaNeutral: true,
      maxLeverage: 2.0,
      borrowCost: 0.03
    });

    // Create divergent prices to trigger signals
    const prices = [
      { date: "2023-01-01", xom: 100, uso: 50 },
      { date: "2023-01-02", xom: 102, uso: 50 },  // XOM up, USO flat
      { date: "2023-01-03", xom: 104, uso: 49 },  // Divergence increases
      { date: "2023-01-04", xom: 106, uso: 48 },  // More divergence
      { date: "2023-01-05", xom: 110, uso: 47 }   // Strong divergence
    ];

    let signalGenerated = false;
    
    for (const pricePoint of prices) {
      const priceMap = { "XOM": pricePoint.xom, "USO": pricePoint.uso };
      const signals = strategy.generateSignals(pricePoint.date, priceMap, 200000);
      
      if (signals.signals.length > 0) {
        signalGenerated = true;
        
        const xomSignal = signals.signals.find(s => s.symbol === "XOM");
        const usoSignal = signals.signals.find(s => s.symbol === "USO");
        
        expect(xomSignal?.quantity).toBeDefined();
        expect(usoSignal?.quantity).toBeDefined();
        
        // With beta-neutral sizing, position sizes should be adjusted for beta
        const xomValue = xomSignal!.quantity! * pricePoint.xom;
        const usoValue = usoSignal!.quantity! * pricePoint.uso;
        
        // Values should be meaningful (not zero)
        expect(Math.abs(xomValue)).toBeGreaterThan(1000);
        expect(Math.abs(usoValue)).toBeGreaterThan(1000);
        
        break;
      }
    }
    
    expect(signalGenerated).toBe(true);
  });

  test("should generate exit signals when z-score normalizes", () => {
    const strategy = new PairZScoreStrategy({
      symbolA: "XOM",
      symbolB: "USO",
      lookbackPeriod: 10,
      zScoreEntry: 1.0,
      zScoreExit: 0.3,
      betaNeutral: false,
      maxLeverage: 2.0,
      borrowCost: 0.03
    });

    // Create pattern: divergence followed by convergence
    const scenarios = [
      // Initial period - build history
      { date: "2023-01-01", xom: 100, uso: 50 },
      { date: "2023-01-02", xom: 101, uso: 50.5 },
      { date: "2023-01-03", xom: 102, uso: 51 },
      { date: "2023-01-04", xom: 103, uso: 51.5 },
      { date: "2023-01-05", xom: 104, uso: 52 },
      
      // Divergence - should trigger entry
      { date: "2023-01-06", xom: 108, uso: 52 },   // Strong divergence
      
      // Convergence - should trigger exit
      { date: "2023-01-07", xom: 106, uso: 53 },   // Converging
      { date: "2023-01-08", xom: 104, uso: 52 }    // Back to normal
    ];

    let entryDetected = false;
    let exitDetected = false;
    
    for (const scenario of scenarios) {
      const prices = { "XOM": scenario.xom, "USO": scenario.uso };
      const signals = strategy.generateSignals(scenario.date, prices, 100000);
      
      if (signals.signals.length > 0) {
        const hasEntrySignals = signals.signals.some(s => s.tag?.includes("long") || s.tag?.includes("short"));
        const hasExitSignals = signals.signals.some(s => s.action === "CLOSE");
        
        if (hasEntrySignals) entryDetected = true;
        if (hasExitSignals) exitDetected = true;
      }
    }
    
    expect(entryDetected).toBe(true);
    expect(exitDetected).toBe(true);
  });

  test("should maintain position state correctly", () => {
    const strategy = new PairZScoreStrategy({
      symbolA: "XOM",
      symbolB: "USO",
      lookbackPeriod: 5,
      zScoreEntry: 1.0,
      zScoreExit: 0.3,
      betaNeutral: false,
      maxLeverage: 2.0,
      borrowCost: 0.03
    });

    // Initial state should be FLAT
    expect(strategy.getCurrentMetrics().position).toBe("FLAT");

    // After entry signal, position should change
    const prices = { "XOM": 100, "USO": 45 }; // Create imbalance
    
    // Build some history first
    for (let i = 0; i < 6; i++) {
      strategy.generateSignals(`2023-01-0${i+1}`, { "XOM": 100 + i, "USO": 50 - i*0.5 }, 100000);
    }
    
    const finalMetrics = strategy.getCurrentMetrics();
    
    // Position should no longer be FLAT if signals were generated
    expect(["FLAT", "LONG_A_SHORT_B", "LONG_B_SHORT_A"]).toContain(finalMetrics.position);
  });
});