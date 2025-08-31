export interface FXRolloverParams {
  enabled: boolean;
  rateDiff: number; // Interest rate differential (annual)
  rolloverTime: string; // "17:00" for 5 PM EST
}

export function calculateRollover(
  position: number,
  price: number,
  rateDiff: number,
  days: number = 1
): number {
  // Rollover = Position * Price * Rate_Diff * (Days / 365)
  return position * price * rateDiff * (days / 365);
}

export function shouldApplyRollover(
  currentTime: string,
  rolloverTime: string,
  lastRolloverDate?: string
): boolean {
  const currentDate = currentTime.split('T')[0];
  
  // Don't apply if we already applied rollover today
  if (lastRolloverDate === currentDate) {
    return false;
  }

  // Check if current time is past rollover time
  const currentHour = new Date(currentTime).getHours();
  const rolloverHour = parseInt(rolloverTime.split(':')[0]);
  
  return currentHour >= rolloverHour;
}

export interface FXPair {
  base: string;
  quote: string;
  pipValue: number;
  spread: number; // in pips
}

export const MAJOR_PAIRS: Record<string, FXPair> = {
  'EURUSD': { base: 'EUR', quote: 'USD', pipValue: 10, spread: 1.2 },
  'GBPUSD': { base: 'GBP', quote: 'USD', pipValue: 10, spread: 1.5 },
  'USDJPY': { base: 'USD', quote: 'JPY', pipValue: 1000, spread: 1.0 },
  'USDCHF': { base: 'USD', quote: 'CHF', pipValue: 10, spread: 1.8 },
  'AUDUSD': { base: 'AUD', quote: 'USD', pipValue: 10, spread: 1.8 },
  'USDCAD': { base: 'USD', quote: 'CAD', pipValue: 10, spread: 2.0 },
  'NZDUSD': { base: 'NZD', quote: 'USD', pipValue: 10, spread: 2.5 }
};

export function calculateSpreadCost(
  symbol: string,
  quantity: number,
  price: number
): number {
  const pair = MAJOR_PAIRS[symbol];
  if (!pair) return 0;
  
  const spreadCost = (pair.spread / 10000) * price * Math.abs(quantity);
  return spreadCost;
}

export function convertPipsToPrice(pips: number, symbol: string): number {
  const pair = MAJOR_PAIRS[symbol];
  if (!pair) return 0;
  
  // For JPY pairs, 1 pip = 0.01, others 1 pip = 0.0001
  const pipSize = symbol.includes('JPY') ? 0.01 : 0.0001;
  return pips * pipSize;
}