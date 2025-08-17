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

export class InvertedHeadAndShouldersTargetMethodologies {
  
  /**
   * Calculate comprehensive target levels for Inverted Head and Shoulders pattern
   * @param headLevel - The low of the head (lowest point)
   * @param shoulderLevel - The average level of both shoulders
   * @param necklineLevel - The resistance level (neckline)
   * @param stopLoss - Recommended stop loss level
   * @returns Complete target analysis
   */
  static calculateTargets(headLevel: number, shoulderLevel: number, necklineLevel: number, stopLoss: number): TargetMethodologyResult {
    const patternHeight = necklineLevel - headLevel;
    
    // 1. Classic Measured Move (Primary Method)
    const classicTarget = necklineLevel + patternHeight;
    
    // 2. Fibonacci Extension Targets
    const fibTargets = this.calculateFibonacciTargets(necklineLevel, patternHeight);
    
    // 3. Percentage-based Targets
    const percentageTargets = this.calculatePercentageTargets(necklineLevel, patternHeight);
    
    // 4. Multiple Measured Move Targets
    const measuredTargets = this.calculateMeasuredMoveTargets(necklineLevel, patternHeight);
    
    // 5. Volume-weighted Target (momentum adjustment)
    const volumeAdjustedTarget = this.calculateVolumeAdjustedTarget(classicTarget, patternHeight);
    
    // Compile all alternative targets
    const alternativeTargets: TargetLevel[] = [
      ...fibTargets,
      ...percentageTargets,
      ...measuredTargets,
      {
        price: volumeAdjustedTarget,
        method: 'Volume-Adjusted',
        confidence: 'Moderate',
        description: 'Enhanced for typical volume expansion in successful breakouts'
      }
    ];
    
    // Calculate risk/reward ratio
    const entryPrice = necklineLevel; // Entry on neckline break
    const riskRewardRatio = Math.abs(classicTarget - entryPrice) / Math.abs(entryPrice - stopLoss);
    
    return {
      primaryTarget: classicTarget,
      alternativeTargets,
      riskRewardRatio,
      methodology: 'Classic Measured Move with Fibonacci and Volume-Enhanced Alternatives'
    };
  }
  
