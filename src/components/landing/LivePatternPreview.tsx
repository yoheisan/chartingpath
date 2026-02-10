import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, TrendingUp, TrendingDown, Zap, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ThumbnailChart from '@/components/charts/ThumbnailChart';
import { CompressedBar, VisualSpec, PatternQuality } from '@/types/VisualSpec';

import type { LiveSetup, ScanResult } from '@/types/screener';

export default function LivePatternPreview() {
  const [patterns, setPatterns] = useState<LiveSetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const fetchLivePatterns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use fx as default for homepage preview - fast DB-first path returns in <1s
      const { data, error: fnError } = await supabase.functions.invoke<ScanResult>('scan-live-patterns', {
        body: { assetType: 'fx', limit: 4 },
      });
      
      if (fnError) throw fnError;
      
      if (data?.patterns) {
        setPatterns(data.patterns.slice(0, 4)); // Show max 4
        setLastScanned(data.scannedAt);
      }
    } catch (err: any) {
      console.error('[LivePatternPreview] Error:', err);
      setError('Failed to load live patterns');
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
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Active Patterns Right Now</h2>
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
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-primary border-primary/50">
                  <Zap className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>
              <h2 className="text-2xl font-bold">Active Patterns Right Now</h2>
            </div>
          </div>
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {error || 'No active patterns detected at the moment. Check back soon!'}
            </p>
            <Button variant="outline" onClick={fetchLivePatterns}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-primary border-primary/50 animate-pulse">
                <Zap className="h-3 w-3 mr-1" />
                Live
              </Badge>
              <span className="text-xs text-muted-foreground">
                Scanned {lastScanned ? new Date(lastScanned).toLocaleTimeString() : 'just now'}
              </span>
            </div>
            <h2 className="text-2xl font-bold">Active Patterns Right Now</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Patterns detected across crypto & forex markets
            </p>
          </div>
          <Link to="/patterns/live">
            <Button variant="ghost" size="sm">
              See all
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
                      className={`text-[10px] px-1.5 py-0 ${
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
                    {setup.patternName}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
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
              Explore All Live Patterns
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          For educational purposes only. Past patterns don't guarantee future results.
        </p>
      </div>
    </section>
  );
}
