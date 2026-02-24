import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, TrendingUp, Lightbulb, CheckCircle, 
  ArrowRight, Zap, Target, Clock, Copy 
} from 'lucide-react';
import { toast } from 'sonner';
import type { AIInsight } from '@/services/journeyAnalyticsService';

interface AIInsightsPanelProps {
  insights: AIInsight[];
}

export function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const getCategoryIcon = (category: AIInsight['category']) => {
    switch (category) {
      case 'critical': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'improvement': return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-amber-500" />;
      case 'positive': return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getCategoryBadge = (category: AIInsight['category']) => {
    switch (category) {
      case 'critical': return <Badge variant="destructive">Critical Fix</Badge>;
      case 'improvement': return <Badge className="bg-blue-500 hover:bg-blue-600">Improvement</Badge>;
      case 'opportunity': return <Badge className="bg-amber-500 hover:bg-amber-600">Opportunity</Badge>;
      case 'positive': return <Badge className="bg-green-500 hover:bg-green-600">Positive</Badge>;
    }
  };

  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'border-red-500/50 text-red-500',
      medium: 'border-amber-500/50 text-amber-500',
      low: 'border-blue-500/50 text-blue-500',
    };
    return (
      <Badge variant="outline" className={styles[impact]}>
        {impact.charAt(0).toUpperCase() + impact.slice(1)} Impact
      </Badge>
    );
  };

  const getEffortBadge = (effort: 'high' | 'medium' | 'low') => {
    const styles = {
      high: 'border-red-500/50 text-red-500',
      medium: 'border-amber-500/50 text-amber-500',
      low: 'border-green-500/50 text-green-500',
    };
    return (
      <Badge variant="outline" className={styles[effort]}>
        {effort.charAt(0).toUpperCase() + effort.slice(1)} Effort
      </Badge>
    );
  };

  const prioritizedInsights = insights.sort((a, b) => b.priorityScore - a.priorityScore);
  const topPriority = prioritizedInsights.slice(0, 3);
  const otherInsights = prioritizedInsights.slice(3);

  return (
    <div className="space-y-6">
      {/* Priority Matrix Summary */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Priority Recommendations
          </CardTitle>
          <CardDescription>
            Data-driven insights ranked by impact and effort for maximum ROI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <p className="text-2xl font-bold text-red-500">
                {insights.filter(i => i.category === 'critical').length}
              </p>
              <p className="text-xs text-muted-foreground">Critical Issues</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <p className="text-2xl font-bold text-blue-500">
                {insights.filter(i => i.category === 'improvement').length}
              </p>
              <p className="text-xs text-muted-foreground">Improvements</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10">
              <p className="text-2xl font-bold text-amber-500">
                {insights.filter(i => i.category === 'opportunity').length}
              </p>
              <p className="text-xs text-muted-foreground">Opportunities</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Priority Actions */}
      {topPriority.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Top Priority Actions
          </h3>
          {topPriority.map((insight, index) => (
            <Card key={insight.id} className={
              insight.category === 'critical' ? 'border-red-500/30 bg-red-500/5' :
              insight.category === 'improvement' ? 'border-blue-500/30 bg-blue-500/5' :
              'border-amber-500/30 bg-amber-500/5'
            }>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background border font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(insight.category)}
                        <h4 className="font-semibold">{insight.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {getCategoryBadge(insight.category)}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                    
                    <div className="flex items-center gap-3 text-xs">
                      {getImpactBadge(insight.impact)}
                      {getEffortBadge(insight.effort)}
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        Priority: {insight.priorityScore}/100
                      </Badge>
                    </div>

                    <div className="p-3 rounded-lg bg-background/50 border">
                      <p className="text-xs text-muted-foreground mb-2">Suggested Actions:</p>
                      <ul className="space-y-1">
                        {insight.suggestedActions.map((action, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Affects: <strong>{insight.affectedMetric}</strong></span>
                        <span>Potential: <strong className="text-green-500">{insight.potentialLift}</strong></span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          const prompt = `Please implement this improvement from Journey Analytics:\n\n**Title**: ${insight.title}\n**Description**: ${insight.description}\n\n**Suggested Actions**:\n${insight.suggestedActions.map(a => `- ${a}`).join('\n')}\n\n**Context**:\n- Impact: ${insight.impact}\n- Effort: ${insight.effort}\n- Affected Metric: ${insight.affectedMetric}\n- Potential Lift: ${insight.potentialLift}`;
                          navigator.clipboard.writeText(prompt);
                          toast.success('Prompt copied! Paste it into Lovable to implement.');
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy Prompt for Lovable
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Other Insights */}
      {otherInsights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Additional Insights
          </h3>
          <div className="grid gap-3">
            {otherInsights.map(insight => (
              <Card key={insight.id} className="hover:border-primary/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(insight.category)}
                      <div>
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getImpactBadge(insight.impact)}
                      <span className="text-xs text-muted-foreground">
                        Score: {insight.priorityScore}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {insights.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Issues Detected</h3>
            <p className="text-muted-foreground">
              Your user journey is performing well. Continue monitoring for changes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
