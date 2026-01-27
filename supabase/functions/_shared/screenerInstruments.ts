// =============================================================================
// COMPREHENSIVE YAHOO FINANCE INSTRUMENT UNIVERSE
// Used by cache-popular-instruments and scan-live-patterns
// =============================================================================

export interface Instrument {
  symbol: string;
  yahooSymbol: string;
  name?: string;
}

// =============================================================================
// FOREX - 50 Major, Minor & Cross Pairs
// =============================================================================
export const FX_INSTRUMENTS: Instrument[] = [
  // Majors
  { symbol: 'EUR/USD', yahooSymbol: 'EURUSD=X', name: 'Euro / US Dollar' },
  { symbol: 'GBP/USD', yahooSymbol: 'GBPUSD=X', name: 'British Pound / US Dollar' },
  { symbol: 'USD/JPY', yahooSymbol: 'USDJPY=X', name: 'US Dollar / Japanese Yen' },
  { symbol: 'USD/CHF', yahooSymbol: 'USDCHF=X', name: 'US Dollar / Swiss Franc' },
  { symbol: 'AUD/USD', yahooSymbol: 'AUDUSD=X', name: 'Australian Dollar / US Dollar' },
  { symbol: 'USD/CAD', yahooSymbol: 'USDCAD=X', name: 'US Dollar / Canadian Dollar' },
  { symbol: 'NZD/USD', yahooSymbol: 'NZDUSD=X', name: 'New Zealand Dollar / US Dollar' },
  
  // Euro Crosses
  { symbol: 'EUR/GBP', yahooSymbol: 'EURGBP=X', name: 'Euro / British Pound' },
  { symbol: 'EUR/JPY', yahooSymbol: 'EURJPY=X', name: 'Euro / Japanese Yen' },
  { symbol: 'EUR/CHF', yahooSymbol: 'EURCHF=X', name: 'Euro / Swiss Franc' },
  { symbol: 'EUR/AUD', yahooSymbol: 'EURAUD=X', name: 'Euro / Australian Dollar' },
  { symbol: 'EUR/CAD', yahooSymbol: 'EURCAD=X', name: 'Euro / Canadian Dollar' },
  { symbol: 'EUR/NZD', yahooSymbol: 'EURNZD=X', name: 'Euro / New Zealand Dollar' },
  
  // GBP Crosses
  { symbol: 'GBP/JPY', yahooSymbol: 'GBPJPY=X', name: 'British Pound / Japanese Yen' },
  { symbol: 'GBP/CHF', yahooSymbol: 'GBPCHF=X', name: 'British Pound / Swiss Franc' },
  { symbol: 'GBP/AUD', yahooSymbol: 'GBPAUD=X', name: 'British Pound / Australian Dollar' },
  { symbol: 'GBP/CAD', yahooSymbol: 'GBPCAD=X', name: 'British Pound / Canadian Dollar' },
  { symbol: 'GBP/NZD', yahooSymbol: 'GBPNZD=X', name: 'British Pound / New Zealand Dollar' },
  
  // JPY Crosses
  { symbol: 'AUD/JPY', yahooSymbol: 'AUDJPY=X', name: 'Australian Dollar / Japanese Yen' },
  { symbol: 'CAD/JPY', yahooSymbol: 'CADJPY=X', name: 'Canadian Dollar / Japanese Yen' },
  { symbol: 'CHF/JPY', yahooSymbol: 'CHFJPY=X', name: 'Swiss Franc / Japanese Yen' },
  { symbol: 'NZD/JPY', yahooSymbol: 'NZDJPY=X', name: 'New Zealand Dollar / Japanese Yen' },
  
  // AUD/NZD Crosses
  { symbol: 'AUD/CAD', yahooSymbol: 'AUDCAD=X', name: 'Australian Dollar / Canadian Dollar' },
  { symbol: 'AUD/CHF', yahooSymbol: 'AUDCHF=X', name: 'Australian Dollar / Swiss Franc' },
  { symbol: 'AUD/NZD', yahooSymbol: 'AUDNZD=X', name: 'Australian Dollar / New Zealand Dollar' },
  { symbol: 'NZD/CAD', yahooSymbol: 'NZDCAD=X', name: 'New Zealand Dollar / Canadian Dollar' },
  { symbol: 'NZD/CHF', yahooSymbol: 'NZDCHF=X', name: 'New Zealand Dollar / Swiss Franc' },
  
  // CAD/CHF Crosses
  { symbol: 'CAD/CHF', yahooSymbol: 'CADCHF=X', name: 'Canadian Dollar / Swiss Franc' },
  
  // Exotic Pairs
  { symbol: 'USD/SGD', yahooSymbol: 'USDSGD=X', name: 'US Dollar / Singapore Dollar' },
  { symbol: 'USD/HKD', yahooSymbol: 'USDHKD=X', name: 'US Dollar / Hong Kong Dollar' },
  { symbol: 'USD/SEK', yahooSymbol: 'USDSEK=X', name: 'US Dollar / Swedish Krona' },
  { symbol: 'USD/NOK', yahooSymbol: 'USDNOK=X', name: 'US Dollar / Norwegian Krone' },
  { symbol: 'USD/DKK', yahooSymbol: 'USDDKK=X', name: 'US Dollar / Danish Krone' },
  { symbol: 'USD/ZAR', yahooSymbol: 'USDZAR=X', name: 'US Dollar / South African Rand' },
  { symbol: 'USD/MXN', yahooSymbol: 'USDMXN=X', name: 'US Dollar / Mexican Peso' },
  { symbol: 'USD/TRY', yahooSymbol: 'USDTRY=X', name: 'US Dollar / Turkish Lira' },
  { symbol: 'USD/PLN', yahooSymbol: 'USDPLN=X', name: 'US Dollar / Polish Zloty' },
  { symbol: 'USD/CNH', yahooSymbol: 'USDCNH=X', name: 'US Dollar / Chinese Yuan Offshore' },
  { symbol: 'USD/INR', yahooSymbol: 'USDINR=X', name: 'US Dollar / Indian Rupee' },
  { symbol: 'USD/THB', yahooSymbol: 'USDTHB=X', name: 'US Dollar / Thai Baht' },
  { symbol: 'EUR/SEK', yahooSymbol: 'EURSEK=X', name: 'Euro / Swedish Krona' },
  { symbol: 'EUR/NOK', yahooSymbol: 'EURNOK=X', name: 'Euro / Norwegian Krone' },
  { symbol: 'EUR/PLN', yahooSymbol: 'EURPLN=X', name: 'Euro / Polish Zloty' },
  { symbol: 'EUR/TRY', yahooSymbol: 'EURTRY=X', name: 'Euro / Turkish Lira' },
  { symbol: 'GBP/ZAR', yahooSymbol: 'GBPZAR=X', name: 'British Pound / South African Rand' },
  { symbol: 'AUD/SGD', yahooSymbol: 'AUDSGD=X', name: 'Australian Dollar / Singapore Dollar' },
];

