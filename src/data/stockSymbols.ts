/**
 * Comprehensive Stock Symbol Database
 * Data is static and stored client-side (no backend storage needed)
 * Yahoo Finance provides free data for all these symbols
 */

export interface StockSymbol {
  symbol: string;
  name: string;
  exchange: 'NYSE' | 'NASDAQ' | 'AMEX';
  index?: 'SP500' | 'NASDAQ100' | 'DJIA' | 'RUSSELL2000';
  sector?: string;
}

// Popular symbols shown by default
export const POPULAR_STOCKS: StockSymbol[] = [
  // Tech Giants
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Consumer' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  
  // Financial
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  
  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  
  // Consumer
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', index: 'SP500', sector: 'Entertainment' },
  
  // Energy & Industrial
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
];

// S&P 500 stocks (comprehensive list)
export const SP500_STOCKS: StockSymbol[] = [
  // Technology
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Consumer' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'ORCL', name: 'Oracle Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'IBM', name: 'IBM Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'TXN', name: 'Texas Instruments Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Technology' },
  { symbol: 'INTU', name: 'Intuit Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Technology' },
  
  // Financial Services
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'BAC', name: 'Bank of America Corp.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'BLK', name: 'BlackRock Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'C', name: 'Citigroup Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'AXP', name: 'American Express Company', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc. Class B', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Financial' },
  { symbol: 'SCHW', name: 'Charles Schwab Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Financial' },
  
  // Healthcare
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'BMY', name: 'Bristol-Myers Squibb Company', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'GILD', name: 'Gilead Sciences Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Healthcare' },
  { symbol: 'CVS', name: 'CVS Health Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Healthcare' },
  
  // Consumer Discretionary
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', index: 'SP500', sector: 'Entertainment' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Consumer' },
  { symbol: 'TGT', name: 'Target Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'LOW', name: 'Lowe\'s Companies Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Consumer' },
  
  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger NV', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Energy' },
  
  // Industrials
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  { symbol: 'HON', name: 'Honeywell International Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Industrial' },
  { symbol: 'UPS', name: 'United Parcel Service Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  { symbol: 'GE', name: 'General Electric Company', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  { symbol: 'MMM', name: '3M Company', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  { symbol: 'LMT', name: 'Lockheed Martin Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Industrial' },
  
  // Communication Services
  { symbol: 'T', name: 'AT&T Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Communication' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Communication' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', exchange: 'NASDAQ', index: 'SP500', sector: 'Communication' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Entertainment' },
  
  // Consumer Staples
  { symbol: 'PG', name: 'Procter & Gamble Company', exchange: 'NYSE', index: 'SP500', sector: 'Consumer Staples' },
  { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', index: 'SP500', sector: 'Consumer Staples' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', index: 'SP500', sector: 'Consumer Staples' },
  { symbol: 'PM', name: 'Philip Morris International Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer Staples' },
  { symbol: 'MO', name: 'Altria Group Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Consumer Staples' },
  
  // Real Estate
  { symbol: 'AMT', name: 'American Tower Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Real Estate' },
  { symbol: 'CCI', name: 'Crown Castle Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Real Estate' },
  
  // Utilities
  { symbol: 'NEE', name: 'NextEra Energy Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corporation', exchange: 'NYSE', index: 'SP500', sector: 'Utilities' },
  { symbol: 'SO', name: 'Southern Company', exchange: 'NYSE', index: 'SP500', sector: 'Utilities' },
  
  // Materials
  { symbol: 'LIN', name: 'Linde plc', exchange: 'NYSE', index: 'SP500', sector: 'Materials' },
  { symbol: 'APD', name: 'Air Products and Chemicals Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Materials' },
  { symbol: 'DD', name: 'DuPont de Nemours Inc.', exchange: 'NYSE', index: 'SP500', sector: 'Materials' },
];

// NASDAQ 100 stocks
export const NASDAQ100_STOCKS: StockSymbol[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Consumer' },
  { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Automotive' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'QCOM', name: 'Qualcomm Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Technology' },
  { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Entertainment' },
  { symbol: 'PYPL', name: 'PayPal Holdings Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Financial' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Consumer' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Communication' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ', index: 'NASDAQ100', sector: 'Consumer Staples' },
];

// Dow Jones Industrial Average (30 stocks)
export const DJIA_STOCKS: StockSymbol[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', index: 'DJIA', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', index: 'DJIA', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE', index: 'DJIA', sector: 'Financial' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE', index: 'DJIA', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Financial' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Healthcare' },
  { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer' },
  { symbol: 'HD', name: 'Home Depot Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Company', exchange: 'NYSE', index: 'DJIA', sector: 'Entertainment' },
  { symbol: 'BA', name: 'Boeing Company', exchange: 'NYSE', index: 'DJIA', sector: 'Industrial' },
  { symbol: 'GS', name: 'Goldman Sachs Group Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Financial' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Industrial' },
  { symbol: 'AXP', name: 'American Express Company', exchange: 'NYSE', index: 'DJIA', sector: 'Financial' },
  { symbol: 'IBM', name: 'IBM Corporation', exchange: 'NYSE', index: 'DJIA', sector: 'Technology' },
  { symbol: 'NKE', name: 'Nike Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer' },
  { symbol: 'HON', name: 'Honeywell International Inc.', exchange: 'NASDAQ', index: 'DJIA', sector: 'Industrial' },
  { symbol: 'AMGN', name: 'Amgen Inc.', exchange: 'NASDAQ', index: 'DJIA', sector: 'Healthcare' },
  { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE', index: 'DJIA', sector: 'Energy' },
  { symbol: 'PG', name: 'Procter & Gamble Company', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer Staples' },
  { symbol: 'KO', name: 'Coca-Cola Company', exchange: 'NYSE', index: 'DJIA', sector: 'Consumer Staples' },
  { symbol: 'MRK', name: 'Merck & Co. Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Healthcare' },
  { symbol: 'CSCO', name: 'Cisco Systems Inc.', exchange: 'NASDAQ', index: 'DJIA', sector: 'Technology' },
  { symbol: 'VZ', name: 'Verizon Communications Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Communication' },
  { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Technology' },
  { symbol: 'TRV', name: 'Travelers Companies Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Financial' },
  { symbol: 'MMM', name: '3M Company', exchange: 'NYSE', index: 'DJIA', sector: 'Industrial' },
  { symbol: 'WBA', name: 'Walgreens Boots Alliance Inc.', exchange: 'NASDAQ', index: 'DJIA', sector: 'Healthcare' },
  { symbol: 'DOW', name: 'Dow Inc.', exchange: 'NYSE', index: 'DJIA', sector: 'Materials' },
  { symbol: 'INTC', name: 'Intel Corporation', exchange: 'NASDAQ', index: 'DJIA', sector: 'Technology' },
];

// Russell 2000 top stocks (small cap)
export const RUSSELL2000_STOCKS: StockSymbol[] = [
  { symbol: 'FLEX', name: 'Flex Ltd.', exchange: 'NASDAQ', index: 'RUSSELL2000', sector: 'Technology' },
  { symbol: 'SITM', name: 'SiTime Corporation', exchange: 'NASDAQ', index: 'RUSSELL2000', sector: 'Technology' },
  { symbol: 'ONTO', name: 'Onto Innovation Inc.', exchange: 'NYSE', index: 'RUSSELL2000', sector: 'Technology' },
  { symbol: 'CVLT', name: 'Commvault Systems Inc.', exchange: 'NASDAQ', index: 'RUSSELL2000', sector: 'Technology' },
  { symbol: 'AGCO', name: 'AGCO Corporation', exchange: 'NYSE', index: 'RUSSELL2000', sector: 'Industrial' },
  { symbol: 'FN', name: 'Fabrinet', exchange: 'NYSE', index: 'RUSSELL2000', sector: 'Technology' },
  { symbol: 'MATX', name: 'Matson Inc.', exchange: 'NYSE', index: 'RUSSELL2000', sector: 'Industrial' },
  { symbol: 'PTEN', name: 'Patterson-UTI Energy Inc.', exchange: 'NASDAQ', index: 'RUSSELL2000', sector: 'Energy' },
  { symbol: 'HRI', name: 'Herc Holdings Inc.', exchange: 'NYSE', index: 'RUSSELL2000', sector: 'Industrial' },
  { symbol: 'NOVT', name: 'Novanta Inc.', exchange: 'NASDAQ', index: 'RUSSELL2000', sector: 'Technology' },
];

// Additional popular NYSE stocks
export const NYSE_POPULAR: StockSymbol[] = [
  { symbol: 'F', name: 'Ford Motor Company', exchange: 'NYSE', sector: 'Automotive' },
  { symbol: 'GM', name: 'General Motors Company', exchange: 'NYSE', sector: 'Automotive' },
  { symbol: 'DAL', name: 'Delta Air Lines Inc.', exchange: 'NYSE', sector: 'Travel' },
  { symbol: 'UAL', name: 'United Airlines Holdings Inc.', exchange: 'NASDAQ', sector: 'Travel' },
  { symbol: 'AAL', name: 'American Airlines Group Inc.', exchange: 'NASDAQ', sector: 'Travel' },
  { symbol: 'CCL', name: 'Carnival Corporation', exchange: 'NYSE', sector: 'Travel' },
  { symbol: 'MAR', name: 'Marriott International Inc.', exchange: 'NASDAQ', sector: 'Hospitality' },
  { symbol: 'SQ', name: 'Block Inc.', exchange: 'NYSE', sector: 'Financial' },
  { symbol: 'SNAP', name: 'Snap Inc.', exchange: 'NYSE', sector: 'Technology' },
  { symbol: 'UBER', name: 'Uber Technologies Inc.', exchange: 'NYSE', sector: 'Technology' },
  { symbol: 'LYFT', name: 'Lyft Inc.', exchange: 'NASDAQ', sector: 'Technology' },
  { symbol: 'SPOT', name: 'Spotify Technology SA', exchange: 'NYSE', sector: 'Entertainment' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ', sector: 'Hospitality' },
  { symbol: 'COIN', name: 'Coinbase Global Inc.', exchange: 'NASDAQ', sector: 'Financial' },
  { symbol: 'RBLX', name: 'Roblox Corporation', exchange: 'NYSE', sector: 'Entertainment' },
];

// Combine all stocks into searchable database
export const ALL_STOCKS: StockSymbol[] = [
  ...SP500_STOCKS,
  ...NASDAQ100_STOCKS,
  ...DJIA_STOCKS,
  ...RUSSELL2000_STOCKS,
  ...NYSE_POPULAR,
].reduce((unique, stock) => {
  // Remove duplicates based on symbol
  if (!unique.find(s => s.symbol === stock.symbol)) {
    unique.push(stock);
  }
  return unique;
}, [] as StockSymbol[]);

/**
 * Search stocks by symbol or name
 */
export function searchStocks(query: string, limit: number = 50): StockSymbol[] {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) {
    return POPULAR_STOCKS;
  }
  
  return ALL_STOCKS
    .filter(stock => 
      stock.symbol.toLowerCase().includes(searchTerm) ||
      stock.name.toLowerCase().includes(searchTerm)
    )
    .slice(0, limit);
}

/**
 * Get stocks by index
 */
export function getStocksByIndex(index: 'SP500' | 'NASDAQ100' | 'DJIA' | 'RUSSELL2000'): StockSymbol[] {
  return ALL_STOCKS.filter(stock => stock.index === index);
}

/**
 * Get stocks by sector
 */
export function getStocksBySector(sector: string): StockSymbol[] {
  return ALL_STOCKS.filter(stock => stock.sector === sector);
}
