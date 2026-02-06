// Maps quiz question topics to their corresponding blog post URLs
export const topicLinks: Record<string, { url: string; title: string }> = {
  "head-and-shoulders": {
    url: "/learn/head-and-shoulders",
    title: "Head and Shoulders Pattern Guide"
  },
  "double-top": {
    url: "/learn/double-top-bottom",
    title: "Double Top and Bottom Patterns"
  },
  "double-bottom": {
    url: "/learn/double-top-bottom",
    title: "Double Top and Bottom Patterns"
  },
  "triple-top": {
    url: "/learn/double-top-bottom",
    title: "Double Top and Bottom Patterns"
  },
  "triple-bottom": {
    url: "/learn/double-top-bottom",
    title: "Double Top and Bottom Patterns"
  },
  "ascending-triangle": {
    url: "/learn/triangle-patterns",
    title: "Triangle Patterns Complete Guide"
  },
  "descending-triangle": {
    url: "/learn/triangle-patterns",
    title: "Triangle Patterns Complete Guide"
  },
  "symmetrical-triangle": {
    url: "/learn/triangle-patterns",
    title: "Triangle Patterns Complete Guide"
  },
  "rising-wedge": {
    url: "/learn/wedge-patterns",
    title: "Rising and Falling Wedge Patterns"
  },
  "falling-wedge": {
    url: "/learn/wedge-patterns",
    title: "Rising and Falling Wedge Patterns"
  },
  "pennant": {
    url: "/learn/flag-pennant",
    title: "Flags and Pennants Guide"
  },
  "flag": {
    url: "/learn/flag-pennant",
    title: "Flags and Pennants Guide"
  },
  "cup-and-handle": {
    url: "/learn/cup-and-handle",
    title: "Cup and Handle Pattern"
  },
  "rectangle": {
    url: "/learn/flag-pennant",
    title: "Flags and Pennants Guide"
  },
  "diamond": {
    url: "/learn/triangle-patterns",
    title: "Triangle Patterns Complete Guide"
  },
  "rounding-bottom": {
    url: "/learn/cup-and-handle",
    title: "Cup and Handle Pattern"
  },
  "support-resistance": {
    url: "/learn/support-resistance",
    title: "Support and Resistance Fundamentals"
  },
  "trend-lines": {
    url: "/learn/trend-analysis",
    title: "Trend Lines and Trend Analysis"
  },
  "volume": {
    url: "/learn/volume-analysis",
    title: "Volume Analysis Guide"
  },
  "candlesticks": {
    url: "/learn/candlestick-patterns",
    title: "Japanese Candlestick Patterns"
  },
  "risk-management": {
    url: "/learn/risk-management-fundamentals",
    title: "Risk Management Fundamentals"
  },
  "psychology": {
    url: "/learn/trading-psychology-101",
    title: "Trading Psychology 101"
  },
  "breakout": {
    url: "/learn/breakout-trading",
    title: "Breakout Trading Strategy"
  },
  "reversal": {
    url: "/learn/reversal-patterns",
    title: "Reversal Patterns Overview"
  },
  "continuation": {
    url: "/learn/continuation-patterns",
    title: "Continuation Patterns Guide"
  },
  "technical-analysis": {
    url: "/learn/technical-vs-fundamental-analysis",
    title: "Technical vs Fundamental Analysis"
  },
  "fundamental-analysis": {
    url: "/learn/technical-vs-fundamental-analysis",
    title: "Technical vs Fundamental Analysis"
  },
  "trading-styles": {
    url: "/learn/trading-styles-timeframes",
    title: "Trading Styles and Timeframes"
  },
  "day-trading": {
    url: "/learn/trading-styles-timeframes",
    title: "Trading Styles and Timeframes"
  },
  "swing-trading": {
    url: "/learn/trading-styles-timeframes",
    title: "Trading Styles and Timeframes"
  },
  "position-trading": {
    url: "/learn/trading-styles-timeframes",
    title: "Trading Styles and Timeframes"
  }
};

// Get topic link for a question based on keywords
export const getTopicLink = (question: string, correctAnswer: string): { url: string; title: string } | null => {
  const questionLower = question.toLowerCase();
  const answerLower = correctAnswer.toLowerCase();
  
  // Check for specific pattern names
  if (questionLower.includes("head and shoulders") || answerLower.includes("head and shoulders")) {
    return topicLinks["head-and-shoulders"];
  }
  if (questionLower.includes("double top") || answerLower.includes("double top")) {
    return topicLinks["double-top"];
  }
  if (questionLower.includes("double bottom") || answerLower.includes("double bottom")) {
    return topicLinks["double-bottom"];
  }
  if (questionLower.includes("triple top") || answerLower.includes("triple top")) {
    return topicLinks["triple-top"];
  }
  if (questionLower.includes("triple bottom") || answerLower.includes("triple bottom")) {
    return topicLinks["triple-bottom"];
  }
  if (questionLower.includes("ascending triangle")) {
    return topicLinks["ascending-triangle"];
  }
  if (questionLower.includes("descending triangle")) {
    return topicLinks["descending-triangle"];
  }
  if (questionLower.includes("symmetrical triangle")) {
    return topicLinks["symmetrical-triangle"];
  }
  if (questionLower.includes("rising wedge")) {
    return topicLinks["rising-wedge"];
  }
  if (questionLower.includes("falling wedge")) {
    return topicLinks["falling-wedge"];
  }
  if (questionLower.includes("pennant")) {
    return topicLinks["pennant"];
  }
  if (questionLower.includes("flag")) {
    return topicLinks["flag"];
  }
  if (questionLower.includes("cup and handle")) {
    return topicLinks["cup-and-handle"];
  }
  if (questionLower.includes("rectangle")) {
    return topicLinks["rectangle"];
  }
  if (questionLower.includes("diamond")) {
    return topicLinks["diamond"];
  }
  if (questionLower.includes("rounding bottom")) {
    return topicLinks["rounding-bottom"];
  }
  
  // Check for general topics
  if (questionLower.includes("support") || questionLower.includes("resistance")) {
    return topicLinks["support-resistance"];
  }
  if (questionLower.includes("trend line")) {
    return topicLinks["trend-lines"];
  }
  if (questionLower.includes("volume")) {
    return topicLinks["volume"];
  }
  if (questionLower.includes("candlestick") || questionLower.includes("doji") || questionLower.includes("hammer")) {
    return topicLinks["candlesticks"];
  }
  if (questionLower.includes("risk") || questionLower.includes("stop loss") || questionLower.includes("position siz")) {
    return topicLinks["risk-management"];
  }
  if (questionLower.includes("psychology") || questionLower.includes("emotion") || questionLower.includes("discipline")) {
    return topicLinks["psychology"];
  }
  if (questionLower.includes("breakout")) {
    return topicLinks["breakout"];
  }
  if (questionLower.includes("reversal")) {
    return topicLinks["reversal"];
  }
  if (questionLower.includes("continuation")) {
    return topicLinks["continuation"];
  }
  
  // Default to main learning center
  return null;
};