// =============================================================================
// CRYPTO - Top 50 by Market Cap
// =============================================================================
export const CRYPTO_INSTRUMENTS: Instrument[] = [
  { symbol: 'BTC/USD', yahooSymbol: 'BTC-USD', name: 'Bitcoin' },
  { symbol: 'ETH/USD', yahooSymbol: 'ETH-USD', name: 'Ethereum' },
  { symbol: 'BNB/USD', yahooSymbol: 'BNB-USD', name: 'BNB' },
  { symbol: 'XRP/USD', yahooSymbol: 'XRP-USD', name: 'XRP' },
  { symbol: 'SOL/USD', yahooSymbol: 'SOL-USD', name: 'Solana' },
  { symbol: 'ADA/USD', yahooSymbol: 'ADA-USD', name: 'Cardano' },
  { symbol: 'DOGE/USD', yahooSymbol: 'DOGE-USD', name: 'Dogecoin' },
  { symbol: 'TRX/USD', yahooSymbol: 'TRX-USD', name: 'TRON' },
  { symbol: 'AVAX/USD', yahooSymbol: 'AVAX-USD', name: 'Avalanche' },
  { symbol: 'LINK/USD', yahooSymbol: 'LINK-USD', name: 'Chainlink' },
  { symbol: 'DOT/USD', yahooSymbol: 'DOT-USD', name: 'Polkadot' },
  { symbol: 'MATIC/USD', yahooSymbol: 'MATIC-USD', name: 'Polygon' },
  { symbol: 'SHIB/USD', yahooSymbol: 'SHIB-USD', name: 'Shiba Inu' },
  { symbol: 'LTC/USD', yahooSymbol: 'LTC-USD', name: 'Litecoin' },
  { symbol: 'BCH/USD', yahooSymbol: 'BCH-USD', name: 'Bitcoin Cash' },
  { symbol: 'UNI/USD', yahooSymbol: 'UNI-USD', name: 'Uniswap' },
  { symbol: 'XLM/USD', yahooSymbol: 'XLM-USD', name: 'Stellar' },
  { symbol: 'ATOM/USD', yahooSymbol: 'ATOM-USD', name: 'Cosmos' },
  { symbol: 'XMR/USD', yahooSymbol: 'XMR-USD', name: 'Monero' },
  { symbol: 'ETC/USD', yahooSymbol: 'ETC-USD', name: 'Ethereum Classic' },
  { symbol: 'FIL/USD', yahooSymbol: 'FIL-USD', name: 'Filecoin' },
  { symbol: 'NEAR/USD', yahooSymbol: 'NEAR-USD', name: 'NEAR Protocol' },
  { symbol: 'APT/USD', yahooSymbol: 'APT-USD', name: 'Aptos' },
  { symbol: 'ARB/USD', yahooSymbol: 'ARB-USD', name: 'Arbitrum' },
  { symbol: 'OP/USD', yahooSymbol: 'OP-USD', name: 'Optimism' },
  { symbol: 'INJ/USD', yahooSymbol: 'INJ-USD', name: 'Injective' },
  { symbol: 'AAVE/USD', yahooSymbol: 'AAVE-USD', name: 'Aave' },
  { symbol: 'MKR/USD', yahooSymbol: 'MKR-USD', name: 'Maker' },
  { symbol: 'ALGO/USD', yahooSymbol: 'ALGO-USD', name: 'Algorand' },
  { symbol: 'VET/USD', yahooSymbol: 'VET-USD', name: 'VeChain' },
  { symbol: 'SAND/USD', yahooSymbol: 'SAND-USD', name: 'The Sandbox' },
  { symbol: 'MANA/USD', yahooSymbol: 'MANA-USD', name: 'Decentraland' },
  { symbol: 'AXS/USD', yahooSymbol: 'AXS-USD', name: 'Axie Infinity' },
  { symbol: 'FTM/USD', yahooSymbol: 'FTM-USD', name: 'Fantom' },
  { symbol: 'THETA/USD', yahooSymbol: 'THETA-USD', name: 'Theta Network' },
  { symbol: 'EGLD/USD', yahooSymbol: 'EGLD-USD', name: 'MultiversX' },
  { symbol: 'FLOW/USD', yahooSymbol: 'FLOW-USD', name: 'Flow' },
  { symbol: 'XTZ/USD', yahooSymbol: 'XTZ-USD', name: 'Tezos' },
  { symbol: 'EOS/USD', yahooSymbol: 'EOS-USD', name: 'EOS' },
  { symbol: 'CHZ/USD', yahooSymbol: 'CHZ-USD', name: 'Chiliz' },
  { symbol: 'CRV/USD', yahooSymbol: 'CRV-USD', name: 'Curve DAO' },
  { symbol: 'LDO/USD', yahooSymbol: 'LDO-USD', name: 'Lido DAO' },
  { symbol: 'RUNE/USD', yahooSymbol: 'RUNE-USD', name: 'THORChain' },
  { symbol: 'SNX/USD', yahooSymbol: 'SNX-USD', name: 'Synthetix' },
  { symbol: 'COMP/USD', yahooSymbol: 'COMP-USD', name: 'Compound' },
  { symbol: 'ZEC/USD', yahooSymbol: 'ZEC-USD', name: 'Zcash' },
  { symbol: 'DASH/USD', yahooSymbol: 'DASH-USD', name: 'Dash' },
  { symbol: 'NEO/USD', yahooSymbol: 'NEO-USD', name: 'Neo' },
  { symbol: 'WAVES/USD', yahooSymbol: 'WAVES-USD', name: 'Waves' },
  { symbol: 'ZIL/USD', yahooSymbol: 'ZIL-USD', name: 'Zilliqa' },
];

