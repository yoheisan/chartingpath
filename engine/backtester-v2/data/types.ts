export type ISODate = string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ssZ"

export interface PriceFrame {
  index: ISODate[];           // ascending timestamps (EOD or intraday)
  columns: string[];          // symbols
  data: number[][];           // close prices only; shape = [index.length][columns.length]
  meta?: Record<string, any>; // optional (exchange, tz, notes)
}

// Optional richer bars for future use (not required by engine v1)
export interface Bar { 
  t: ISODate; 
  o: number; 
  h: number; 
  l: number; 
  c: number; 
  v?: number; 
}

export interface BacktestResult {
  equity: Array<{date: string, value: number}>;
  dailyReturns: Array<{date: string, value: number}>;
  stats: { 
    cagr: number; 
    vol: number; 
    sharpe: number; 
    sortino: number; 
    maxDD: number; 
    calmar: number; 
    turnover: number; 
  };
  trades: Array<{
    date: string; 
    symbol: string; 
    qty: number; 
    price: number; 
    cost: number; 
    side: "OPEN" | "CLOSE"; 
    tag?: string;
  }>;
  exposures?: Array<{date: string} & Record<string, number>>;
  weights?: Array<{date: string} & Record<string, number>>;
}