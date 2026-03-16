import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, ArrowRight, TrendingUp, Shield,
  Bot
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import { trackEvent } from '@/lib/analytics';
import HowItWorks from '@/components/landing/HowItWorks';
import PricingTeaser from '@/components/landing/PricingTeaser';
import { PatternScreenerTeaser } from '@/components/landing/PatternScreenerTeaser';
import { EdgeAtlasSection } from '@/components/landing/EdgeAtlasSection';
import { usePrefetchArticles } from '@/hooks/usePrefetchArticles';
import { CopilotShowcase } from '@/components/landing/CopilotShowcase';
import { PageMeta } from '@/components/PageMeta';
import { WebApplicationJsonLd } from '@/components/JsonLd';
import { MetricStrip } from '@/components/landing/MetricStrip';
import { useSectionTracking } from '@/hooks/useSectionTracking';
import LivePatternPreview from '@/components/landing/LivePatternPreview';
import { FadeIn, CtaBand } from '@/components/editorial';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [instrumentCount, setInstrumentCount] = useState<number | null>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { prefetchArticles } = usePrefetchArticles();

  // Section tracking refs
  const heroRef = useSectionTracking('hero');
  const howItWorksRef = useSectionTracking('how_it_works');
  const screenerRef = useSectionTracking('screener_teaser');
  const edgeAtlasRef = useSectionTracking('edge_atlas');
  const copilotRef = useSectionTracking('copilot');
  const pricingRef = useSectionTracking('pricing');

  // Track landing page view for KPI funnel (fires into product_events + analytics_events)
  useEffect(() => {
    track('landing_view', { path: '/' });
    trackEvent('landing_view', { path: '/' });
  }, []);

  useEffect(() => {
    prefetchArticles();
  }, [prefetchArticles]);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('instruments')
        .select('symbol', { count: 'exact', head: true })
        .eq('is_active', true);
      if (count != null) setInstrumentCount(count);
    };
    fetchCount();
  }, []);

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

  const handleScreenerClick = () => {
    track('pricing_clicked', { source: 'landing_cta_screener' });
    trackEvent('landing.cta_click', { button: 'hero_see_setups' });
    navigate('/patterns/live');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="ChartingPath – Validate Chart Patterns with 320K+ Backtested Outcomes"
        description={`Know if a chart pattern works before you trade it. ${instrumentCount ? instrumentCount.toLocaleString() + '+' : '800+'} instruments backtested across 320,000+ real outcomes with win rates, expectancy, and quality grading.`}
        canonicalPath="/"
      />
      <WebApplicationJsonLd />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Background — subtle dot grid */}
        <div className="absolute inset-0 bg-background">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-left px-4 md:px-6 lg:px-8 py-24">
          <FadeIn>
            {/* Platform badge */}
            <Badge variant="secondary" className="mb-5 text-xs tracking-wide">
              {t('landing.platformBadge', 'Chart Pattern Backtesting Platform')}
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-bold mb-5 leading-[1.1] tracking-tight max-w-4xl">
              <span className="text-foreground">
                {t('hero.headlinePrimary', 'Know if a pattern works')}
              </span>
              <br />
              <span className="text-primary">
                {t('hero.headlineAccent', 'before you trade it')}
              </span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={100}>
            <p className="text-lg text-muted-foreground mb-3 max-w-2xl leading-relaxed">
              {t('hero.subtitleMain', 'Every pattern backtested against 320,000+ real market outcomes. Win rates, expectancy, and quality grades — not guesswork.')}
            </p>
          </FadeIn>

          <FadeIn delay={150}>
            <p className="text-sm text-muted-foreground/70 mb-8">
              {t('hero.socialProof', '320,000+ pattern outcomes analyzed. Free to start — works alongside TradingView.')}
            </p>
            
            {/* Orange accent line */}
            <div className="w-[120px] h-[2px] bg-primary mb-8" />
          </FadeIn>

          <FadeIn delay={200}>
            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button 
                size="lg" 
                onClick={() => {
                  (window as any).gtag?.('event', 'cta_click', { location: 'hero' });
                  handleScreenerClick();
                }}
                className="px-10 py-7 text-xl font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-xl shadow-primary/20"
              >
                <TrendingUp className="h-6 w-6 mr-3" />
                {t('hero.ctaPrimary', 'See Live Patterns Free')}
                <ArrowRight className="h-6 w-6 ml-3" />
              </Button>

              {/* Sign Up CTA — for guests */}
              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    (window as any).gtag?.('event', 'cta_click', { location: 'hero_signup' });
                    navigate('/auth?mode=signup');
                  }}
                  className="px-8 py-6 text-lg font-semibold"
                >
                  {t('hero.createFreeAccount', 'Create Free Account')}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </FadeIn>
          
          <FadeIn delay={300}>
            {/* Trust Block */}
            <div className="flex flex-wrap gap-6 md:gap-10 text-xs text-muted-foreground/70 uppercase tracking-wider mb-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-primary/60" />
                <span>{t('hero.trustSignals', 'Every signal backtested')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-primary/60" />
                <span>{t('hero.trustAssumptions', 'Win rates shown upfront')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-primary/60" />
                <span>{t('hero.trustRepeatability', 'No black-box indicators')}</span>
              </div>
            </div>

            {/* Copilot hint */}
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground/50">
              <Bot className="h-3 w-3" />
              <span>{t('hero.copilotHint', 'Powered by AI Trading Copilot — press ⌘K anywhere')}</span>
            </div>
          </FadeIn>

          {/* Metric Strip */}
          <MetricStrip />
        </div>
      </section>

      {/* Live Pattern Preview — visual proof above the fold */}
      <LivePatternPreview />

      {/* Use-Case Showcase (replaces How It Works + Action Cards) */}
      <div ref={howItWorksRef} className="border-t border-border/20">
        <HowItWorks />
      </div>

      {/* AI Copilot */}
      <div ref={copilotRef} className="border-t border-border/20">
        <CopilotShowcase />
      </div>

      {/* Mid-page Signup CTA */}
      {!isAuthenticated && (
        <CtaBand>
          <FadeIn>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              {t('hero.midPageHeadline', 'See the data behind the pattern')}
            </h2>
            <p className="text-white/70 mb-8">
              {t('hero.midPageSubtext', 'Free account. No credit card. Real backtest data from day one.')}
            </p>
            <Button
              size="lg"
              onClick={() => {
                (window as any).gtag?.('event', 'cta_click', { location: 'mid_page' });
                navigate('/auth?mode=signup');
              }}
              className="px-10 py-7 text-lg font-bold bg-white text-primary hover:bg-white/90 transition-opacity shadow-lg"
            >
              {t('hero.createFreeAccount', 'Create Free Account')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </FadeIn>
        </CtaBand>
      )}

      {/* Pattern Screener Table */}
      <div ref={screenerRef}>
        <PatternScreenerTeaser />
      </div>

      {/* Edge Atlas */}
      <div ref={edgeAtlasRef}>
        <EdgeAtlasSection />
      </div>

      {/* Pricing Teaser */}
      <div ref={pricingRef}>
        <PricingTeaser />
      </div>

      {/* Disclaimer */}
      <section className="py-8 px-4 md:px-6 lg:px-8 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
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
