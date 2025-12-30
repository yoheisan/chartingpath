import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Zap, Clock, TrendingUp, Bell, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { wedgeConfig, featuredPresets, WEDGE_PATTERN_ID_MAP } from '@/config/wedge';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
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

  const handlePrimaryClick = () => {
    navigate('/strategy-workspace');
  };

  const handleAlertClick = () => {
    if (isAuthenticated) {
      navigate('/members/alerts');
    } else {
      navigate('/auth?redirect=/members/alerts');
    }
  };

  // Crypto-focused wedge landing page
  if (wedgeConfig.wedgeEnabled) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section - Crypto 1H Focus */}
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background">
            <div className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 30% 40%, hsl(var(--primary)) 0%, transparent 40%), radial-gradient(circle at 70% 60%, hsl(var(--accent)) 0%, transparent 40%)',
              }}
            />
          </div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          
          {/* Content */}
          <div className="relative z-10 container mx-auto max-w-4xl text-center px-6">
            {/* Badge */}
            <div className="flex items-center justify-center gap-2 mb-6 animate-fade-in">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                Crypto • 1H Timeframe • TradingView-Native
              </Badge>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="text-foreground">TradingView shows patterns.</span>
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ChartingPath tells you when they work.
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
              1H crypto playbooks with regime-conditioned evidence + alerts.
              <br />
              <span className="text-sm">Built for discretionary traders who live in TradingView.</span>
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Button 
                size="lg" 
                onClick={handlePrimaryClick}
                className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Start with 1H Crypto Playbooks
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleAlertClick}
                className="px-8 py-6 text-lg"
              >
                <Bell className="h-5 w-5 mr-2" />
                Create your first alert (Free)
              </Button>
            </div>
            
            {/* Trust Block */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Signals evaluated on closed 1H candles</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Backtests use OHLC with documented assumptions</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bell className="h-4 w-4 text-primary" />
                <span>Alerts trigger when playbook conditions are met</span>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Presets Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">Featured Crypto 1H Presets</h2>
              <p className="text-muted-foreground">One-click playbooks ready to backtest and alert</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {featuredPresets.slice(0, 10).map((preset, idx) => (
                <Card 
                  key={idx} 
                  className="hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => navigate('/strategy-workspace')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {preset.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      1H {WEDGE_PATTERN_ID_MAP[preset.patternId] || preset.patternId}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Button variant="outline" onClick={handlePrimaryClick}>
                See all presets in Workspace
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold mb-3">The Playbook Loop</h2>
              <p className="text-muted-foreground">From hypothesis to evidence in minutes</p>
            </div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Pick a Preset', desc: 'BTC, ETH, SOL + pattern + 1H' },
                { step: '2', title: 'Run Backtest', desc: 'See historical performance' },
                { step: '3', title: 'Create Alert', desc: 'Get notified when conditions hit' },
                { step: '4', title: 'Review & Iterate', desc: 'Refine based on results' },
              ].map((item, idx) => (
                <Card key={idx} className="text-center">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-3">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Alerts CTA */}
        <section className="py-16 px-6 bg-gradient-to-br from-primary/5 to-accent/5">
          <div className="container mx-auto max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Stop Staring at Charts
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Create alerts for your backtested playbooks. Get notified when conditions are met.
              <br />
              <span className="text-sm">Free plan includes 1 active alert.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={handleAlertClick}>
                <Bell className="h-5 w-5 mr-2" />
                Create Free Alert
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">
                  Unlock More Alerts
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 px-6 border-t">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>
                <strong>Disclaimer:</strong> ChartingPath provides educational tools and backtesting software. 
                Past performance does not guarantee future results. Trading involves substantial risk of loss. 
                Alerts and signals are for informational purposes only and do not constitute financial advice.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Original landing page (when wedge mode disabled) - keeping minimal for brevity
  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background" />
        <div className="relative z-10 container mx-auto max-w-5xl text-center px-6">
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Map the trade. Make the trade.
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The best trades require research, then commitment.
          </p>
          <Button size="lg" asChild>
            <Link to="/pricing">Get started for free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
