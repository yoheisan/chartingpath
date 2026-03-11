/**
 * Centralized trading terminology glossary.
 * Keys map to i18n `glossary.<key>` for translated tooltips.
 * English fallbacks are provided inline.
 */
export const TRADING_GLOSSARY: Record<string, string> = {
  winRate: 'The percentage of trades that end in profit. A 60% win rate means 6 out of 10 trades are winners.',
  expectancy: 'Average return per trade in R-multiples. Positive expectancy means the strategy is profitable over time. Formula: (Win% × Avg Win) − (Loss% × Avg Loss).',
  sharpe: 'Risk-adjusted return metric. Higher is better. Measures excess return per unit of volatility. Above 1.0 is good, above 2.0 is excellent.',
  profitFactor: 'Gross profits divided by gross losses. Above 1.0 means overall profitable. Above 2.0 is considered strong.',
  maxDrawdown: 'The largest peak-to-trough decline in portfolio value. Measures worst-case loss scenario during a trading period.',
  riskReward: 'The ratio between potential loss (stop loss distance) and potential gain (take profit distance). A 1:2 R:R means you risk $1 to potentially make $2.',
  sampleSize: 'The number of historical trades used to calculate statistics. Larger samples (50+) give more reliable results.',
  grade: 'Overall signal quality score combining pattern clarity, volume confirmation, and trend alignment. A+ is highest.',
  timeframe: 'The time period each candlestick represents (e.g., 1H = 1 hour, 1D = 1 day). Lower timeframes show more detail but more noise.',
  support: 'A price level where buying pressure historically prevents further decline. Acts as a "floor" for price.',
  resistance: 'A price level where selling pressure historically prevents further advance. Acts as a "ceiling" for price.',
  takeProfit: 'The target price where a winning trade is closed to lock in gains.',
  stopLoss: 'The price level where a losing trade is automatically closed to limit losses.',
  paperTrading: 'Simulated trading with virtual money to practice strategies without financial risk.',
  signalAge: 'How long ago the pattern was first detected. Fresher signals (< 24h) tend to be more actionable.',
  barsToOutcome: 'The average number of candlesticks (bars) from entry signal to the trade reaching its target or stop loss.',
  cagr: 'Compound Annual Growth Rate — the smoothed annual return of an investment over a given period.',
  sortino: 'Similar to Sharpe ratio but only penalizes downside volatility, giving a better picture of risk-adjusted returns.',
  calmar: 'CAGR divided by maximum drawdown. Higher values indicate better return relative to worst-case loss.',
  annualizedReturn: 'The estimated yearly return if the strategy were traded continuously, based on trade frequency and expectancy.',
  patternConfidence: 'How closely the detected pattern matches the ideal textbook formation. Higher confidence = cleaner pattern.',
  tradesPerYear: 'Estimated number of trading opportunities per year for this pattern/timeframe combination.',
  balance: 'Your current paper trading portfolio value, including initial capital plus all realized gains and losses.',
  totalPnl: 'Total Profit & Loss — the sum of all closed trade results in your paper trading account.',
  rMultiple: 'Return expressed as a multiple of initial risk (R). A +2R trade means you made 2× what you risked.',
};

/** Get glossary text — prefers i18n key, falls back to English inline */
export function getGlossaryText(term: string, t?: (key: string, opts?: any) => string): string {
  if (t) {
    const translated = t(`glossary.${term}`, { defaultValue: '' });
    if (translated && translated !== `glossary.${term}`) return translated;
  }
  return TRADING_GLOSSARY[term] || term;
}
