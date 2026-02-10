-- Platform Glossary Article
INSERT INTO public.learning_articles (
  title,
  slug,
  excerpt,
  content,
  category,
  difficulty_level,
  reading_time_minutes,
  tags,
  status,
  seo_title,
  seo_description,
  seo_keywords
) VALUES (
  'ChartingPath Glossary: Official Platform Terminology',
  'platform-glossary',
  'Master the official terminology for all ChartingPath features, charts, and services. This comprehensive glossary ensures you speak the same language as the platform.',
  '# ChartingPath Glossary: Official Platform Terminology

Welcome to the official ChartingPath glossary. Understanding these terms will help you navigate the platform efficiently and master every feature at your fingertips.

---

## Chart Types

### Study Chart
The **Study Chart** is the primary research visualization found on pattern detail pages and educational content. It displays historical price action with overlaid pattern annotations, entry/exit markers, and technical indicators. Study Charts are optimized for analysis rather than real-time monitoring.

**Where you''ll find it:** Pattern Library pages, educational articles, historical pattern examples.

**Key features:**
- Pattern zone overlays (support, resistance, trendlines)
- Trade execution markers (Entry, Stop Loss, Take Profit)
- Candlestick or bar visualization
- Technical indicator overlays (EMA, SMA, Bollinger Bands)

### Full Chart
The **Full Chart** is the expanded, interactive chart viewer that provides institutional-grade analysis capabilities. It maximizes screen real estate and offers advanced interaction controls.

**Where you''ll find it:** Dashboard Command Center, Pattern Lab research, dedicated chart analysis views.

**Key features:**
- Manual vertical axis scaling (drag the price scale)
- Vertical panning (Shift + Left Click drag)
- Reset button to restore auto-scaling
- Extended timeframe selection
- Drawing tools and annotations

### Thumbnail Chart
The **Thumbnail Chart** is a compact, inline preview designed for quick visual reference in lists and cards. It provides at-a-glance pattern recognition without interactive controls.

**Where you''ll find it:** Screener results, alert cards, pattern detection feeds.

**Key features:**
- Compact form factor
- Essential price action only
- Optimized for performance (minimal rendering overhead)
- Click to expand to Full Chart

### Signal Chart
The **Signal Chart** is a specialized visualization that highlights detected pattern signals with trade setup overlays. It emphasizes the entry zone, stop loss, and take profit levels.

**Where you''ll find it:** Live pattern detection results, alert notifications, trade setup previews.

---

## Core Platform Features

### Command Center
The **Command Center** (opened via ⌘K on Mac or Ctrl+K on Windows) is the universal AI-powered command hub for the entire platform. It combines navigation, research, automation, and AI assistance into a single spotlight-style interface.

**Capabilities:**
- **Navigate:** Jump to any page instantly (Dashboard, Screener, Pattern Lab, Scripts, Learning Center)
- **Research:** Search live patterns, get historical statistics, scan crypto/stocks
- **Automate:** Create alerts, generate Pine Scripts, build trading strategies
- **Ask AI:** Natural language queries for market analysis, pattern education, and strategy development

**Mobile Access:** Tap the sparkle floating action button (FAB) to open the Command Center as a bottom drawer.

### Pattern Lab
The **Pattern Lab** is the dedicated research environment for strategy validation and backtesting. It allows you to test pattern performance across different instruments, timeframes, and risk/reward configurations.

**Key features:**
- Multi-R:R backtesting (2:1 to 5:1 reward tiers)
- Quality grade filtering (A, B, C, D, F)
- Exit strategy optimization
- Benchmark overlays (SPY, QQQ)
- Equity curve visualization

### Pattern Screener
The **Pattern Screener** is a real-time scanner that detects forming chart patterns across 8,500+ instruments. It filters by pattern type, quality grade, direction, and asset class.

**Where you''ll find it:** /patterns/live or via Command Center → "Pattern Screener"

### Market Breadth
**Market Breadth** refers to market internals indicators that measure the overall health and direction of the market. This includes advance/decline ratios, new highs vs. new lows, and sector rotation analysis.

**Where you''ll find it:** Dashboard widgets, Market Overview sections.

### Scripts
The **Scripts** section houses your exported Pine Script strategies for TradingView deployment. All scripts are pattern-based and derived from validated backtest configurations in Pattern Lab.

**Key features:**
- Pine Script v5 code generation
- Optimized exit logic from backtest data
- One-click copy to TradingView
- Strategy versioning

### Alerts
The **Alerts** system monitors your saved symbols and patterns, sending notifications when patterns form. Alerts can be delivered via email or in-app notifications.

---

## Pattern Quality System

### Quality Grades
Patterns are scored from **A** (highest) to **F** (lowest) based on:
- **Trend Alignment:** Does the pattern align with the broader trend?
- **Volume Confirmation:** Is there supporting volume activity?
- **Pattern Structure:** How clean is the formation?
- **Risk/Reward Ratio:** Is the setup favorable?

### A-Quality Patterns
The highest-rated patterns with strong trend alignment, volume confirmation, and clean structure. These typically have the best historical win rates.

### Close Matches
When searching for specific criteria, the system may also surface "close matches"—patterns that nearly meet your requirements but differ in one dimension (e.g., B-quality instead of A, or a slightly different timeframe).

---

## Trading Terminology

### Entry Price
The recommended price level to enter a trade when a pattern confirms.

### Stop Loss
The price level at which to exit a losing trade to limit losses. Typically placed beyond the pattern''s support (for longs) or resistance (for shorts).

### Take Profit
The target price level to exit a winning trade and secure profits.

### Risk/Reward Ratio (R:R)
The ratio between potential profit and potential loss. A 2:1 R:R means the take profit is 2x the distance from entry as the stop loss.

### Win Rate
The percentage of historical signals that hit their take profit before stop loss.

### Expectancy
A statistical measure of expected profit per trade, accounting for both win rate and average R:R.

---

## Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K / Ctrl+K | Open Command Center |
| G D | Go to Dashboard |
| G S | Go to Screener |
| G L | Go to Pattern Lab |
| G A | Go to Alerts |
| G C | Go to Scripts |
| G E | Go to Learning Center |
| ↑ ↓ | Navigate Command Center items |
| Enter | Select item |
| Esc | Close Command Center |

---

## Related Articles

- [Command Center Guide](/blog/command-center-guide) - Deep dive into AI-powered trading assistance
- [Chart Types Explained](/blog/chart-types-explained) - Visual guide to all chart views
- [Platform FAQ](/blog/platform-faq) - Common questions answered',
  'Platform Guide',
  'beginner',
  12,
  ARRAY['glossary', 'terminology', 'platform', 'features', 'charts', 'command center'],
  'published',
  'ChartingPath Glossary - Official Platform Terminology Guide',
  'Master the official terminology for all ChartingPath features including Study Chart, Full Chart, Command Center, Pattern Lab, and more.',
  ARRAY['chartingpath glossary', 'trading platform terminology', 'chart types explained', 'command center', 'pattern lab']
);