// =============================================================================
// STOCKS - S&P 500 Top 150 + Tech Giants + Popular Retail
// =============================================================================
export const STOCK_INSTRUMENTS: Instrument[] = [
  // Mega Cap Tech
  { symbol: 'AAPL', yahooSymbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', yahooSymbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', yahooSymbol: 'GOOGL', name: 'Alphabet Inc. Class A' },
  { symbol: 'GOOG', yahooSymbol: 'GOOG', name: 'Alphabet Inc. Class C' },
  { symbol: 'AMZN', yahooSymbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', yahooSymbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', yahooSymbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', yahooSymbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'TSM', yahooSymbol: 'TSM', name: 'Taiwan Semiconductor' },
  { symbol: 'AVGO', yahooSymbol: 'AVGO', name: 'Broadcom Inc.' },
  
  // Semiconductors
  { symbol: 'AMD', yahooSymbol: 'AMD', name: 'Advanced Micro Devices' },
  { symbol: 'INTC', yahooSymbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'QCOM', yahooSymbol: 'QCOM', name: 'Qualcomm Inc.' },
  { symbol: 'TXN', yahooSymbol: 'TXN', name: 'Texas Instruments' },
  { symbol: 'MU', yahooSymbol: 'MU', name: 'Micron Technology' },
  { symbol: 'ASML', yahooSymbol: 'ASML', name: 'ASML Holding' },
  { symbol: 'LRCX', yahooSymbol: 'LRCX', name: 'Lam Research' },
  { symbol: 'AMAT', yahooSymbol: 'AMAT', name: 'Applied Materials' },
  { symbol: 'KLAC', yahooSymbol: 'KLAC', name: 'KLA Corporation' },
  { symbol: 'MRVL', yahooSymbol: 'MRVL', name: 'Marvell Technology' },
  
  // Software & Cloud
  { symbol: 'CRM', yahooSymbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'ORCL', yahooSymbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'ADBE', yahooSymbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'NOW', yahooSymbol: 'NOW', name: 'ServiceNow Inc.' },
  { symbol: 'INTU', yahooSymbol: 'INTU', name: 'Intuit Inc.' },
  { symbol: 'SNOW', yahooSymbol: 'SNOW', name: 'Snowflake Inc.' },
  { symbol: 'PANW', yahooSymbol: 'PANW', name: 'Palo Alto Networks' },
  { symbol: 'CRWD', yahooSymbol: 'CRWD', name: 'CrowdStrike Holdings' },
  { symbol: 'DDOG', yahooSymbol: 'DDOG', name: 'Datadog Inc.' },
  { symbol: 'ZS', yahooSymbol: 'ZS', name: 'Zscaler Inc.' },
  
  // Internet & E-Commerce
  { symbol: 'NFLX', yahooSymbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'BKNG', yahooSymbol: 'BKNG', name: 'Booking Holdings' },
  { symbol: 'ABNB', yahooSymbol: 'ABNB', name: 'Airbnb Inc.' },
  { symbol: 'UBER', yahooSymbol: 'UBER', name: 'Uber Technologies' },
  { symbol: 'LYFT', yahooSymbol: 'LYFT', name: 'Lyft Inc.' },
  { symbol: 'SHOP', yahooSymbol: 'SHOP', name: 'Shopify Inc.' },
  { symbol: 'SQ', yahooSymbol: 'SQ', name: 'Block Inc.' },
  { symbol: 'PYPL', yahooSymbol: 'PYPL', name: 'PayPal Holdings' },
  { symbol: 'COIN', yahooSymbol: 'COIN', name: 'Coinbase Global' },
  { symbol: 'ROKU', yahooSymbol: 'ROKU', name: 'Roku Inc.' },
  
  // Financials - Banks
  { symbol: 'JPM', yahooSymbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'BAC', yahooSymbol: 'BAC', name: 'Bank of America' },
  { symbol: 'WFC', yahooSymbol: 'WFC', name: 'Wells Fargo & Company' },
  { symbol: 'C', yahooSymbol: 'C', name: 'Citigroup Inc.' },
  { symbol: 'GS', yahooSymbol: 'GS', name: 'Goldman Sachs Group' },
  { symbol: 'MS', yahooSymbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'SCHW', yahooSymbol: 'SCHW', name: 'Charles Schwab' },
  { symbol: 'USB', yahooSymbol: 'USB', name: 'U.S. Bancorp' },
  { symbol: 'PNC', yahooSymbol: 'PNC', name: 'PNC Financial Services' },
  { symbol: 'TFC', yahooSymbol: 'TFC', name: 'Truist Financial' },
  
  // Financials - Other
  { symbol: 'V', yahooSymbol: 'V', name: 'Visa Inc.' },
  { symbol: 'MA', yahooSymbol: 'MA', name: 'Mastercard Inc.' },
  { symbol: 'AXP', yahooSymbol: 'AXP', name: 'American Express' },
  { symbol: 'BLK', yahooSymbol: 'BLK', name: 'BlackRock Inc.' },
  { symbol: 'SPGI', yahooSymbol: 'SPGI', name: 'S&P Global Inc.' },
  { symbol: 'CME', yahooSymbol: 'CME', name: 'CME Group Inc.' },
  { symbol: 'ICE', yahooSymbol: 'ICE', name: 'Intercontinental Exchange' },
  { symbol: 'MCO', yahooSymbol: 'MCO', name: 'Moody\'s Corporation' },
  { symbol: 'CB', yahooSymbol: 'CB', name: 'Chubb Limited' },
  { symbol: 'MMC', yahooSymbol: 'MMC', name: 'Marsh McLennan' },
  
  // Healthcare - Pharma
  { symbol: 'JNJ', yahooSymbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'UNH', yahooSymbol: 'UNH', name: 'UnitedHealth Group' },
  { symbol: 'LLY', yahooSymbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'PFE', yahooSymbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'ABBV', yahooSymbol: 'ABBV', name: 'AbbVie Inc.' },
  { symbol: 'MRK', yahooSymbol: 'MRK', name: 'Merck & Co.' },
  { symbol: 'TMO', yahooSymbol: 'TMO', name: 'Thermo Fisher Scientific' },
  { symbol: 'ABT', yahooSymbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'DHR', yahooSymbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'BMY', yahooSymbol: 'BMY', name: 'Bristol-Myers Squibb' },
  { symbol: 'AMGN', yahooSymbol: 'AMGN', name: 'Amgen Inc.' },
  { symbol: 'GILD', yahooSymbol: 'GILD', name: 'Gilead Sciences' },
  { symbol: 'REGN', yahooSymbol: 'REGN', name: 'Regeneron Pharmaceuticals' },
  { symbol: 'VRTX', yahooSymbol: 'VRTX', name: 'Vertex Pharmaceuticals' },
  { symbol: 'MRNA', yahooSymbol: 'MRNA', name: 'Moderna Inc.' },
  
  // Consumer - Retail
  { symbol: 'WMT', yahooSymbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'COST', yahooSymbol: 'COST', name: 'Costco Wholesale' },
  { symbol: 'HD', yahooSymbol: 'HD', name: 'The Home Depot' },
  { symbol: 'LOW', yahooSymbol: 'LOW', name: 'Lowe\'s Companies' },
  { symbol: 'TGT', yahooSymbol: 'TGT', name: 'Target Corporation' },
  { symbol: 'TJX', yahooSymbol: 'TJX', name: 'TJX Companies' },
  { symbol: 'ROST', yahooSymbol: 'ROST', name: 'Ross Stores' },
  { symbol: 'DG', yahooSymbol: 'DG', name: 'Dollar General' },
  { symbol: 'DLTR', yahooSymbol: 'DLTR', name: 'Dollar Tree' },
  { symbol: 'BBY', yahooSymbol: 'BBY', name: 'Best Buy Co.' },
  
  // Consumer - Staples
  { symbol: 'PG', yahooSymbol: 'PG', name: 'Procter & Gamble' },
  { symbol: 'KO', yahooSymbol: 'KO', name: 'Coca-Cola Company' },
  { symbol: 'PEP', yahooSymbol: 'PEP', name: 'PepsiCo Inc.' },
  { symbol: 'PM', yahooSymbol: 'PM', name: 'Philip Morris International' },
  { symbol: 'MO', yahooSymbol: 'MO', name: 'Altria Group' },
  { symbol: 'MDLZ', yahooSymbol: 'MDLZ', name: 'Mondelez International' },
  { symbol: 'CL', yahooSymbol: 'CL', name: 'Colgate-Palmolive' },
  { symbol: 'KMB', yahooSymbol: 'KMB', name: 'Kimberly-Clark' },
  { symbol: 'GIS', yahooSymbol: 'GIS', name: 'General Mills' },
  { symbol: 'K', yahooSymbol: 'K', name: 'Kellanova' },
  
  // Consumer - Discretionary
  { symbol: 'MCD', yahooSymbol: 'MCD', name: 'McDonald\'s Corporation' },
  { symbol: 'SBUX', yahooSymbol: 'SBUX', name: 'Starbucks Corporation' },
  { symbol: 'NKE', yahooSymbol: 'NKE', name: 'Nike Inc.' },
  { symbol: 'DIS', yahooSymbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'CMCSA', yahooSymbol: 'CMCSA', name: 'Comcast Corporation' },
  { symbol: 'CHTR', yahooSymbol: 'CHTR', name: 'Charter Communications' },
  { symbol: 'LVS', yahooSymbol: 'LVS', name: 'Las Vegas Sands' },
  { symbol: 'MGM', yahooSymbol: 'MGM', name: 'MGM Resorts' },
  { symbol: 'MAR', yahooSymbol: 'MAR', name: 'Marriott International' },
  { symbol: 'HLT', yahooSymbol: 'HLT', name: 'Hilton Worldwide' },
  
  // Industrials
  { symbol: 'CAT', yahooSymbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'DE', yahooSymbol: 'DE', name: 'Deere & Company' },
  { symbol: 'HON', yahooSymbol: 'HON', name: 'Honeywell International' },
  { symbol: 'UPS', yahooSymbol: 'UPS', name: 'United Parcel Service' },
  { symbol: 'UNP', yahooSymbol: 'UNP', name: 'Union Pacific' },
  { symbol: 'RTX', yahooSymbol: 'RTX', name: 'RTX Corporation' },
  { symbol: 'BA', yahooSymbol: 'BA', name: 'Boeing Company' },
  { symbol: 'LMT', yahooSymbol: 'LMT', name: 'Lockheed Martin' },
  { symbol: 'GE', yahooSymbol: 'GE', name: 'GE Aerospace' },
  { symbol: 'MMM', yahooSymbol: 'MMM', name: '3M Company' },
  { symbol: 'GD', yahooSymbol: 'GD', name: 'General Dynamics' },
  { symbol: 'NOC', yahooSymbol: 'NOC', name: 'Northrop Grumman' },
  { symbol: 'CSX', yahooSymbol: 'CSX', name: 'CSX Corporation' },
  { symbol: 'NSC', yahooSymbol: 'NSC', name: 'Norfolk Southern' },
  { symbol: 'FDX', yahooSymbol: 'FDX', name: 'FedEx Corporation' },
  
  // Energy
  { symbol: 'XOM', yahooSymbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'CVX', yahooSymbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'COP', yahooSymbol: 'COP', name: 'ConocoPhillips' },
  { symbol: 'SLB', yahooSymbol: 'SLB', name: 'Schlumberger Limited' },
  { symbol: 'EOG', yahooSymbol: 'EOG', name: 'EOG Resources' },
  { symbol: 'PXD', yahooSymbol: 'PXD', name: 'Pioneer Natural Resources' },
  { symbol: 'MPC', yahooSymbol: 'MPC', name: 'Marathon Petroleum' },
  { symbol: 'VLO', yahooSymbol: 'VLO', name: 'Valero Energy' },
  { symbol: 'PSX', yahooSymbol: 'PSX', name: 'Phillips 66' },
  { symbol: 'OXY', yahooSymbol: 'OXY', name: 'Occidental Petroleum' },
  
  // Utilities
  { symbol: 'NEE', yahooSymbol: 'NEE', name: 'NextEra Energy' },
  { symbol: 'DUK', yahooSymbol: 'DUK', name: 'Duke Energy' },
  { symbol: 'SO', yahooSymbol: 'SO', name: 'Southern Company' },
  { symbol: 'D', yahooSymbol: 'D', name: 'Dominion Energy' },
  { symbol: 'AEP', yahooSymbol: 'AEP', name: 'American Electric Power' },
  { symbol: 'SRE', yahooSymbol: 'SRE', name: 'Sempra Energy' },
  { symbol: 'EXC', yahooSymbol: 'EXC', name: 'Exelon Corporation' },
  { symbol: 'XEL', yahooSymbol: 'XEL', name: 'Xcel Energy' },
  { symbol: 'WEC', yahooSymbol: 'WEC', name: 'WEC Energy Group' },
  { symbol: 'ED', yahooSymbol: 'ED', name: 'Consolidated Edison' },
  
  // REITs
  { symbol: 'AMT', yahooSymbol: 'AMT', name: 'American Tower' },
  { symbol: 'PLD', yahooSymbol: 'PLD', name: 'Prologis Inc.' },
  { symbol: 'CCI', yahooSymbol: 'CCI', name: 'Crown Castle' },
  { symbol: 'EQIX', yahooSymbol: 'EQIX', name: 'Equinix Inc.' },
  { symbol: 'SPG', yahooSymbol: 'SPG', name: 'Simon Property Group' },
  { symbol: 'O', yahooSymbol: 'O', name: 'Realty Income' },
  { symbol: 'DLR', yahooSymbol: 'DLR', name: 'Digital Realty Trust' },
  { symbol: 'WELL', yahooSymbol: 'WELL', name: 'Welltower Inc.' },
  { symbol: 'AVB', yahooSymbol: 'AVB', name: 'AvalonBay Communities' },
  { symbol: 'EQR', yahooSymbol: 'EQR', name: 'Equity Residential' },
  
  // Communications
  { symbol: 'T', yahooSymbol: 'T', name: 'AT&T Inc.' },
  { symbol: 'VZ', yahooSymbol: 'VZ', name: 'Verizon Communications' },
  { symbol: 'TMUS', yahooSymbol: 'TMUS', name: 'T-Mobile US' },
  
  // Materials
  { symbol: 'LIN', yahooSymbol: 'LIN', name: 'Linde plc' },
  { symbol: 'APD', yahooSymbol: 'APD', name: 'Air Products and Chemicals' },
  { symbol: 'SHW', yahooSymbol: 'SHW', name: 'Sherwin-Williams' },
  { symbol: 'ECL', yahooSymbol: 'ECL', name: 'Ecolab Inc.' },
  { symbol: 'NEM', yahooSymbol: 'NEM', name: 'Newmont Corporation' },
  { symbol: 'FCX', yahooSymbol: 'FCX', name: 'Freeport-McMoRan' },
  { symbol: 'NUE', yahooSymbol: 'NUE', name: 'Nucor Corporation' },
  { symbol: 'DOW', yahooSymbol: 'DOW', name: 'Dow Inc.' },
  { symbol: 'DD', yahooSymbol: 'DD', name: 'DuPont de Nemours' },
  { symbol: 'PPG', yahooSymbol: 'PPG', name: 'PPG Industries' },
  
  // Popular Meme/Retail Stocks
  { symbol: 'GME', yahooSymbol: 'GME', name: 'GameStop Corp.' },
  { symbol: 'AMC', yahooSymbol: 'AMC', name: 'AMC Entertainment' },
  { symbol: 'PLTR', yahooSymbol: 'PLTR', name: 'Palantir Technologies' },
  { symbol: 'RIVN', yahooSymbol: 'RIVN', name: 'Rivian Automotive' },
  { symbol: 'LCID', yahooSymbol: 'LCID', name: 'Lucid Group' },
  { symbol: 'NIO', yahooSymbol: 'NIO', name: 'NIO Inc.' },
  { symbol: 'SOFI', yahooSymbol: 'SOFI', name: 'SoFi Technologies' },
  { symbol: 'HOOD', yahooSymbol: 'HOOD', name: 'Robinhood Markets' },
  { symbol: 'RBLX', yahooSymbol: 'RBLX', name: 'Roblox Corporation' },
  { symbol: 'SNAP', yahooSymbol: 'SNAP', name: 'Snap Inc.' },
];

// =============================================================================
// COMMODITIES - Energy, Metals, Agriculture
// =============================================================================
export const COMMODITY_INSTRUMENTS: Instrument[] = [
  // Precious Metals
  { symbol: 'GC=F', yahooSymbol: 'GC=F', name: 'Gold Futures' },
  { symbol: 'SI=F', yahooSymbol: 'SI=F', name: 'Silver Futures' },
  { symbol: 'PL=F', yahooSymbol: 'PL=F', name: 'Platinum Futures' },
  { symbol: 'PA=F', yahooSymbol: 'PA=F', name: 'Palladium Futures' },
  
  // Energy
  { symbol: 'CL=F', yahooSymbol: 'CL=F', name: 'Crude Oil WTI' },
  { symbol: 'BZ=F', yahooSymbol: 'BZ=F', name: 'Brent Crude Oil' },
  { symbol: 'NG=F', yahooSymbol: 'NG=F', name: 'Natural Gas' },
  { symbol: 'RB=F', yahooSymbol: 'RB=F', name: 'RBOB Gasoline' },
  { symbol: 'HO=F', yahooSymbol: 'HO=F', name: 'Heating Oil' },
  
  // Industrial Metals
  { symbol: 'HG=F', yahooSymbol: 'HG=F', name: 'Copper Futures' },
  { symbol: 'ALI=F', yahooSymbol: 'ALI=F', name: 'Aluminum Futures' },
  { symbol: 'ZN=F', yahooSymbol: 'ZN=F', name: 'Zinc Futures' },
  
  // Grains
  { symbol: 'ZC=F', yahooSymbol: 'ZC=F', name: 'Corn Futures' },
  { symbol: 'ZW=F', yahooSymbol: 'ZW=F', name: 'Wheat Futures' },
  { symbol: 'ZS=F', yahooSymbol: 'ZS=F', name: 'Soybeans Futures' },
  { symbol: 'ZM=F', yahooSymbol: 'ZM=F', name: 'Soybean Meal' },
  { symbol: 'ZL=F', yahooSymbol: 'ZL=F', name: 'Soybean Oil' },
  { symbol: 'ZO=F', yahooSymbol: 'ZO=F', name: 'Oats Futures' },
  { symbol: 'ZR=F', yahooSymbol: 'ZR=F', name: 'Rough Rice Futures' },
  
  // Softs
  { symbol: 'KC=F', yahooSymbol: 'KC=F', name: 'Coffee Futures' },
  { symbol: 'SB=F', yahooSymbol: 'SB=F', name: 'Sugar Futures' },
  { symbol: 'CC=F', yahooSymbol: 'CC=F', name: 'Cocoa Futures' },
  { symbol: 'CT=F', yahooSymbol: 'CT=F', name: 'Cotton Futures' },
  { symbol: 'OJ=F', yahooSymbol: 'OJ=F', name: 'Orange Juice Futures' },
  
  // Livestock
  { symbol: 'LE=F', yahooSymbol: 'LE=F', name: 'Live Cattle' },
  { symbol: 'HE=F', yahooSymbol: 'HE=F', name: 'Lean Hogs' },
  { symbol: 'GF=F', yahooSymbol: 'GF=F', name: 'Feeder Cattle' },
];

// =============================================================================
// INDICES - Global Major Indices
// =============================================================================
export const INDEX_INSTRUMENTS: Instrument[] = [
  // US Indices
  { symbol: '^GSPC', yahooSymbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^DJI', yahooSymbol: '^DJI', name: 'Dow Jones Industrial Average' },
  { symbol: '^IXIC', yahooSymbol: '^IXIC', name: 'NASDAQ Composite' },
  { symbol: '^NDX', yahooSymbol: '^NDX', name: 'NASDAQ 100' },
  { symbol: '^RUT', yahooSymbol: '^RUT', name: 'Russell 2000' },
  { symbol: '^VIX', yahooSymbol: '^VIX', name: 'CBOE Volatility Index' },
  
  // European Indices
  { symbol: '^FTSE', yahooSymbol: '^FTSE', name: 'FTSE 100' },
  { symbol: '^GDAXI', yahooSymbol: '^GDAXI', name: 'DAX' },
  { symbol: '^FCHI', yahooSymbol: '^FCHI', name: 'CAC 40' },
  { symbol: '^STOXX50E', yahooSymbol: '^STOXX50E', name: 'Euro Stoxx 50' },
  { symbol: '^IBEX', yahooSymbol: '^IBEX', name: 'IBEX 35' },
  { symbol: 'FTSEMIB.MI', yahooSymbol: 'FTSEMIB.MI', name: 'FTSE MIB' },
  { symbol: '^AEX', yahooSymbol: '^AEX', name: 'AEX Index' },
  { symbol: '^SSMI', yahooSymbol: '^SSMI', name: 'Swiss Market Index' },
  
  // Asian Indices
  { symbol: '^N225', yahooSymbol: '^N225', name: 'Nikkei 225' },
  { symbol: '^HSI', yahooSymbol: '^HSI', name: 'Hang Seng Index' },
  { symbol: '000001.SS', yahooSymbol: '000001.SS', name: 'Shanghai Composite' },
  { symbol: '399001.SZ', yahooSymbol: '399001.SZ', name: 'Shenzhen Component' },
  { symbol: '^KS11', yahooSymbol: '^KS11', name: 'KOSPI' },
  { symbol: '^TWII', yahooSymbol: '^TWII', name: 'Taiwan Weighted' },
  { symbol: '^STI', yahooSymbol: '^STI', name: 'Straits Times Index' },
  { symbol: '^AXJO', yahooSymbol: '^AXJO', name: 'S&P/ASX 200' },
  { symbol: '^BSESN', yahooSymbol: '^BSESN', name: 'BSE SENSEX' },
  { symbol: '^NSEI', yahooSymbol: '^NSEI', name: 'NIFTY 50' },
  
  // Other Indices
  { symbol: '^GSPTSE', yahooSymbol: '^GSPTSE', name: 'S&P/TSX Composite' },
  { symbol: '^BVSP', yahooSymbol: '^BVSP', name: 'Bovespa Index' },
  { symbol: '^MXX', yahooSymbol: '^MXX', name: 'IPC Mexico' },
];

// =============================================================================
// ETFs - Popular & Sector ETFs
// =============================================================================
export const ETF_INSTRUMENTS: Instrument[] = [
  // Broad Market
  { symbol: 'SPY', yahooSymbol: 'SPY', name: 'SPDR S&P 500 ETF' },
  { symbol: 'QQQ', yahooSymbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'IWM', yahooSymbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  { symbol: 'DIA', yahooSymbol: 'DIA', name: 'SPDR Dow Jones Industrial Average' },
  { symbol: 'VOO', yahooSymbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'VTI', yahooSymbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  
  // Sector ETFs
  { symbol: 'XLK', yahooSymbol: 'XLK', name: 'Technology Select Sector SPDR' },
  { symbol: 'XLF', yahooSymbol: 'XLF', name: 'Financial Select Sector SPDR' },
  { symbol: 'XLE', yahooSymbol: 'XLE', name: 'Energy Select Sector SPDR' },
  { symbol: 'XLV', yahooSymbol: 'XLV', name: 'Health Care Select Sector SPDR' },
  { symbol: 'XLI', yahooSymbol: 'XLI', name: 'Industrial Select Sector SPDR' },
  { symbol: 'XLP', yahooSymbol: 'XLP', name: 'Consumer Staples Select Sector SPDR' },
  { symbol: 'XLY', yahooSymbol: 'XLY', name: 'Consumer Discretionary Select Sector SPDR' },
  { symbol: 'XLU', yahooSymbol: 'XLU', name: 'Utilities Select Sector SPDR' },
  { symbol: 'XLB', yahooSymbol: 'XLB', name: 'Materials Select Sector SPDR' },
  { symbol: 'XLRE', yahooSymbol: 'XLRE', name: 'Real Estate Select Sector SPDR' },
  
  // Thematic ETFs
  { symbol: 'ARKK', yahooSymbol: 'ARKK', name: 'ARK Innovation ETF' },
  { symbol: 'ARKG', yahooSymbol: 'ARKG', name: 'ARK Genomic Revolution ETF' },
  { symbol: 'ARKW', yahooSymbol: 'ARKW', name: 'ARK Next Generation Internet ETF' },
  { symbol: 'SMH', yahooSymbol: 'SMH', name: 'VanEck Semiconductor ETF' },
  { symbol: 'SOXX', yahooSymbol: 'SOXX', name: 'iShares Semiconductor ETF' },
  { symbol: 'XBI', yahooSymbol: 'XBI', name: 'SPDR S&P Biotech ETF' },
  { symbol: 'IBB', yahooSymbol: 'IBB', name: 'iShares Biotechnology ETF' },
  
  // Fixed Income
  { symbol: 'TLT', yahooSymbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  { symbol: 'IEF', yahooSymbol: 'IEF', name: 'iShares 7-10 Year Treasury Bond ETF' },
  { symbol: 'SHY', yahooSymbol: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF' },
  { symbol: 'LQD', yahooSymbol: 'LQD', name: 'iShares iBoxx Investment Grade Corporate Bond ETF' },
  { symbol: 'HYG', yahooSymbol: 'HYG', name: 'iShares iBoxx High Yield Corporate Bond ETF' },
  { symbol: 'BND', yahooSymbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
  
  // Commodities ETFs
  { symbol: 'GLD', yahooSymbol: 'GLD', name: 'SPDR Gold Shares' },
  { symbol: 'SLV', yahooSymbol: 'SLV', name: 'iShares Silver Trust' },
  { symbol: 'USO', yahooSymbol: 'USO', name: 'United States Oil Fund' },
  { symbol: 'UNG', yahooSymbol: 'UNG', name: 'United States Natural Gas Fund' },
  { symbol: 'DBC', yahooSymbol: 'DBC', name: 'Invesco DB Commodity Index Tracking Fund' },
  
  // International
  { symbol: 'EFA', yahooSymbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
  { symbol: 'EEM', yahooSymbol: 'EEM', name: 'iShares MSCI Emerging Markets ETF' },
  { symbol: 'VWO', yahooSymbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF' },
  { symbol: 'VEA', yahooSymbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF' },
  { symbol: 'FXI', yahooSymbol: 'FXI', name: 'iShares China Large-Cap ETF' },
  { symbol: 'EWJ', yahooSymbol: 'EWJ', name: 'iShares MSCI Japan ETF' },
  { symbol: 'EWG', yahooSymbol: 'EWG', name: 'iShares MSCI Germany ETF' },
  { symbol: 'EWU', yahooSymbol: 'EWU', name: 'iShares MSCI United Kingdom ETF' },
  
  // Volatility & Leveraged
  { symbol: 'VXX', yahooSymbol: 'VXX', name: 'iPath Series B S&P 500 VIX Short-Term Futures ETN' },
  { symbol: 'UVXY', yahooSymbol: 'UVXY', name: 'ProShares Ultra VIX Short-Term Futures ETF' },
  { symbol: 'SQQQ', yahooSymbol: 'SQQQ', name: 'ProShares UltraPro Short QQQ' },
  { symbol: 'TQQQ', yahooSymbol: 'TQQQ', name: 'ProShares UltraPro QQQ' },
  { symbol: 'SPXS', yahooSymbol: 'SPXS', name: 'Direxion Daily S&P 500 Bear 3X Shares' },
  { symbol: 'SPXL', yahooSymbol: 'SPXL', name: 'Direxion Daily S&P 500 Bull 3X Shares' },
];

// =============================================================================
// AGGREGATED EXPORTS
// =============================================================================
export const ALL_INSTRUMENTS = {
  fx: FX_INSTRUMENTS,
  crypto: CRYPTO_INSTRUMENTS,
  stocks: STOCK_INSTRUMENTS,
  commodities: COMMODITY_INSTRUMENTS,
  indices: INDEX_INSTRUMENTS,
  etfs: ETF_INSTRUMENTS,
};

export const TOTAL_INSTRUMENT_COUNT = 
  FX_INSTRUMENTS.length + 
  CRYPTO_INSTRUMENTS.length + 
  STOCK_INSTRUMENTS.length + 
  COMMODITY_INSTRUMENTS.length + 
  INDEX_INSTRUMENTS.length + 
  ETF_INSTRUMENTS.length;

// For screener (subset) vs full cache (all)
export type AssetCategory = keyof typeof ALL_INSTRUMENTS;
