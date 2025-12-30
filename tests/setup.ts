// Global test setup for Backtester V2 tests

// Set default environment variables for testing
process.env.NODE_ENV = 'test';

// Set feature flag based on environment (defaults to true for tests)
if (!process.env.BACKTESTER_V2_ENABLED) {
  process.env.BACKTESTER_V2_ENABLED = 'true';
}

// Import jest-dom matchers for React component tests (when using jsdom environment)
// This is conditionally loaded to avoid issues with node environment tests
if (typeof document !== 'undefined') {
  require('@testing-library/jest-dom');
}

// Mock console methods to avoid noise in tests (optional)
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console.log in tests unless explicitly needed
  if (process.env.SUPPRESS_LOGS !== 'false') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
  }
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to generate test dates
  generateDateRange: (start: string, end: string) => {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  },
  
  // Helper to create mock price data
  createMockPriceFrame: (symbol: string, dates: string[], prices: number[]) => ({
    index: dates,
    columns: [symbol],
    data: prices.map(p => [p]),
    meta: { provider: 'test' }
  })
};

// Add type declaration for the global test utilities
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    generateDateRange: (start: string, end: string) => string[];
    createMockPriceFrame: (symbol: string, dates: string[], prices: number[]) => any;
  };
}

// Jest custom matchers
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
  
  toBeCloseTo2DecimalPlaces(received: number, expected: number) {
    const pass = Math.abs(received - expected) < 0.01;
    if (pass) {
      return {
        message: () => `expected ${received} not to be close to ${expected} within 2 decimal places`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be close to ${expected} within 2 decimal places`,
        pass: false,
      };
    }
  }
});

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toBeCloseTo2DecimalPlaces(expected: number): R;
    }
  }
}

export {};