import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Shield, Clock, Briefcase, Info, HelpCircle, FlaskConical } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const AgentWeightsFAQ: React.FC<{ trigger: React.ReactNode }> = ({ trigger }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl max-h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-primary" />
            Agent Weights — How It Works
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[70vh]">
          <div className="space-y-5 pr-3">
            {/* Overview */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">What are Agent Weights?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The Multi-Agent Trade Filter uses four specialized AI agents that independently evaluate every trade opportunity.
                Before scoring, each signal must pass the <strong>Proof Gate</strong> — only setups backed by ≥15 historical trades
                with a ≥45% win rate are scored. Signals that don't meet this threshold are labeled <strong>UNPROVEN</strong> and
                shown in a separate Emerging Signals section. <strong>Agent Weights</strong> control how much influence each agent
                has on the final <strong>Composite Score (0–100)</strong> that determines whether a proven trade is labeled
                <strong> TAKE</strong>, <strong>WATCH</strong>, or <strong>SKIP</strong>.
              </p>
            </section>

            {/* Proof Gate */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Proof Gate
              </h3>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Proof Gate ensures you only act on signals with a <strong>verified statistical edge</strong>. A signal must have:
                </p>
                <ul className="text-xs text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
                  <li>At least <strong>15 resolved historical trades</strong> for that pattern + instrument combination</li>
                  <li>A win rate of <strong>≥45%</strong></li>
                </ul>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Signals failing either criterion are classified as <strong>Emerging</strong> — they are still visible but not scored.
                  Their Analyst and Composite columns show "—" with an <strong>UNPROVEN</strong> badge. Send emerging signals to
                  Pattern Lab to investigate their potential.
                </p>
              </div>
            </section>

            {/* Formula */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Scoring Formula</h3>
              <div className="bg-muted/40 border border-border rounded-lg p-3">
                <code className="text-xs text-foreground font-mono">
                  Composite = (Analyst_raw × W<sub>a</sub>) + (Risk_raw × W<sub>r</sub>) + (Timing_raw × W<sub>t</sub>) + (Portfolio_raw × W<sub>p</sub>)
                </code>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The four weights must sum to <strong>100</strong>. Each agent's raw score (0–1) is multiplied by its weight,
                and the results are summed to produce the composite. A composite of 70+ defaults to <strong>TAKE</strong>,
                50–69 to <strong>WATCH</strong>, and below 50 to <strong>SKIP</strong> (thresholds are adjustable).
                Only proven signals (those passing the Proof Gate) receive a composite score.
              </p>
            </section>

            <Separator />

            {/* Agent Details */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">The Four Agents</h3>

              {/* Analyst */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 h-fit">
                  <Brain className="h-4 w-4 text-blue-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">🧠 Analyst Agent</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scores each signal using three independent components: <strong>Win Rate</strong> (0–10 pts, linear scale
                    from the pattern's historical win rate on this instrument), <strong>Expectancy</strong> (0–10 pts, based
                    on the average R-multiple — an expectancyR of 1.0+ earns full marks), and <strong>Sample Confidence</strong>
                    (0–5 pts, log₂ scale of sample size relative to the 30-trade minimum). Signals below the Proof Gate
                    threshold receive a 50% confidence penalty. Only scored for proven signals.
                  </p>
                  <p className="text-sm text-muted-foreground/80 italic">
                    High weight → You prioritize setups with a proven statistical edge — patterns that have historically delivered
                    consistent returns on this specific ticker.
                  </p>
                </div>
              </div>

              {/* Risk */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 h-fit">
                  <Shield className="h-4 w-4 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">🛡️ Risk Manager Agent</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scores each signal using three independent components: <strong>R:R Adequacy</strong> (0–10 pts — an R:R
                    of 1.5 earns 5 pts, 3.0+ earns the maximum), <strong>Volatility Stability</strong> (0–8 pts — tighter
                    stops relative to price indicate lower volatility and score higher; stops beyond 5% of entry price
                    score zero), and <strong>Kelly Sizing</strong> (0–7 pts — applies the Kelly Criterion formula
                    <em> K = winRate − (1−winRate)/R:R</em>, capped at 25% to prevent over-betting). Higher combined
                    score means the trade has a well-defined risk bracket with room for sensible position sizing.
                  </p>
                  <p className="text-sm text-muted-foreground/80 italic">
                    High weight → You prioritize tight risk control — only taking setups with well-defined stops and
                    favorable risk-to-reward (typically 2:1 or better). Recommended for capital preservation strategies.
                  </p>
                </div>
              </div>

              {/* Timing */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 h-fit">
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">⏱️ Timing Agent</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Produces a blended score from two equally-weighted components (50/50):
                  </p>
                  <ul className="text-xs text-muted-foreground leading-relaxed space-y-1 list-disc pl-4">
                    <li>
                      <strong>Trend Score</strong> — based on the detection's trend alignment tag (MACD, EMA 50/200, RSI, ADX):
                      <strong> with_trend = 0.85</strong>, neutral = 0.55, counter_trend = 0.30.
                    </li>
                    <li>
                      <strong>Event Score</strong> — starts at <strong>1.0</strong> (clear calendar). The system queries the
                      <code className="text-sm bg-muted/60 px-1 rounded">economic_events</code> table for events within a
                      <strong> 48-hour lookahead window</strong>, then matches them to the instrument by currency
                      (e.g., GBPJPY is affected by both GB and JP events). Each relevant <strong>high-impact</strong> event
                      (FOMC, NFP, CPI, rate decisions) deducts <strong>−0.15</strong>; each <strong>medium-impact</strong> event
                      (PMI, retail sales) deducts <strong>−0.06</strong>. Floors at 0.
                    </li>
                  </ul>
                  <div className="bg-muted/40 border border-border rounded-lg p-2 mt-1">
                    <code className="text-sm text-foreground font-mono">
                      Timing = trendScore × 0.5 + eventScore × 0.5
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground/80 italic mt-1">
                    High weight → You prioritize event-aware, trend-aligned entries — avoiding trades right before major
                    announcements or against the prevailing trend. Essential for news-sensitive instruments like forex.
                  </p>
                </div>
              </div>

              {/* Portfolio */}
              <div className="flex gap-3">
                <div className="shrink-0 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 h-fit">
                  <Briefcase className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-foreground">💼 Portfolio Agent</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Evaluates <strong>concentration risk</strong>, currency correlation, and directional skew — but only
                    among the signals currently in your <strong>Basket</strong>, not your real-world brokerage holdings.
                    When the basket has multiple symbols, it checks asset-class overlap, shared currency exposure
                    (e.g. multiple USD pairs), and whether too many signals lean the same direction (all-long / all-short).
                  </p>
                  <p className="text-sm text-muted-foreground/80 italic">
                    Without a basket (single signal), the score falls back to a quality-grade proxy.
                    Add multiple symbols to the basket for meaningful diversification analysis.
                    High weight → You prioritize basket balance — useful when screening many setups at once.
                  </p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Kelly Criterion Deep-Dive */}
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                Kelly Criterion — Why It Matters
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The <strong>Kelly Criterion</strong> is a mathematical formula that calculates the optimal fraction of capital
                to risk on a trade, given its win rate and reward-to-risk ratio. In the Risk Agent, it acts as an
                <strong> edge filter</strong>: if the Kelly value is zero or negative, the setup has no statistical edge —
                regardless of how clean the pattern looks — and scores <strong>0 of 7</strong> possible points.
              </p>

              {/* Formula */}
              <div className="bg-muted/40 border border-border rounded-lg p-3 space-y-1">
                <code className="text-xs text-foreground font-mono block">
                  K = winRate − (1 − winRate) / R:R
                </code>
                <p className="text-sm text-muted-foreground">
                  A positive K means the trade has a genuine mathematical edge. A negative K means losses outpace wins over time.
                </p>
              </div>

              {/* Cap explanation */}
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 space-y-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong>25% Cap</strong> — Even when the formula suggests risking more, the system caps Kelly at
                  <strong> 25%</strong> to prevent over-betting. A Kelly of 25%+ earns the full 7 points; lower values
                  scale linearly (e.g., 12.5% Kelly → 3.5 pts).
                </p>
              </div>

              {/* Examples */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-foreground">Example Scenarios</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/40">
                        <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Win Rate</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">R:R</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Kelly %</th>
                        <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Score</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-t border-border">
                        <td className="px-2.5 py-1.5">60%</td>
                        <td className="px-2.5 py-1.5">2:1</td>
                        <td className="px-2.5 py-1.5 text-emerald-400">10%</td>
                        <td className="px-2.5 py-1.5">2.8 / 7</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2.5 py-1.5">50%</td>
                        <td className="px-2.5 py-1.5">1.5:1</td>
                        <td className="px-2.5 py-1.5 text-emerald-400">16.7%</td>
                        <td className="px-2.5 py-1.5">4.7 / 7</td>
                      </tr>
                      <tr className="border-t border-border">
                        <td className="px-2.5 py-1.5">40%</td>
                        <td className="px-2.5 py-1.5">1.5:1</td>
                        <td className="px-2.5 py-1.5 text-red-400">−0.7%</td>
                        <td className="px-2.5 py-1.5">0 / 7</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="text-sm text-muted-foreground/80 italic leading-relaxed">
                Key takeaway: Kelly ensures only setups with a genuine mathematical edge contribute to a passing Risk score,
                filtering out patterns that "look good but don't pay" over a large sample.
              </p>
            </section>

            <Separator />

            {/* Verdicts */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Verdict Labels</h3>
              <div className="space-y-2">
                {[
                  { badge: 'TAKE', color: 'text-emerald-400', desc: 'Composite ≥70 — actionable edge backed by proven history.' },
                  { badge: 'WATCH', color: 'text-amber-400', desc: 'Composite 50–69 — monitor for improving conditions.' },
                  { badge: 'SKIP', color: 'text-red-400', desc: 'Composite <50 — insufficient edge, pass.' },
                  { badge: 'UNPROVEN', color: 'text-muted-foreground', desc: 'Failed Proof Gate — fewer than 15 historical trades or win rate below 45%. Not scored.' },
                ].map((v) => (
                  <div key={v.badge} className="flex gap-2 items-start">
                    <span className={`text-xs font-mono font-bold shrink-0 w-20 ${v.color}`}>{v.badge}</span>
                    <p className="text-sm text-muted-foreground">{v.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Presets */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Quick Presets</h3>
              <div className="space-y-2">
                {[
                  { emoji: '⚖️', name: 'Balanced (25/25/25/25)', desc: 'Equal influence from all agents. Good starting point for most traders.' },
                  { emoji: '🛡️', name: 'Conservative (20/35/25/20)', desc: 'Heavy risk management bias. Fewer trades, tighter stops, higher quality.' },
                  { emoji: '🔥', name: 'Aggressive (35/15/25/25)', desc: 'Pattern-edge focused. Accepts more risk for higher-conviction signals.' },
                  { emoji: '⚡', name: 'Momentum (30/20/30/20)', desc: 'Timing-heavy. Ideal for event-driven or session-sensitive strategies.' },
                ].map((p) => (
                  <div key={p.name} className="flex gap-2 items-start">
                    <span className="text-sm shrink-0">{p.emoji}</span>
                    <div>
                      <span className="text-xs font-medium text-foreground">{p.name}</span>
                      <p className="text-sm text-muted-foreground">{p.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            {/* Tips */}
            <section className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Tips & Best Practices</h3>
              <ul className="text-xs text-muted-foreground leading-relaxed space-y-1.5 list-disc pl-4">
                <li>Weights must always sum to <strong>100</strong>. The system warns you if they don't.</li>
                <li>Setting a weight to <strong>0</strong> completely disables that agent — the trade will never be filtered by it.</li>
                <li>Use the <strong>Agent Impact Simulator</strong> to test how different weight configurations affect verdicts on sample scenarios before committing.</li>
                <li>The <strong>Verdict Thresholds</strong> (TAKE/WATCH cutoffs) work in tandem with weights — tightening the TAKE cutoff to 80+ produces fewer but higher-conviction signals.</li>
                <li>For volatile assets (crypto), consider increasing <strong>Risk Mgr</strong> and <strong>Timing</strong> weights to filter out noisy setups.</li>
                <li>For diversified portfolios (10+ positions), increase <strong>Portfolio</strong> weight to prevent over-concentration.</li>
                <li><strong>Emerging signals</strong> can be sent to Pattern Lab to build historical data — once they accumulate ≥15 trades with ≥45% win rate, they'll automatically graduate to the scored table.</li>
              </ul>
            </section>

            {/* References */}
            <section className="space-y-2 pb-2">
              <h3 className="text-sm font-semibold text-foreground">References</h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                <li>Bulkowski, T. — <em>Encyclopedia of Chart Patterns</em> (pattern win-rate methodology)</li>
                <li>Vince, R. — <em>The Mathematics of Money Management</em> (Kelly criterion & optimal f)</li>
                <li>Wilder, J.W. — <em>New Concepts in Technical Trading Systems</em> (ATR-based stops)</li>
              </ul>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