-- Command Center Guide Article
INSERT INTO public.learning_articles (
  title,
  slug,
  excerpt,
  content,
  category,
  difficulty_level,
  reading_time_minutes,
  tags,
  status,
  seo_title,
  seo_description,
  seo_keywords
) VALUES (
  'Command Center: Your AI-Powered Trading Hub',
  'command-center-guide',
  'Master the Command Center - ChartingPath''s universal interface for navigation, research, automation, and AI assistance. Learn keyboard shortcuts and power-user techniques.',
  '# Command Center: Your AI-Powered Trading Hub

The **Command Center** is the beating heart of ChartingPath—a unified interface that puts every platform capability at your fingertips. Think of it as a trading-focused Spotlight or command palette that combines navigation, research, automation, and AI assistance into one seamless experience.

---

## Opening the Command Center

### Desktop
Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux) from anywhere in the platform.

### Mobile
Tap the **sparkle button** (floating action button) in the bottom-right corner of your screen.

---

## The Four Pillars

### 1. Quick Actions
Pre-built prompts that handle the most common trading workflows:

- **Find A-quality patterns forming now** - Scans all 8,500+ instruments for the best setups
- **What''s moving in the markets?** - Quick market pulse with key patterns on major indices
- **Generate a Pine Script strategy** - Creates TradingView-ready automation code
- **Teach me a chart pattern** - Interactive pattern education with real examples

### 2. Navigate
Instantly jump to any section of the platform:

