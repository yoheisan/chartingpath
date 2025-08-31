// Synthetic data generation utilities for backtesting tests

export function generateSyntheticPrices(
  startDate: string,
  endDate: string,
  initialPrice: number = 100,
  volatility: number = 0.02,
  drift: number = 0.0001,
  seed: number = 12345
): Array<{date: string, price: number}> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  const prices: Array<{date: string, price: number}> = [];
  let currentPrice = initialPrice;
  
  // Simple pseudo-random generator for deterministic tests
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate random return
    const randomReturn = (nextRandom() - 0.5) * 2; // -1 to 1
    const dailyReturn = drift + volatility * randomReturn;
    
    currentPrice *= (1 + dailyReturn);
    prices.push({ date: dateStr, price: currentPrice });
  }
  
  return prices;
}

export function generateCorrelatedPrices(
  basePrices: Array<{date: string, price: number}>,
  correlation: number = 0.7,
  volatilityRatio: number = 1.0,
  priceRatio: number = 1.0,
  seed: number = 54321
): Array<{date: string, price: number}> {
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  const correlatedPrices: Array<{date: string, price: number}> = [];
  let currentPrice = basePrices[0].price * priceRatio;
  
  for (let i = 0; i < basePrices.length; i++) {
    const baseReturn = i > 0 
      ? (basePrices[i].price - basePrices[i-1].price) / basePrices[i-1].price
      : 0;
    
    const independentReturn = (nextRandom() - 0.5) * 0.04; // Independent noise
    const correlatedReturn = correlation * baseReturn + (1 - correlation) * independentReturn;
    const adjustedReturn = correlatedReturn * volatilityRatio;
    
    if (i > 0) {
      currentPrice *= (1 + adjustedReturn);
    }
    
    correlatedPrices.push({
      date: basePrices[i].date,
      price: currentPrice
    });
  }
  
  return correlatedPrices;
}

export function generateMeanRevertingPair(
  startDate: string,
  endDate: string,
  initialPriceA: number = 100,
  initialPriceB: number = 50,
  meanReversionSpeed: number = 0.1,
  equilibriumRatio: number = 2.0,
  seed: number = 98765
): {
  pricesA: Array<{date: string, price: number}>;
  pricesB: Array<{date: string, price: number}>;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  const pricesA: Array<{date: string, price: number}> = [];
  const pricesB: Array<{date: string, price: number}> = [];
  
  let priceA = initialPriceA;
  let priceB = initialPriceB;
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    // Calculate current ratio and deviation from equilibrium
    const currentRatio = priceA / priceB;
    const deviation = currentRatio - equilibriumRatio;
    
    // Mean reversion force
    const reversionForceA = -meanReversionSpeed * deviation * (nextRandom() - 0.5);
    const reversionForceB = meanReversionSpeed * deviation * (nextRandom() - 0.5);
    
    // Add some noise
    const noiseA = (nextRandom() - 0.5) * 0.02;
    const noiseB = (nextRandom() - 0.5) * 0.02;
    
    // Update prices
    priceA *= (1 + reversionForceA + noiseA);
    priceB *= (1 + reversionForceB + noiseB);
    
    pricesA.push({ date: dateStr, price: priceA });
    pricesB.push({ date: dateStr, price: priceB });
  }
  
  return { pricesA, pricesB };
}

export function createTrendingPrice(
  startDate: string,
  endDate: string,
  initialPrice: number = 100,
  annualTrend: number = 0.1, // 10% annual trend
  volatility: number = 0.015,
  seed: number = 11111
): Array<{date: string, price: number}> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const dailyTrend = annualTrend / 365.25;
  
  let random = seed;
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };
  
  const prices: Array<{date: string, price: number}> = [];
  let currentPrice = initialPrice;
  
  for (let i = 0; i <= days; i++) {
    const date = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    const noise = (nextRandom() - 0.5) * volatility * 2;
    const dailyReturn = dailyTrend + noise;
    
    currentPrice *= (1 + dailyReturn);
    prices.push({ date: dateStr, price: currentPrice });
  }
  
  return prices;
}