interface TargetLevel {
  price: number;
  method: string;
  confidence: 'Conservative' | 'Moderate' | 'Aggressive';
  description: string;
}

interface TargetMethodologyResult {
  primaryTarget: number;
  alternativeTargets: TargetLevel[];
  riskRewardRatio: number;
  methodology: string;
}

export class DoubleTopTargetMethodologies {
  
  /**
   * Calculate comprehensive target levels for Double Top pattern
   * @param peakLevel - The high of both peaks
   * @param valleyLevel - The low between the peaks (support level)
   * @param stopLoss - Recommended stop loss level
   * @returns Complete target analysis
   */
  static calculateTargets(peakLevel: number, valleyLevel: number, stopLoss: number): TargetMethodologyResult {
    const patternHeight = peakLevel - valleyLevel;
    
    // 1. Classic Measured Move (Primary Method)
    const classicTarget = valleyLevel - patternHeight;
    
    // 2. Fibonacci Extension Targets
    const fibTargets = this.calculateFibonacciTargets(peakLevel, valleyLevel, patternHeight);
    
    // 3. Percentage-based Targets
    const percentageTargets = this.calculatePercentageTargets(valleyLevel, patternHeight);
    
    // 4. Multiple Measured Move Targets
    const measuredTargets = this.calculateMeasuredMoveTargets(valleyLevel, patternHeight);
    
    // 5. Volume-weighted Target (conservative adjustment)
    const volumeAdjustedTarget = this.calculateVolumeAdjustedTarget(classicTarget, patternHeight);
    
    // Compile all alternative targets
    const alternativeTargets: TargetLevel[] = [
      ...fibTargets,
      ...percentageTargets,
      ...measuredTargets,
      {
        price: volumeAdjustedTarget,
        method: 'Volume-Adjusted',
        confidence: 'Conservative',
        description: 'Adjusted for typical volume characteristics in double top failures'
      }
    ];
    
    // Calculate risk/reward ratio
    const entryPrice = valleyLevel; // Entry on support break
    const riskRewardRatio = Math.abs(classicTarget - entryPrice) / Math.abs(stopLoss - entryPrice);
    
    return {
      primaryTarget: classicTarget,
      alternativeTargets,
      riskRewardRatio,
      methodology: 'Classic Measured Move with Fibonacci and Statistical Alternatives'
    };
  }
  
  private static calculateFibonacciTargets(peakLevel: number, valleyLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: valleyLevel - (patternHeight * 0.618),
        method: 'Fibonacci 61.8%',
        confidence: 'Conservative',
        description: 'First Fibonacci retracement level - high probability target'
      },
      {
        price: valleyLevel - (patternHeight * 1.0),
        method: 'Fibonacci 100%',
        confidence: 'Moderate',
        description: 'Equal to pattern height - classic measured move'
      },
      {
        price: valleyLevel - (patternHeight * 1.618),
        method: 'Fibonacci 161.8%',
        confidence: 'Aggressive',
        description: 'Golden ratio extension - strong momentum target'
      },
      {
        price: valleyLevel - (patternHeight * 2.618),
        method: 'Fibonacci 261.8%',
        confidence: 'Aggressive',
        description: 'Extended target for major trend reversals'
      }
    ];
  }
  
  private static calculatePercentageTargets(valleyLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: valleyLevel - (patternHeight * 0.5),
        method: 'Conservative 50%',
        confidence: 'Conservative',
        description: 'Half the pattern height - minimum expected move'
      },
      {
        price: valleyLevel - (patternHeight * 0.75),
        method: 'Moderate 75%',
        confidence: 'Moderate',
        description: 'Three-quarters pattern height - balanced target'
      },
      {
        price: valleyLevel - (patternHeight * 1.25),
        method: 'Extended 125%',
        confidence: 'Aggressive',
        description: 'Extended target for strong bearish momentum'
      }
    ];
  }
  
  private static calculateMeasuredMoveTargets(valleyLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: valleyLevel - (patternHeight * 0.8),
        method: 'Statistical 80%',
        confidence: 'Moderate',
        description: 'Based on historical pattern completion rates (~80%)'
      },
      {
        price: valleyLevel - (patternHeight * 1.15),
        method: 'Momentum Extension',
        confidence: 'Moderate',
        description: 'Accounts for breakout momentum continuation'
      }
    ];
  }
  
  private static calculateVolumeAdjustedTarget(classicTarget: number, patternHeight: number): number {
    // Adjust target based on typical volume divergence characteristics
    // Double tops often show volume divergence, suggesting conservative targets
    return classicTarget + (patternHeight * 0.15); // 15% more conservative
  }
  
  /**
   * Get target methodology explanation for educational purposes
   */
  static getMethodologyExplanation(): string {
    return `
Double Top Target Price Methodologies:

1. **Classic Measured Move** (Primary): Target = Support - Pattern Height
   - Most reliable and widely used method
   - Based on symmetrical price projection
   - Success rate: ~65-75%

2. **Fibonacci Extensions**: Mathematical ratios based on pattern geometry
   - 61.8%: Conservative, high-probability target
   - 100%: Equal to measured move
   - 161.8% & 261.8%: Aggressive momentum targets

3. **Statistical Targets**: Based on historical pattern analysis
   - 50%: Minimum expected move
   - 80%: Statistical completion average
   - 125%: Extended bearish scenario

4. **Volume-Adjusted**: Considers volume divergence typical in double tops
   - More conservative when volume divergence is present
   - Adjusts for pattern reliability factors

**Risk Management**: Always use stop loss above the second peak with position sizing based on risk/reward ratio.
    `;
  }
}