| Command | Shortcut | Destination |
|---------|----------|-------------|
| Dashboard | G D | Command center with live charts |
| Pattern Screener | G S | Live pattern detection |
| Pattern Lab | G L | Research & backtest environment |
| My Alerts | G A | Alert management |
| My Scripts | G C | Pine Script library |
| Learning Center | G E | Education & tutorials |

### 3. Research
AI-powered market analysis at conversational speed:

- **Find bullish patterns** - Searches for bull flags, ascending triangles, etc.
- **Get pattern statistics** - Historical win rates and R:R performance data
- **Scan crypto patterns** - BTC, ETH, SOL, and major altcoins

### 4. Automate
Convert research into action:

- **Create a pattern alert** - Set up notifications for specific patterns on specific instruments
- **Build custom Pine Script** - Generate TradingView strategy code from natural language

---

## AI Chat Mode

When you type a question that doesn''t match a command, or when you select any AI-powered action, the Command Center transitions into **Chat Mode**. This is a full conversational interface where you can:

- Ask follow-up questions
- Request clarifications
- Drill deeper into specific patterns or instruments
- Generate and iterate on Pine Script code

### Chat Tips
1. **Be specific:** "Show me bull flags on AAPL 1h timeframe" works better than "show me patterns"
2. **Iterate:** If results aren''t quite right, refine your criteria in follow-up messages
3. **Request alternatives:** "What about B-quality patterns?" or "Try 4h timeframe instead"

---

## Power User Techniques

### Keyboard-First Navigation
Never leave the keyboard:
1. Press ⌘K to open
2. Start typing to filter commands
3. Use ↑↓ arrows to navigate
4. Press Enter to select
5. Press Esc to close

### Quick Pattern Lookups
Type the instrument symbol directly:
- "AAPL patterns" → Shows all patterns forming on Apple
- "BTC bull flag" → Searches for bull flag specifically on Bitcoin
- "SPY 1h" → Patterns on SPY at 1-hour timeframe

### Natural Language Automation
Describe what you want in plain English:
- "Alert me when a head and shoulders forms on NVDA"
- "Create a Pine Script for trading descending triangles on crypto"
- "What''s the historical win rate for bull flags on tech stocks?"

---

## Mobile Experience

On mobile devices, the Command Center opens as a **bottom drawer** that''s designed for thumb-friendly interaction:

- Swipe up to see more results
- Tap Quick Action cards for one-tap prompts
- Type in the search bar for custom queries
- The chat interface expands to 70% of screen height for comfortable reading

---

## Under the Hood

The Command Center is powered by an intelligent orchestrator that:

1. **Resolves intent** - Understands what you''re asking for
2. **Gathers data** - Queries pattern databases, historical stats, and market data
3. **Generates responses** - Provides actionable insights, not generic answers
4. **Handles edge cases** - When exact matches aren''t found, suggests "close matches"

The AI is programmed as a friendly expert assistant—never robotic, always helpful, and proactive about finding solutions even when initial criteria don''t yield results.

---

## Related Articles

- [Platform Glossary](/blog/platform-glossary) - Official terminology reference
- [Chart Types Explained](/blog/chart-types-explained) - Understanding different chart views
- [Platform FAQ](/blog/platform-faq) - Common questions answered',
  'Platform Guide',
  'beginner',
  8,
  ARRAY['command center', 'AI', 'navigation', 'automation', 'keyboard shortcuts', 'trading assistant'],
  'published',
  'Command Center Guide - AI-Powered Trading Hub | ChartingPath',
  'Master the Command Center - ChartingPath''s universal interface for navigation, research, automation, and AI assistance.',
  ARRAY['command center', 'trading ai', 'keyboard shortcuts', 'pattern search', 'pine script generator']
);

