import { memo, useEffect, useState } from 'react';

/**
 * Animated ascending triangle pattern forming with candlesticks.
 * Candles appear one-by-one, then trendlines draw in.
 * Purely decorative — sits behind hero text at low opacity.
 */

// Ascending triangle: flat resistance top, rising support bottom
const CANDLES = [
  // { open, close, high, low } — normalized 0-100 vertical space
  { o: 35, c: 28, h: 38, l: 25 },  // bearish
  { o: 30, c: 40, h: 43, l: 28 },  // bullish bounce
  { o: 40, c: 33, h: 44, l: 30 },  // bearish
  { o: 34, c: 45, h: 48, l: 32 },  // bullish
  { o: 44, c: 38, h: 49, l: 35 },  // bearish
  { o: 39, c: 50, h: 53, l: 37 },  // bullish
  { o: 50, c: 42, h: 54, l: 40 },  // bearish pullback
  { o: 43, c: 52, h: 55, l: 41 },  // bullish
  { o: 51, c: 46, h: 56, l: 44 },  // bearish
  { o: 47, c: 55, h: 58, l: 45 },  // bullish
  { o: 54, c: 48, h: 57, l: 46 },  // small bearish
  { o: 49, c: 56, h: 59, l: 47 },  // bullish
  { o: 55, c: 50, h: 58, l: 48 },  // bearish
  { o: 51, c: 57, h: 60, l: 49 },  // bullish — testing resistance
  { o: 56, c: 53, h: 59, l: 51 },  // small bearish
  { o: 54, c: 62, h: 66, l: 52 },  // BREAKOUT candle — big bullish
  { o: 62, c: 68, h: 72, l: 60 },  // continuation
  { o: 67, c: 73, h: 76, l: 65 },  // continuation
];

const CANDLE_WIDTH = 18;
const CANDLE_GAP = 28;
const TOTAL_WIDTH = CANDLES.length * (CANDLE_WIDTH + CANDLE_GAP);
const VIEW_HEIGHT = 100;
const PADDING_Y = 8;

function yScale(val: number) {
  // Invert Y for SVG (0 at top)
  return PADDING_Y + ((100 - val) / 100) * (VIEW_HEIGHT - PADDING_Y * 2);
}

const AnimatedCandlestickPattern = memo(() => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showLines, setShowLines] = useState(false);

  useEffect(() => {
    // Stagger candle appearance
    const intervals: NodeJS.Timeout[] = [];
    CANDLES.forEach((_, i) => {
      intervals.push(
        setTimeout(() => setVisibleCount(i + 1), 400 + i * 150)
      );
    });
    // Draw trendlines after all candles
    intervals.push(
      setTimeout(() => setShowLines(true), 400 + CANDLES.length * 150 + 300)
    );
    return () => intervals.forEach(clearTimeout);
  }, []);

  // Resistance line (flat top ~58-59)
  const resistanceY = yScale(58);
  // Support line (rising from candle 0 low to candle 14 low)
  const supportStartY = yScale(25);
  const supportEndY = yScale(51);

  return (
    <svg
      viewBox={`0 0 ${TOTAL_WIDTH} ${VIEW_HEIGHT}`}
      className="w-full h-full"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-candle-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          <stop offset="20%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
          <stop offset="80%" stopColor="hsl(var(--foreground))" stopOpacity="1" />
          <stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Candles */}
      {CANDLES.map((candle, i) => {
        if (i >= visibleCount) return null;
        const x = i * (CANDLE_WIDTH + CANDLE_GAP) + CANDLE_GAP / 2;
        const isBullish = candle.c > candle.o;
        const bodyTop = yScale(Math.max(candle.o, candle.c));
        const bodyBottom = yScale(Math.min(candle.o, candle.c));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 0.8);
        const wickTop = yScale(candle.h);
        const wickBottom = yScale(candle.l);
        const centerX = x + CANDLE_WIDTH / 2;

        // Breakout candles (index 15+) get accent color
        const isBreakout = i >= 15;

        return (
          <g
            key={i}
            className="animate-fade-in"
            style={{ animationDuration: '0.4s' }}
          >
            {/* Wick */}
            <line
              x1={centerX}
              y1={wickTop}
              x2={centerX}
              y2={wickBottom}
              stroke={isBreakout ? 'hsl(var(--primary))' : isBullish ? 'hsl(var(--primary) / 0.6)' : 'hsl(var(--destructive) / 0.5)'}
              strokeWidth={1.2}
            />
            {/* Body */}
            <rect
              x={x}
              y={bodyTop}
              width={CANDLE_WIDTH}
              height={bodyHeight}
              rx={1.5}
              fill={
                isBreakout
                  ? 'hsl(var(--primary))'
                  : isBullish
                    ? 'hsl(var(--primary) / 0.5)'
                    : 'hsl(var(--destructive) / 0.4)'
              }
            />
          </g>
        );
      })}

      {/* Resistance line (flat) */}
      {showLines && (
        <line
          x1={CANDLE_GAP / 2}
          y1={resistanceY}
          x2={(CANDLES.length - 3) * (CANDLE_WIDTH + CANDLE_GAP)}
          y2={resistanceY}
          stroke="hsl(var(--destructive) / 0.4)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          className="animate-fade-in"
          style={{ animationDuration: '0.8s' }}
        />
      )}

      {/* Support line (ascending) */}
      {showLines && (
        <line
          x1={CANDLE_GAP / 2}
          y1={supportStartY}
          x2={14 * (CANDLE_WIDTH + CANDLE_GAP)}
          y2={supportEndY}
          stroke="hsl(var(--primary) / 0.4)"
          strokeWidth={1.5}
          strokeDasharray="6 4"
          className="animate-fade-in"
          style={{ animationDuration: '0.8s' }}
        />
      )}
    </svg>
  );
});

AnimatedCandlestickPattern.displayName = 'AnimatedCandlestickPattern';

export default AnimatedCandlestickPattern;
