import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import type { JourneyFlow, ConversionFunnel } from '@/services/journeyAnalyticsService';

interface JourneyFlowVisualizationProps {
  flow: JourneyFlow;
  funnel: ConversionFunnel[];
}

export function JourneyFlowVisualization({ flow, funnel }: JourneyFlowVisualizationProps) {
  const funnelData = useMemo(() => {
    const maxCount = Math.max(...funnel.map(s => s.count), 1);
    return funnel.map(stage => ({
      ...stage,
      widthPercentage: (stage.count / maxCount) * 100,
    }));
  }, [funnel]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'acquisition': return 'bg-blue-500/10 border-blue-500/30 text-blue-600';
      case 'activation': return 'bg-green-500/10 border-green-500/30 text-green-600';
      case 'engagement': return 'bg-purple-500/10 border-purple-500/30 text-purple-600';
      case 'monetization': return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
      case 'retention': return 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getPerformanceIcon = (performance: 'above' | 'at' | 'below') => {
    switch (performance) {
      case 'above': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'at': return null;
      case 'below': return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  const getBarColor = (performance: 'above' | 'at' | 'below') => {
    switch (performance) {
      case 'above': return 'bg-green-500';
      case 'at': return 'bg-primary';
      case 'below': return 'bg-red-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{flow.totalSessions.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unique Users</p>
            <p className="text-2xl font-bold">{flow.uniqueUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Nodes</p>
            <p className="text-2xl font-bold">{flow.nodes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Transitions</p>
            <p className="text-2xl font-bold">{flow.edges.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>
            User journey from landing to paid subscription with benchmark comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32">{stage.displayName}</span>
                    <Badge variant="outline" className="text-xs">
                      {stage.count.toLocaleString()}
                    </Badge>
                    {getPerformanceIcon(stage.performance)}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {index > 0 && (
                      <>
                        <span className="text-muted-foreground">
                          {stage.rate.toFixed(1)}% from previous
                        </span>
                        <span className="text-muted-foreground text-xs">
                          (benchmark: {stage.benchmarkRate}%)
                        </span>
                      </>
                    )}
                    {stage.dropOff > 0 && (
                      <span className="text-red-500 text-xs flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" />
                        -{stage.dropOff.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
                  <div
                    className={`absolute inset-y-0 left-0 ${getBarColor(stage.performance)} transition-all duration-500 rounded-lg`}
                    style={{ width: `${stage.widthPercentage}%` }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-medium text-white mix-blend-difference">
                      {((stage.count / flow.totalSessions) * 100).toFixed(2)}% of total
                    </span>
                  </div>
                </div>
                {stage.avgTimeToNext && (
                  <p className="text-xs text-muted-foreground">
                    Avg time to next: {stage.avgTimeToNext < 60 
                      ? `${stage.avgTimeToNext.toFixed(0)}min` 
                      : `${(stage.avgTimeToNext / 60).toFixed(1)}h`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Node Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Event Distribution by Category</CardTitle>
          <CardDescription>
            All tracked user events grouped by journey stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {flow.nodes.map(node => {
              const stageInfo = {
                acquisition: { label: 'Acquisition', color: 'blue' },
                activation: { label: 'Activation', color: 'green' },
                engagement: { label: 'Engagement', color: 'purple' },
                monetization: { label: 'Monetization', color: 'amber' },
                retention: { label: 'Retention', color: 'cyan' },
              }[node.category];

              return (
                <div
                  key={node.id}
                  className={`p-3 rounded-lg border ${getCategoryColor(node.category)}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium uppercase opacity-70">
                      {stageInfo?.label}
                    </span>
                    {node.isRequired && (
                      <Badge variant="outline" className="text-sm h-4">
                        Critical
                      </Badge>
                    )}
                  </div>
                  <p className="font-medium text-sm">{node.displayName}</p>
                  <p className="text-lg font-bold">{node.count.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Path */}
      <Card>
        <CardHeader>
          <CardTitle>Critical Conversion Path</CardTitle>
          <CardDescription>
            The ideal user journey from discovery to subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {flow.criticalPath.map((step, index) => {
              const node = flow.nodes.find(n => n.id === step);
              const edge = index < flow.criticalPath.length - 1 
                ? flow.edges.find(e => e.source === step && e.target === flow.criticalPath[index + 1])
                : null;

              return (
                <div key={step} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`px-4 py-2 rounded-lg border ${edge?.isBottleneck ? 'border-red-500 bg-red-500/10' : 'border-primary/30 bg-primary/10'}`}>
                      <p className="text-sm font-medium">{node?.displayName || step}</p>
                      <p className="text-xs text-muted-foreground text-center">
                        {node?.count.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  {index < flow.criticalPath.length - 1 && (
                    <div className="flex flex-col items-center">
                      <ArrowRight className={`h-5 w-5 ${edge?.isBottleneck ? 'text-red-500' : 'text-muted-foreground'}`} />
                      {edge && (
                        <span className={`text-sm ${edge.isBottleneck ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {edge.conversionRate.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary/10 border border-primary/30" />
              <span className="text-muted-foreground">Healthy transition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/10 border border-red-500" />
              <span className="text-muted-foreground">Bottleneck (below benchmark)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
