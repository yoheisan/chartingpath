/**
 * Maps options strategy article slugs to their payoff diagram configurations.
 * Based on research from tastytrade, Option Alpha, and Investopedia.
 * 
 * Each configuration provides realistic example parameters for educational visualization
 * along with comprehensive beginner-friendly primer content.
 */

import { OptionsPayoffConfig, OptionsStrategyType } from '@/components/charts/OptionsPayoffChart';
import { OptionsStrategyPrimerData } from '@/components/blog/OptionsStrategyPrimer';

export interface OptionsArticleConfig {
  configs: OptionsPayoffConfig[];
  greeksTable?: GreeksTableData;
  educationalNotes?: string[];
  primer?: OptionsStrategyPrimerData;
}

export interface GreeksTableData {
  delta: { value: string; impact: string };
  gamma: { value: string; impact: string };
  theta: { value: string; impact: string };
  vega: { value: string; impact: string };
}

/**
 * Mapping of article slugs to options payoff configurations.
 * Uses realistic example values based on a $100 stock.
 */
export const OPTIONS_STRATEGY_MAPPING: Record<string, OptionsArticleConfig> = {
  // ===== COVERED CALL =====
  'covered-call': {
    configs: [
      {
        strategy: 'covered-call',
        stockPrice: 100,
        strikes: [105],
        premium: 2.50,
        daysToExpiration: 30,
        title: 'Covered Call Payoff Diagram',
        description: 'Stock at $100, selling $105 call for $2.50 premium. Max profit capped at strike price.',
      },
    ],
    greeksTable: {
      delta: { value: '0.65-0.70', impact: 'Reduced upside exposure from short call' },
      gamma: { value: 'Negative', impact: 'Delta changes work against you above strike' },
      theta: { value: 'Positive', impact: 'Time decay benefits the position daily' },
      vega: { value: 'Negative', impact: 'Rising IV hurts; falling IV helps' },
    },
    educationalNotes: [
      'Max profit = (Strike − Stock Price + Premium) × 100',
      'Break-even = Stock Price − Premium Received',
      'Best for: Generating income on existing holdings',
      'Risk: Full downside exposure on stock minus premium',
    ],
    primer: {
      strategyName: 'Covered Call',
      difficulty: 'beginner',
      whatIsIt: 'A covered call is one of the most beginner-friendly options strategies. It involves owning 100 shares of a stock and then selling (writing) a call option against those shares. By selling the call, you collect an upfront payment called a "premium." In exchange, you agree to sell your shares at a specific price (the strike price) if the stock rises above that level.',
      whyUseIt: 'Investors use covered calls to generate extra income from stocks they already own and plan to hold. It\'s like collecting rent on a property you own. Even if the stock goes nowhere, you keep the premium as profit. This strategy is popular among long-term investors who want to reduce their cost basis or enhance returns on stable holdings.',
      analogy: 'Think of it like renting out a spare room in your house. You still own the house (the stock), but you\'re collecting rent (the premium) from a tenant (the call buyer). If they decide to buy the house (exercise the call), you have to sell at the agreed price—but you keep the rent either way.',
      outlook: {
        direction: 'bullish',
        description: 'You expect the stock to stay relatively flat or rise slightly. You\'re comfortable selling your shares if the price rises above your strike price. This is a moderately bullish to neutral strategy—you want the stock to appreciate, but not too much beyond your strike.',
      },
      prerequisites: [
        {
          title: 'Call Options Basics',
          description: 'A call option gives the buyer the right to purchase 100 shares at a specific price. As a seller, you\'re obligated to deliver shares if exercised.',
        },
        {
          title: 'Stock Ownership',
          description: 'You must own at least 100 shares of the stock for each covered call you sell. This is what makes it "covered"—your obligation is backed by shares you own.',
        },
        {
          title: 'Strike Price',
          description: 'The price at which the call buyer can purchase your shares. Choose a strike above the current price if you want to keep your shares unless the stock rises significantly.',
        },
      ],
      construction: [
        {
          step: 'Own 100 shares of the underlying stock',
          detail: 'You need to already own or purchase the shares. Each option contract represents 100 shares.',
        },
        {
          step: 'Choose an expiration date',
          detail: 'Shorter expirations (30-45 days) are common. More time = more premium, but longer commitment.',
        },
        {
          step: 'Select a strike price above current stock price',
          detail: 'Popular choice: 5-10% above current price. Higher strikes = lower premium but more upside potential if stock rises.',
        },
        {
          step: 'Sell (write) the call option',
          detail: 'You receive the premium immediately. This is yours to keep regardless of what happens next.',
        },
      ],
      keyConcepts: [
        {
          term: 'Premium',
          definition: 'The price you receive for selling the call option. It\'s paid to you upfront and is yours to keep.',
          inContext: 'With a $100 stock and $105 strike, you might receive $2.50 per share ($250 total). This income reduces your effective purchase price of the stock.',
        },
        {
          term: 'Assignment',
          definition: 'When the option buyer exercises their right to buy your shares at the strike price.',
          inContext: 'If the stock closes above $105 at expiration, you\'ll likely be assigned and will sell your shares at $105—plus you kept the $2.50 premium.',
        },
        {
          term: 'Theta (Time Decay)',
          definition: 'Options lose value as time passes. This works in your favor as a seller.',
          inContext: 'Every day that passes, the call you sold becomes less valuable. If the stock stays below $105, the option expires worthless and you keep your shares AND the premium.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock stays below strike price ($105)',
          outcome: 'profit',
          explanation: 'The option expires worthless. You keep your 100 shares AND the $250 premium. Best outcome—you can sell another call next month.',
        },
        {
          scenario: 'Stock rises above strike price (e.g., to $110)',
          outcome: 'profit',
          explanation: 'You sell your shares at $105 (the strike), plus keep the $2.50 premium. Total: $107.50/share. Profit is capped, but you still made money.',
        },
        {
          scenario: 'Stock drops significantly (e.g., to $85)',
          outcome: 'loss',
          explanation: 'You lose money on the stock position. The $2.50 premium provides a small cushion, so you effectively paid $97.50/share. Loss = $12.50/share instead of $15.',
        },
      ],
      riskProfile: {
        maxProfit: '(Strike − Stock Price + Premium) × 100 = $750',
        maxLoss: 'Stock could go to $0, minus premium received = $9,750',
        breakeven: 'Stock Price − Premium = $97.50',
        probability: 'High (~70-80% when selling OTM calls)',
      },
      commonMistakes: [
        'Selling calls on a stock you\'re not willing to sell—don\'t get attached',
        'Choosing strikes too close to current price for minimal premium with high assignment risk',
        'Not accounting for dividends—ex-dividend dates can trigger early assignment',
        'Selling calls before earnings if you don\'t want assignment risk during volatility',
      ],
    },
  },

  // ===== IRON CONDOR =====
  'iron-condor': {
    configs: [
      {
        strategy: 'iron-condor',
        stockPrice: 100,
        strikes: [85, 90, 110, 115],
        premium: 3.00,
        daysToExpiration: 45,
        title: 'Iron Condor Payoff Diagram',
        description: 'Selling 90/85 put spread and 110/115 call spread for $3.00 credit. Profits if stock stays between short strikes.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Market neutral at entry; shifts as stock moves' },
      gamma: { value: 'Negative', impact: 'Position loses as stock moves toward either wing' },
      theta: { value: 'Positive', impact: 'Primary profit driver - time decay benefits' },
      vega: { value: 'Negative', impact: 'IV spike hurts; IV crush helps' },
    },
    educationalNotes: [
      'Max profit = Net credit received × 100',
      'Max loss = (Wing width − Net credit) × 100',
      'Break-evens: Short put − credit, Short call + credit',
      'Best for: Range-bound, low volatility environments',
    ],
    primer: {
      strategyName: 'Iron Condor',
      difficulty: 'intermediate',
      whatIsIt: 'An iron condor is a market-neutral options strategy that profits when the underlying stock stays within a specific price range until expiration. It combines two credit spreads: a bull put spread (betting the stock won\'t fall below a certain level) and a bear call spread (betting it won\'t rise above another level). You collect premium upfront and keep it all if the stock stays in your "profit zone."',
      whyUseIt: 'This strategy is popular because it has a high probability of profit—typically 60-80% depending on how wide you set your strikes. It\'s ideal for collecting income when you expect a stock or index to trade sideways. Unlike directional trades, you profit from the passage of time rather than predicting which way the market will move.',
      analogy: 'Imagine you\'re betting that a basketball game will have a total score between 180 and 220 points. You don\'t care which team wins—you just want the combined score to stay in that range. If it does, you win. If either team goes on a scoring frenzy or the game becomes a defensive battle, you lose.',
      outlook: {
        direction: 'neutral',
        description: 'You expect the stock to stay in a trading range with low volatility. You have no strong directional opinion and believe the current price level will hold for the next 30-60 days. This is a pure theta (time decay) play.',
      },
      prerequisites: [
        {
          title: 'Vertical Spreads',
          description: 'An iron condor is made of two vertical spreads. Understand how bull put spreads and bear call spreads work individually first.',
        },
        {
          title: 'Implied Volatility (IV)',
          description: 'IV affects option prices. High IV = more premium collected, but also more risk of large moves. Sell iron condors when IV is elevated and you expect it to decrease.',
        },
        {
          title: 'Probability of Profit (POP)',
          description: 'Wider strikes = higher probability of keeping your profit, but lower premium. Tighter strikes = more premium, but higher risk of loss.',
        },
      ],
      construction: [
        {
          step: 'Sell an out-of-the-money put (e.g., $90 put)',
          detail: 'This is your lower short strike. You want the stock to stay above this price.',
        },
        {
          step: 'Buy a further out-of-the-money put (e.g., $85 put)',
          detail: 'This is your "insurance" that caps your downside risk. The difference between strikes is your max loss per spread.',
        },
        {
          step: 'Sell an out-of-the-money call (e.g., $110 call)',
          detail: 'This is your upper short strike. You want the stock to stay below this price.',
        },
        {
          step: 'Buy a further out-of-the-money call (e.g., $115 call)',
          detail: 'This caps your upside risk. You now have defined risk on both sides.',
        },
      ],
      keyConcepts: [
        {
          term: 'Credit Received',
          definition: 'The net premium you collect for selling both spreads. This is your maximum profit.',
          inContext: 'If you collect $3.00 ($300 total), this is the most you can make. The trade is profitable if you keep any portion of this credit.',
        },
        {
          term: 'Wing Width',
          definition: 'The distance between your short and long strikes on each side (e.g., $90-$85 = $5 wide).',
          inContext: 'Wider wings = more risk but often more credit. Your max loss is the wing width minus your credit received.',
        },
        {
          term: 'Profit Zone',
          definition: 'The price range where you make money. It\'s between your short strikes, plus a buffer from the credit received.',
          inContext: 'With short strikes at $90 and $110 and $3 credit, you profit if the stock stays between $87 and $113 at expiration.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock stays between $90 and $110',
          outcome: 'profit',
          explanation: 'All options expire worthless. You keep the entire $300 credit. This is your best-case scenario.',
        },
        {
          scenario: 'Stock drops to $82 (below both put strikes)',
          outcome: 'loss',
          explanation: 'You\'re assigned on the put spread. Loss = $5 width - $3 credit = $2/share = $200 max loss.',
        },
        {
          scenario: 'Stock rises to $118 (above both call strikes)',
          outcome: 'loss',
          explanation: 'You\'re assigned on the call spread. Same math: $200 max loss.',
        },
      ],
      riskProfile: {
        maxProfit: 'Net credit received = $300',
        maxLoss: '(Wing width − Credit) × 100 = $200 per side',
        breakeven: 'Lower: $87 / Upper: $113',
        probability: 'Typically 60-80% depending on strike selection',
      },
      commonMistakes: [
        'Placing iron condors right before earnings or major events when big moves are expected',
        'Not adjusting when the stock approaches a short strike—waiting too long to defend',
        'Using strikes too narrow for the credit received, giving poor risk/reward',
        'Ignoring IV—selling when IV is already low means less premium and less cushion',
      ],
    },
  },

  // ===== STRADDLES AND STRANGLES =====
  'straddle-strangle': {
    configs: [
      {
        strategy: 'straddle',
        stockPrice: 100,
        strikes: [100],
        premium: 8.00,
        daysToExpiration: 30,
        title: 'Long Straddle Payoff',
        description: 'Buying ATM call and put at $100 strike for $8.00 total. Profits from large price movement.',
      },
      {
        strategy: 'strangle',
        stockPrice: 100,
        strikes: [95, 105],
        premium: 5.00,
        daysToExpiration: 30,
        title: 'Long Strangle Payoff',
        description: 'Buying $95 put and $105 call for $5.00 total. Lower cost but requires larger move.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Neutral at entry; becomes directional with movement' },
      gamma: { value: 'Positive', impact: 'Delta accelerates in your favor with movement' },
      theta: { value: 'Negative', impact: 'Time decay works against you daily' },
      vega: { value: 'Positive', impact: 'IV expansion helps; IV crush hurts' },
    },
    educationalNotes: [
      'Straddle: Same strike for both legs (ATM)',
      'Strangle: Different strikes (OTM options)',
      'Max loss = Total premium paid',
      'Best before: Earnings, FDA decisions, major events',
    ],
    primer: {
      strategyName: 'Straddle & Strangle',
      difficulty: 'intermediate',
      whatIsIt: 'Straddles and strangles are volatility strategies that profit when a stock makes a big move—in either direction. A straddle buys a call and put at the same strike price (at-the-money). A strangle buys a call and put at different strikes (out-of-the-money), which costs less but requires a bigger move to profit. You\'re essentially betting that the market is underestimating how much the stock will move.',
      whyUseIt: 'These strategies are perfect when you expect a big move but don\'t know which direction. Common use cases include trading before earnings announcements, FDA drug approvals, court rulings, or any binary event. If the move is bigger than what the options market predicted, you profit.',
      analogy: 'It\'s like betting on the total distance a car will travel, not which direction. You don\'t care if it goes north or south—you just need it to go far enough to cover your costs. If the car barely moves, you lose your bet.',
      outlook: {
        direction: 'volatile',
        description: 'You expect a major price move but are uncertain about direction. You believe the market is underpricing volatility—that the actual move will be larger than what current option prices suggest.',
      },
      prerequisites: [
        {
          title: 'Implied Volatility (IV)',
          description: 'High IV = expensive options. You want to buy straddles when IV is low relative to expected actual movement.',
        },
        {
          title: 'At-the-Money (ATM) vs Out-of-the-Money (OTM)',
          description: 'ATM options have the highest extrinsic value. OTM options are cheaper but need a bigger move to become profitable.',
        },
        {
          title: 'Time Decay',
          description: 'Both legs lose value every day. You need the move to happen quickly, preferably before expiration.',
        },
      ],
      construction: [
        {
          step: 'For a Straddle: Buy an ATM call and ATM put at the same strike',
          detail: 'Example: With stock at $100, buy the $100 call and $100 put. Total cost might be $8.00 ($800).',
        },
        {
          step: 'For a Strangle: Buy an OTM put and OTM call at different strikes',
          detail: 'Example: Buy the $95 put and $105 call. Cheaper than a straddle but requires a bigger move.',
        },
        {
          step: 'Choose expiration based on when you expect the move',
          detail: 'If earnings are in 5 days, use a 1-2 week expiration. More time = higher cost but more room for the move to occur.',
        },
      ],
      keyConcepts: [
        {
          term: 'IV Crush',
          definition: 'After events like earnings, implied volatility drops sharply—often 20-50%. This crushes option values.',
          inContext: 'Even if the stock moves, IV crush can still cause you to lose money if the move wasn\'t big enough to offset the volatility decrease.',
        },
        {
          term: 'Breakeven Points',
          definition: 'The prices the stock must reach for you to make a profit.',
          inContext: 'A $100 straddle costing $8 needs the stock to move below $92 or above $108 to profit at expiration.',
        },
        {
          term: 'Gamma Scalping',
          definition: 'An advanced technique where you hedge delta by trading the underlying stock as the price moves.',
          inContext: 'Professional traders use straddles for gamma scalping—profiting from the volatility itself rather than a single directional move.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock jumps from $100 to $115 after earnings',
          outcome: 'profit',
          explanation: 'Your $100 call is now worth ~$15. Even after IV crush, you profit because the move exceeded your $8 cost.',
        },
        {
          scenario: 'Stock drops from $100 to $85 after bad news',
          outcome: 'profit',
          explanation: 'Your $100 put is worth ~$15. Direction didn\'t matter—the magnitude of the move did.',
        },
        {
          scenario: 'Stock moves from $100 to $104 (small move)',
          outcome: 'loss',
          explanation: 'The move wasn\'t big enough. Your call gained some value but IV crush killed the remaining time value. You lose most of your $8 investment.',
        },
      ],
      riskProfile: {
        maxProfit: 'Unlimited (as the stock moves further from strikes)',
        maxLoss: 'Total premium paid ($800 for straddle, $500 for strangle)',
        breakeven: 'Straddle: $92 and $108 / Strangle: $90 and $110',
        probability: 'Lower (30-40% typical)—you need a big move',
      },
      commonMistakes: [
        'Buying straddles when IV is already high (expensive premiums, less edge)',
        'Holding through the event and getting crushed by IV collapse',
        'Not understanding how big the move needs to be—often larger than you expect',
        'Using too short an expiration without enough time for the move to unfold',
      ],
    },
  },

  // ===== BUTTERFLY SPREAD =====
  'butterfly-spread': {
    configs: [
      {
        strategy: 'butterfly',
        stockPrice: 100,
        strikes: [95, 100, 105],
        premium: 1.50,
        daysToExpiration: 30,
        title: 'Butterfly Spread Payoff',
        description: 'Buy $95 call, sell 2× $100 calls, buy $105 call. Max profit if stock expires exactly at $100.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Neutral at entry, changes near wings' },
      gamma: { value: 'Mixed', impact: 'Negative at middle strike, positive at wings' },
      theta: { value: 'Positive', impact: 'Benefits as expiration approaches at middle' },
      vega: { value: 'Negative', impact: 'Lower IV helps reach max profit' },
    },
    educationalNotes: [
      'Max profit = Width of wings − Net debit',
      'Max loss = Net debit paid',
      'Sweet spot: Stock at middle strike at expiration',
      'Best for: Pinpointing expected price level',
    ],
    primer: {
      strategyName: 'Butterfly Spread',
      difficulty: 'intermediate',
      whatIsIt: 'A butterfly spread is a low-risk, low-reward strategy that profits when a stock finishes at a specific price at expiration. It\'s constructed using three strike prices: you buy one option at a lower strike, sell two at the middle strike, and buy one at a higher strike. The position looks like a butterfly when graphed. Maximum profit occurs if the stock lands exactly at the middle strike.',
      whyUseIt: 'Butterflies are used when you have a precise price target in mind. They cost very little to enter (often $1-2 risk per spread) and can pay off 3:1 or more if your prediction is accurate. They\'re excellent for playing around specific levels like support/resistance or anticipated price targets after events.',
      analogy: 'It\'s like a lottery ticket with better odds. You\'re betting the stock will land in a very specific zone. If it does, you win big relative to your cost. If it doesn\'t, you lose your small investment.',
      outlook: {
        direction: 'neutral',
        description: 'You believe the stock will settle near a specific price at expiration. You have a precise target and expect low volatility as the stock gravitates toward that level.',
      },
      prerequisites: [
        {
          title: 'Understanding Spreads',
          description: 'A butterfly is a combination of a bull spread and bear spread sharing the same middle strike.',
        },
        {
          title: 'Strike Selection',
          description: 'The middle strike should be where you think the stock will settle. Wing width determines risk and reward.',
        },
        {
          title: 'Expiration Dynamics',
          description: 'Butterflies are most effective close to expiration when the position can reach max profit.',
        },
      ],
      construction: [
        {
          step: 'Buy 1 lower strike call (e.g., $95)',
          detail: 'This is your "floor"—provides profit potential if stock rises above this level.',
        },
        {
          step: 'Sell 2 middle strike calls (e.g., $100)',
          detail: 'This is your target price. Selling 2 options funds most of the position.',
        },
        {
          step: 'Buy 1 higher strike call (e.g., $105)',
          detail: 'This caps your risk if the stock rises too far above your target.',
        },
      ],
      keyConcepts: [
        {
          term: 'Wing Width',
          definition: 'The distance from the middle strike to either wing (e.g., $5 in a 95/100/105 butterfly).',
          inContext: 'A $5 wide butterfly has a max profit of $5 minus your cost. If you paid $1.50, max profit is $3.50 per share ($350).',
        },
        {
          term: 'Pinning',
          definition: 'When a stock finishes very close to a strike price at expiration.',
          inContext: 'Butterfly traders love when stocks "pin" at their middle strike—this is where maximum profit is achieved.',
        },
        {
          term: 'Debit Spread',
          definition: 'A spread that costs money to enter (you pay a net premium).',
          inContext: 'Your risk is limited to the $1.50 you paid. Unlike selling options, you can\'t lose more than your initial investment.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock closes exactly at $100',
          outcome: 'profit',
          explanation: 'Maximum profit achieved! The $95 call is worth $5, the two $100 calls expire worthless. Profit = $5 - $1.50 cost = $3.50 ($350).',
        },
        {
          scenario: 'Stock closes at $97 or $103',
          outcome: 'profit',
          explanation: 'Partial profit. You\'re within the wings so you make some money, just not the maximum.',
        },
        {
          scenario: 'Stock closes below $95 or above $105',
          outcome: 'loss',
          explanation: 'You lose your entire $1.50 investment. All options either expire worthless or offset each other.',
        },
      ],
      riskProfile: {
        maxProfit: '(Wing width − Debit) × 100 = $350',
        maxLoss: 'Net debit paid = $150',
        breakeven: '$96.50 and $103.50',
        probability: 'Lower (20-35%)—requires precise price targeting',
      },
      commonMistakes: [
        'Entering too early—butterflies work best in the last 1-2 weeks before expiration',
        'Setting the middle strike at the wrong price—it should be your actual target',
        'Paying too much for the butterfly, reducing your profit potential',
        'Not closing early if you have a nice profit—waiting for "max profit" can be greedy',
      ],
    },
  },

  // ===== CALENDAR/TIME SPREAD =====
  'time-spread': {
    configs: [
      {
        strategy: 'calendar-spread',
        stockPrice: 100,
        strikes: [100],
        premium: 2.00,
        daysToExpiration: 30,
        title: 'Calendar Spread Payoff',
        description: 'Sell near-term $100 call, buy longer-term $100 call. Profits from differential time decay.',
      },
    ],
    greeksTable: {
      delta: { value: 'Near Zero', impact: 'Slightly positive or negative based on skew' },
      gamma: { value: 'Mixed', impact: 'Short near-term, long far-term gamma' },
      theta: { value: 'Positive', impact: 'Near-term option decays faster (profit)' },
      vega: { value: 'Positive', impact: 'Rising IV helps the longer-dated option more' },
    },
    educationalNotes: [
      'Also called "Time Spread" or "Horizontal Spread"',
      'Profits from theta differential between expirations',
      'Max profit when stock at strike at front-month expiry',
      'Best for: Low-movement periods with IV expansion',
    ],
    primer: {
      strategyName: 'Calendar Spread (Time Spread)',
      difficulty: 'intermediate',
      whatIsIt: 'A calendar spread exploits the fact that options with different expiration dates decay at different rates. You sell a shorter-term option and buy a longer-term option at the same strike price. The near-term option loses value faster than the far-term option, creating a profit as time passes. It\'s also called a "time spread" or "horizontal spread."',
      whyUseIt: 'Calendar spreads are excellent for generating income when you expect a stock to stay near a specific price for a few weeks. They also benefit from increases in implied volatility (unlike iron condors). This makes them useful leading up to events when IV is expected to rise.',
      analogy: 'Imagine you\'re a landlord renting out two apartments. One lease ends next month (short-term renter), the other ends in a year (long-term renter). The short-term rent is cheaper but gets collected faster. You profit from the difference in how fast you collect rent versus your costs.',
      outlook: {
        direction: 'neutral',
        description: 'You expect the stock to stay near the strike price through the front-month expiration. You also benefit if implied volatility increases, which would inflate the value of your longer-dated option.',
      },
      prerequisites: [
        {
          title: 'Theta Decay Curve',
          description: 'Options lose value faster as expiration approaches. Near-term options have accelerating decay; far-term options decay slowly.',
        },
        {
          title: 'Implied Volatility',
          description: 'Higher IV increases all option prices, but longer-dated options benefit more because they have more time value.',
        },
        {
          title: 'Horizontal vs Vertical Spreads',
          description: 'Vertical spreads use different strikes/same expiration. Horizontal (calendar) spreads use same strike/different expirations.',
        },
      ],
      construction: [
        {
          step: 'Sell a near-term option at your target price',
          detail: 'Example: Sell a 30-day $100 call. This is what you\'re collecting premium on.',
        },
        {
          step: 'Buy a longer-term option at the same strike',
          detail: 'Example: Buy a 60-day $100 call. This costs more but decays slower.',
        },
        {
          step: 'Net debit = Far month cost − Near month credit',
          detail: 'The difference is your investment. You want the near-term option to decay faster than the far-term.',
        },
      ],
      keyConcepts: [
        {
          term: 'Time Decay Differential',
          definition: 'Near-term options decay faster than far-term options, especially in the last 30 days.',
          inContext: 'Your short near-term option might lose 3-5% of value daily, while your long far-term option only loses 1-2%. The difference is your profit.',
        },
        {
          term: 'Vega Positive',
          definition: 'The position benefits when implied volatility increases.',
          inContext: 'Unlike selling options outright, calendars like IV expansion. This makes them useful before events when IV is expected to rise.',
        },
        {
          term: 'Roll',
          definition: 'At front-month expiration, you can "roll" by selling another near-term option against your far-term option.',
          inContext: 'If the stock is still at $100 at expiration, you can sell another 30-day $100 call and repeat the process.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock stays at $100 through front-month expiration',
          outcome: 'profit',
          explanation: 'The near-term call expires worthless (you keep that premium). The far-term call retains most of its value. Net gain from the theta differential.',
        },
        {
          scenario: 'Stock moves to $110 (above strike)',
          outcome: 'loss',
          explanation: 'Both options go in-the-money. They start to move 1:1 with the stock, eliminating your edge from time decay.',
        },
        {
          scenario: 'Stock drops to $90 (well below strike)',
          outcome: 'loss',
          explanation: 'Both options lose value as they go further out-of-the-money. The far-term option you bought loses more than the near-term option you sold.',
        },
      ],
      riskProfile: {
        maxProfit: 'Varies—typically 50-100% of debit paid if stock pins at strike',
        maxLoss: 'Net debit paid (can be less if closed early)',
        breakeven: 'Depends on IV and theta—roughly $4-5 away from strike',
        probability: 'Moderate (40-50%)—needs stock to stay near strike',
      },
      commonMistakes: [
        'Entering when IV is already high—calendar spreads need room for IV expansion',
        'Not closing before front-month expiration—pin risk and assignment complications',
        'Ignoring skew—sometimes the near-term option is priced differently than expected',
        'Choosing too wide an expiration gap—reduces the theta differential edge',
      ],
    },
  },

  // ===== DELTA NEUTRAL HEDGING =====
  'delta-neutral-hedging': {
    configs: [
      {
        strategy: 'delta-neutral',
        stockPrice: 100,
        strikes: [100],
        premium: 4.00,
        daysToExpiration: 30,
        title: 'Delta Neutral Position',
        description: 'Hedged position that profits from movement regardless of direction. Requires active rebalancing.',
      },
    ],
    greeksTable: {
      delta: { value: '0 (hedged)', impact: 'No directional exposure initially' },
      gamma: { value: 'Positive', impact: 'Creates delta as price moves (profit opportunity)' },
      theta: { value: 'Negative', impact: 'Ongoing cost of maintaining the hedge' },
      vega: { value: 'Positive', impact: 'Higher volatility = more rebalancing profits' },
    },
    educationalNotes: [
      'Requires continuous delta rebalancing',
      'Profits from realized volatility exceeding implied',
      'Transaction costs are a major consideration',
      'Best for: High-frequency, systematic traders',
    ],
    primer: {
      strategyName: 'Delta Neutral Hedging',
      difficulty: 'advanced',
      whatIsIt: 'Delta neutral hedging is a sophisticated strategy that removes directional risk from a position. By balancing positive and negative delta (the measure of how much an option moves relative to the stock), you create a position that initially doesn\'t care which way the stock moves. Instead, you profit from the actual volatility of the stock—how much it moves around, regardless of direction.',
      whyUseIt: 'Professional traders and market makers use delta neutral strategies to isolate volatility as a tradeable asset. Instead of betting on direction (up or down), you\'re betting that the stock will move more (or less) than the options market predicts. If actual movement exceeds expected movement, you profit through a process called "gamma scalping."',
      analogy: 'Imagine you\'re a currency exchanger at an airport. You don\'t care if the euro goes up or down—you profit from the spread on every transaction. The more people exchange money (volatility), the more you make. Delta neutral trading works similarly: you profit from movement itself, not direction.',
      outlook: {
        direction: 'volatile',
        description: 'You have no directional opinion but believe the stock will experience significant price swings. You\'re trading volatility itself—profiting when actual movement exceeds what option prices implied.',
      },
      prerequisites: [
        {
          title: 'Delta (Δ)',
          description: 'Measures how much an option\'s price changes for each $1 move in the stock. A delta of 0.50 means the option moves $0.50 for every $1 stock move.',
        },
        {
          title: 'Gamma (Γ)',
          description: 'Measures how much delta changes as the stock moves. High gamma means delta shifts quickly, creating opportunities to trade.',
        },
        {
          title: 'Implied vs Realized Volatility',
          description: 'Implied volatility is what the market expects. Realized volatility is what actually happens. You profit when realized > implied.',
        },
        {
          title: 'Dynamic Hedging',
          description: 'Delta neutral positions require constant adjustment. As the stock moves, delta changes, and you must rebalance to stay neutral.',
        },
      ],
      construction: [
        {
          step: 'Calculate your portfolio\'s net delta',
          detail: 'Add up the deltas of all your positions. If you own 100 shares of stock, that\'s +100 delta. A call with 0.50 delta = +50 delta.',
        },
        {
          step: 'Offset with opposing delta',
          detail: 'If net delta is +100, sell options or short stock to add -100 delta. Now your position is delta neutral (net delta = 0).',
        },
        {
          step: 'Monitor and rebalance as price moves',
          detail: 'As the stock moves, delta changes due to gamma. Periodically rebalance by buying or selling shares to return to neutral.',
        },
        {
          step: 'Capture profits through rebalancing',
          detail: 'Each rebalance locks in small profits. If you bought low and sold high during swings, you keep those gains.',
        },
      ],
      keyConcepts: [
        {
          term: 'Delta',
          definition: 'The rate of change between an option\'s price and a $1 move in the underlying stock. Ranges from 0 to 1 for calls, -1 to 0 for puts.',
          inContext: 'By keeping delta at zero, your P&L doesn\'t change with small stock moves. You\'re isolated from direction.',
        },
        {
          term: 'Gamma',
          definition: 'How fast delta changes as the stock price moves. High gamma near ATM strikes.',
          inContext: 'Gamma creates new delta as the stock moves. This gives you something to trade—buying low and selling high during oscillations.',
        },
        {
          term: 'Theta',
          definition: 'The cost of holding options—they lose value daily due to time decay.',
          inContext: 'Delta neutral positions with long options bleed theta daily. Your gamma scalping profits must exceed theta costs.',
        },
        {
          term: 'Gamma Scalping',
          definition: 'The process of repeatedly rebalancing delta to capture profits from stock oscillations.',
          inContext: 'If a stock swings $5 up then $5 down, a gamma scalper might buy shares on the dip and sell on the rise, profiting from the round trip.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock swings between $95 and $105 multiple times',
          outcome: 'profit',
          explanation: 'Each swing lets you scalp delta. You buy shares when the stock dips (as delta goes negative), sell when it rises (as delta goes positive). Multiple round trips compound profits.',
        },
        {
          scenario: 'Stock moves $10 in one direction and stays there',
          outcome: 'breakeven',
          explanation: 'A single move in one direction is less profitable than oscillation. You may profit once from the move but lose on theta while waiting.',
        },
        {
          scenario: 'Stock stays flat at $100 for 30 days',
          outcome: 'loss',
          explanation: 'No movement = no gamma scalping opportunities. You lose theta daily with nothing to offset it.',
        },
      ],
      riskProfile: {
        maxProfit: 'Theoretically unlimited—more volatility = more scalping opportunities',
        maxLoss: 'Limited to the premium paid for options (if using straddles as the base)',
        breakeven: 'When gamma scalping profits equal theta decay',
        probability: 'Depends on realized volatility—profitable when actual movement exceeds expectations',
      },
      commonMistakes: [
        'Not accounting for transaction costs—frequent rebalancing incurs commissions and slippage',
        'Over-hedging—adjusting too frequently eats into profits from bid-ask spreads',
        'Under-hedging—not rebalancing enough lets delta drift and re-introduces directional risk',
        'Ignoring theta—the clock is always ticking on long options positions',
        'Trading during low volatility—not enough movement to overcome theta costs',
      ],
    },
  },

  // ===== GAMMA SCALPING =====
  'gamma-scalping': {
    configs: [
      {
        strategy: 'gamma-scalp',
        stockPrice: 100,
        strikes: [100],
        premium: 5.00,
        daysToExpiration: 14,
        title: 'Gamma Scalping Strategy',
        description: 'Long options with delta hedging. Scalps profits as gamma creates delta from price movement.',
      },
    ],
    greeksTable: {
      delta: { value: '0 (continuously hedged)', impact: 'Rebalanced to neutral after each move' },
      gamma: { value: 'Positive (high)', impact: 'Creates tradeable delta from movement' },
      theta: { value: 'Negative (high)', impact: 'Daily decay cost that must be overcome' },
      vega: { value: 'Positive', impact: 'Benefits from volatility spikes' },
    },
    educationalNotes: [
      'Buy high-gamma options, continuously hedge delta',
      'Profit = Scalped gains − Theta decay − Transaction costs',
      'Requires significant intraday price movement',
      'Best for: Active traders in volatile markets',
    ],
    primer: {
      strategyName: 'Gamma Scalping',
      difficulty: 'advanced',
      whatIsIt: 'Gamma scalping is the active implementation of delta neutral trading. You buy options (creating a long gamma position) and then continuously trade the underlying stock to stay delta neutral. As the stock oscillates, gamma creates delta in your favor. By buying shares when the stock dips and selling when it rises, you "scalp" small profits from each swing. The goal is for these scalping profits to exceed the theta decay of your options.',
      whyUseIt: 'Gamma scalping is a professional strategy used by market makers and volatility traders. It converts raw volatility into profit, regardless of whether the stock ends up higher or lower. If a stock is highly volatile (moving a lot intraday), gamma scalping can generate consistent profits from those oscillations.',
      analogy: 'You\'re like a surfer riding waves. Each wave (price swing) is an opportunity. You paddle out (buy options for gamma), then catch wave after wave (scalp delta). If the ocean is choppy (high volatility), you catch more waves. If it\'s flat (low volatility), you\'re just floating and losing energy (paying theta) waiting for action.',
      outlook: {
        direction: 'volatile',
        description: 'You expect significant intraday volatility—lots of back-and-forth price movement. You don\'t have a directional view; you\'re purely playing the magnitude of swings. This works best in choppy, ranging markets.',
      },
      prerequisites: [
        {
          title: 'Delta Neutral Positioning',
          description: 'You must understand how to calculate and maintain a delta neutral position by hedging with stock.',
        },
        {
          title: 'Gamma and Its Properties',
          description: 'Gamma is highest for ATM options and near-term expirations. This determines your hedge sensitivity.',
        },
        {
          title: 'Transaction Cost Analysis',
          description: 'Every hedge costs money in commissions and bid-ask spread. You need tight spreads and low costs to profit.',
        },
        {
          title: 'Real-Time Monitoring',
          description: 'Gamma scalping requires watching positions throughout the day and executing many trades.',
        },
      ],
      construction: [
        {
          step: 'Buy ATM straddle or strangle',
          detail: 'ATM options have the highest gamma. A 14-day expiration balances gamma with manageable theta.',
        },
        {
          step: 'Calculate initial delta and hedge to neutral',
          detail: 'If your straddle has +5 delta, short 5 shares to neutralize.',
        },
        {
          step: 'Set rebalancing triggers (e.g., every $1 move or 10 delta change)',
          detail: 'Too frequent = high costs. Too infrequent = missed opportunities.',
        },
        {
          step: 'Execute hedge adjustments as stock moves',
          detail: 'Stock up? Sell shares (your position got long delta). Stock down? Buy shares (you got short delta).',
        },
      ],
      keyConcepts: [
        {
          term: 'Gamma',
          definition: 'The rate of change of delta per $1 move in the stock. Measured per share of equivalent stock exposure.',
          inContext: 'If gamma is 0.10, a $1 stock rise adds +10 delta to your position. You\'d then short 10 shares to rebalance.',
        },
        {
          term: 'P&L from Gamma',
          definition: 'Profit from gamma = 0.5 × Gamma × (Price Move)². Bigger moves = exponentially more profit.',
          inContext: 'A $2 move creates 4× the profit of a $1 move (0.5 × 0.10 × 4 = $0.20 vs $0.05). Volatility compounds.',
        },
        {
          term: 'Theta Burn',
          definition: 'The daily cost of holding options, which must be overcome by scalping profits.',
          inContext: 'If your straddle costs $5 and has 14 days left, you lose ~$0.35/day to theta. You need to scalp more than that daily.',
        },
      ],
      scenarios: [
        {
          scenario: 'Stock oscillates $2 up and $2 down three times in a day',
          outcome: 'profit',
          explanation: 'Each round trip scalps approximately $20-40 depending on gamma. Three round trips might yield $60-120, far exceeding $35 daily theta.',
        },
        {
          scenario: 'Stock moves $5 in one direction and stays',
          outcome: 'breakeven',
          explanation: 'You profit from the initial move (gamma creates delta), but then you\'re stuck paying theta while waiting for the next move.',
        },
        {
          scenario: 'Stock stays within $0.50 range all day',
          outcome: 'loss',
          explanation: 'Minimal gamma scalping opportunity. You lose theta (~$35) with almost no offsetting profits. Repeated flat days compound losses.',
        },
      ],
      riskProfile: {
        maxProfit: 'Unlimited—proportional to realized volatility',
        maxLoss: 'Initial premium paid ($500 for a 5-point straddle)',
        breakeven: 'When cumulative scalped profits equal total theta paid',
        probability: 'Highly dependent on realized vs implied volatility',
      },
      commonMistakes: [
        'Trading in low-volatility environments—theta eats you alive',
        'Over-trading—transaction costs can wipe out scalping profits',
        'Using options with too short expiration—extreme theta acceleration',
        'Not having a clear rebalancing rule—either over-hedge or under-hedge',
        'Ignoring gamma decay—gamma decreases as you move away from ATM or near expiration',
      ],
    },
  },
};

/**
 * Get options payoff configuration for a given article slug.
 */
export function getOptionsStrategyConfig(slug: string): OptionsArticleConfig | null {
  return OPTIONS_STRATEGY_MAPPING[slug] || null;
}

/**
 * Check if an article has options payoff visualizations.
 */
export function hasOptionsPayoffChart(slug: string): boolean {
  return slug in OPTIONS_STRATEGY_MAPPING;
}

/**
 * Get all options strategy article slugs.
 */
export function getOptionsStrategySlugs(): string[] {
  return Object.keys(OPTIONS_STRATEGY_MAPPING);
}
