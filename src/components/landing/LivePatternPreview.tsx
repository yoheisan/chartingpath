import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';

import type { LiveSetup, ScanResult } from '@/types/screener';

export default function LivePatternPreview() {
  const { t } = useTranslation();
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const fetchLivePatterns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Query DB directly for active patterns — much faster than edge function for a simple preview
      const { data: dbPatterns, error: dbError } = await supabase
        .from('live_pattern_detections')
        .select('id, instrument, pattern_id, pattern_name, direction, asset_type, timeframe, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, visual_spec, bars, last_confirmed_at')
        .eq('status', 'active')
        .order('last_confirmed_at', { ascending: false })
        .limit(4);

      if (dbError) throw dbError;

      if (dbPatterns && dbPatterns.length > 0) {
        const mapped: LiveSetup[] = dbPatterns.map((p: any) => ({
          dbId: p.id,
          instrument: p.instrument,
          patternId: p.pattern_id,
          patternName: p.pattern_name,
          direction: p.direction as 'long' | 'short',
          signalTs: p.last_confirmed_at,
          quality: { score: 'B', reasons: [] },
          tradePlan: {
            entry: p.entry_price,
            stopLoss: p.stop_loss_price,
            takeProfit: p.take_profit_price,
            rr: p.risk_reward_ratio,
          },
          bars: p.bars,
          visualSpec: p.visual_spec,
        }));
        setPatterns(mapped);
        setLastScanned(dbPatterns[0].last_confirmed_at);
      } else {
        setError(t('livePatternPreview.noPatterns'));
      }
    } catch (err: any) {
      console.error('[LivePatternPreview] Error:', err);
      setError(t('livePatternPreview.noPatterns'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLivePatterns();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  {t('patternScreenerTeaser.live')}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">{t('livePatternPreview.title')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <CardContent className="p-3">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || patterns.length === 0) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  {t('patternScreenerTeaser.live')}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">{t('livePatternPreview.title')}</h2>
            </div>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || t('livePatternPreview.noPatterns')}
            </p>
            <Button variant="outline" onClick={fetchLivePatterns}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('livePatternPreview.refresh')}
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                {t('patternScreenerTeaser.live')}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {t('livePatternPreview.scanned')} {lastScanned ? new Date(lastScanned).toLocaleTimeString() : t('patternScreenerTeaser.justNow')}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{t('livePatternPreview.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t('livePatternPreview.patternsDetected')}
            </p>
          </div>
          <Link to="/patterns/live">
            <Button variant="ghost" size="sm">
              {t('livePatternPreview.seeAll')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {patterns.map((setup, idx) => (
            <Link 
              key={`${setup.instrument}-${setup.patternId}-${idx}`}
              to={`/patterns/live?highlight=${setup.instrument}`}
            >
              <Card className="overflow-hidden hover:border-primary/50 transition-all group cursor-pointer">
                <div className="h-28 bg-card">
                  <ThumbnailChart
                    bars={setup.bars}
                    visualSpec={setup.visualSpec}
                    height={112}
                    instrument={setup.instrument}
                  />
                </div>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {setup.instrument.replace('-USD', '').replace('=X', '')}
                    </span>
                    <Badge 
                      variant={setup.direction === 'long' ? 'default' : 'secondary'}
                      className={`text-sm px-1.5 py-0 ${
                        setup.direction === 'long' 
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30' 
                          : 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
                      }`}
                    >
                      {setup.direction === 'long' ? (
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                      )}
                      {setup.direction}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {t(`patternNames.${setup.patternName}`, setup.patternName)}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                    <span>R:R {setup.tradePlan.rr.toFixed(1)}</span>
                    <span>{new Date(setup.signalTs).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <div className="text-center mt-6">
          <Link to="/patterns/live">
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              {t('livePatternPreview.exploreAll')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {t('livePatternPreview.disclaimer')}
        </p>
      </div>
    </section>
  );
}
