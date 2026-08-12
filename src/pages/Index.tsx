import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, BarChart3, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { PageMeta } from '@/components/PageMeta';
import { WebApplicationJsonLd, FAQJsonLd } from '@/components/JsonLd';
import { MetricStrip } from '@/components/landing/MetricStrip';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';
import { FiringNowSection } from '@/components/landing/FiringNowSection';
import { HeroStatsBar } from '@/components/landing/HeroStatsBar';
import { OutcomeDataBadge } from '@/components/screener/OutcomeDataBadge';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchArticles } = usePrefetchArticles();
  const { formatted: outcomeCount } = useOutcomeCount();

  const heroRef = useSectionTracking('hero');
  const differenceRef = useSectionTracking('difference');
  const pricingRef = useSectionTracking('pricing');

  useEffect(() => {
    // Single source of truth: analytics_events only. The old parallel
    // track() -> product_events write was removed (double-counting).
    trackEvent('landing_view', { path: '/' });
    trackEvent('landing.hero_view', { path: '/' });
  }, []);

  useEffect(() => {
    prefetchArticles();
  }, [prefetchArticles]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="ChartingPath — Chart Patterns, Measured Against What Actually Happened"
        description={`The only chart pattern platform that tracks what actually happens after the pattern forms. ${outcomeCount} labeled pattern outcomes across FX and US equities. Win rates by pattern, timeframe, and instrument — updated daily.`}
        canonicalPath="/"
      />
      <WebApplicationJsonLd />
      <FAQJsonLd faqs={[
        {
          question: 'What is ChartingPath?',
          answer: 'ChartingPath is a chart pattern detection platform that scans 820+ instruments across FX and US equities in real time. Unlike textbook statistics, it tracks every detected pattern to its actual outcome, providing real win rates and expectancy data.',
        },
        {
          question: 'How many chart patterns does ChartingPath track?',
          answer: 'ChartingPath tracks 17 chart patterns including head and shoulders, triangles, flags, wedges, double tops/bottoms, and cup and handle formations across multiple timeframes from 1-hour to weekly.',
        },
        {
          question: 'Is ChartingPath free to use?',
          answer: 'Yes, ChartingPath offers a free tier with live pattern scanning, access to the pattern screener, and basic outcome data. Premium plans unlock full historical data, AI Copilot, and advanced backtesting.',
        },
        {
          question: 'What makes ChartingPath different from other pattern scanners?',
          answer: 'ChartingPath is the only platform that labels every detected pattern with its actual outcome (win/loss at specific R:R targets). This means every win rate and expectancy figure is backed by real, auditable data — not theoretical estimates.',
        },
        {
          question: 'Can I backtest chart patterns on ChartingPath?',
          answer: 'Yes. Pattern Lab lets you backtest any of the 17 supported patterns on any instrument and timeframe. Results include win rate, expectancy, R-multiple distribution, and equity curves based on historical pattern occurrences.',
        },
      ]} />

      {/* 1. Hero — exactly ONE primary action.
          Deliberately NOT a signup ask: a cold visitor has no reason to create
          an account yet. We send them to /outcomes, where the value lands first
          and the signup ask converts a warm visitor. Do not re-add extra hero CTAs. */}
      <section ref={heroRef} className="relative flex items-center overflow-hidden border-b border-border/20">
        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <OutcomeDataBadge />
              <Badge variant="secondary" className="text-xs tracking-wide">
                {t('landing.platformBadge', 'Chart Pattern Backtesting Platform')}
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.08] tracking-tight text-foreground">
              {t('landing.heroHeadline', 'The pattern fired. Then what?')}
            </h1>

            <p className="text-lg md:text-xl lg:text-[1.35rem] text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              {t('landing.heroSubheadline', 'We tracked what happened the last 500,000 times. Win rate, average R:R and expectancy for every pattern — each shown with the sample size it rests on.')}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  trackEvent('landing.cta_click', { source: 'hero_primary', button: 'see_outcome_data' });
                  navigate('/outcomes');
                }}
                className="px-10 py-7 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/20"
              >
                <BarChart3 className="h-6 w-6 mr-3" />
                {t('landing.seeOutcomeData', 'See the outcome data')}
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>

              <Link
                to="/methodology"
                onClick={() => trackEvent('landing.cta_click', { source: 'hero_secondary', button: 'how_we_measure' })}
                className="text-base text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
              >
                {t('landing.howWeMeasure', 'How we measure this')}
              </Link>
            </div>

            <p className="text-sm text-muted-foreground mt-6">
              {t('landing.heroProof', '{{total}} resolved pattern outcomes across FX and US equities — every figure on this site traces back to them.', { total: outcomeCount })}
            </p>

            <HeroStatsBar />
          </div>
        </div>
      </section>

      {/* 2. What is firing right now — qualifying and suppressed side by side */}
      <FiringNowSection />

      {/* 3. What makes this different */}
      <section ref={differenceRef} className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
        <div className="container mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 max-w-2xl">
            {t('landing.differenceHeadline', 'Everyone shows you the pattern forming. We show you what happened afterwards.')}
          </h2>
          <div className="grid gap-8 md:grid-cols-3 mt-10">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('landing.differenceOneTitle', 'Every detection is followed to an outcome')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.differenceOneBody', 'A pattern is logged when it fires and resolved when price hits the target or the stop. Win or lose, it stays in the record.')}
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('landing.differenceTwoTitle', 'Sample size is shown, never hidden')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.differenceTwoBody', 'Nothing is published below 30 resolved outcomes. Where the sample is thin, we say so instead of quoting a number.')}
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground mb-2">
                {t('landing.differenceThreeTitle', 'Losing combinations are published too')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('landing.differenceThreeBody', 'Most pattern and timeframe combinations have negative expectancy. They stay in the table — filtering them out would manufacture an edge.')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-border/20">
          <div className="container mx-auto">
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-10 md:p-14 flex flex-col md:flex-row items-center gap-8 md:gap-16">
              <div className="flex-1">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3">
                  {t('hero.midPageHeadline', 'See the data behind the pattern')}
                </h2>
                <p className="text-base md:text-lg text-muted-foreground">
                  {t('hero.midPageSubtext', 'Free account. No credit card. Real backtest data from day one.')}
                </p>
              </div>
              <div className="shrink-0">
                <Button
                  size="lg"
                  onClick={() => {
                    trackEvent('landing.cta_click', { source: 'home_midpage', button: 'create_free_account' });
                    navigate('/auth?mode=signup&source=home_midpage');
                  }}
                  className="px-10 py-7 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 whitespace-nowrap"
                >
                  {t('hero.createFreeAccount', 'Create Free Account')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. Factual proof numbers */}
      <div className="border-t border-border/20 bg-card/30">
        <div className="container mx-auto">
          <MetricStrip />
        </div>
      </div>

      {/* 5. Pricing */}
      <div ref={pricingRef}>
        <PricingTeaser />
      </div>

      {/* 6. Disclaimer */}
      <section className="py-8 px-6 border-t">
        <div className="container mx-auto">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <p>
              <strong>{t('common.warning', 'Disclaimer')}:</strong> {t('landing.disclaimer', 'ChartingPath provides educational tools and backtesting software. Past performance does not guarantee future results. Trading involves substantial risk of loss. Alerts and signals are for informational purposes only and do not constitute financial advice.')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
