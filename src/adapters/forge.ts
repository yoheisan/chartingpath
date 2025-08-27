// Adapter utilities for converting between Forge and Site JSON AST formats

export interface SiteCondition {
  id: string;
  type: "indicator" | "price_action" | "time" | "relative";
  lhs?: {
    ind: string;
    params: Record<string, any>;
    tf?: string;
  };
  operator: string;
  rhs?: {
    ind?: string;
    params?: Record<string, any>;
    tf?: string;
    threshold?: number;
  };
  point?: {
    mode: "n_bars_ago" | "session_open" | "specific_time" | "previous_close" | "day_open";
    n?: number;
    session?: string;
    time?: string;
    tz?: string;
  };
  label?: string;
}

export interface SiteAST {
  type: "strategy" | "indicator";
  name: string;
  conditions: SiteCondition[];
  logic: "and" | "or";
  execution: {
    mode: "long" | "short" | "directional_mapping";
  };
  risk: {
    type: "atr" | "percentage";
    stopLoss: number;
    takeProfit: number;
    trailingStop?: boolean;
    trailingStopValue?: number;
  };
  timeframe: string;
  confirmTimeframe?: string;
  filters?: {
    volume?: boolean;
    trend?: boolean;
    trendEmaLength?: number;
  };
}

export interface ForgeCondition {
  type: string;
  lhs?: {
    indicator: string;
    parameters: Record<string, any>;
    timeframe?: string;
  };
  op: string;
  rhs?: {
    indicator?: string;
    parameters?: Record<string, any>;
    timeframe?: string;
    value?: number;
  };
  point?: {
    mode: string;
    n?: number;
    session?: string;
    time?: string;
    timezone?: string;
  };
  description?: string;
}

export interface ForgeAST {
  strategy_type: "strategy" | "indicator";
  strategy_name: string;
  entry_conditions: ForgeCondition[];
  condition_logic: "AND" | "OR";
  execution_rules: {
    direction: "LONG" | "SHORT" | "BOTH";
  };
  risk_management: {
    stop_loss_type: "ATR" | "PERCENTAGE";
    stop_loss_value: number;
    take_profit_value: number;
    trailing_stop?: boolean;
    trailing_stop_value?: number;
  };
  chart_timeframe: string;
  confirmation_timeframe?: string;
  additional_filters?: {
    volume_filter?: boolean;
    trend_filter?: boolean;
    trend_ema_period?: number;
  };
}

/**
 * Convert from Site AST format to Forge AST format
 */
export function siteToForge(siteAST: SiteAST): ForgeAST {
  const forgeConditions: ForgeCondition[] = siteAST.conditions.map(condition => ({
    type: condition.type === "relative" ? "RELATIVE" : condition.type.toUpperCase(),
    lhs: condition.lhs ? {
      indicator: condition.lhs.ind,
      parameters: condition.lhs.params,
      timeframe: condition.lhs.tf
    } : undefined,
    op: condition.operator.toUpperCase(),
    rhs: condition.rhs ? {
      indicator: condition.rhs.ind,
      parameters: condition.rhs.params,
      timeframe: condition.rhs.tf,
      value: condition.rhs.threshold
    } : undefined,
    point: condition.point ? {
      mode: condition.point.mode.toUpperCase(),
      n: condition.point.n,
      session: condition.point.session,
      time: condition.point.time,
      timezone: condition.point.tz
    } : undefined,
    description: condition.label
  }));

  return {
    strategy_type: siteAST.type,
    strategy_name: siteAST.name,
    entry_conditions: forgeConditions,
    condition_logic: siteAST.logic.toUpperCase() as "AND" | "OR",
    execution_rules: {
      direction: siteAST.execution.mode === "long" ? "LONG" : 
                 siteAST.execution.mode === "short" ? "SHORT" : "BOTH"
    },
    risk_management: {
      stop_loss_type: siteAST.risk.type.toUpperCase() as "ATR" | "PERCENTAGE",
      stop_loss_value: siteAST.risk.stopLoss,
      take_profit_value: siteAST.risk.takeProfit,
      trailing_stop: siteAST.risk.trailingStop,
      trailing_stop_value: siteAST.risk.trailingStopValue
    },
    chart_timeframe: siteAST.timeframe,
    confirmation_timeframe: siteAST.confirmTimeframe,
    additional_filters: {
      volume_filter: siteAST.filters?.volume,
      trend_filter: siteAST.filters?.trend,
      trend_ema_period: siteAST.filters?.trendEmaLength
    }
  };
}

/**
 * Convert from Forge AST format to Site AST format
 */
