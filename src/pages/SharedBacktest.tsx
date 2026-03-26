import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Target, 
  BarChart3,
  Clock,
  AlertCircle,
  ArrowRight,
  Share2,
  ExternalLink,
  Bell
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { openTradingView } from "@/utils/tradingViewLinks";
import { track } from "@/services/analytics";
import { savePlaybookContextStatic } from "@/hooks/usePlaybookContext";

interface SharedBacktestData {
  id: string;
  strategy_name: string;
  instrument: string;
  timeframe: string;
  from_date: string;
  to_date: string;
  win_rate?: number;
  profit_factor?: number;
  net_pnl?: number;
  max_drawdown?: number;
  sharpe_ratio?: number;
  total_trades?: number;
  avg_win?: number;
  avg_loss?: number;
  initial_capital?: number;
  engine_version?: string;
  created_at: string;
  parameters?: any;
}

const SharedBacktest = () => {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [backtest, setBacktest] = useState<SharedBacktestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBacktest = async () => {
      if (!token) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('backtest_runs')
          .select(`
            id,
            strategy_name,
            instrument,
            timeframe,
            from_date,
            to_date,
            win_rate,
            profit_factor,
            net_pnl,
            max_drawdown,
            sharpe_ratio,
            total_trades,
            avg_win,
            avg_loss,
            initial_capital,
            engine_version,
            created_at,
            parameters
          `)
          .eq('share_token', token)
          .eq('is_shared', true)
          .single();

        if (fetchError) {
          console.error('Fetch error:', fetchError);
          setError("This backtest is not available or the share link has expired");
          setLoading(false);
          return;
        }

        setBacktest(data);
        
        // Track shared backtest viewed
        track('shared_backtest_viewed', {
          share_token: token,
          instrument: data.instrument,
          timeframe: data.timeframe,
        });
      } catch (err) {
        console.error('Error fetching shared backtest:', err);
        setError("Failed to load backtest data");
      } finally {
        setLoading(false);
      }
    };

    fetchBacktest();
  }, [token]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Handle "Create this alert" - save context and navigate
  const handleCreateAlert = async () => {
    if (!backtest) return;
    
    track('shared_backtest_alert_clicked', {
      share_token: token,
      instrument: backtest.instrument,
      timeframe: backtest.timeframe,
    });

    // Save playbook context for prefilling alert form
    const playbookContext = {
      symbol: backtest.instrument,
      pattern: backtest.strategy_name,
      timeframe: backtest.timeframe,
      instrumentCategory: 'crypto',
      fromShare: true,
      shareToken: token,
    };
    
    savePlaybookContextStatic(playbookContext);
    
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/auth?redirect=/members/alerts&fromShare=true');
      return;
    }
    
    navigate('/members/alerts');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('sharedBacktest.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !backtest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-16 max-w-2xl">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">{t('sharedBacktest.notFound')}</h1>
              <p className="text-muted-foreground mb-6">
                {error || t('sharedBacktest.invalidLink')}
              </p>
              <Button asChild>
                <Link to="/projects/pattern-lab/new">
                  {t('sharedBacktest.createOwn')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Share2 className="h-3 w-3 mr-1" />
            {t('sharedBacktest.sharedResults')}
          </Badge>
          <h1 className="text-3xl font-bold mb-2">{backtest.strategy_name}</h1>
          <p className="text-muted-foreground">
            {backtest.instrument} • {backtest.timeframe} • {backtest.from_date} to {backtest.to_date}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Percent className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('sharedBacktest.winRate')}</p>
              <p className="text-2xl font-bold">
                {backtest.win_rate ? formatPercentage(backtest.win_rate) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              {(backtest.net_pnl || 0) >= 0 ? (
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              ) : (
                <TrendingDown className="h-6 w-6 mx-auto mb-2 text-red-500" />
              )}
              <p className="text-sm text-muted-foreground">{t('sharedBacktest.netPnl')}</p>
              <p className={`text-2xl font-bold ${(backtest.net_pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {backtest.net_pnl ? formatCurrency(backtest.net_pnl) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingDown className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('sharedBacktest.maxDrawdown')}</p>
              <p className="text-2xl font-bold text-red-500">
                {backtest.max_drawdown ? formatPercentage(backtest.max_drawdown) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t('sharedBacktest.totalTrades')}</p>
              <p className="text-2xl font-bold">
                {backtest.total_trades || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Primary CTAs - Conversion focused */}
        <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">
              {t('sharedBacktest.tradeStrategy')}
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="gap-2 flex-1 max-w-xs"
              >
                <Link 
                  to={buildPatternLabUrl({ instrument: backtest.instrument, pattern: backtest.strategy_name, timeframe: backtest.timeframe })}
                  onClick={() => track('shared_backtest_run_clicked', { share_token: token, instrument: backtest.instrument, timeframe: backtest.timeframe })}
                >
                  <BarChart3 className="h-4 w-4" />
                  Try This Backtest Yourself
                </Link>
              </Button>
              <Button 
                onClick={handleCreateAlert}
                size="lg"
                className="gap-2 flex-1 max-w-xs"
              >
                <Bell className="h-4 w-4" />
                {t('sharedBacktest.createAlert')}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              {t('sharedBacktest.validateFirst')}
            </p>
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('sharedBacktest.performanceMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">{t('sharedBacktest.sharpeRatio')}</p>
                <p className="text-xl font-semibold">
                  {backtest.sharpe_ratio?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('sharedBacktest.profitFactor')}</p>
                <p className="text-xl font-semibold">
                  {backtest.profit_factor?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('sharedBacktest.avgWin')}</p>
                <p className="text-xl font-semibold text-green-500">
                  {backtest.avg_win ? formatCurrency(backtest.avg_win) : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('sharedBacktest.avgLoss')}</p>
                <p className="text-xl font-semibold text-red-500">
                  {backtest.avg_loss ? formatCurrency(backtest.avg_loss) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Model Assumptions */}
        <Card className="mb-8 border-muted">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Model Assumptions
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• OHLC data from Yahoo Finance</p>
            <p>• Signals evaluated on closed {backtest.timeframe} candles</p>
            <p>• Slippage and commission: 0% (customize in your own backtest)</p>
            <p>• Initial capital: {formatCurrency(backtest.initial_capital || 10000)}</p>
            <p>• Engine version: {backtest.engine_version || 'v1.0'}</p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Footer Disclaimer */}
        <div className="mt-12 p-4 bg-muted/50 rounded-lg text-center mb-16">
          <p className="text-xs text-muted-foreground">
            <strong>{t('about.disclaimerTitle')}</strong> {t('sharedBacktest.disclaimer')}
          </p>
        </div>

        {/* Sticky bottom CTA bar */}
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm p-3 md:p-4">
          <div className="container mx-auto max-w-4xl flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground hidden sm:block">
              Validate <strong className="text-foreground">{backtest.strategy_name}</strong> on <strong className="text-foreground">{backtest.instrument}</strong> yourself
            </p>
            <div className="flex gap-2 ml-auto">
              <Button 
                asChild 
                size="sm" 
                variant="outline"
                onClick={() => track('shared_backtest_run_clicked', { share_token: token, context: 'sticky_bar', instrument: backtest.instrument })}
              >
                <Link to={buildPatternLabUrl({ instrument: backtest.instrument, pattern: backtest.strategy_name, timeframe: backtest.timeframe })}>
                  Try Free Backtest
                </Link>
              </Button>
              <Button 
                asChild 
                size="sm"
                onClick={() => track('shared_to_auth_click', { share_token: token, context: 'shared_backtest', instrument: backtest.instrument })}
              >
                <Link to={`/auth?redirect=/members/alerts&context=shared_backtest&pattern=${encodeURIComponent(backtest.strategy_name)}&symbol=${encodeURIComponent(backtest.instrument)}`}>
                  Create Free Account
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedBacktest;
