import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TrendingUp, Shield, FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import { trackEvent } from '@/lib/analytics';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { PatternScreenerTeaser } from '@/components/landing/PatternScreenerTeaser';
import { EdgeAtlasSection } from '@/components/landing/EdgeAtlasSection';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { FeatureBlocks } from '@/components/landing/FeatureBlocks';
import { CopilotValueProp } from '@/components/landing/CopilotValueProp';
import { PageMeta } from '@/components/PageMeta';
import { WebApplicationJsonLd, FAQJsonLd } from '@/components/JsonLd';
import { MetricStrip } from '@/components/landing/MetricStrip';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import { useOutcomeCount } from '@/hooks/useOutcomeCount';
import LivePatternPreview from '@/components/landing/LivePatternPreview';
import MarketPulseChart from '@/components/landing/MarketPulseChart';
import { SocialProof } from '@/components/landing/SocialProof';
import { EmailLeadCapture } from '@/components/landing/EmailLeadCapture';
import { ScrollSignupModal } from '@/components/landing/ScrollSignupModal';
import { HeroStatsBar } from '@/components/landing/HeroStatsBar';
import { OutcomeStatsStrip } from '@/components/landing/OutcomeStatsStrip';
import { PatternConcentrationHeatmap } from '@/components/landing/PatternConcentrationHeatmap';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchArticles } = usePrefetchArticles();
  const { formatted: outcomeCount } = useOutcomeCount();

  const heroRef = useSectionTracking('hero');
  const screenerRef = useSectionTracking('screener_teaser');
  const edgeAtlasRef = useSectionTracking('edge_atlas');
  const copilotRef = useSectionTracking('copilot');
  const pricingRef = useSectionTracking('pricing');

  useEffect(() => {
    track('landing_view', { path: '/' });
    trackEvent('landing_view', { path: '/' });
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
        title="ChartingPath — Pattern Detection with Proven Outcomes"
        description={`The only chart pattern platform that tracks what actually happens after the pattern forms. ${outcomeCount} labeled pattern outcomes across FX and US equities. Win rates by pattern, timeframe, and instrument — updated daily.`}
        canonicalPath="/"
      />
      <WebApplicationJsonLd />
      <FAQJsonLd faqs={[
        {
          question: 'What is ChartingPath?',
          answer: 'ChartingPath is a chart pattern detection platform that scans 1,100+ instruments across FX and US equities in real time. Unlike textbook statistics, it tracks every detected pattern to its actual outcome, providing real win rates and expectancy data.',
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

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[60vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-background">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '80px 80px',
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07] blur-[100px] bg-primary pointer-events-none" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-6 text-xs tracking-wide animate-fade-in">
              {t('landing.platformBadge', 'Chart Pattern Backtesting Platform')}
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.08] animate-fade-in tracking-tight text-foreground">
              {t('landing.heroHeadline', 'Know what happens after the pattern forms.')}
            </h1>
            
            <p className="text-lg md:text-xl lg:text-[1.35rem] text-muted-foreground mb-10 max-w-xl animate-fade-in leading-relaxed" style={{ animationDelay: '0.1s' }}>
              {(t as Function)('landing.heroSubheadline', { defaultValue: 'ChartingPath detects chart patterns live across FX and US equities — and tracks every outcome. Win rates, R-multiples, and outcome data from {{count}} pattern detections. Not textbook stats — real data from our engine.', count: outcomeCount })}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button 
                size="lg" 
                onClick={() => {
                  (window as any).gtag?.('event', 'cta_click', { location: 'hero' });
                  track('pricing_clicked', { source: 'landing_cta_screener' });
                  trackEvent('landing.cta_click', { button: 'hero_see_live_patterns' });
                  navigate('/patterns/live');
                }}
                className="px-10 py-7 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/20"
              >
                <TrendingUp className="h-6 w-6 mr-3" />
                {t('landing.seeLivePatterns', 'See live patterns')}
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>

              <Button 
                variant="outline"
                size="lg" 
                onClick={() => {
                  (window as any).gtag?.('event', 'cta_click', { location: 'hero_secondary' });
                  trackEvent('landing.cta_click', { button: 'hero_explore_outcomes' });
                  navigate('/projects/pattern-lab/new');
                }}
                className="px-10 py-7 text-xl font-bold border-border/60 hover:bg-accent/10 transition-colors"
              >
                <FlaskConical className="h-6 w-6 mr-3" />
                {t('landing.exploreOutcomeData', 'Explore outcome data')}
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/patterns/live" className="underline underline-offset-4 hover:text-foreground transition-colors">
                {t('landing.noAccountNeeded', 'No account needed — browse live patterns now →')}
              </Link>
            </p>

            <HeroStatsBar />
          </div>
        </div>
      </section>

      <div className="border-t border-border/20 bg-card/30">
        <div className="container mx-auto">
          <MetricStrip />
        </div>
      </div>

      <LivePatternPreview />
      <MarketPulseChart />

      <div className="border-t border-border/20">
        <PatternConcentrationHeatmap />
      </div>

      <div className="border-t border-border/20">
        <SocialProof />
      </div>

      <OutcomeStatsStrip />

      <div ref={copilotRef} className="border-t border-border/20">
        <FeatureBlocks />
      </div>

      <CopilotValueProp />

      {!isAuthenticated && (
        <section className="py-20 px-4 md:px-6 lg:px-8 border-t border-border/20">
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
                    (window as any).gtag?.('event', 'cta_click', { location: 'mid_page' });
                    navigate('/auth?mode=signup');
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

      <div ref={screenerRef}>
        <PatternScreenerTeaser />
      </div>

      <div ref={edgeAtlasRef}>
        <EdgeAtlasSection />
      </div>

      <EmailLeadCapture />

      <div ref={pricingRef}>
        <PricingTeaser />
      </div>

      <ScrollSignupModal />

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
