import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Zap, Copy, Loader2, RefreshCw } from "lucide-react";
import { GradeBadge } from "@/components/ui/GradeBadge";

// ─── Tweet formatting (mirrors post-patterns-to-social edge function) ───────

const ASSET_EMOJI: Record<string, string> = {
  stocks: '📈', etf: '📊', forex: '💱', fx: '💱',
  crypto: '🪙', commodities: '🛢️', indices: '🌐',
};

function formatPatternName(raw: string): string {
  return raw.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function directionEmoji(direction: string): string {
  return direction?.toLowerCase() === 'bullish' ? '🟢' : '🔴';
}

function buildTweet(pattern: PatternRow): string {
  const emoji = ASSET_EMOJI[pattern.asset_type?.toLowerCase() ?? ''] ?? '📉';
  const dir = directionEmoji(pattern.direction);
  const patternName = formatPatternName(pattern.pattern_name);
  const grade = pattern.quality_score?.toUpperCase() ?? '?';
  const tf = pattern.timeframe?.toUpperCase() ?? '';
  const rr = Number(pattern.risk_reward_ratio).toFixed(1);
  const entry = Number(pattern.entry_price).toPrecision(5);
  const sl = Number(pattern.stop_loss_price).toPrecision(5);
  const tp = Number(pattern.take_profit_price).toPrecision(5);

  return (
    `${emoji} ${dir} ${patternName} — ${pattern.instrument} (${tf})\n\n` +
    `Grade: ${grade} | R:R ${rr}:1\n` +
    `Entry: ${entry} | SL: ${sl} | TP: ${tp}\n\n` +
    `Free alerts at chartingpath.com`
  ).slice(0, 280);
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface PatternRow {
  id: string;
  pattern_name: string;
  instrument: string;
  asset_type: string | null;
  direction: string;
  timeframe: string;
  quality_score: string | null;
  entry_price: number;
  stop_loss_price: number;
  take_profit_price: number;
  risk_reward_ratio: number;
  trend_alignment: string | null;
  status: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function SignalPostGenerator() {
  const [signals, setSignals] = useState<{ pattern: PatternRow; tweet: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('live_pattern_detections')
        .select('id, pattern_name, instrument, asset_type, direction, timeframe, quality_score, entry_price, stop_loss_price, take_profit_price, risk_reward_ratio, trend_alignment, status')
        .in('quality_score', ['A', 'B'])
        .in('status', ['active', 'pending'])
        .order('last_confirmed_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const filtered = (data ?? [])
        .filter(p => p.trend_alignment && p.trend_alignment !== 'counter_trend')
        .slice(0, 5) as PatternRow[];

      if (filtered.length === 0) {
        toast({ title: "No signals", description: "No A/B grade with-trend patterns found right now." });
        setSignals([]);
        return;
      }

      setSignals(filtered.map(p => ({ pattern: p, tweet: buildTweet(p) })));
      toast({ title: `${filtered.length} signal(s) generated` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Signal Post Generator</h2>
          <p className="text-muted-foreground text-sm">
            Fetch top A/B-grade patterns and copy formatted tweets for X
          </p>
        </div>
        <Button onClick={generate} disabled={loading} size="lg">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : signals.length > 0 ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {loading ? "Fetching…" : signals.length > 0 ? "Refresh" : "Generate"}
        </Button>
      </div>

      {signals.length === 0 && !loading && (
        <Card className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
          <Zap className="h-10 w-10 mb-3 opacity-40" />
          <p>Click Generate to fetch top signals</p>
        </Card>
      )}

      <div className="grid gap-4">
        {signals.map(({ pattern, tweet }) => (
          <Card key={pattern.id} className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">{pattern.instrument}</span>
                <GradeBadge grade={pattern.quality_score ?? 'C'} size="sm" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  pattern.direction === 'bullish'
                    ? 'bg-green-500/15 text-green-500'
                    : 'bg-red-500/15 text-red-500'
                }`}>
                  {pattern.direction === 'bullish' ? '▲ Bullish' : '▼ Bearish'}
                </span>
                <span className="text-xs text-muted-foreground">{pattern.timeframe?.toUpperCase()}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(tweet)}
                className="gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <pre className="whitespace-pre-wrap text-sm bg-muted/50 rounded-md p-3 font-mono border">
              {tweet}
            </pre>
          </Card>
        ))}
      </div>
    </div>
  );
}