-- Chart Types Explained Article
INSERT INTO public.learning_articles (
  title,
  slug,
  excerpt,
  content,
  category,
  difficulty_level,
  reading_time_minutes,
  tags,
  status,
  seo_title,
  seo_description,
  seo_keywords
) VALUES (
  'Chart Types Explained: Study Chart, Full Chart, and More',
  'chart-types-explained',
  'Understand the different chart types in ChartingPath and when to use each one. From quick Thumbnail Charts to professional Full Charts, master your charting workflow.',
  '# Chart Types Explained: Study Chart, Full Chart, and More

ChartingPath provides multiple chart types optimized for different stages of your trading workflow. Understanding when to use each will make you more efficient and effective.

---

## Chart Type Overview

| Chart Type | Purpose | Interactive | Where Found |
|------------|---------|-------------|-------------|
| Thumbnail Chart | Quick preview | No | Screener results, cards |
| Study Chart | Pattern analysis | Limited | Pattern pages, articles |
| Full Chart | Deep research | Yes | Dashboard, Pattern Lab |
| Signal Chart | Trade setup | Limited | Alerts, notifications |

---

## Thumbnail Chart

The **Thumbnail Chart** is a compact, performance-optimized preview designed for scanning and quick visual recognition.

### Characteristics
- **Size:** Small inline preview (typically 200-300px wide)
- **Interactivity:** None (click to expand)
- **Data:** Last 50-100 bars
- **Rendering:** Minimal overlays for speed

### Best Used For
- Quickly scanning screener results
- Comparing multiple patterns at once
- Visual confirmation before clicking through
- Mobile browsing

### Example Locations
- Pattern Screener grid view
- Alert notification cards
- Dashboard pattern feed
- Watchlist quick views

---

## Study Chart

The **Study Chart** is the primary research visualization for learning and analyzing patterns in educational contexts.

### Characteristics
- **Size:** Medium (fills content area)
- **Interactivity:** Limited (hover tooltips, zoom)
- **Data:** Full pattern context (typically 100-300 bars)
- **Overlays:** Pattern zones, annotations, trade markers

### Key Features
- **Pattern Zone Overlays:** Shaded areas showing support, resistance, and trendlines
- **Trade Markers:** Amber entry arrows, horizontal SL/TP lines
- **Technical Indicators:** EMA, SMA, Bollinger Bands when relevant
- **Candlestick Colors:** Green = up from previous close, Red = down

### Best Used For
- Understanding pattern structure
- Learning entry/exit placement
- Reviewing historical examples
- Educational content consumption

### Example Locations
- Pattern Library detail pages
- Learning Center articles
- Historical pattern examples
- Quiz and practice interfaces

---

## Full Chart

The **Full Chart** is the professional-grade, fully interactive chart for serious research and analysis.

### Characteristics
- **Size:** Large (maximizes available space)
- **Interactivity:** Full (scale, pan, draw, annotate)
- **Data:** Extended history (user-configurable)
- **Overlays:** All indicators and drawing tools available

### Key Features
- **Manual Scaling:** Drag the price scale to zoom vertically
- **Vertical Panning:** Shift + Left Click drag OR Middle-mouse drag
- **Reset Button:** Restore auto-scaling and fit content
- **Drawing Tools:** Trendlines, horizontal lines, rectangles
- **Timeframe Selection:** Switch between 1m, 5m, 15m, 1h, 4h, D, W, M

### Professional Interactions
The Full Chart follows institutional charting standards:

1. **Vertical Scaling:** Click and drag the right-side price axis to manually adjust the vertical range
2. **Horizontal Scrolling:** Scroll wheel or drag the chart area
3. **Vertical Panning:** Hold Shift and drag, or use middle mouse button
4. **Reset:** Click the ↺ button to restore auto-fit

### Best Used For
- Deep pattern analysis
- Backtesting validation
- Multi-timeframe research
- Strategy development

### Example Locations
- Dashboard Command Center
- Pattern Lab research interface
- Full Chart Viewer (expanded view)
- FullChartViewer modal

---

## Signal Chart

The **Signal Chart** is a specialized visualization that emphasizes trade setup information over general price action.

### Characteristics
- **Size:** Medium
- **Interactivity:** Minimal
- **Data:** Focused on pattern timeframe
- **Overlays:** Entry, Stop Loss, Take Profit prominently displayed

### Key Features
- **Entry Zone:** Highlighted area or marker showing entry price
- **Stop Loss Line:** Red dashed horizontal line
- **Take Profit Line:** Green dashed horizontal line
- **R:R Visualization:** Distance relationship between SL and TP

### Best Used For
- Quick trade setup review
- Alert notifications
- Pattern confirmation
- Mobile trading decisions

### Example Locations
- Alert cards and notifications
- Pattern detection results
- Trade setup previews
- Email alert embeds

---

## Chart Styling Standards

All ChartingPath charts follow consistent institutional styling:

### Colors
- **Background:** Dark (#0f0f0f)
- **Up candles:** Green (#22c55e)
- **Down candles:** Red (#ef4444)
- **Entry markers:** Amber (#f59e0b)
- **Stop Loss:** Red dashed line
- **Take Profit:** Green dashed line

### Candle Logic
ChartingPath uses a normalized coloring system:
- **Green** = Current close is higher than previous close
- **Red** = Current close is lower than previous close

This differs from some platforms that compare open vs. close of the same candle.

### Margin Calculation
Charts use dynamic price margins based on volatility:
- Low volatility (<2%): Tight 1% margins
- High volatility (>10%): Wider 8% padding
- This ensures candles always appear "tall" and responsive

---

## Switching Between Charts

### Thumbnail → Full
Click any Thumbnail Chart to open the Full Chart Viewer in a modal or navigate to the full detail page.

### Study → Full
On pattern detail pages, look for the "Expand" or "Full Chart" button to switch to the interactive Full Chart view.

### Full → Thumbnail
Not typically needed, but the Screener provides grid view for thumbnail browsing.

---

## Mobile Considerations

On mobile devices:
- **Thumbnail Charts** load by default in lists for performance
- **Full Charts** support touch gestures (pinch zoom, drag pan)
- **Study Charts** display at full width with vertical scroll

---

## Related Articles

- [Platform Glossary](/blog/platform-glossary) - Official terminology reference
- [Command Center Guide](/blog/command-center-guide) - AI-powered trading hub
- [Platform FAQ](/blog/platform-faq) - Common questions answered',
  'Platform Guide',
  'beginner',
  10,
  ARRAY['charts', 'study chart', 'full chart', 'thumbnail chart', 'signal chart', 'visualization'],
  'published',
  'Chart Types Explained - Study Chart, Full Chart & More | ChartingPath',
  'Understand the different chart types in ChartingPath: Thumbnail, Study, Full, and Signal charts. Learn when to use each for optimal trading workflow.',
  ARRAY['chart types', 'study chart', 'full chart', 'trading charts', 'technical analysis charts']
);

-- Platform FAQ Article
INSERT INTO public.learning_articles (
  title,
  slug,
  excerpt,
  content,
  category,
  difficulty_level,
  reading_time_minutes,
  tags,
  status,
  seo_title,
  seo_description,
  seo_keywords
) VALUES (
  'ChartingPath FAQ: Your Questions Answered',
  'platform-faq',
  'Find answers to the most common questions about ChartingPath features, charts, Command Center, Pattern Lab, alerts, scripts, and more.',
  '# ChartingPath FAQ: Your Questions Answered

Everything you need to know about using ChartingPath effectively.

---

## General Questions

### What is ChartingPath?
ChartingPath is a pattern detection and trading research platform that scans 8,500+ instruments across stocks, crypto, forex, and commodities to identify chart patterns in real-time. It combines AI-powered analysis with professional-grade tools for backtesting, alert creation, and strategy automation.

### Is ChartingPath suitable for beginners?
Absolutely. The platform is designed with a progressive learning curve:
- **Learning Center:** Comprehensive education on all pattern types
- **Command Center:** Natural language interface—just ask questions
- **Quality Grades:** A-quality patterns are easier to identify and trade
- **Paper Trading:** Practice without risking real capital

### What markets do you cover?
- **US Stocks:** All NYSE, NASDAQ, and major exchange listings
- **Crypto:** BTC, ETH, SOL, and 100+ major cryptocurrencies
- **Forex:** Major and minor currency pairs
- **Commodities:** Gold, silver, oil, and agricultural futures

---

## Command Center

### How do I open the Command Center?
- **Desktop:** Press ⌘K (Mac) or Ctrl+K (Windows/Linux)
- **Mobile:** Tap the sparkle floating button in the bottom-right

### What can I ask the Command Center?
Anything related to trading and the platform:
- "Show me bull flags on AAPL"
- "What''s the win rate for head and shoulders patterns?"
- "Create an alert for wedge patterns on BTC"
- "Generate a Pine Script for trading triangles"

### Why is it called Command Center instead of Search?
Because it does much more than search. The Command Center is a universal interface for navigation, research, automation, and AI assistance. It''s designed to be the central hub for all platform interactions.

---

## Charts

### What''s the difference between Study Chart and Full Chart?
- **Study Chart:** Optimized for learning—shows patterns with annotations but limited interactivity
- **Full Chart:** Professional research tool—full interactivity including manual scaling, panning, and drawing tools

### How do I zoom and pan the Full Chart?
- **Vertical zoom:** Drag the right-side price scale up/down
- **Horizontal scroll:** Mouse wheel or drag the chart area
- **Vertical pan:** Hold Shift and drag, or use middle mouse button
- **Reset:** Click the ↺ button to restore auto-fit

### Why are some candles colored differently than my broker''s charts?
ChartingPath uses normalized candle coloring:
- **Green** = Close higher than *previous* close
- **Red** = Close lower than *previous* close

Some platforms compare open vs. close of the same candle. Our method shows the actual directional movement from bar to bar.

---

## Pattern Detection

### What is a Quality Grade?
Patterns are rated A through F based on:
- Trend alignment
- Volume confirmation
- Pattern structure clarity
- Risk/reward ratio

A-quality patterns have the highest historical win rates.

### How often are patterns updated?
Live pattern detection runs continuously. Results refresh every few minutes as new price data arrives.

### What timeframes are supported?
- 1 minute, 5 minute, 15 minute
- 1 hour, 4 hour
- Daily, Weekly, Monthly

---

## Pattern Lab

### What is Pattern Lab?
Pattern Lab is the research environment for validating trading strategies through historical backtesting. You can test different:
- Patterns and instruments
- Risk/reward ratios (2:1 to 5:1)
- Quality grade filters
- Exit strategies

### How accurate are the backtest results?
Backtests use historical pattern detections with actual price outcomes. Results include:
- Win rate
- Average R:R multiple
- Equity curve
- Trade-by-trade log

Note: Past performance doesn''t guarantee future results.

### What are the R:R tiers?
Pattern Lab tests multiple reward ratios simultaneously:
- **2:1** - Take profit is 2x the stop loss distance
- **3:1** - Take profit is 3x the stop loss distance
- **4:1** - Take profit is 4x the stop loss distance
- **5:1** - Take profit is 5x the stop loss distance

---

## Alerts

### How do I create an alert?
1. Open Command Center (⌘K)
2. Type "create alert" or select "Create a pattern alert"
3. Specify the instrument and pattern type
4. Confirm your settings

### What notification methods are available?
- In-app notifications
- Email alerts

### Can I set alerts for quality grades?
Yes. You can filter alerts to only trigger on A-quality or B-quality patterns.

---

## Scripts

### What are Scripts?
The Scripts section contains your exported Pine Script strategies for TradingView. All scripts are pattern-based and derived from validated backtest configurations.

### How do I generate a Pine Script?
1. Open Command Center (⌘K)
2. Type "generate pine script" or select the option
3. Describe your strategy parameters
4. Copy the generated code to TradingView

### Do scripts include optimized exit logic?
Yes. Scripts export with exit logic derived from your backtest optimization, including the specific R:R tier and stop loss placement that performed best historically.

---

## Account & Settings

### How do I change my display settings?
Navigate to the settings menu (gear icon) to adjust:
- Theme (light/dark)
- Default timeframe
- Notification preferences
- Alert settings

### Is there a mobile app?
ChartingPath is a progressive web app (PWA) optimized for mobile browsers. You can add it to your home screen for an app-like experience.

---

## Need More Help?

- **Command Center:** Ask any question in natural language
- **Learning Center:** Comprehensive guides and tutorials
- **Platform Glossary:** Official terminology reference

---

## Related Articles

- [Platform Glossary](/blog/platform-glossary) - Official terminology reference
- [Command Center Guide](/blog/command-center-guide) - AI-powered trading hub
- [Chart Types Explained](/blog/chart-types-explained) - Understanding different chart views',
  'Platform Guide',
  'beginner',
  15,
  ARRAY['FAQ', 'help', 'questions', 'support', 'getting started'],
  'published',
  'ChartingPath FAQ - Common Questions Answered',
  'Find answers to the most common questions about ChartingPath features, charts, Command Center, Pattern Lab, alerts, scripts, and more.',
  ARRAY['chartingpath faq', 'trading platform help', 'pattern detection questions', 'command center help']
);