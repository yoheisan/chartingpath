import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommunityFeed, type CommunityFilters } from '@/hooks/useCommunityFeed';
import { useCommunityEngagement } from '@/hooks/useCommunityEngagement';
import { EdgeCard } from '@/components/community/EdgeCard';
import { CommunityFilters as FiltersBar } from '@/components/community/CommunityFilters';
import { LeaderboardSidebar } from '@/components/community/LeaderboardSidebar';
import { ShieldCheck, Users } from 'lucide-react';

const CommunityFeed = () => {
  const [filters, setFilters] = useState<CommunityFilters>({});

  const { cards, loading, error, refetch } = useCommunityFeed(filters);
  const { toggleLike, toggleBookmark } = useCommunityEngagement(refetch);

  return (
    <div className="container mx-auto max-w-7xl px-4 md:px-6 py-8">
        {/* Hero */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Community Edge Feed</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                Every stat is verified by ChartingPath — no fake claims
              </p>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="mb-6">
          <FiltersBar
            activeAssetType={filters.assetType || ''}
            activeDirection={filters.direction || ''}
            onAssetTypeChange={(v) => setFilters(prev => ({ ...prev, assetType: v || undefined }))}
            onDirectionChange={(v) => setFilters(prev => ({ ...prev, direction: v || undefined }))}
          />
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feed */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-52 bg-muted/50 animate-pulse rounded-lg border border-border/40" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{error}</p>
              </div>
            ) : cards.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold">No edges shared yet</h2>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Be the first! Run a backtest in the Strategy Workspace and toggle "Share to Community" to post your verified edge here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {cards.map(card => (
                  <EdgeCard
                    key={`${card.type}-${card.id}`}
                    card={card}
                    onLike={() => toggleLike(card.type, card.id, !!card.isLiked)}
                    onBookmark={() => toggleBookmark(card.type, card.id, !!card.isBookmarked)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <LeaderboardSidebar />
            </div>
          </aside>
        </div>
      </div>
  );
};

export default CommunityFeed;
