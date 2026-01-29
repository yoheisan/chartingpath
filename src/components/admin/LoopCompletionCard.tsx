import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  RefreshCw, 
  Target, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import type { LoopCompletionMetrics } from '@/services/journeyAnalyticsService';

interface LoopCompletionCardProps {
  metrics: LoopCompletionMetrics;
}

export function LoopCompletionCard({ metrics }: LoopCompletionCardProps) {
  const overallPercentage = metrics.overall.rate * 100;
  const targetPercentage = metrics.overall.target * 100;
  const isOnTarget = overallPercentage >= targetPercentage;
  
  const stages = [
    { key: 'discover', label: 'Discover', icon: '🔍', color: 'bg-green-500' },
    { key: 'research', label: 'Research', icon: '📊', color: 'bg-amber-500' },
    { key: 'execute', label: 'Execute', icon: '📈', color: 'bg-blue-500' },
    { key: 'automate', label: 'Automate', icon: '⚡', color: 'bg-violet-500' },
  ] as const;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Loop Completion Rate</CardTitle>
          </div>
          <Badge 
            variant={isOnTarget ? 'default' : 'destructive'}
            className="gap-1"
          >
            {isOnTarget ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {isOnTarget ? 'On Target' : 'Below Target'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Core KPI: % of users completing Discover → Research → Execute → Automate within 7 days
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Rate */}
        <div className="text-center py-4 bg-muted/30 rounded-lg">
          <div className="text-4xl font-bold text-primary">
            {overallPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {metrics.overall.completedCount} of {metrics.overall.totalUsers} users
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Target: {targetPercentage}%</span>
          </div>
        </div>

        {/* By Tier */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Free Users</span>
              {metrics.byTier.free.onTarget ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold">
              {(metrics.byTier.free.rate * 100).toFixed(1)}%
            </div>
            <Progress 
              value={metrics.byTier.free.rate * 100} 
              className="h-2 mt-2" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              Target: {(metrics.byTier.free.target * 100)}%
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Paid Users</span>
              {metrics.byTier.paid.onTarget ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <div className="text-2xl font-bold">
              {(metrics.byTier.paid.rate * 100).toFixed(1)}%
            </div>
            <Progress 
              value={metrics.byTier.paid.rate * 100} 
              className="h-2 mt-2" 
            />
            <div className="text-xs text-muted-foreground mt-1">
              Target: {(metrics.byTier.paid.target * 100)}%
            </div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Stage Completion</h4>
          <div className="space-y-3">
            {stages.map((stage) => {
              const data = metrics.byStage[stage.key];
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-lg">{stage.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{stage.label}</span>
                      <span className="text-sm font-medium">
                        {data.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <Progress 
                      value={data.percentage} 
                      className="h-2"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {data.completed} users
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Time Metrics */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Time to Complete Loop</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              Avg: {metrics.avgTimeToComplete.toFixed(1)}h
            </div>
            <div className="text-xs text-muted-foreground">
              Median: {metrics.medianTimeToComplete.toFixed(1)}h
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