  private static calculateFibonacciTargets(necklineLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: necklineLevel + (patternHeight * 0.618),
        method: 'Fibonacci 61.8%',
        confidence: 'Conservative',
        description: 'First Fibonacci extension - high probability bullish target'
      },
      {
        price: necklineLevel + (patternHeight * 1.0),
        method: 'Fibonacci 100%',
        confidence: 'Moderate',
        description: 'Equal to pattern height - classic measured move target'
      },
      {
        price: necklineLevel + (patternHeight * 1.618),
        method: 'Fibonacci 161.8%',
        confidence: 'Aggressive',
        description: 'Golden ratio extension - strong bullish momentum target'
      },
      {
        price: necklineLevel + (patternHeight * 2.618),
        method: 'Fibonacci 261.8%',
        confidence: 'Aggressive',
        description: 'Extended target for major bullish trend reversals'
      }
    ];
  }
  
  private static calculatePercentageTargets(necklineLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: necklineLevel + (patternHeight * 0.5),
        method: 'Conservative 50%',
        confidence: 'Conservative',
        description: 'Half the pattern height - minimum expected bullish move'
      },
      {
        price: necklineLevel + (patternHeight * 0.75),
        method: 'Moderate 75%',
        confidence: 'Moderate',
        description: 'Three-quarters pattern height - balanced bullish target'
      },
      {
        price: necklineLevel + (patternHeight * 1.25),
        method: 'Extended 125%',
        confidence: 'Aggressive',
        description: 'Extended target for strong bullish momentum continuation'
      }
    ];
  }
  
  private static calculateMeasuredMoveTargets(necklineLevel: number, patternHeight: number): TargetLevel[] {
    return [
      {
        price: necklineLevel + (patternHeight * 0.8),
        method: 'Statistical 80%',
        confidence: 'Moderate',
        description: 'Based on historical pattern completion rates (~80%)'
      },
      {
        price: necklineLevel + (patternHeight * 1.15),
        method: 'Momentum Extension',
        confidence: 'Moderate',
        description: 'Accounts for breakout momentum and follow-through buying'
      },
      {
        price: necklineLevel + (patternHeight * 0.9),
        method: 'Conservative Statistical',
        confidence: 'Conservative',
        description: 'Lower-risk target with higher probability of achievement'
      }
    ];
  }
  
  private static calculateVolumeAdjustedTarget(classicTarget: number, patternHeight: number): number {
    // Adjust target upward for typical volume expansion in successful breakouts
    // Inverted H&S patterns often show strong volume confirmation
    return classicTarget + (patternHeight * 0.12); // 12% more aggressive for volume confirmation
  }
  
  /**
   * Get target methodology explanation for educational purposes
   */
  static getMethodologyExplanation(): string {
    return `
Inverted Head and Shoulders Target Price Methodologies:

1. **Classic Measured Move** (Primary): Target = Neckline + Pattern Height
   - Most reliable method for bullish reversal patterns
   - Pattern Height = Neckline Level - Head Level (lowest point)
   - Success rate: ~70-80% with volume confirmation

2. **Fibonacci Extensions**: Mathematical ratios for bullish projections
   - 61.8%: Conservative, high-probability bullish target
   - 100%: Equal to measured move (classic target)
   - 161.8% & 261.8%: Aggressive momentum targets for strong reversals

3. **Statistical Targets**: Based on historical bullish pattern analysis
   - 50%: Minimum expected bullish move
   - 80%: Statistical completion average for confirmed patterns
   - 125%: Extended bullish scenario with momentum continuation

4. **Volume-Enhanced**: Considers volume expansion typical in successful breakouts
   - More aggressive when volume confirms the breakout
   - Adjusts for pattern reliability and momentum factors
   - Volume surge on neckline break increases target probability

**Key Success Factors**:
- Volume confirmation on neckline break (minimum 1.5x average)
- Right shoulder should be higher than left shoulder
- Clear three-touch neckline resistance
- Pattern duration: 4-12 weeks for reliability

**Risk Management**: Use stop loss below the right shoulder low, with position sizing based on favorable risk/reward ratio (typically 1:2 or better).
    `;
  }
}

export class DescendingTriangleTargetMethodologies {
  
  /**
   * Calculate comprehensive target levels for Descending Triangle pattern
   * @param supportLevel - The horizontal support level (breakout point)
   * @param triangleHeight - The distance between highest and lowest points
   * @param stopLoss - Recommended stop loss level
   * @returns Complete target analysis
   */
  static calculateTargets(supportLevel: number, triangleHeight: number, stopLoss: number): TargetMethodologyResult {
    
    // 1. Classic Measured Move (Primary Method)
    const classicTarget = supportLevel - triangleHeight;
    
    // 2. Fibonacci Extension Targets
    const fibTargets = this.calculateFibonacciTargets(supportLevel, triangleHeight);
    
    // 3. Percentage-based Targets
    const percentageTargets = this.calculatePercentageTargets(supportLevel, triangleHeight);
    
    // 4. Multiple Measured Move Targets
    const measuredTargets = this.calculateMeasuredMoveTargets(supportLevel, triangleHeight);
    
    // 5. Volume-weighted Target (momentum adjustment)
    const volumeAdjustedTarget = this.calculateVolumeAdjustedTarget(classicTarget, triangleHeight);
    
    // Compile all alternative targets
    const alternativeTargets: TargetLevel[] = [
      ...fibTargets,
      ...percentageTargets,
      ...measuredTargets,
      {
        price: volumeAdjustedTarget,
        method: 'Volume-Adjusted',
        confidence: 'Moderate',
        description: 'Enhanced for typical volume expansion in continuation breakdowns'
      }
    ];
    
    // Calculate risk/reward ratio
    const entryPrice = supportLevel; // Entry on support break
    const riskRewardRatio = Math.abs(classicTarget - entryPrice) / Math.abs(stopLoss - entryPrice);
    
    return {
      primaryTarget: classicTarget,
      alternativeTargets,
      riskRewardRatio,
      methodology: 'Classic Measured Move with Fibonacci and Volume-Enhanced Alternatives'
    };
  }
  
