import { useEffect, useRef, ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { BarChart3, Shield, Eye, Cpu, Users, Target, TrendingUp, ArrowRight } from "lucide-react";

/* ── Scroll-fade wrapper ─────────────────────────────────── */
function FadeIn({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("opacity-100", "translate-y-0"); el.classList.remove("opacity-0", "translate-y-6"); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`opacity-0 translate-y-6 transition-all duration-700 ease-out ${className}`}>
      {children}
    </div>
  );
}

/* ── Flow diagram (Section 6) ────────────────────────────── */
function FlowDiagram() {
  const { t } = useTranslation();
  const steps = [
    t('aboutPage.flowSignalDetected', 'Signal Detected'),
    t('aboutPage.flowTraderActs', 'Trader Acts'),
    t('aboutPage.flowOutcomeRecorded', 'Outcome Recorded'),
    t('aboutPage.flowModelImproves', 'Model Improves'),
    t('aboutPage.flowBetterSignals', 'Better Signals'),
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 md:gap-0 mt-12">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-2 md:gap-0">
          <div className="px-4 py-2.5 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium text-foreground whitespace-nowrap">
            {step}
          </div>
          {i < steps.length - 1 && (
            <div className="hidden md:flex items-center mx-1">
              <div className="w-8 h-px bg-primary/40 relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 w-3 h-px bg-primary animate-[flowPulse_2s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.4}s` }} />
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-primary/70" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── Section number badge ────────────────────────────────── */
function SectionNum({ n, label }: { n: string; label: string }) {
  return (
    <div className="select-none">
      <span className="text-[120px] leading-none font-bold text-primary/10 block">{n}</span>
      <span className="text-sm font-semibold uppercase tracking-widest text-primary">{label}</span>
    </div>
  );
}

/* ── Stat pill ────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

/* ── Belief card ──────────────────────────────────────────── */
function BeliefCard({ icon: Icon, title, desc }: { icon: typeof BarChart3; title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors">
      <Icon className="h-8 w-8 text-primary mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ── Trader profile card ──────────────────────────────────── */
function ProfileCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-6 rounded-xl border border-border bg-card">
      <h3 className="text-lg font-semibold text-foreground mb-3">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ABOUT PAGE
   ════════════════════════════════════════════════════════════ */
const About = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── S1: Hero / Manifesto ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-24 pb-20">
        <FadeIn>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-4xl">
            {t('aboutPage.heroLine1', "Markets don't lie.")}{" "}
            <span className="text-primary">{t('aboutPage.heroLine2', "Patterns don't lie.")}</span>{" "}
            {t('aboutPage.heroLine3', "Most trading tools do.")}
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            {t('aboutPage.heroSubtitle', "ChartingPath was built on one uncomfortable truth: most traders lose not because they lack discipline — but because nobody ever showed them which patterns actually work.")}
          </p>
          <div className="mt-8 w-[120px] h-[2px] bg-primary" />
        </FadeIn>
      </section>

      {/* ─── S2: The Origin Story ─────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-20">
        <FadeIn>
          <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-12">
            <SectionNum n="01" label={t('aboutPage.sectionProblem', 'The Problem')} />
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                {t('aboutPage.problemP1Before', "Every trading platform shows you chart patterns. TradingView shows you a Bull Flag. Your broker shows you a Head and Shoulders. But none of them answer the only question that matters:")}
                {" "}<span className="text-foreground font-medium">{t('aboutPage.problemP1Highlight', "does this pattern actually work?")}</span>
              </p>
              <p>
                {t('aboutPage.problemP2', "We searched for a tool that could tell us — with real data — whether a Descending Triangle on EURUSD at the 4H timeframe had a positive expectancy over the last 5 years. It didn't exist. So we built it.")}
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── S3: What We Believe ──────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-20">
        <FadeIn>
          <div className="mb-10">
            <SectionNum n="02" label={t('aboutPage.sectionBelieve', 'What We Believe')} />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BeliefCard
              icon={BarChart3}
              title={t('aboutPage.beliefDataTitle', "Data over dogma")}
              desc={t('aboutPage.beliefDataDesc', "Every pattern claim on ChartingPath is backed by real historical outcomes — not textbook theory, not YouTube heuristics. 320,000+ trades don't lie.")}
            />
            <BeliefCard
              icon={Shield}
              title={t('aboutPage.beliefEdgeTitle', "Edge is earned, not sold")}
              desc={t('aboutPage.beliefEdgeDesc', "We don't sell signals. We don't promise returns. We give you the statistical foundation to develop your own edge — and the tools to validate it before risking a dollar.")}
            />
            <BeliefCard
              icon={Eye}
              title={t('aboutPage.beliefTransparencyTitle', "Transparency builds trust")}
              desc={t('aboutPage.beliefTransparencyDesc', "Our Edge Atlas is public. Anyone can see which patterns work and which don't. We have nothing to hide because the data speaks for itself.")}
            />
          </div>
        </FadeIn>
      </section>

      {/* ─── S4: What ChartingPath Actually Is ────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-20">
        <FadeIn>
          <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-12">
            <SectionNum n="03" label={t('aboutPage.sectionWhatItIs', 'What It Is')} />
            <div>
              <p className="text-2xl md:text-3xl font-semibold italic text-primary leading-snug mb-6">
                {t('aboutPage.whatItIsTagline', "A pattern intelligence platform — not a signal service.")}
              </p>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  {t('aboutPage.whatItIsP1', "There's an important difference. A signal service tells you what to trade. A pattern intelligence platform shows you what works, why it works, and how often — then lets you decide.")}
                </p>
                <p>
                  {t('aboutPage.whatItIsP2Before', "ChartingPath scans 800+ instruments across forex, crypto, stocks, and commodities every hour. It detects 17 chart patterns. It backtests each one against years of real price data. And it gives every signal a statistical verdict:")}
                  {" "}<span className="text-foreground font-medium">TAKE</span>, <span className="text-foreground font-medium">WATCH</span>, {t('aboutPage.or', 'or')} <span className="text-foreground font-medium">SKIP</span> — {t('aboutPage.whatItIsP2After', "based on evidence, not opinion.")}
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ─── S5: The Technology ───────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10">
              <SectionNum n="04" label={t('aboutPage.sectionTechnology', 'The Technology')} />
            </div>
            <div className="rounded-2xl border border-border bg-card p-8 md:p-12" style={{ backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <Stat value="800+" label={t('aboutPage.statInstruments', 'Instruments tracked')} />
                <Stat value="17" label={t('aboutPage.statPatterns', 'Pattern types detected')} />
                <Stat value="320K+" label={t('aboutPage.statOutcomes', 'Historical outcomes')} />
                <Stat value="4" label={t('aboutPage.statAgents', 'AI agents scoring')} />
              </div>

              <div className="grid md:grid-cols-2 gap-10 text-sm">
                <div>
                  <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-primary" />
                    {t('aboutPage.howScoringTitle', 'How the scoring works')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('aboutPage.howScoringDesc', "Every live pattern detection passes through four AI agents simultaneously. The Analyst agent evaluates historical win rate and expectancy. The Risk agent calculates reward-to-risk and Kelly criterion. The Timing agent checks trend alignment and economic event proximity. The Portfolio agent scores basket fit. The result is a composite score from 0–100 and a TAKE / WATCH / SKIP verdict — automatically, every hour.")}
                  </p>
                </div>
                <div>
                  <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    {t('aboutPage.whyMattersTitle', 'Why it matters')}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {t('aboutPage.whyMattersDesc', "Pattern trading is fundamentally about supply and demand dynamics forming in recognisable geometric shapes. When a Bull Flag forms, it means demand is consolidating after absorbing supply — and historically, that consolidation resolves upward X% of the time. ChartingPath quantifies that X. For every pattern. On every instrument. Across every timeframe.")}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── S6: The Moat ─────────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10">
              <SectionNum n="05" label={t('aboutPage.sectionMoat', 'The Moat')} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              {t('aboutPage.moatHeadline1', 'The longer you use ChartingPath, the')}{" "}
              <span className="text-primary">{t('aboutPage.moatHeadline2', 'smarter it gets.')}</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed max-w-3xl mb-4">
              {t('aboutPage.moatP1', "Every time a trader paper trades a signal on ChartingPath, the outcome feeds back into the scoring model. Not theoretical outcomes — real ones, validated against actual price movement. This creates a proprietary dataset that no competitor can replicate without starting over.")}
            </p>
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {t('aboutPage.moatP2', "TradingView can copy our UI. Bloomberg can copy our patterns. Nobody can copy five years of user-validated pattern outcomes tied to real market conditions.")}
            </p>
            <FlowDiagram />
          </FadeIn>
        </div>
      </section>

      {/* ─── S7: Who We Serve ─────────────────────────────────── */}
      <section className="py-20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <FadeIn>
            <div className="mb-10">
              <SectionNum n="06" label={t('aboutPage.sectionWhoWeServe', 'Who We Serve')} />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ProfileCard
                title={t('aboutPage.profileSystematicTitle', 'The Systematic Trader')}
                desc={t('aboutPage.profileSystematicDesc', "You already have a process. You want data to validate it — not replace it. ChartingPath gives you the statistical foundation to know which patterns have genuine edge in your markets before you risk capital.")}
              />
              <ProfileCard
                title={t('aboutPage.profilePatternTitle', 'The Pattern Trader')}
                desc={t('aboutPage.profilePatternDesc', "You've been trading Bull Flags and Double Bottoms for years — mostly on gut feel. ChartingPath tells you which ones actually worked, on which instruments, at which timeframes. Finally: proof.")}
              />
              <ProfileCard
                title={t('aboutPage.profilePropTitle', 'The Prop Trader')}
                desc={t('aboutPage.profilePropDesc', "You're paying for challenge accounts hoping your strategy survives the drawdown rules. ChartingPath lets you validate your pattern strategy against 320,000+ historical outcomes before you spend another dollar on a challenge fee.")}
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── S8: The Vision ───────────────────────────────────── */}
      <section className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t('aboutPage.visionHeadline1', 'From signal discovery to')}{" "}
              <span className="text-primary">{t('aboutPage.visionHeadline2', 'pattern intelligence.')}</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10">
              {t('aboutPage.visionDesc', 'The future we\'re building is one where any trader — regardless of experience — can answer the question "does my strategy actually work?" in under 60 seconds. Where pattern outcomes are transparent, verifiable, and continuously improving. Where the gap between retail traders and institutional desks narrows — not because retail traders got more capital, but because they finally got the same quality of information.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2">
                <Link to="/auth/register">
                  {t('aboutPage.ctaStartFree', 'Start For Free')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/patterns/live">{t('aboutPage.ctaExploreEdge', 'Explore the Edge Atlas')}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── S9: Footer CTA Band ─────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-6">
              {t('aboutPage.footerCtaHeadline', 'Ready to trade with evidence, not instinct?')}
            </h2>
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold">
              <Link to="/auth/register">{t('aboutPage.footerCtaButton', 'Create Free Account')}</Link>
            </Button>
            <p className="text-primary-foreground/70 text-sm mt-4">
              {t('aboutPage.footerCtaSubtext', 'No credit card required. Free forever tier available.')}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CSS keyframe for flow pulse */}
      <style>{`
        @keyframes flowPulse {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
};

export default About;
