interface PatternDetail {
  name: string;
  type: "reversal" | "continuation" | "candlestick";
  description: string;
  accuracy: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  
  // Detailed characteristics
  characteristics: string[];
  formation: string;
  confirmation: string;
  
  // Trading information
  entry: string;
  stopLoss: string;
  targetMethodology: string;
  timeframe: string;
  
  // Volume analysis
  volumeProfile: string;
  
  // Key success factors
  keyFactors: string[];
  
  // Common mistakes
  commonMistakes: string[];
  
  // Market psychology
  psychology: string;
  
  // Examples and notes
  additionalNotes?: string;
}

export const PATTERN_DETAILS: Record<string, PatternDetail> = {
  "head-shoulders": {
    name: "Head and Shoulders",
    type: "reversal",
    description: "Classic bearish reversal pattern with three peaks - left shoulder, head (highest), right shoulder. Volume decreases at right shoulder.",
    accuracy: "85%",
    difficulty: "Intermediate",
    
    characteristics: [
      "Three distinct peaks with the middle peak (head) being the highest",
      "Two roughly equal shoulders on either side of the head",
      "Clear neckline connecting the two valleys between shoulders and head",
      "Volume typically decreases from left shoulder to right shoulder"
    ],
    
    formation: "Forms after a significant uptrend when buying momentum begins to weaken. The pattern represents a shift from bullish to bearish sentiment as each successive rally becomes weaker.",
    
    confirmation: "Pattern is confirmed when price breaks below the neckline with increased volume. The break should be decisive, not just a temporary dip.",
    
    entry: "Enter short position on break below neckline with stop loss above right shoulder high",
    stopLoss: "Place stop loss 2-3% above the right shoulder high",
    targetMethodology: "Classic measured move: Target = Neckline - Pattern Height. Alternative targets include Fibonacci extensions at 61.8%, 100%, and 161.8% of pattern height.",
    timeframe: "Most reliable on daily and weekly charts. Pattern typically takes 4-12 weeks to form.",
    
    volumeProfile: "Volume should decline from left shoulder to head to right shoulder, indicating weakening buying pressure. Confirmation requires volume expansion on neckline break.",
    
    keyFactors: [
      "Right shoulder should be lower than left shoulder",
      "Clear volume divergence (decreasing volume on right shoulder)",
      "Clean neckline break with volume confirmation",
      "Pattern duration of at least 4 weeks for reliability"
    ],
    
    commonMistakes: [
      "Trading before neckline confirmation",
      "Ignoring volume divergence signals",
      "Setting stop loss too tight",
      "Missing the pattern due to minor price variations in shoulders"
    ],
    
    psychology: "Represents the exhaustion of bullish momentum. Initial rally (left shoulder) shows strong buying, head shows climactic buying, and right shoulder shows failed attempt to reach new highs, indicating seller control.",
    
    additionalNotes: "This pattern has one of the highest success rates among reversal patterns. It's particularly reliable when formed after a major uptrend and confirmed with proper volume analysis."
  },

  "inverted-head-shoulders": {
    name: "Inverted Head and Shoulders",
    type: "reversal",
    description: "Classic bullish reversal pattern with three troughs - left shoulder, head (lowest), right shoulder. Neckline break confirms upward momentum.",
    accuracy: "85%",
    difficulty: "Intermediate",
    
    characteristics: [
      "Three distinct troughs with the middle trough (head) being the lowest",
      "Two roughly equal shoulders on either side of the head",
      "Clear neckline connecting the two peaks between shoulders and head",
      "Volume typically increases from left shoulder through right shoulder"
    ],
    
    formation: "Forms after a significant downtrend when selling pressure begins to weaken. The pattern represents a shift from bearish to bullish sentiment as each successive decline becomes less severe.",
    
    confirmation: "Pattern is confirmed when price breaks above the neckline with strong volume expansion. The break should be decisive and sustained.",
    
    entry: "Enter long position on break above neckline with stop loss below right shoulder low",
    stopLoss: "Place stop loss 2-3% below the right shoulder low",
    targetMethodology: "Classic measured move: Target = Neckline + Pattern Height. Enhanced targets using Fibonacci extensions at 61.8%, 100%, and 161.8% with volume adjustment.",
    timeframe: "Most reliable on daily and weekly charts. Pattern typically takes 4-12 weeks to form for optimal reliability.",
    
    volumeProfile: "Volume should increase from left shoulder through right shoulder formation, showing growing buying interest. Strong volume expansion on neckline break is crucial for confirmation.",
    
    keyFactors: [
      "Right shoulder should be higher than left shoulder",
      "Progressive volume increase through pattern formation",
      "Strong volume surge on neckline break (minimum 1.5x average)",
      "Clear three-touch neckline resistance"
    ],
    
    commonMistakes: [
      "Entering before neckline breakout confirmation",
      "Insufficient volume confirmation on breakout",
      "Placing stop loss too close to entry point",
      "Misidentifying normal correction as pattern formation"
    ],
    
    psychology: "Represents exhaustion of selling pressure and growing buyer confidence. Each decline becomes less severe, showing sellers losing control while buyers step in at higher levels.",
    
    additionalNotes: "Particularly reliable when formed at major support levels. The pattern works best when the overall market trend is beginning to shift from bearish to bullish."
  },

  "double-top": {
    name: "Double Top",
    type: "reversal",
    description: "Bearish reversal pattern with two equal peaks. Volume divergence at second peak confirms weakness.",
    accuracy: "78%",
    difficulty: "Beginner",
    
    characteristics: [
      "Two peaks at approximately the same price level",
      "Clear valley between the two peaks",
      "Volume divergence - lower volume on second peak",
      "Pattern typically spans 4-8 weeks"
    ],
    
    formation: "Forms when price reaches a resistance level twice but fails to break through, indicating weakening bullish momentum and potential reversal.",
    
    confirmation: "Confirmed when price breaks below the valley low (support level) with increased volume.",
    
    entry: "Enter short position on break below support level between the two peaks",
    stopLoss: "Place stop loss above the second peak high",
    targetMethodology: "Primary target = Support level - Pattern height. Additional targets include Fibonacci extensions and statistical targets at 50%, 80%, and 125% of pattern height.",
    timeframe: "Reliable on all timeframes, but most effective on daily charts with 4+ week formation period.",
    
    volumeProfile: "Volume should be higher on first peak and notably lower on second peak, showing weakening buying interest. Confirmation requires volume expansion on support break.",
    
    keyFactors: [
      "Peaks should be within 3% of each other",
      "Clear volume divergence between peaks",
      "Decisive break of support level",
      "Minimum 4-week pattern duration"
    ],
    
    commonMistakes: [
      "Trading on second peak without waiting for confirmation",
      "Ignoring volume divergence signals",
      "Setting unrealistic price targets",
      "Confusing consolidation with reversal pattern"
    ],
    
    psychology: "Shows market's inability to break resistance after two attempts, indicating distribution by smart money and eventual exhaustion of buying pressure.",
    
    additionalNotes: "One of the most reliable bearish reversal patterns. Success rate increases significantly when volume divergence is present and pattern takes adequate time to form."
  },

  "double-bottom": {
    name: "Double Bottom",
    type: "reversal",
    description: "Bullish reversal pattern with two equal troughs. Volume expansion on breakout confirms strength.",
    accuracy: "78%",
    difficulty: "Beginner",
    
    characteristics: [
      "Two troughs at approximately the same price level",
      "Clear peak between the two troughs (resistance level)",
      "Volume often increases on second trough formation",
      "Pattern typically spans 4-8 weeks for reliability"
    ],
    
    formation: "Forms when price finds support at the same level twice, indicating strong buying interest and potential trend reversal from bearish to bullish.",
    
    confirmation: "Confirmed when price breaks above the resistance level (peak between troughs) with strong volume.",
    
    entry: "Enter long position on break above resistance level between the two troughs",
    stopLoss: "Place stop loss below the second trough low",
    targetMethodology: "Primary target = Resistance level + Pattern height. Fibonacci extensions provide additional targets at 61.8%, 100%, and 161.8% levels.",
    timeframe: "Most effective on daily and weekly charts with minimum 4-week formation period.",
    
    volumeProfile: "Volume may increase on second trough formation, showing renewed buying interest. Strong volume expansion on resistance break is essential for confirmation.",
    
    keyFactors: [
      "Troughs should be within 3% of each other",
      "Volume expansion on breakout (minimum 1.5x average)",
      "Clean break above resistance level",
      "Adequate time between troughs (2+ weeks minimum)"
    ],
    
    commonMistakes: [
      "Entering before resistance breakout",
      "Insufficient volume confirmation",
      "Placing stop loss too close to entry",
      "Mistaking temporary bounce for pattern completion"
    ],
    
    psychology: "Demonstrates strong support level where buyers consistently step in, showing accumulation and eventual exhaustion of selling pressure.",
    
    additionalNotes: "More reliable when formed at major support levels or after extended downtrends. Pattern strength increases with time duration and volume confirmation."
  },

  "triple-top": {
    name: "Triple Top",
    type: "reversal",
    description: "Strong bearish reversal with three equal peaks. More reliable than double top with higher volume requirements.",
    accuracy: "80%",
    difficulty: "Advanced",
    
    characteristics: [
      "Three peaks at approximately the same resistance level",
      "Two valleys between the peaks at similar support levels",
      "Progressive volume decline across the three peaks",
      "Extended formation period (6-12 weeks typical)"
    ],
    
    formation: "Forms when price tests a strong resistance level three times but fails to break through, showing extreme weakening of bullish momentum.",
    
    confirmation: "Confirmed on break below the support level connecting the two valleys with significant volume increase.",
    
    entry: "Enter short position on decisive break below support level with volume confirmation",
    stopLoss: "Place stop loss above the third (final) peak",
    targetMethodology: "Measured move target = Support level - Pattern height. High reliability warrants aggressive targets using 125% and 161.8% Fibonacci extensions.",
    timeframe: "Most reliable on daily and weekly charts with extended formation periods.",
    
    volumeProfile: "Volume should progressively decline from first to third peak, showing clear distribution pattern. Heavy volume on support break confirms pattern completion.",
    
    keyFactors: [
      "All three peaks within 2-3% of each other",
      "Clear volume distribution pattern",
      "Strong support level connecting valleys",
      "Extended time frame for pattern development"
    ],
    
    commonMistakes: [
      "Acting on the formation before confirmation",
      "Underestimating the strength of the reversal signal",
      "Inadequate position sizing for high-probability setup",
      "Missing the pattern due to minor peak variations"
    ],
    
    psychology: "Represents extreme resistance at a price level with three failed breakout attempts, indicating major distribution and strong seller commitment.",
    
    additionalNotes: "Higher reliability than double tops due to additional confirmation. Pattern suggests strong institutional selling and often leads to significant price declines."
  },

  "triple-bottom": {
    name: "Triple Bottom",
    type: "reversal",
    description: "Strong bullish reversal with three equal troughs. More reliable than double bottom with volume confirmation needed.",
    accuracy: "80%",
    difficulty: "Advanced",
    
    characteristics: [
      "Three troughs at approximately the same support level",
      "Two peaks between the troughs at similar resistance levels",
      "Volume may increase on second and third trough formation",
      "Extended formation period (6-12 weeks typical)"
    ],
    
    formation: "Forms when price finds strong support at the same level three times, indicating powerful buying interest and accumulation.",
    
    confirmation: "Confirmed on break above the resistance level connecting the two peaks with strong volume expansion.",
    
    entry: "Enter long position on decisive break above resistance level with volume confirmation",
    stopLoss: "Place stop loss below the third (final) trough",
    targetMethodology: "Measured move target = Resistance level + Pattern height. Strong pattern reliability supports aggressive targets at 125% and 161.8% extensions.",
    timeframe: "Most effective on daily and weekly charts with substantial formation periods.",
    
    volumeProfile: "Volume may increase progressively through trough formation, showing growing buying interest. Strong volume surge on resistance break is crucial.",
    
    keyFactors: [
      "All three troughs within 2-3% of each other",
      "Volume expansion on breakout (minimum 2x average)",
      "Clear resistance level connecting peaks",
      "Substantial time between troughs for accumulation"
    ],
    
    commonMistakes: [
      "Premature entry before resistance break",
      "Insufficient volume confirmation requirements",
      "Conservative position sizing despite high probability",
      "Confusing temporary support bounces with pattern formation"
    ],
    
    psychology: "Shows extremely strong support with three successful defense attempts, indicating major accumulation and eventual exhaustion of selling pressure.",
    
    additionalNotes: "Higher success rate than double bottoms due to additional confirmation. Often marks major trend reversals and leads to significant bullish moves."
  },

  "bump-run-reversal": {
    name: "Bump-and-Run Reversal",
    type: "reversal",
    description: "Three-phase reversal pattern with trend acceleration followed by sharp reversal and trend continuation.",
    accuracy: "72%",
    difficulty: "Advanced",
    
    characteristics: [
      "Three distinct phases: lead-in, bump, and run",
      "Initial trend line break signals phase transition",
      "Steep acceleration in bump phase",
      "Sharp reversal back to original trend line"
    ],
    
    formation: "Forms during trend acceleration when price moves too far too fast, creating unsustainable momentum that leads to sharp reversal.",
    
    confirmation: "Confirmed when price breaks back through the original trend line with volume expansion in the run phase.",
    
    entry: "Enter on trend line break with direction of original trend",
    stopLoss: "Place beyond the extreme of the bump phase",
    targetMethodology: "Target based on return to trend line plus projection equal to lead-in phase magnitude. Conservative targets use 50-75% of lead-in range.",
    timeframe: "Works on all timeframes but most reliable on daily charts with multi-week formations.",
    
    volumeProfile: "Volume typically increases during bump phase acceleration and expands significantly during run phase reversal.",
    
    keyFactors: [
      "Clear three-phase structure",
      "Steep angle in bump phase (45+ degrees)",
      "Volume confirmation in run phase",
      "Original trend line acts as support/resistance"
    ],
    
    commonMistakes: [
      "Missing the initial trend line break signal",
      "Trading against the bump phase momentum",
      "Insufficient patience for full pattern development",
      "Poor risk management during volatile phases"
    ],
    
    psychology: "Represents market euphoria or panic followed by return to rational pricing as unsustainable moves are corrected.",
    
    additionalNotes: "Complex pattern requiring experience to identify. Most effective when combined with momentum indicators and volume analysis."
  },

  "island-reversal": {
    name: "Island Reversal",
    type: "reversal",
    description: "Gap-based reversal pattern isolated from main trend by exhaustion and breakaway gaps.",
    accuracy: "75%",
    difficulty: "Advanced",
    
    characteristics: [
      "Exhaustion gap followed by reversal gap",
      "Price action isolated between two gaps",
      "Usually occurs at trend extremes",
      "Pattern completion within 1-5 trading sessions"
    ],
    
    formation: "Forms when trend exhaustion creates a gap, followed quickly by reversal gap in opposite direction, isolating price action.",
    
    confirmation: "Confirmed when second gap closes with strong volume and price continues in reversal direction.",
    
    entry: "Enter on gap confirmation with tight stop loss beyond island extreme",
    stopLoss: "Place stop loss beyond the island high/low",
    targetMethodology: "Target based on return to pre-gap trend line. Aggressive targets use gap size projection in reversal direction.",
    timeframe: "Most common on daily charts, rare but powerful on weekly charts.",
    
    volumeProfile: "High volume typically accompanies both gap formations, showing intense buying/selling pressure followed by immediate reversal.",
    
    keyFactors: [
      "Clear gap isolation of price action",
      "Strong volume on both gaps",
      "Trend extreme location",
      "Quick pattern completion (1-5 days)"
    ],
    
    commonMistakes: [
      "Confusing single gaps with island formations",
      "Trading before second gap confirmation",
      "Inadequate risk management due to gap volatility",
      "Missing the rapid pattern development"
    ],
    
    psychology: "Shows extreme market sentiment reaching unsustainable levels followed by immediate reversal as participants realize overextension.",
    
    additionalNotes: "Rare but powerful pattern. Most effective at major trend extremes and often signals significant reversals."
  },

  "ascending-triangle": {
    name: "Ascending Triangle",
    type: "continuation",
    description: "Bullish continuation with horizontal resistance and ascending support. Volume decreases during consolidation.",
    accuracy: "83%",
    difficulty: "Beginner",
    
    characteristics: [
      "Horizontal resistance line at top",
      "Ascending support line connecting higher lows",
      "Volume typically decreases during formation",
      "Pattern duration of 3-8 weeks optimal"
    ],
    
    formation: "Forms during uptrends as buyers become more aggressive on pullbacks while sellers maintain consistent resistance level.",
    
    confirmation: "Confirmed on break above resistance with volume expansion of at least 1.5x average volume.",
    
    entry: "Enter long on resistance breakout with volume confirmation",
    stopLoss: "Place stop loss below most recent support low",
    targetMethodology: "Measured move: Target = Resistance + Triangle height. Additional targets using Fibonacci extensions at 61.8% and 100%.",
    timeframe: "Reliable on all timeframes, most common on daily charts.",
    
    volumeProfile: "Volume decreases during triangle formation, then expands significantly on upward breakout, confirming continuation.",
    
    keyFactors: [
      "Minimum three touches on resistance line",
      "Ascending support with at least two points",
      "Volume expansion on breakout",
      "Formation in context of existing uptrend"
    ],
    
    commonMistakes: [
      "Trading before resistance break",
      "Ignoring volume confirmation requirements",
      "Misidentifying sideways movement as ascending pattern",
      "Setting stop loss too close to breakout level"
    ],
    
    psychology: "Shows increasing buyer enthusiasm as they pay higher prices on each pullback while sellers remain committed to resistance level.",
    
    additionalNotes: "One of the most reliable continuation patterns. Success rate increases when formed after significant uptrend with proper volume confirmation."
  },

  "descending-triangle": {
    name: "Descending Triangle",
    type: "continuation",
    description: "Bearish continuation with horizontal support and descending resistance. Volume decreases during consolidation.",
    accuracy: "83%",
    difficulty: "Beginner",
    
    characteristics: [
      "Horizontal support line at bottom",
      "Descending resistance line connecting lower highs",
      "Volume typically decreases during formation",
      "Pattern duration of 3-8 weeks for reliability"
    ],
    
    formation: "Forms during downtrends as sellers become more aggressive on rallies while buyers maintain defense at support level.",
    
    confirmation: "Confirmed on break below support with volume expansion of at least 1.5x average volume.",
    
    entry: "Enter short on support breakdown with volume confirmation",
    stopLoss: "Place stop loss above most recent resistance high",
    targetMethodology: "Measured move: Target = Support - Triangle height. Fibonacci extensions at 61.8%, 100%, and 161.8% provide additional targets.",
    timeframe: "Effective on all timeframes, most reliable on daily charts with adequate formation time.",
    
    volumeProfile: "Volume decreases during pattern formation, then expands on downward breakout, confirming bearish continuation.",
    
    keyFactors: [
      "Minimum three touches on support line",
      "Descending resistance with at least two points",
      "Volume confirmation on breakdown",
      "Formation within existing downtrend context"
    ],
    
    commonMistakes: [
      "Entering before support breakdown",
      "Insufficient volume confirmation",
      "Confusing consolidation with descending pattern",
      "Premature stop loss placement"
    ],
    
    psychology: "Demonstrates increasing seller pressure as they accept lower prices on rallies while buyers defend specific support level.",
    
    additionalNotes: "Highly reliable bearish continuation pattern. Most effective when formed during established downtrends with proper volume analysis."
  },

  "symmetrical-triangle": {
    name: "Symmetrical Triangle",
    type: "continuation",
    description: "Neutral triangle with converging trend lines. Breakout direction determines trend continuation.",
    accuracy: "76%",
    difficulty: "Intermediate",
    
    characteristics: [
      "Converging trend lines - ascending support, descending resistance",
      "Decreasing volume during formation",
      "Neutral bias until breakout direction confirmed",
      "Pattern duration typically 3-12 weeks"
    ],
    
    formation: "Forms during trend pauses as buyers and sellers reach equilibrium with decreasing volatility leading to eventual breakout.",
    
    confirmation: "Confirmed on breakout in either direction with volume expansion. Breakout should occur in upper 2/3 of triangle for reliability.",
    
    entry: "Enter in direction of breakout with volume confirmation",
    stopLoss: "Place stop loss on opposite side of triangle",
    targetMethodology: "Classic Measured Move: Target = Breakout point ± Triangle height. Fibonacci extensions at 61.8%, 100%, 161.8% provide additional targets. Statistical targets show 80% completion rate.",
    timeframe: "Works on all timeframes, most reliable on daily charts with 3+ week formation.",
    
    volumeProfile: "Volume decreases throughout formation, creating coiling effect. Strong volume expansion on breakout (2x+ average) confirms direction.",
    
    keyFactors: [
      "Clear converging trend lines",
      "Breakout in upper 2/3 of triangle",
      "Strong volume confirmation (minimum 2x average)",
      "Adequate formation time (3+ weeks)"
    ],
    
    commonMistakes: [
      "Trading false breakouts near triangle apex",
      "Insufficient volume confirmation",
      "Wrong directional bias before breakout",
      "Inadequate risk management on both sides"
    ],
    
    psychology: "Represents market indecision and equilibrium between buyers and sellers, with eventual resolution determining trend direction.",
    
    additionalNotes: "Neutral pattern that can break either way. Success depends on proper breakout confirmation and tends to continue prevailing trend direction 70% of the time."
  },

  "bull-flag": {
    name: "Bull Flag",
    type: "continuation",
    description: "Brief consolidation in strong uptrend with parallel support and resistance lines sloping downward.",
    accuracy: "81%",
    difficulty: "Beginner",
    
    characteristics: [
      "Steep initial move up (flagpole)",
      "Brief consolidation period sloping downward",
      "Parallel support and resistance lines",
      "Light volume during flag formation"
    ],
    
    formation: "Forms after sharp upward move when profit-taking creates brief pause before trend continuation.",
    
    confirmation: "Confirmed on break above flag resistance with volume expansion.",
    
    entry: "Enter long on break above flag resistance",
    stopLoss: "Place stop loss below flag support",
    targetMethodology: "Target = Flag breakout + Flagpole height. Typically achieves 80% of flagpole projection.",
    timeframe: "Most common on intraday and daily charts, formation period 1-4 weeks.",
    
    volumeProfile: "High volume on flagpole formation, light volume during flag, heavy volume on breakout continuation.",
    
    keyFactors: [
      "Strong initial move (flagpole)",
      "Brief consolidation period",
      "Volume pattern: high-low-high",
      "Upward breakout with volume"
    ],
    
    commonMistakes: [
      "Entering during flag formation",
      "Misidentifying longer consolidations as flags",
      "Inadequate volume confirmation",
      "Setting unrealistic profit targets"
    ],
    
    psychology: "Represents brief profit-taking in strong uptrend, with buyers quickly regaining control for trend continuation.",
    
    additionalNotes: "High-probability continuation pattern in strong trends. Most reliable when flag duration is less than 25% of flagpole formation time."
  },

  "bear-flag": {
    name: "Bear Flag",
    type: "continuation",
    description: "Brief consolidation in strong downtrend with parallel support and resistance lines sloping upward.",
    accuracy: "81%",
    difficulty: "Beginner",
    
    characteristics: [
      "Steep initial move down (flagpole)",
      "Brief consolidation period sloping upward",
      "Parallel support and resistance lines",
      "Light volume during flag formation"
    ],
    
    formation: "Forms after sharp downward move when short-covering creates brief pause before trend continuation.",
    
    confirmation: "Confirmed on break below flag support with volume expansion.",
    
    entry: "Enter short on break below flag support",
    stopLoss: "Place stop loss above flag resistance",
    targetMethodology: "Target = Flag breakdown - Flagpole height. Typically achieves 80% of flagpole projection downward.",
    timeframe: "Common on intraday and daily charts, formation period typically 1-4 weeks.",
    
    volumeProfile: "High volume on flagpole formation, light volume during flag, heavy volume on breakdown continuation.",
    
    keyFactors: [
      "Sharp initial decline (flagpole)",
      "Brief upward-sloping consolidation",
      "Volume pattern: high-low-high",
      "Downward breakdown with volume"
    ],
    
    commonMistakes: [
      "Trading during flag formation instead of waiting",
      "Confusing longer corrections with bear flags",
      "Missing volume confirmation signals",
      "Conservative profit targets in strong downtrends"
    ],
    
    psychology: "Shows brief short-covering or bargain hunting in strong downtrend, with sellers quickly resuming control.",
    
    additionalNotes: "Reliable bearish continuation pattern. Most effective when flag retraces less than 38% of flagpole decline and forms quickly."
  },

  "pennant": {
    name: "Pennant",
    type: "continuation",
    description: "Small symmetrical triangle after strong move. Similar to flag but triangular shape with converging lines.",
    accuracy: "78%",
    difficulty: "Intermediate",
    
    characteristics: [
      "Strong initial move (flagpole)",
      "Small symmetrical triangle formation",
      "Converging support and resistance lines",
      "Brief formation period (1-3 weeks)"
    ],
    
    formation: "Forms after strong directional move when brief consolidation creates small triangle before trend continuation.",
    
    confirmation: "Confirmed on breakout in direction of prior trend with volume expansion.",
    
    entry: "Enter in direction of breakout from pennant",
    stopLoss: "Place stop loss on opposite side of pennant",
    targetMethodology: "Target = Breakout point + Flagpole height in breakout direction. Success rate approximately 78% for full target achievement.",
    timeframe: "Most common on daily charts with 1-3 week formation periods.",
    
    volumeProfile: "High volume on initial move, declining volume in pennant, expansion on breakout.",
    
    keyFactors: [
      "Strong preceding move",
      "Small triangular consolidation",
      "Quick formation (1-3 weeks maximum)",
      "Breakout with volume confirmation"
    ],
    
    commonMistakes: [
      "Confusing pennants with larger triangle patterns",
      "Trading before clear breakout",
      "Ignoring volume confirmation requirements",
      "Expecting continuation when formation takes too long"
    ],
    
    psychology: "Brief pause in strong trend as participants take profits before resuming directional move.",
    
    additionalNotes: "Reliable short-term continuation pattern. Most effective when formation is quick and follows strong directional move."
  },

  "cup-handle": {
    name: "Cup with Handle",
    type: "continuation",
    description: "Bullish continuation resembling a cup with rounded bottom followed by small downward handle.",
    accuracy: "79%",
    difficulty: "Intermediate",
    
    characteristics: [
      "U-shaped or rounded bottom formation (cup)",
      "Return to resistance level of cup",
      "Brief pullback forming handle",
      "Volume pattern: high-low-high"
    ],
    
    formation: "Forms during uptrends when stock consolidates in rounded bottom then pulls back slightly before breakout continuation.",
    
    confirmation: "Confirmed on breakout above handle resistance with strong volume.",
    
    entry: "Enter long on breakout above handle resistance",
    stopLoss: "Place stop loss below handle low",
    targetMethodology: "Target = Breakout point + Cup depth. Conservative targets use 75% of cup depth projection.",
    timeframe: "Most reliable on weekly and daily charts with 7+ week cup formation.",
    
    volumeProfile: "Volume decreases during cup formation, stays light in handle, expands strongly on breakout.",
    
    keyFactors: [
      "Well-formed cup with rounded bottom",
      "Handle retraces less than 1/3 of cup advance",
      "Volume expansion on breakout",
      "Adequate time for cup formation (7+ weeks)"
    ],
    
    commonMistakes: [
      "Trading V-shaped bottoms instead of rounded cups",
      "Accepting deep handle retracements",
      "Insufficient volume confirmation",
      "Premature entry before handle completion"
    ],
    
    psychology: "Shows healthy consolidation and base-building before renewed bullish momentum.",
    
    additionalNotes: "Popular among growth stock traders. Most reliable when cup takes 7+ weeks to form and handle retraces modestly."
  },

  // Candlestick patterns
  "hammer": {
    name: "Hammer",
    type: "candlestick",
    description: "Bullish reversal candlestick with long lower shadow (2-3x body size) and small body at upper range.",
    accuracy: "70%",
    difficulty: "Beginner",
    
    characteristics: [
      "Small body at upper end of trading range",
      "Long lower shadow (2-3x body length)",
      "Little to no upper shadow",
      "Appears after downtrend"
    ],
    
    formation: "Forms when selling pressure drives price down but buyers step in strongly, pushing price back near opening level.",
    
    confirmation: "Next candle should close above hammer high with volume confirmation.",
    
    entry: "Enter long on next candle close above hammer high",
    stopLoss: "Place stop loss below hammer low",
    targetMethodology: "Initial target at nearby resistance level. Conservative approach targets previous swing high.",
    timeframe: "Effective on all timeframes, most reliable on daily charts.",
    
    volumeProfile: "Higher volume on hammer formation increases reliability of reversal signal.",
    
    keyFactors: [
      "Lower shadow 2-3x body length",
      "Body in upper half of range",
      "Appears at potential support level",
      "Confirmation by next candle"
    ],
    
    commonMistakes: [
      "Trading without confirmation candle",
      "Ignoring trend context",
      "Using in sideways markets",
      "Inadequate risk management"
    ],
    
    psychology: "Shows rejection of lower prices and potential shift from selling to buying pressure.",
    
    additionalNotes: "More reliable at key support levels. Color of body less important than shadow characteristics."
  },

  "hanging-man": {
    name: "Hanging Man",
    type: "candlestick",
    description: "Bearish reversal candlestick with long lower shadow appearing at top of uptrend.",
    accuracy: "68%",
    difficulty: "Beginner",
    
    characteristics: [
      "Small body at upper end of trading range",
      "Long lower shadow (2-3x body length)",
      "Little to no upper shadow",
      "Appears after uptrend"
    ],
    
    formation: "Forms when buyers initially drive price higher but sellers emerge strongly, though buyers manage to close near highs.",
    
    confirmation: "Next candle should close below hanging man low with volume.",
    
    entry: "Enter short on next candle close below hanging man low",
    stopLoss: "Place stop loss above hanging man high",
    targetMethodology: "Initial target at nearby support level. Conservative targets focus on previous swing lows.",
    timeframe: "Works on all timeframes, most significant on daily charts at trend tops.",
    
    volumeProfile: "Higher volume increases significance of potential reversal signal.",
    
    keyFactors: [
      "Lower shadow 2-3x body length",
      "Appears after significant uptrend",
      "Body color less important than structure",
      "Requires bearish confirmation"
    ],
    
    commonMistakes: [
      "Acting without bearish confirmation",
      "Using in wrong trend context",
      "Ignoring volume considerations",
      "Poor entry timing"
    ],
    
    psychology: "Shows potential exhaustion of buying pressure despite apparent strength in closing near highs.",
    
    additionalNotes: "Requires strong bearish confirmation to be reliable. Most effective at resistance levels."
  },

  "shooting-star": {
    name: "Shooting Star",
    type: "candlestick",
    description: "Bearish reversal candlestick with long upper shadow and small body at lower range.",
    accuracy: "72%",
    difficulty: "Beginner",
    
    characteristics: [
      "Small body at lower end of trading range",
      "Long upper shadow (2-3x body length)",
      "Little to no lower shadow",
      "Appears after uptrend"
    ],
    
    formation: "Forms when buyers push price higher but sellers take control, driving price back down near opening level.",
    
    confirmation: "Next candle should close below shooting star low with volume.",
    
    entry: "Enter short on break below shooting star low",
    stopLoss: "Place stop loss above shooting star high",
    targetMethodology: "Target nearby support levels or previous swing lows based on market structure.",
    timeframe: "Reliable on all timeframes, particularly significant on daily charts.",
    
    volumeProfile: "High volume on formation increases bearish reversal probability.",
    
    keyFactors: [
      "Upper shadow 2-3x body length",
      "Body in lower third of range",
      "Appears at potential resistance",
      "Bearish confirmation required"
    ],
    
    commonMistakes: [
      "Trading without confirmation",
      "Wrong trend identification",
      "Ignoring support/resistance context",
      "Inadequate stop loss placement"
    ],
    
    psychology: "Shows rejection of higher prices and potential shift from buying to selling pressure.",
    
    additionalNotes: "More reliable when formed at key resistance levels. Body color secondary to shadow structure."
  },

  "doji": {
    name: "Doji",
    type: "candlestick",
    description: "Indecision candlestick with equal or nearly equal open and close prices. Shows market uncertainty.",
    accuracy: "65%",
    difficulty: "Beginner",
    
    characteristics: [
      "Open and close at same or very similar levels",
      "Can have upper and lower shadows of varying lengths",
      "Small or non-existent body",
      "Indicates market indecision"
    ],
    
    formation: "Forms when neither buyers nor sellers can maintain control, resulting in equilibrium price action.",
    
    confirmation: "Requires confirmation by subsequent price action in either direction.",
    
    entry: "Enter based on confirmed breakout direction after doji",
    stopLoss: "Place stop loss beyond doji range",
    targetMethodology: "Target depends on breakout direction and nearby support/resistance levels.",
    timeframe: "Meaningful on all timeframes, most significant on daily charts at key levels.",
    
    volumeProfile: "Volume context helps determine significance of indecision signal.",
    
    keyFactors: [
      "Open equals close (or very close)",
      "Appears at significant price levels",
      "Market context important",
      "Requires directional confirmation"
    ],
    
    commonMistakes: [
      "Trading doji without confirmation",
      "Overemphasizing single doji formations",
      "Ignoring market trend context",
      "Poor timing of entry signals"
    ],
    
    psychology: "Represents balance between buying and selling forces, often preceding directional moves.",
    
    additionalNotes: "Most significant at trend extremes or key support/resistance levels. Various types include dragonfly and gravestone doji."
  },

  "bullish-harami": {
    name: "Bullish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bearish candle. Potential bullish reversal signal.",
    accuracy: "69%",
    difficulty: "Intermediate",
    
    characteristics: [
      "First candle: Large bearish candle",
      "Second candle: Small candle contained within first",
      "Second candle can be any color",
      "Shows slowing of bearish momentum"
    ],
    
    formation: "Forms when strong selling is followed by indecision, suggesting potential trend change.",
    
    confirmation: "Requires bullish confirmation by subsequent candle closing above harami high.",
    
    entry: "Enter long on confirmation candle close above harami high",
    stopLoss: "Place stop loss below harami low",
    targetMethodology: "Conservative targets at nearby resistance levels or previous swing highs.",
    timeframe: "Effective on daily and weekly charts for trend reversal identification.",
    
    volumeProfile: "Decreasing volume on second candle supports reversal interpretation.",
    
    keyFactors: [
      "Large first candle followed by small contained candle",
      "Appears after downtrend",
      "Volume decrease on second candle",
      "Bullish confirmation required"
    ],
    
    commonMistakes: [
      "Trading without confirmation",
      "Using in wrong trend context",
      "Ignoring volume patterns",
      "Premature position entry"
    ],
    
    psychology: "Shows exhaustion of selling pressure and potential shift to buyer control.",
    
    additionalNotes: "More reliable when second candle is white/green. Pattern suggests indecision after strong bearish move."
  },

  "bearish-harami": {
    name: "Bearish Harami",
    type: "candlestick",
    description: "Small candle inside previous large bullish candle. Potential bearish reversal signal.",
    accuracy: "69%",
    difficulty: "Intermediate",
    
    characteristics: [
      "First candle: Large bullish candle",
      "Second candle: Small candle contained within first",
      "Second candle can be any color",
      "Shows slowing of bullish momentum"
    ],
    
    formation: "Forms when strong buying is followed by indecision, suggesting potential trend change.",
    
    confirmation: "Requires bearish confirmation by subsequent candle closing below harami low.",
    
    entry: "Enter short on confirmation candle close below harami low",
    stopLoss: "Place stop loss above harami high",
    targetMethodology: "Target nearby support levels or previous swing lows based on market structure.",
    timeframe: "Most effective on daily and weekly charts at potential trend tops.",
    
    volumeProfile: "Decreasing volume on second candle strengthens bearish reversal signal.",
    
    keyFactors: [
      "Large first candle followed by small contained candle",
      "Appears after uptrend",
      "Volume decrease on second candle",
      "Bearish confirmation needed"
    ],
    
    commonMistakes: [
      "Acting without bearish confirmation",
      "Wrong trend context usage",
      "Volume pattern ignorance",
      "Early entry without validation"
    ],
    
    psychology: "Indicates exhaustion of buying pressure and potential shift to seller control.",
    
    additionalNotes: "More significant when second candle is black/red. Suggests indecision following strong bullish momentum."
  },

  "bullish-engulfing": {
    name: "Bullish Engulfing",
    type: "candlestick",
    description: "Large bullish candle completely engulfing previous bearish candle. Strong reversal signal.",
    accuracy: "73%",
    difficulty: "Beginner",
    
    characteristics: [
      "First candle: Bearish candle",
      "Second candle: Large bullish candle",
      "Second candle completely engulfs first candle's body",
      "Shows strong shift to buying pressure"
    ],
    
    formation: "Forms when selling pressure is overwhelmed by strong buying, completely reversing previous session's losses.",
    
    confirmation: "Pattern is self-confirming but next candle should maintain bullish momentum.",
    
    entry: "Enter long on engulfing candle close or next candle open",
    stopLoss: "Place stop loss below engulfing candle low",
    targetMethodology: "Initial targets at nearby resistance levels, extended targets at previous swing highs.",
    timeframe: "Reliable on all timeframes, most significant on daily charts at support levels.",
    
    volumeProfile: "High volume on engulfing candle increases reliability and bullish conviction.",
    
    keyFactors: [
      "Complete engulfment of previous candle body",
      "Appears after downtrend or at support",
      "High volume preferred on engulfing candle",
      "Strong bullish momentum shift"
    ],
    
    commonMistakes: [
      "Accepting partial engulfment",
      "Ignoring trend and support context",
      "Inadequate volume confirmation",
      "Poor risk management execution"
    ],
    
    psychology: "Shows complete rejection of bearish sentiment and strong commitment by buyers.",
    
    additionalNotes: "One of the most reliable candlestick reversal patterns. Particularly effective at key support levels."
  },

  "bearish-engulfing": {
    name: "Bearish Engulfing",
    type: "candlestick",
    description: "Large bearish candle completely engulfing previous bullish candle. Strong reversal signal.",
    accuracy: "73%",
    difficulty: "Beginner",
    
    characteristics: [
      "First candle: Bullish candle",
      "Second candle: Large bearish candle",
      "Second candle completely engulfs first candle's body",
      "Shows strong shift to selling pressure"
    ],
    
    formation: "Forms when buying pressure is overwhelmed by strong selling, completely reversing previous session's gains.",
    
    confirmation: "Pattern is self-confirming but next candle should maintain bearish momentum.",
    
    entry: "Enter short on engulfing candle close or next candle open",
    stopLoss: "Place stop loss above engulfing candle high",
    targetMethodology: "Initial targets at nearby support levels, extended targets at previous swing lows.",
    timeframe: "Effective on all timeframes, most impactful on daily charts at resistance levels.",
    
    volumeProfile: "High volume on engulfing candle confirms bearish reversal strength.",
    
    keyFactors: [
      "Complete engulfment of previous candle body",
      "Appears after uptrend or at resistance",
      "High volume on engulfing candle preferred",
      "Strong bearish momentum shift"
    ],
    
    commonMistakes: [
      "Trading partial engulfing patterns",
      "Wrong trend or resistance context",
      "Missing volume confirmation",
      "Inadequate stop loss management"
    ],
    
    psychology: "Demonstrates complete rejection of bullish sentiment and strong seller commitment.",
    
    additionalNotes: "Highly reliable bearish reversal pattern. Most effective when formed at key resistance levels with volume confirmation."
  },

  "spinning-top": {
    name: "Spinning Top",
    type: "candlestick",
    description: "Small body with long upper and lower shadows indicating indecision and potential reversal.",
    accuracy: "62%",
    difficulty: "Beginner",
    
    characteristics: [
      "Small body relative to shadows",
      "Long upper and lower shadows",
      "Body can be bullish or bearish",
      "Shows market indecision"
    ],
    
    formation: "Forms when both buyers and sellers are active but neither can maintain control, creating indecision.",
    
    confirmation: "Requires confirmation by subsequent price action to determine direction.",
    
    entry: "Enter based on confirmed breakout direction after spinning top",
    stopLoss: "Place stop loss beyond spinning top range",
    targetMethodology: "Target depends on breakout direction and market structure context.",
    timeframe: "Meaningful on all timeframes, most significant at trend extremes on daily charts.",
    
    volumeProfile: "Volume context helps determine significance of indecision signal.",
    
    keyFactors: [
      "Small body with long shadows on both sides",
      "Appears at potential turning points",
      "Market indecision indication",
      "Directional confirmation needed"
    ],
    
    commonMistakes: [
      "Trading without directional confirmation",
      "Overemphasizing single spinning top",
      "Ignoring overall market context",
      "Poor entry and exit timing"
    ],
    
    psychology: "Shows balance between bulls and bears, often preceding significant directional moves.",
    
    additionalNotes: "Most useful at trend extremes or key support/resistance levels. Requires patience for directional confirmation."
  }
};

export const getPatternDetails = (patternKey: string): PatternDetail | null => {
  return PATTERN_DETAILS[patternKey] || null;
};