  private static calculateFibonacciTargets(supportLevel: number, triangleHeight: number): TargetLevel[] {
    return [
      {
        price: supportLevel - (triangleHeight * 0.618),
        method: 'Fibonacci 61.8%',
        confidence: 'Conservative',
        description: 'First Fibonacci extension - high probability bearish target'
      },
      {
        price: supportLevel - (triangleHeight * 1.0),
        method: 'Fibonacci 100%',
        confidence: 'Moderate',
        description: 'Equal to triangle height - classic measured move target'
      },
      {
        price: supportLevel - (triangleHeight * 1.618),
        method: 'Fibonacci 161.8%',
        confidence: 'Aggressive',
        description: 'Golden ratio extension - strong bearish momentum target'
      },
      {
        price: supportLevel - (triangleHeight * 2.618),
        method: 'Fibonacci 261.8%',
        confidence: 'Aggressive',
        description: 'Extended target for major bearish trend continuation'
      }
    ];
  }
  
  private static calculatePercentageTargets(supportLevel: number, triangleHeight: number): TargetLevel[] {
    return [
      {
        price: supportLevel - (triangleHeight * 0.5),
        method: 'Conservative 50%',
        confidence: 'Conservative',
        description: 'Half the triangle height - minimum expected bearish move'
      },
      {
        price: supportLevel - (triangleHeight * 0.75),
        method: 'Moderate 75%',
        confidence: 'Moderate',
        description: 'Three-quarters triangle height - balanced bearish target'
      },
      {
        price: supportLevel - (triangleHeight * 1.25),
        method: 'Extended 125%',
        confidence: 'Aggressive',
        description: 'Extended target for strong bearish momentum continuation'
      }
    ];
  }
  
  private static calculateMeasuredMoveTargets(supportLevel: number, triangleHeight: number): TargetLevel[] {
    return [
      {
        price: supportLevel - (triangleHeight * 0.8),
        method: 'Statistical 80%',
        confidence: 'Moderate',
        description: 'Based on historical pattern completion rates (~80%)'
      },
      {
        price: supportLevel - (triangleHeight * 1.15),
        method: 'Momentum Extension',
        confidence: 'Moderate',
        description: 'Accounts for breakdown momentum and follow-through selling'
      },
      {
        price: supportLevel - (triangleHeight * 0.9),
        method: 'Conservative Statistical',
        confidence: 'Conservative',
        description: 'Lower-risk target with higher probability of achievement'
      }
    ];
  }
  
  private static calculateVolumeAdjustedTarget(classicTarget: number, triangleHeight: number): number {
    // Adjust target downward for typical volume expansion in successful breakdowns
    // Descending triangles often show strong volume confirmation on breakdown
    return classicTarget - (triangleHeight * 0.12); // 12% more aggressive for volume confirmation
  }
  
  /**
   * Get target methodology explanation for educational purposes
   */
  static getMethodologyExplanation(): string {
    return `
Descending Triangle Target Price Methodologies:

1. **Classic Measured Move** (Primary): Target = Support Level - Triangle Height
   - Most reliable method for bearish continuation patterns  
   - Triangle Height = Highest Point - Support Level
   - Success rate: ~75-85% with volume confirmation

2. **Fibonacci Extensions**: Mathematical ratios for bearish projections
   - 61.8%: Conservative, high-probability bearish target
   - 100%: Equal to measured move (classic target)
   - 161.8% & 261.8%: Aggressive momentum targets for strong continuation

3. **Statistical Targets**: Based on historical bearish pattern analysis
   - 50%: Minimum expected bearish move
   - 80%: Statistical completion average for confirmed patterns
   - 125%: Extended bearish scenario with momentum continuation

4. **Descending Triangle**: Target = Breakout Level - Triangle Height
   Target = 90 - 10 = 80
   Rule: Measure the widest part of the triangle (base), then project that distance below the breakout point.

**Key Success Factors**:
- Volume confirmation on support break (minimum 1.5x average)
- Clear horizontal support with descending resistance trend
- Multiple touches of both support and resistance lines
- Pattern duration: 2-8 weeks for reliability

**Risk Management**: Use stop loss above the descending trendline, with position sizing based on favorable risk/reward ratio (typically 1:2 or better).
    `;
  }
}