export function forgeToSite(forgeAST: ForgeAST): SiteAST {
  const siteConditions: SiteCondition[] = forgeAST.entry_conditions.map((condition, index) => ({
    id: `condition_${index}`,
    type: condition.type.toLowerCase() === "relative" ? "relative" : 
          condition.type.toLowerCase() as "indicator" | "price_action" | "time",
    lhs: condition.lhs ? {
      ind: condition.lhs.indicator,
      params: condition.lhs.parameters,
      tf: condition.lhs.timeframe
    } : undefined,
    operator: condition.op.toLowerCase(),
    rhs: condition.rhs ? {
      ind: condition.rhs.indicator,
      params: condition.rhs.parameters,
      tf: condition.rhs.timeframe,
      threshold: condition.rhs.value
    } : undefined,
    point: condition.point ? {
      mode: condition.point.mode.toLowerCase() as any,
      n: condition.point.n,
      session: condition.point.session,
      time: condition.point.time,
      tz: condition.point.timezone
    } : undefined,
    label: condition.description
  }));

  return {
    type: forgeAST.strategy_type,
    name: forgeAST.strategy_name,
    conditions: siteConditions,
    logic: forgeAST.condition_logic.toLowerCase() as "and" | "or",
    execution: {
      mode: forgeAST.execution_rules.direction === "LONG" ? "long" :
            forgeAST.execution_rules.direction === "SHORT" ? "short" : "directional_mapping"
    },
    risk: {
      type: forgeAST.risk_management.stop_loss_type.toLowerCase() as "atr" | "percentage",
      stopLoss: forgeAST.risk_management.stop_loss_value,
      takeProfit: forgeAST.risk_management.take_profit_value,
      trailingStop: forgeAST.risk_management.trailing_stop,
      trailingStopValue: forgeAST.risk_management.trailing_stop_value
    },
    timeframe: forgeAST.chart_timeframe,
    confirmTimeframe: forgeAST.confirmation_timeframe,
    filters: {
      volume: forgeAST.additional_filters?.volume_filter,
      trend: forgeAST.additional_filters?.trend_filter,
      trendEmaLength: forgeAST.additional_filters?.trend_ema_period
    }
  };
}

/**
 * Parse Pine Script code to extract basic strategy information
 */
export function parsePineScript(code: string): Partial<ForgeAST> {
  const lines = code.split('\n');
  const strategyName = extractStrategyName(lines);
  const indicators = extractIndicators(lines);
  const conditions = extractConditions(lines);
  
  return {
    strategy_type: code.includes('strategy(') ? 'strategy' : 'indicator',
    strategy_name: strategyName || 'Parsed Strategy',
    entry_conditions: conditions,
    condition_logic: 'AND', // Default
    execution_rules: { direction: 'BOTH' },
    risk_management: {
      stop_loss_type: 'ATR',
      stop_loss_value: 1.5,
      take_profit_value: 3.0
    },
    chart_timeframe: '15m'
  };
}

/**
 * Parse MQL4/5 code to extract basic strategy information
 */
export function parseMQL(code: string): Partial<ForgeAST> {
  const lines = code.split('\n');
  
  return {
    strategy_type: 'strategy',
    strategy_name: 'Parsed MQL Strategy',
    entry_conditions: [],
    condition_logic: 'AND',
    execution_rules: { direction: 'BOTH' },
    risk_management: {
      stop_loss_type: 'PERCENTAGE',
      stop_loss_value: 2.0,
      take_profit_value: 4.0
    },
    chart_timeframe: '15m'
  };
}

/**
 * Parse C# code (cTrader/NinjaTrader) to extract basic strategy information
 */
export function parseCSharp(code: string): Partial<ForgeAST> {
  const lines = code.split('\n');
  
  return {
    strategy_type: 'strategy',
    strategy_name: 'Parsed C# Strategy',
    entry_conditions: [],
    condition_logic: 'AND',
    execution_rules: { direction: 'BOTH' },
    risk_management: {
      stop_loss_type: 'ATR',
      stop_loss_value: 1.5,
      take_profit_value: 3.0
    },
    chart_timeframe: '15m'
  };
}

// Helper functions for parsing
function extractStrategyName(lines: string[]): string | null {
  for (const line of lines) {
    const match = line.match(/strategy\s*\(\s*["']([^"']+)["']/);
    if (match) return match[1];
  }
  return null;
}

function extractIndicators(lines: string[]): string[] {
  const indicators: string[] = [];
  const indicatorPatterns = [
    /ta\.(sma|ema|rsi|macd|bb|stoch)/g,
    /(sma|ema|rsi|macd|bb|stoch)\s*\(/g
  ];
  
  for (const line of lines) {
    for (const pattern of indicatorPatterns) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        indicators.push(match[1].toUpperCase());
      }
    }
  }
  
  return [...new Set(indicators)];
}

function extractConditions(lines: string[]): ForgeCondition[] {
  const conditions: ForgeCondition[] = [];
  
  for (const line of lines) {
    // Look for crossover patterns
    if (line.includes('ta.crossover') || line.includes('crossover')) {
      conditions.push({
        type: 'CROSSOVER',
        op: 'CROSS_UP',
        description: 'Crossover condition detected'
      });
    }
    
    // Look for comparison patterns
    if (line.includes('>') && (line.includes('sma') || line.includes('ema'))) {
      conditions.push({
        type: 'COMPARISON',
        op: 'ABOVE',
        description: 'Comparison condition detected'
      });
    }
  }
  
  return conditions;
}