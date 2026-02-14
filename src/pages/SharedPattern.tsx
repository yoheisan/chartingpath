import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, Target, Shield, ArrowRight,
  AlertCircle, Share2, Zap, BarChart3, Bell, FlaskConical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/services/analytics';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import { GradeBadge } from '@/components/ui/GradeBadge';
import type { CompressedBar, VisualSpec } from '@/types/VisualSpec';

interface SharedPatternData {
  id: string;
  instrument: string;
  pattern_name: string;
  pattern_id: string;
  direction: string;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  quality_score: string | null;
  quality_reasons: string[] | null;
  timeframe: string;
  asset_type: string;
  status: string;
  first_detected_at: string;
  bars: CompressedBar[];
  visual_spec: VisualSpec;
  trend_alignment: string | null;
  current_price: number | null;
  change_percent: number | null;
}

export default function SharedPattern() {
  const { token } = useParams<{ token: string }>();
  const [pattern, setPattern] = useState<SharedPatternData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ogSet = useRef(false);

  useEffect(() => {
    const fetchPattern = async () => {
      if (!token) {
        setError('Invalid share link');
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('live_pattern_detections')
          .select('*')
          .eq('share_token', token)
          .single();

        if (fetchError || !data) {
          setError('This pattern is no longer available or the link is invalid');
          setLoading(false);
          return;
        }

        setPattern(data as unknown as SharedPatternData);

        // Set OG meta tags dynamically for social sharing
        if (!ogSet.current) {
          ogSet.current = true;
          const title = `${data.pattern_name} on ${data.instrument} — ${data.direction === 'long' ? '↑ Long' : '↓ Short'}`;
          const desc = `R:R ${data.risk_reward_ratio?.toFixed(1)} | Quality: ${data.quality_score || 'N/A'} | Entry: ${data.entry_price}`;
          
          document.title = `${title} | ChartingPath`;
          setMetaTag('og:title', title);
          setMetaTag('og:description', desc);
          setMetaTag('og:type', 'article');
          setMetaTag('twitter:card', 'summary_large_image');
          setMetaTag('twitter:title', title);
          setMetaTag('twitter:description', desc);
        }

        track('shared_pattern_viewed', {
          share_token: token,
          instrument: data.instrument,
          pattern_name: data.pattern_name,
          direction: data.direction,
        });
      } catch (err) {
        console.error('Error fetching shared pattern:', err);
        setError('Failed to load pattern data');
      } finally {
        setLoading(false);
      }
    };

    fetchPattern();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pattern...</p>
        </div>
      </div>
    );
  }

  if (error || !pattern) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-16 max-w-2xl">
          <Card className="border-destructive/50">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Pattern Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'This share link is invalid.'}
              </p>
              <Button asChild>
                <Link to="/patterns/live">
                  <Zap className="h-4 w-4 mr-2" />
                  View Live Patterns
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isLong = pattern.direction === 'long';
  const rr = pattern.risk_reward_ratio;
  const grade = pattern.quality_score;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">
            <Share2 className="h-3 w-3 mr-1" />
            Shared Pattern Setup
          </Badge>
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
            {pattern.instrument.replace('-USD', '').replace('=X', '')}
            <Badge
              variant="outline"
              className={`text-sm ${
                isLong
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'
              }`}
            >
              {isLong ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : <TrendingDown className="h-3.5 w-3.5 mr-1" />}
              {isLong ? 'Long' : 'Short'}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            {pattern.pattern_name} • {pattern.timeframe.toUpperCase()} • {pattern.asset_type.toUpperCase()}
          </p>
        </div>

        {/* Chart Preview */}
        {pattern.bars && pattern.bars.length > 0 && (
          <Card className="mb-8 overflow-hidden">
            <div className="h-64 bg-card">
              <ThumbnailChart
                bars={pattern.bars}
                visualSpec={pattern.visual_spec}
                height={256}
                instrument={pattern.instrument}
              />
            </div>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Entry</p>
              <p className="text-xl font-bold font-mono">{pattern.entry_price}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingDown className="h-6 w-6 mx-auto mb-2 text-destructive" />
              <p className="text-sm text-muted-foreground">Stop Loss</p>
              <p className="text-xl font-bold font-mono text-destructive">{pattern.stop_loss_price}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Take Profit</p>
              <p className="text-xl font-bold font-mono text-green-500">{pattern.take_profit_price}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">R:R</p>
              <p className="text-xl font-bold font-mono">{rr.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Quality + Trend */}
        {(grade || pattern.trend_alignment) && (
          <Card className="mb-8">
            <CardContent className="p-4 flex flex-wrap items-center gap-4">
              {grade && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Quality:</span>
                  <GradeBadge quality={{ score: grade, grade: grade }} />
                </div>
              )}
              {pattern.trend_alignment && pattern.trend_alignment !== 'neutral' && (
                <Badge
                  variant="outline"
                  className={`${
                    pattern.trend_alignment === 'with_trend'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                  }`}
                >
                  {pattern.trend_alignment === 'with_trend' ? 'With Trend ↑' : 'Counter Trend ↓'}
                </Badge>
              )}
              {pattern.quality_reasons && pattern.quality_reasons.length > 0 && (
                <div className="w-full mt-2">
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {pattern.quality_reasons.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* CTAs */}
        <Card className="mb-8 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-center">
              Want to track this setup?
            </h2>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Create a free account to set alerts, backtest patterns, and discover more setups.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg">
                <Link to="/auth?redirect=/patterns/live">
                  <Zap className="h-4 w-4 mr-2" />
                  View Live Screener
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to={`/projects/pattern-lab/new?instrument=${pattern.instrument}&pattern=${pattern.pattern_id}&timeframe=${pattern.timeframe}`}>
                  <FlaskConical className="h-4 w-4 mr-2" />
                  Run Backtest
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Disclaimer */}
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Shield className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Disclaimer:</strong> This pattern is shared for educational purposes only.
            Past pattern performance does not guarantee future results. Always conduct your own research.
          </p>
        </div>
      </div>
    </div>
  );
}

function setMetaTag(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) ||
           document.querySelector(`meta[name="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    if (property.startsWith('og:')) {
      el.setAttribute('property', property);
    } else {
      el.setAttribute('name', property);
    }
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
