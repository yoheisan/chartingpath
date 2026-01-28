import { Link } from "react-router-dom";
import { ArrowLeft, Brain, CheckCircle, AlertTriangle, Target, Shield, Heart, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  SkillLevelSection,
  TradingRule,
  PatternChecklist,
  CommonMistakes,
  ProTip,
  RiskManagementBox,
  StatisticsBox,
  TableOfContents
} from "@/components/blog/ArticleSection";

const TradingPsychology = () => {
  const tocSections = [
    { id: 'introduction', title: 'Why Psychology Matters' },
    { id: 'emotional-enemies', title: 'The Four Emotional Enemies', level: 'novice' as const },
    { id: 'cognitive-biases', title: 'Cognitive Biases in Trading', level: 'intermediate' as const },
    { id: 'mental-framework', title: 'Building Mental Discipline', level: 'advanced' as const },
    { id: 'professional-mindset', title: 'The Professional Mindset', level: 'professional' as const },
    { id: 'daily-routines', title: 'Daily Mental Routines' },
    { id: 'recovery-strategies', title: 'Recovery from Losses' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link to="/learn" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Learning Center
        </Link>

        <article className="prose prose-lg dark:prose-invert max-w-none">
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">Psychology</Badge>
            <Badge variant="outline">Mental Game</Badge>
            <Badge variant="secondary">18 min read</Badge>
          </div>

          <h1 className="text-4xl font-bold mb-4">Trading Psychology: Mastering Your Mind for Market Success</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover why 80% of trading success comes from psychology, not strategy — and learn the mental frameworks used by professional traders to maintain emotional control in volatile markets.
          </p>

          <TableOfContents sections={tocSections} />

          <StatisticsBox 
            stats={[
              { label: 'Psychology Impact', value: '80%', description: 'Of trading success' },
              { label: 'Retail Failure', value: '90%', description: 'Lose money' },
              { label: 'Emotional Trades', value: '75%', description: 'Are losing trades' },
              { label: 'Recovery Time', value: '3-6mo', description: 'After major loss' },
            ]}
            title="Trading Psychology Statistics"
          />

          {/* Introduction */}
          <section id="introduction">
            <Alert className="mb-8 border-primary/50 bg-primary/5">
              <Brain className="h-5 w-5 text-primary" />
              <AlertDescription className="text-base">
                "The market is a device for transferring money from the impatient to the patient." — Warren Buffett. 
                Your greatest edge isn't your strategy — it's your ability to execute it flawlessly under emotional pressure.
              </AlertDescription>
            </Alert>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Every trader eventually discovers a frustrating truth: knowing <em>what</em> to do and actually <em>doing</em> it are completely different skills. 
              You can have the most profitable strategy in the world, but if fear causes you to exit winners early or greed pushes you to hold losers too long, 
              your results will suffer.
            </p>

            <p className="text-muted-foreground leading-relaxed mb-6">
              Trading psychology isn't about eliminating emotions — that's impossible. It's about understanding your emotional triggers, 
              building systems that protect you from yourself, and developing the mental resilience to execute your plan regardless of how you feel.
            </p>

            {/* Psychology Visualization */}
            <div className="my-8 p-8 rounded-xl border border-border bg-gradient-to-br from-purple-500/5 to-blue-500/5">
              <h3 className="text-xl font-bold text-center mb-8">The Trader's Emotional Cycle</h3>
              <div className="relative">
                <div className="flex justify-between items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[140px] text-center p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="text-3xl mb-2">😊</div>
                    <p className="font-semibold text-green-600 dark:text-green-400">Optimism</p>
                    <p className="text-xs text-muted-foreground">"This is easy!"</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="flex-1 min-w-[140px] text-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="text-3xl mb-2">🤑</div>
                    <p className="font-semibold text-yellow-600 dark:text-yellow-400">Euphoria</p>
                    <p className="text-xs text-muted-foreground">"I'm a genius!"</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="flex-1 min-w-[140px] text-center p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <div className="text-3xl mb-2">😰</div>
                    <p className="font-semibold text-orange-600 dark:text-orange-400">Anxiety</p>
                    <p className="text-xs text-muted-foreground">"Something's wrong"</p>
                  </div>
                  <div className="text-2xl text-muted-foreground">→</div>
                  <div className="flex-1 min-w-[140px] text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="text-3xl mb-2">😱</div>
                    <p className="font-semibold text-red-600 dark:text-red-400">Panic</p>
                    <p className="text-xs text-muted-foreground">"Get me out!"</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <div className="inline-block p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                    <div className="text-3xl mb-2">🧘</div>
                    <p className="font-semibold text-blue-600 dark:text-blue-400">Professional Trader</p>
                    <p className="text-xs text-muted-foreground">"This is just another trade"</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* EMOTIONAL ENEMIES - NOVICE */}
          <section id="emotional-enemies">
            <SkillLevelSection level="novice" title="The Four Emotional Enemies">
              <p className="text-muted-foreground mb-6">
                Before you can master trading psychology, you need to understand the four primary emotions that destroy trading accounts. 
                These aren't character flaws — they're evolutionary survival mechanisms that worked for our ancestors but sabotage our trading.
              </p>

              <div className="grid gap-4 mb-8">
                <Card className="bg-background/50 border-red-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">😨</span>
                      Fear
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3"><strong>How it manifests:</strong> Exiting winning trades too early, hesitating to enter valid setups, widening stops to avoid being stopped out, avoiding trading after losses.</p>
                    <p className="mb-3"><strong>Why it happens:</strong> The brain treats financial loss like physical danger. The amygdala triggers fight-or-flight responses that override logical thinking.</p>
                    <p><strong>The real cost:</strong> A study by Barber & Odean found that retail traders sell winning positions 50% more often than losing positions — leaving massive profits on the table.</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-yellow-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">🤑</span>
                      Greed
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3"><strong>How it manifests:</strong> Overtrading, increasing position sizes after wins, holding trades past targets, chasing moves you missed.</p>
                    <p className="mb-3"><strong>Why it happens:</strong> Dopamine released during winning trades creates addiction-like behavior. Your brain wants more of that feeling.</p>
                    <p><strong>The real cost:</strong> Traders who double position size after 3 consecutive wins lose 68% of those profits within 10 trades (behavioral finance research).</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-orange-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">😤</span>
                      Revenge Trading
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3"><strong>How it manifests:</strong> Taking impulsive trades immediately after a loss, increasing size to "win back" losses, abandoning your trading plan.</p>
                    <p className="mb-3"><strong>Why it happens:</strong> The brain experiences losses 2.5x more intensely than equivalent gains (loss aversion). This creates an urgent need to eliminate the pain.</p>
                    <p><strong>The real cost:</strong> Revenge trades have a 73% failure rate. One revenge trade often leads to a cascade of bad decisions that can destroy weeks of profits in hours.</p>
                  </CardContent>
                </Card>

                <Card className="bg-background/50 border-purple-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="text-2xl">😌</span>
                      Overconfidence
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <p className="mb-3"><strong>How it manifests:</strong> Trading larger size than your system calls for, skipping risk management, taking low-probability setups, believing you can predict the market.</p>
                    <p className="mb-3"><strong>Why it happens:</strong> After a winning streak, the brain attributes success to skill rather than probabilities. This is called the "skill illusion."</p>
                    <p><strong>The real cost:</strong> 88% of traders who experience a 50% drawdown attribute it to trades taken during periods of overconfidence following winning streaks.</p>
                  </CardContent>
                </Card>
              </div>

              <ProTip>
                Keep an "Emotion Journal" alongside your trade journal. Before each trade, rate your emotional state 1-10. After 100 trades, analyze: 
                which emotional states correlate with your best and worst performance?
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* COGNITIVE BIASES - INTERMEDIATE */}
          <section id="cognitive-biases">
            <SkillLevelSection level="intermediate" title="Cognitive Biases That Destroy Accounts">
              <p className="text-muted-foreground mb-6">
                Beyond raw emotions, our brains are wired with cognitive biases — mental shortcuts that helped our ancestors survive but cause systematic errors in trading. 
                Understanding these biases is the first step to neutralizing them.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">The Seven Deadly Biases</h4>

              <div className="space-y-4 mb-8">
                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-blue-500">
                  <h5 className="font-semibold">1. Confirmation Bias</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> You see a bullish setup, then only look for reasons to go long — ignoring bearish evidence.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Before every trade, actively search for 3 reasons NOT to take it. If you can't find any, your analysis might be biased.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-green-500">
                  <h5 className="font-semibold">2. Recency Bias</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> Your last few trades were winners, so you feel invincible. Or your last few were losers, so you doubt your entire strategy.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Never evaluate your system on fewer than 50 trades. Random variance means short-term results are meaningless.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-yellow-500">
                  <h5 className="font-semibold">3. Anchoring Bias</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> "Bitcoin was at $69K, so $35K is cheap." The previous price becomes your mental anchor, regardless of current value.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Trade what you see, not what you remember. Your entry and exit rules should be based on current price action, not historical levels.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-red-500">
                  <h5 className="font-semibold">4. Sunk Cost Fallacy</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> "I've held this losing trade for 3 weeks, I can't sell now." Past time/money invested affects future decisions.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Ask yourself: "Would I enter this trade today at this price?" If no, exit. What you paid or how long you've held is irrelevant.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-purple-500">
                  <h5 className="font-semibold">5. Hindsight Bias</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> "I knew that was going to happen." After the move, it seems obvious. This creates false confidence.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Write your analysis BEFORE the move. Review your pre-trade notes, not post-move charts. Honest records prevent hindsight distortion.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-orange-500">
                  <h5 className="font-semibold">6. Outcome Bias</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> Judging a trade by its result, not by whether you followed your process. A winning trade taken incorrectly is still a bad trade.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Grade each trade on process adherence (1-10), not P&L. Over time, good process creates good outcomes.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-pink-500">
                  <h5 className="font-semibold">7. Disposition Effect</h5>
                  <p className="text-sm text-muted-foreground mt-1">
                    <strong>The trap:</strong> Selling winners too quickly (to lock in gains) while holding losers too long (to avoid realizing losses).
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>The fix:</strong> Use mechanical exit rules. When your stop or target is hit, execute. Remove discretion from the exit process.
                  </p>
                </div>
              </div>

              <CommonMistakes 
                mistakes={[
                  "Thinking you're immune to biases — everyone has them, including professionals",
                  "Trying to eliminate emotions instead of managing them",
                  "Changing your strategy after every losing trade",
                  "Blaming the market for your losses instead of examining your decisions",
                  "Trading when emotional state is compromised (angry, tired, stressed)"
                ]}
              />
            </SkillLevelSection>
          </section>

          {/* MENTAL FRAMEWORK - ADVANCED */}
          <section id="mental-framework">
            <SkillLevelSection level="advanced" title="Building Mental Discipline">
              <p className="text-muted-foreground mb-6">
                Mental discipline isn't about willpower — it's about systems. Professional traders build processes that make discipline automatic, 
                not something they have to fight for on each trade.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">The Trading Process Framework</h4>

              <div className="grid gap-4 mb-8">
                <TradingRule type="entry" title="Pre-Trade Routine (5 minutes)">
                  <ol className="list-decimal pl-4 space-y-2 mt-2">
                    <li><strong>Emotional check:</strong> Rate yourself 1-10. Below 6? Don't trade.</li>
                    <li><strong>Market context:</strong> What's the higher timeframe trend? Any major news?</li>
                    <li><strong>Setup verification:</strong> Does this meet ALL entry criteria? No exceptions.</li>
                    <li><strong>Risk calculation:</strong> Position size pre-determined before looking at the trade.</li>
                    <li><strong>Verbalize the trade:</strong> Say out loud: "I'm going long because X, with stop at Y, target at Z."</li>
                  </ol>
                </TradingRule>

                <TradingRule type="risk" title="In-Trade Management">
                  <ol className="list-decimal pl-4 space-y-2 mt-2">
                    <li><strong>Set alerts, not watches:</strong> Watching every tick increases emotional reactions.</li>
                    <li><strong>No position adjustments:</strong> Your stop and target are set. Don't move them.</li>
                    <li><strong>Journal while waiting:</strong> Write observations about price action.</li>
                    <li><strong>Physical movement:</strong> Walk away from screens every 30 minutes.</li>
                  </ol>
                </TradingRule>

                <TradingRule type="exit" title="Post-Trade Review (5 minutes)">
                  <ol className="list-decimal pl-4 space-y-2 mt-2">
                    <li><strong>Screenshot the trade:</strong> Mark entry, exit, stop, target.</li>
                    <li><strong>Grade the execution:</strong> Did you follow your rules? (1-10)</li>
                    <li><strong>Emotional debrief:</strong> How did you feel at entry, during, at exit?</li>
                    <li><strong>One lesson:</strong> What will you do differently next time?</li>
                    <li><strong>Next trade mindset:</strong> This trade is over. Clean slate.</li>
                  </ol>
                </TradingRule>
              </div>

              <h4 className="font-semibold text-lg mt-8 mb-4">The "If-Then" Protocol</h4>
              <p className="text-muted-foreground mb-4">
                Pre-commit to your reactions. When you decide in advance how to handle situations, you remove emotional decision-making in the moment.
              </p>

              <div className="bg-muted/30 p-6 rounded-lg mb-8">
                <div className="space-y-3 font-mono text-sm">
                  <p><span className="text-blue-500">IF</span> I have 3 consecutive losses <span className="text-blue-500">THEN</span> I stop trading for the day</p>
                  <p><span className="text-blue-500">IF</span> I'm down 2% for the day <span className="text-blue-500">THEN</span> I stop trading for the day</p>
                  <p><span className="text-blue-500">IF</span> I feel angry after a loss <span className="text-blue-500">THEN</span> I walk away for 30 minutes</p>
                  <p><span className="text-blue-500">IF</span> setup is valid but I feel hesitant <span className="text-blue-500">THEN</span> I reduce size by 50% (not skip)</p>
                  <p><span className="text-blue-500">IF</span> trade hits full target <span className="text-blue-500">THEN</span> I close, no exceptions</p>
                  <p><span className="text-blue-500">IF</span> I want to add to a loser <span className="text-blue-500">THEN</span> I close the entire position</p>
                </div>
              </div>

              <ProTip>
                Write your "If-Then" rules on an index card and place it next to your screen. In moments of emotional pressure, 
                your brain needs a simple visual reference — not a complex decision tree.
              </ProTip>
            </SkillLevelSection>
          </section>

          {/* PROFESSIONAL MINDSET */}
          <section id="professional-mindset">
            <SkillLevelSection level="professional" title="The Professional Mindset">
              <p className="text-muted-foreground mb-6">
                Professional traders think fundamentally differently than retail traders. Here are the mental frameworks that separate consistent winners from everyone else.
              </p>

              <h4 className="font-semibold text-lg mt-6 mb-4">Probability Thinking</h4>
              <Card className="bg-muted/30 mb-6">
                <CardContent className="pt-6">
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">The Professional's Equation</p>
                    <p className="text-xl font-mono font-bold">
                      (Win Rate × Avg Win) − (Loss Rate × Avg Loss) = Expected Value
                    </p>
                  </div>
                  <div className="bg-background/50 p-4 rounded-lg mt-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Example:</strong> 40% win rate, avg win $500, avg loss $200<br />
                      (0.40 × $500) − (0.60 × $200) = $200 − $120 = <strong className="text-green-500">+$80 per trade</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      This trader loses more often than they win, but they're profitable because their winners are larger than their losers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <h4 className="font-semibold text-lg mt-6 mb-4">The Five Beliefs of Profitable Traders</h4>
              <div className="space-y-4 mb-8">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Any single trade is meaningless</h5>
                    <p className="text-sm text-muted-foreground">I'm not trading for this one outcome. I'm playing for the statistics over 1000 trades.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">I don't need to know what happens next</h5>
                    <p className="text-sm text-muted-foreground">I can't predict. I can only respond to what the market shows me with appropriate probability-based actions.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">Losses are the cost of doing business</h5>
                    <p className="text-sm text-muted-foreground">Every business has expenses. Losses are my operating cost — expected, planned for, and emotionally neutral.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">4</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">I am not my P&L</h5>
                    <p className="text-sm text-muted-foreground">My self-worth is separate from my trading results. A losing day doesn't make me a failure.</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-primary">5</span>
                  </div>
                  <div>
                    <h5 className="font-semibold">The market owes me nothing</h5>
                    <p className="text-sm text-muted-foreground">I'm not entitled to profits because I worked hard or did good analysis. The market is indifferent.</p>
                  </div>
                </div>
              </div>

              <RiskManagementBox
                positionSize="1-2% risk per trade, regardless of conviction"
                stopLoss="Pre-determined before entry, never moved against position"
                riskReward="Minimum 1:2 R:R, preferably 1:3+"
                maxRisk="5% maximum daily loss = trading stops"
              />
            </SkillLevelSection>
          </section>

          {/* DAILY ROUTINES */}
          <section id="daily-routines">
            <h2 className="text-2xl font-bold mt-12 mb-4">Daily Mental Routines for Peak Performance</h2>

            <div className="grid gap-4 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">🌅</span>
                    Morning Preparation (30 min before market open)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li><strong>Physical:</strong> Exercise, breakfast, hydration — never trade hungry or tired</li>
                    <li><strong>Market review:</strong> Check overnight moves, news, economic calendar</li>
                    <li><strong>Plan the day:</strong> Identify 2-3 setups you're watching, write them down</li>
                    <li><strong>Mental preparation:</strong> 5 minutes of breathing/meditation</li>
                    <li><strong>Affirmation:</strong> "I will follow my rules regardless of outcome"</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">☀️</span>
                    Midday Reset (1-2pm break)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li><strong>Step away:</strong> Lunch away from screens — no charts</li>
                    <li><strong>Movement:</strong> Walk, stretch, physical activity</li>
                    <li><strong>Emotional check:</strong> How am I feeling? Am I still objective?</li>
                    <li><strong>Re-evaluate:</strong> Is my morning plan still valid? Any adjustments?</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-xl">🌙</span>
                    End-of-Day Review (after market close)
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  <ol className="list-decimal pl-4 space-y-2">
                    <li><strong>Journal all trades:</strong> Screenshots, entry reason, exit, emotions</li>
                    <li><strong>Calculate daily stats:</strong> P&L, win rate, R:R achieved</li>
                    <li><strong>Process grade:</strong> Did I follow my rules? Score 1-10</li>
                    <li><strong>One lesson:</strong> What's the single most important thing I learned?</li>
                    <li><strong>Tomorrow's prep:</strong> Note any setups forming for tomorrow</li>
                    <li><strong>Shutdown ritual:</strong> Close charts, separate work from life</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* RECOVERY FROM LOSSES */}
          <section id="recovery-strategies">
            <h2 className="text-2xl font-bold mt-12 mb-4">Recovery Strategies After Significant Losses</h2>

            <Alert className="mb-6 border-red-500/50 bg-red-500/5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <AlertDescription className="text-base">
                A 50% account loss requires a 100% gain to recover. A 90% loss requires 900%. 
                This is why risk management isn't optional — it's survival.
              </AlertDescription>
            </Alert>

            <h3 className="text-xl font-semibold mt-8 mb-4">The Recovery Protocol</h3>
            <div className="space-y-4 mb-8">
              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-500 text-sm">1</span>
                </div>
                <div>
                  <h5 className="font-semibold">Immediate: Stop trading (1-3 days)</h5>
                  <p className="text-sm text-muted-foreground">After a significant loss, you are not in a mental state to make good decisions. Take a complete break from markets.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-500 text-sm">2</span>
                </div>
                <div>
                  <h5 className="font-semibold">Analysis: Understand what happened (Day 3-5)</h5>
                  <p className="text-sm text-muted-foreground">Without emotion, review every trade. Was it a system failure or execution failure? Be brutally honest.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-500 text-sm">3</span>
                </div>
                <div>
                  <h5 className="font-semibold">Rebuild: Start small (Week 2-4)</h5>
                  <p className="text-sm text-muted-foreground">Return with 25-50% of normal position size. Prove to yourself you can execute properly before sizing up.</p>
                </div>
              </div>

              <div className="flex gap-4 items-start p-4 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-500 text-sm">4</span>
                </div>
                <div>
                  <h5 className="font-semibold">Scale: Gradual return to normal (Month 2+)</h5>
                  <p className="text-sm text-muted-foreground">After 20+ trades with proper execution, slowly increase back to normal size. Patience is essential.</p>
                </div>
              </div>
            </div>

            <PatternChecklist 
              title="Loss Recovery Checklist"
              items={[
                { text: 'Took at least 48 hours away from all trading', critical: true },
                { text: 'Reviewed every trade that led to the loss objectively' },
                { text: 'Identified specific rules that were broken', critical: true },
                { text: 'Created new "If-Then" rules to prevent recurrence' },
                { text: 'Returned with reduced position size (50% or less)', critical: true },
                { text: 'Achieved 10+ trades with proper execution before sizing up' },
                { text: 'Separated self-worth from trading results' },
              ]}
            />
          </section>

          {/* KEY TAKEAWAYS */}
          <h2 className="text-2xl font-bold mt-12 mb-4">Key Takeaways</h2>
          <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mb-8">
            <ol className="list-decimal pl-6 space-y-3 text-muted-foreground">
              <li><strong>Trading success is 80% psychology</strong> — your strategy matters, but execution determines results</li>
              <li><strong>You can't eliminate emotions</strong> — but you can build systems that protect you from emotional decisions</li>
              <li><strong>Every trader has biases</strong> — the profitable ones recognize and compensate for theirs</li>
              <li><strong>Think in probabilities</strong> — any single trade outcome is irrelevant; the edge reveals itself over hundreds of trades</li>
              <li><strong>Losses are not failures</strong> — they're the cost of doing business. Process adherence is what matters</li>
              <li><strong>Daily routines create consistency</strong> — prep, trade, review, repeat. Make discipline automatic</li>
              <li><strong>Recovery takes time</strong> — after significant losses, patience and reduced size are non-negotiable</li>
            </ol>
          </div>
        </article>

        {/* Related Content */}
        <div className="mt-16 border-t pt-12">
          <h3 className="text-2xl font-bold mb-6">Continue Learning</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/learn/risk-management">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Risk Management Fundamentals</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  The technical framework that protects you from emotional decisions.
                </CardContent>
              </Card>
            </Link>
            <Link to="/learn/trading-discipline">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>Trading Discipline</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground">
                  Building the habits and systems for consistent execution.
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Quiz CTA */}
        <div className="mt-12">
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/5 border-purple-500/20">
            <CardContent className="p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Test Your Psychology Knowledge</h3>
              <p className="text-muted-foreground mb-6">
                Can you identify emotional patterns that lead to trading mistakes?
              </p>
              <Link to="/quiz/trading-knowledge">
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Take the Quiz
                </button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TradingPsychology;