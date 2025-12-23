/**
 * Regime Analytics Dashboard
 * 
 * Main dashboard component for pattern strength analysis.
 * Research-grade with explicit reliability messaging.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, BarChart3, Grid3X3, Info } from 'lucide-react';
import { RegimeHeatmap } from './RegimeHeatmap';
import { PatternRankingTable } from './PatternRankingTable';
import { PatternStrengthScore, BucketStats, SAMPLE_SIZE_THRESHOLDS } from '@/types/RegimeAnalytics';

interface RegimeAnalyticsDashboardProps {
  patterns: PatternStrengthScore[];
  patternBuckets: Record<string, Record<string, BucketStats>>;
  isLoading?: boolean;
}

export function RegimeAnalyticsDashboard({
  patterns,
  patternBuckets,
  isLoading = false,
}: RegimeAnalyticsDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<'avgRMultiple' | 'winRate' | 'n'>('avgRMultiple');
  const [sortBy, setSortBy] = useState<'score' | 'trades' | 'edge' | 'reliability'>('score');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key as typeof sortBy);
      setSortDir('desc');
    }
  };

  const totalTrades = patterns.reduce((sum, p) => sum + p.totalTrades, 0);
  const reliablePatterns = patterns.filter(p => p.grade !== 'INSUFFICIENT').length;

  return (
    <div className="space-y-6">
      {/* Research Disclaimer Banner */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="py-3 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Research Analytics — Not Trading Advice
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              These metrics are historical observations for research purposes only. 
              Sample sizes below {SAMPLE_SIZE_THRESHOLDS.LOW} trades are dimmed. 
              Past performance does not guarantee future results.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Patterns Analyzed</CardDescription>
            <CardTitle className="text-2xl">{patterns.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reliable Patterns</CardDescription>
            <CardTitle className="text-2xl">{reliablePatterns}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Trades</CardDescription>
            <CardTitle className="text-2xl">{totalTrades.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Top Grade</CardDescription>
            <CardTitle className="text-2xl">
              {patterns.length > 0 ? patterns.sort((a,b) => b.overallScore - a.overallScore)[0]?.grade : '—'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ranking" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Pattern Rankings
          </TabsTrigger>
          <TabsTrigger value="heatmaps" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Regime Heatmaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking">
          <PatternRankingTable
            patterns={patterns}
            sortBy={sortBy}
            sortDirection={sortDir}
            onSort={handleSort}
          />
        </TabsContent>

        <TabsContent value="heatmaps" className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Metric:</span>
            <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as typeof selectedMetric)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="avgRMultiple">Avg R-Multiple</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
                <SelectItem value="n">Sample Size</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patterns
              .filter(p => p.grade !== 'INSUFFICIENT')
              .slice(0, 6)
              .map(pattern => (
                <Card key={pattern.patternId}>
                  <CardContent className="pt-4">
                    <RegimeHeatmap
                      patternId={pattern.patternId}
                      patternName={pattern.patternName}
                      buckets={patternBuckets[pattern.patternId] || {}}
                      metricKey={selectedMetric}
                    />
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RegimeAnalyticsDashboard;
