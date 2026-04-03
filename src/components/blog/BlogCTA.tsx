import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BlogCTAProps {
  patternName: string;
  patternSlug: string;
}

interface EdgeAtlasData {
  pattern_type: string;
  timeframe: string;
  win_rate: number;
  expectancy_r: number;
  rot_per_bar: number | null;
  est_annual_return: number | null;
  sample_count: number;
}

const BlogCTA = ({ patternName, patternSlug }: BlogCTAProps) => {
  const [count, setCount] = useState<number | null>(null);
  const [edgeData, setEdgeData] = useState<EdgeAtlasData | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: detectionCount, error } = await supabase
        .from('live_pattern_detections')
        .select('id', { count: 'exact', head: true })
        .ilike('pattern_name', `%${patternSlug.replace(/-/g, '%')}%`)
        .gte('detected_at', sevenDaysAgo.toISOString());

      if (!error && detectionCount !== null) {
        setCount(detectionCount);
      }
    };

    fetchCount();
  }, [patternSlug]);

  useEffect(() => {
    const fetchEdgeAtlas = async () => {
      const { data, error } = await (supabase
        .from('pattern_edge_stats' as any)
        .select('pattern_type, timeframe, win_rate, expectancy_r, rot_per_bar, est_annual_return, sample_count')
        .ilike('pattern_type', `%${patternSlug}%`)
        .gte('sample_count', 20)
        .order('est_annual_return', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle() as any);

      if (!error && data) {
        setEdgeData(data as EdgeAtlasData);
      }
    };

    fetchEdgeAtlas();
  }, [patternSlug]);

  return (
    <div className="mt-12 p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
          <TrendingUp className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-bold text-foreground">
              Live {patternName} setups
            </h3>
            {count !== null && count > 0 && (
              <Badge variant="secondary" className="text-sm font-semibold">
                {count} detected this week
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Our scanner monitors {patternName} formations across 200+ instruments in real time. See what's active right now.
          </p>
          <Button asChild className="gap-2">
            <Link to={`/patterns/live?filter=${patternSlug}`}>
              See live {patternName} setups
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          {edgeData && (
            <div className="mt-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {patternName} in Edge Atlas
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {edgeData.win_rate}% win rate · {edgeData.expectancy_r}R expectancy · +{edgeData.est_annual_return}% est. annual · n={edgeData.sample_count}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/#edge-atlas">
                    View ranking →
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogCTA;
