export interface PerformanceStats {
  cagr: number;
  vol: number;
  sharpe: number;
  sortino: number;
  maxDD: number;
  calmar: number;
  turnover: number;
}

export function calculateMetrics(
  equity: Array<{date: string, value: number}>,
  trades: Array<{date: string, symbol: string, qty: number, price: number, cost: number}>,
  initialCapital: number = 100000
): PerformanceStats {
  if (equity.length < 2) {
    return { cagr: 0, vol: 0, sharpe: 0, sortino: 0, maxDD: 0, calmar: 0, turnover: 0 };
  }

  // Calculate daily returns
  const returns: number[] = [];
  for (let i = 1; i < equity.length; i++) {
    const ret = (equity[i].value - equity[i-1].value) / equity[i-1].value;
    returns.push(ret);
  }

  // CAGR
  const totalDays = (new Date(equity[equity.length - 1].date).getTime() - new Date(equity[0].date).getTime()) / (1000 * 60 * 60 * 24);
  const totalReturn = equity[equity.length - 1].value / equity[0].value;
  const cagr = Math.pow(totalReturn, 365.25 / totalDays) - 1;

  // Volatility (annualized)
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  const vol = Math.sqrt(variance * 252); // Annualize assuming 252 trading days

  // Sharpe ratio (assuming 0 risk-free rate)
  const sharpe = vol > 0 ? (cagr / vol) : 0;

  // Sortino ratio
  const negativeReturns = returns.filter(r => r < 0);
  const downsideVariance = negativeReturns.length > 0 
    ? negativeReturns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / negativeReturns.length
    : 0;
  const downsideVol = Math.sqrt(downsideVariance * 252);
  const sortino = downsideVol > 0 ? (cagr / downsideVol) : 0;

  // Maximum drawdown
  let maxDD = 0;
  let peak = equity[0].value;
  for (const point of equity) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDD) {
      maxDD = drawdown;
    }
  }

  // Calmar ratio
  const calmar = maxDD > 0 ? cagr / maxDD : 0;

  // Turnover
  const totalVolume = trades.reduce((sum, trade) => sum + Math.abs(trade.qty * trade.price), 0);
  const avgCapital = equity.reduce((sum, point) => sum + point.value, 0) / equity.length;
  const turnover = avgCapital > 0 ? totalVolume / avgCapital : 0;

  return {
    cagr: Math.round(cagr * 10000) / 100, // Convert to percentage with 2 decimals
    vol: Math.round(vol * 10000) / 100,
    sharpe: Math.round(sharpe * 100) / 100,
    sortino: Math.round(sortino * 100) / 100,
    maxDD: Math.round(maxDD * 10000) / 100,
    calmar: Math.round(calmar * 100) / 100,
    turnover: Math.round(turnover * 100) / 100
  };
}

export function calculateDailyReturns(equity: Array<{date: string, value: number}>): Array<{date: string, value: number}> {
  const returns: Array<{date: string, value: number}> = [];
  
  for (let i = 1; i < equity.length; i++) {
    const ret = (equity[i].value - equity[i-1].value) / equity[i-1].value;
    returns.push({
      date: equity[i].date,
      value: Math.round(ret * 10000) / 100 // Convert to percentage
    });
  }
  
  return returns;
}