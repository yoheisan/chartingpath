/**
 * Backtest Risk Manager
 * 
 * Handles total risk threshold enforcement during backtesting.
 * When combined losses from open trades reach the maxTotalRisk threshold,
 * all positions are auto-exited. New trades can still be entered when
 * patterns confirm.
 */

export interface OpenPosition {
  id: string;
  patternName: string;
  entryPrice: number;
  currentPrice: number;
  size: number;
  direction: 'long' | 'short';
  stopLoss: number;
  takeProfit: number;
  entryDate: string;
  unrealizedPnLPercent: number;
}

export interface RiskManagerConfig {
  maxTotalRisk: number; // e.g., 6 for 6%
  riskPerTrade: number; // e.g., 2 for 2%
  maxSimultaneousTrades: number;
  initialBalance: number;
}

export interface RiskCheckResult {
  shouldExitAll: boolean;
  totalUnrealizedLossPercent: number;
  message?: string;
  exitedPositions?: OpenPosition[];
}

export interface TradeExitEvent {
  position: OpenPosition;
  exitPrice: number;
  exitDate: string;
  exitReason: 'total_risk_threshold' | 'stop_loss' | 'take_profit' | 'pattern_invalidation';
  realizedPnLPercent: number;
}

/**
 * Calculate unrealized P&L percentage for a position
 */
export function calculateUnrealizedPnL(
  position: OpenPosition,
  currentPrice: number
): number {
  const priceChange = position.direction === 'long'
    ? (currentPrice - position.entryPrice) / position.entryPrice
    : (position.entryPrice - currentPrice) / position.entryPrice;
  
  return priceChange * 100;
}

/**
 * Check if total risk threshold is breached and return which positions to exit
 */
export function checkTotalRiskThreshold(
  openPositions: OpenPosition[],
  config: RiskManagerConfig,
  currentBalance: number
): RiskCheckResult {
  if (openPositions.length === 0) {
    return {
      shouldExitAll: false,
      totalUnrealizedLossPercent: 0
    };
  }

  // Calculate total unrealized loss (only counting losing positions)
  let totalUnrealizedLossPercent = 0;
  
  openPositions.forEach(position => {
    if (position.unrealizedPnLPercent < 0) {
      // Weight by position size relative to balance if needed
      // For simplicity, we sum up percentage losses
      totalUnrealizedLossPercent += Math.abs(position.unrealizedPnLPercent);
    }
  });

  const shouldExitAll = totalUnrealizedLossPercent >= config.maxTotalRisk;

  return {
    shouldExitAll,
    totalUnrealizedLossPercent,
    message: shouldExitAll 
      ? `Total risk threshold breached: ${totalUnrealizedLossPercent.toFixed(2)}% >= ${config.maxTotalRisk}%. Auto-exiting all ${openPositions.length} positions.`
      : undefined,
    exitedPositions: shouldExitAll ? [...openPositions] : undefined
  };
}

/**
 * Process a bar of data and manage positions with total risk enforcement
 */
export function processBarWithRiskManagement(
  openPositions: OpenPosition[],
  currentPrices: Record<string, number>,
  config: RiskManagerConfig,
  currentBalance: number,
  currentDate: string
): {
  updatedPositions: OpenPosition[];
  exitEvents: TradeExitEvent[];
  riskBreached: boolean;
} {
  const exitEvents: TradeExitEvent[] = [];
  let updatedPositions = [...openPositions];
  let riskBreached = false;

  // First, update unrealized P&L for all positions
  updatedPositions = updatedPositions.map(pos => {
    const currentPrice = currentPrices[pos.patternName] || pos.currentPrice;
    return {
      ...pos,
      currentPrice,
      unrealizedPnLPercent: calculateUnrealizedPnL({ ...pos, currentPrice }, currentPrice)
    };
  });

  // Check individual stop losses and take profits
  const positionsAfterIndividualExits: OpenPosition[] = [];
  
  for (const position of updatedPositions) {
    const currentPrice = position.currentPrice;
    
    // Check stop loss hit
    if (position.direction === 'long' && currentPrice <= position.stopLoss) {
      exitEvents.push({
        position,
        exitPrice: position.stopLoss,
        exitDate: currentDate,
        exitReason: 'stop_loss',
        realizedPnLPercent: ((position.stopLoss - position.entryPrice) / position.entryPrice) * 100
      });
      continue;
    }
    
    if (position.direction === 'short' && currentPrice >= position.stopLoss) {
      exitEvents.push({
        position,
        exitPrice: position.stopLoss,
        exitDate: currentDate,
        exitReason: 'stop_loss',
        realizedPnLPercent: ((position.entryPrice - position.stopLoss) / position.entryPrice) * 100
      });
      continue;
    }
    
    // Check take profit hit
    if (position.direction === 'long' && currentPrice >= position.takeProfit) {
      exitEvents.push({
        position,
        exitPrice: position.takeProfit,
        exitDate: currentDate,
        exitReason: 'take_profit',
        realizedPnLPercent: ((position.takeProfit - position.entryPrice) / position.entryPrice) * 100
      });
      continue;
    }
    
    if (position.direction === 'short' && currentPrice <= position.takeProfit) {
      exitEvents.push({
        position,
        exitPrice: position.takeProfit,
        exitDate: currentDate,
        exitReason: 'take_profit',
        realizedPnLPercent: ((position.entryPrice - position.takeProfit) / position.entryPrice) * 100
      });
      continue;
    }
    
    positionsAfterIndividualExits.push(position);
  }

  // Now check total risk threshold on remaining positions
  const riskCheck = checkTotalRiskThreshold(positionsAfterIndividualExits, config, currentBalance);

  if (riskCheck.shouldExitAll && riskCheck.exitedPositions) {
    riskBreached = true;
    
    // Exit all remaining positions due to total risk threshold
    for (const position of riskCheck.exitedPositions) {
      exitEvents.push({
        position,
        exitPrice: position.currentPrice,
        exitDate: currentDate,
        exitReason: 'total_risk_threshold',
        realizedPnLPercent: position.unrealizedPnLPercent
      });
    }
    
    // All positions are now closed
    return {
      updatedPositions: [],
      exitEvents,
      riskBreached: true
    };
  }

  return {
    updatedPositions: positionsAfterIndividualExits,
    exitEvents,
    riskBreached: false
  };
}

/**
 * Check if a new trade can be opened based on current risk exposure
 */
export function canOpenNewTrade(
  openPositions: OpenPosition[],
  config: RiskManagerConfig
): { allowed: boolean; reason?: string } {
  // Check max simultaneous trades
  if (openPositions.length >= config.maxSimultaneousTrades) {
    return {
      allowed: false,
      reason: `Maximum simultaneous trades (${config.maxSimultaneousTrades}) reached`
    };
  }

  // Calculate current risk exposure
  let currentRiskExposure = 0;
  openPositions.forEach(pos => {
    if (pos.unrealizedPnLPercent < 0) {
      currentRiskExposure += Math.abs(pos.unrealizedPnLPercent);
    }
  });

  // Allow new trade if adding another trade at max risk won't exceed threshold
  const potentialRiskWithNewTrade = currentRiskExposure + config.riskPerTrade;
  
  if (potentialRiskWithNewTrade > config.maxTotalRisk) {
    return {
      allowed: false,
      reason: `Opening new trade would exceed max total risk (${potentialRiskWithNewTrade.toFixed(1)}% > ${config.maxTotalRisk}%)`
    };
  }

  return { allowed: true };
}
