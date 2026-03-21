import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Bookmark, TrendingUp, TrendingDown, ShieldCheck, ExternalLink, BarChart3, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EdgeCardData } from '@/hooks/useCommunityFeed';
import { Link } from 'react-router-dom';

interface EdgeCardProps {
  card: EdgeCardData;
  onLike: () => void;
  onBookmark: () => void;
}

export const EdgeCard: React.FC<EdgeCardProps> = ({ card, onLike, onBookmark }) => {
  const isBacktest = card.type === 'backtest';
  const displaySymbol = card.instrument.replace('=X', '').replace('=F', '').replace('-USD', '');
  const shareLink = isBacktest
    ? card.shareToken ? `/share/${card.shareToken}` : undefined
    : card.shareToken ? `/s/${card.shareToken}` : undefined;

  const timeAgo = getTimeAgo(card.createdAt);

  return (
    <Card className="group relative overflow-hidden border-border/60 hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      {/* Verified Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge variant="outline" className="text-sm gap-1 bg-background/80 backdrop-blur-sm border-primary/20 text-primary">
          <ShieldCheck className="w-3 h-3" />
          Verified
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Header: Symbol + Pattern + Direction */}
        <div className="flex items-start gap-2 pr-20">
          <div className="flex items-center gap-1.5">
            {card.direction === 'long' ? (
              <TrendingUp className="w-4 h-4 text-[hsl(var(--bullish))]" />
            ) : card.direction === 'short' ? (
              <TrendingDown className="w-4 h-4 text-[hsl(var(--bearish))]" />
            ) : (
              <BarChart3 className="w-4 h-4 text-primary" />
            )}
            <span className="font-bold text-sm">{displaySymbol}</span>
          </div>
          <Badge variant="secondary" className="text-sm shrink-0">
            {card.timeframe}
          </Badge>
        </div>

        <p className="text-sm font-medium text-foreground leading-snug">{card.patternName}</p>

        {/* Stats Grid */}
        {isBacktest ? (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatCell label="Win Rate" value={card.winRate != null ? `${card.winRate.toFixed(1)}%` : '–'} positive={card.winRate != null && card.winRate > 50} />
            <StatCell label="Profit Factor" value={card.profitFactor != null ? card.profitFactor.toFixed(2) : '–'} positive={card.profitFactor != null && card.profitFactor > 1} />
            <StatCell label="Trades" value={card.totalTrades?.toString() || '–'} />
            <StatCell label="Sharpe" value={card.sharpeRatio != null ? card.sharpeRatio.toFixed(2) : '–'} positive={card.sharpeRatio != null && card.sharpeRatio > 1} />
            <StatCell label="Return" value={card.netPnl != null ? `${card.netPnl.toFixed(1)}%` : '–'} positive={card.netPnl != null && card.netPnl > 0} />
            <StatCell label="Max DD" value={card.maxDrawdown != null ? `${card.maxDrawdown.toFixed(1)}%` : '–'} positive={false} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatCell label="Entry" value={card.entryPrice?.toFixed(2) || '–'} />
            <StatCell label="Stop Loss" value={card.stopLossPrice?.toFixed(2) || '–'} />
            <StatCell label="Take Profit" value={card.takeProfitPrice?.toFixed(2) || '–'} />
            <StatCell label="R:R" value={card.riskRewardRatio != null ? `1:${card.riskRewardRatio.toFixed(1)}` : '–'} positive={card.riskRewardRatio != null && card.riskRewardRatio >= 2} />
            <StatCell label="Quality" value={card.qualityScore || '–'} positive={card.qualityScore === 'A' || card.qualityScore === 'B'} />
            <StatCell label="Direction" value={card.direction === 'long' ? 'Long' : card.direction === 'short' ? 'Short' : '–'} />
          </div>
        )}

        {/* Footer: Engagement + Time + Link */}
        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-7 px-2 gap-1 text-xs', card.isLiked && 'text-[hsl(var(--bearish))]')}
              onClick={(e) => { e.preventDefault(); onLike(); }}
            >
              <Heart className={cn('w-3.5 h-3.5', card.isLiked && 'fill-current')} />
              {card.likeCount > 0 && card.likeCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn('h-7 px-2', card.isBookmarked && 'text-primary')}
              onClick={(e) => { e.preventDefault(); onBookmark(); }}
            >
              <Bookmark className={cn('w-3.5 h-3.5', card.isBookmarked && 'fill-current')} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{timeAgo}</span>
            {shareLink && (
              <Link to={shareLink} className="text-primary hover:underline">
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function StatCell({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        'font-mono font-semibold text-xs',
        positive === true && 'text-[hsl(var(--bullish))]',
        positive === false && value !== '–' && label === 'Max DD' && 'text-[hsl(var(--bearish))]',
      )}>
        {value}
      </span>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
