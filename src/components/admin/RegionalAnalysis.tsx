import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, TrendingUp, Users, MapPin } from 'lucide-react';

export interface RegionalInsight {
  region: string;
  engagement: 'high' | 'medium' | 'low';
  topEvents: string[];
  uniqueNeeds: string;
  opportunity: string;
}

export interface CopilotInsights {
  topUnservedIntents: string[];
  contentGapPriority: string[];
  satisfactionTrend: 'improving' | 'stable' | 'declining';
}

export interface JourneySummary {
  healthScore: number;
  biggestBottleneck: string;
  quickestWin: string;
  retentionRisk: string;
}

interface RegionalAnalysisProps {
  regions: RegionalInsight[];
  summary: JourneySummary | null;
  copilotInsights: CopilotInsights | null;
}

const engagementColors = {
  high: 'text-green-500 bg-green-500/10 border-green-500/30',
  medium: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  low: 'text-red-500 bg-red-500/10 border-red-500/30',
};

const regionEmojis: Record<string, string> = {
  'Americas': '🌎',
  'Europe/Africa': '🌍',
  'Asia-Pacific': '🌏',
  'Unknown': '🌐',
};

export function RegionalAnalysis({ regions, summary, copilotInsights }: RegionalAnalysisProps) {
  return (
    <div className="space-y-6">
      {/* Journey Summary */}
      {summary && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              AI Journey Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-background/50 border text-center">
                <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                <p className={`text-2xl font-bold ${summary.healthScore >= 70 ? 'text-green-500' : summary.healthScore >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                  {summary.healthScore}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="text-xs text-muted-foreground mb-1">🚧 Biggest Bottleneck</p>
                <p className="text-sm font-medium">{summary.biggestBottleneck}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="text-xs text-muted-foreground mb-1">⚡ Quickest Win</p>
                <p className="text-sm font-medium">{summary.quickestWin}</p>
              </div>
              <div className="p-3 rounded-lg bg-background/50 border">
                <p className="text-xs text-muted-foreground mb-1">⚠️ Retention Risk</p>
                <p className="text-sm font-medium">{summary.retentionRisk}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regional Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Regional Engagement Analysis
          </CardTitle>
          <CardDescription>
            AI-analyzed engagement patterns and opportunities by geographic region
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {regions.map(region => (
              <div key={region.region} className={`p-4 rounded-lg border ${engagementColors[region.engagement]}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{regionEmojis[region.region] || '🌐'}</span>
                    <div>
                      <h4 className="font-semibold">{region.region}</h4>
                      <Badge variant="outline" className="mt-1">
                        {region.engagement} engagement
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {region.topEvents.slice(0, 4).map(e => (
                      <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-2 rounded bg-background/60">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      Regional Needs
                    </p>
                    <p className="text-xs">{region.uniqueNeeds}</p>
                  </div>
                  <div className="p-2 rounded bg-background/60">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      Opportunity
                    </p>
                    <p className="text-xs">{region.opportunity}</p>
                  </div>
                </div>
              </div>
            ))}
            {regions.length === 0 && (
              <p className="text-center text-muted-foreground py-4">Run AI analysis to see regional insights</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Copilot Content Intelligence */}
      {copilotInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Copilot Content Intelligence
            </CardTitle>
            <CardDescription>
              What users are asking for but not finding — derived from copilot conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  🔍 Unserved Intents
                  <Badge variant="destructive" className="text-xs">
                    {copilotInsights.topUnservedIntents.length}
                  </Badge>
                </h4>
                <ul className="space-y-1">
                  {copilotInsights.topUnservedIntents.map((intent, i) => (
                    <li key={i} className="text-xs p-2 rounded bg-red-500/5 border border-red-500/20">
                      {intent}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  📝 Content to Create
                  <Badge variant="secondary" className="text-xs">Priority</Badge>
                </h4>
                <ol className="space-y-1">
                  {copilotInsights.contentGapPriority.map((gap, i) => (
                    <li key={i} className="text-xs p-2 rounded bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                      <span className="font-bold text-amber-500 shrink-0">#{i + 1}</span>
                      {gap}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">📈 Satisfaction Trend</h4>
                <div className={`p-4 rounded-lg border text-center ${
                  copilotInsights.satisfactionTrend === 'improving' ? 'bg-green-500/10 border-green-500/30' :
                  copilotInsights.satisfactionTrend === 'declining' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-muted border-border'
                }`}>
                  <p className="text-3xl mb-1">
                    {copilotInsights.satisfactionTrend === 'improving' ? '📈' : copilotInsights.satisfactionTrend === 'declining' ? '📉' : '➡️'}
                  </p>
                  <p className="text-sm font-semibold capitalize">{copilotInsights.satisfactionTrend}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
