import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, Lightbulb, Target, Users, 
  TrendingDown, Zap, BookOpen, DollarSign 
} from 'lucide-react';

export interface UnmetNeed {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedUsers: string;
  evidence: string;
  suggestedAction: string;
  impactScore: number;
  category: 'feature_gap' | 'ux_friction' | 'content_gap' | 'onboarding' | 'monetization';
}

interface UnmetNeedsSpotlightProps {
  needs: UnmetNeed[];
}

const severityConfig = {
  critical: { color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/30', badge: 'destructive' as const },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30', badge: 'default' as const },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/30', badge: 'secondary' as const },
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30', badge: 'outline' as const },
};

const categoryIcons: Record<string, React.ReactNode> = {
  feature_gap: <Zap className="h-4 w-4" />,
  ux_friction: <TrendingDown className="h-4 w-4" />,
  content_gap: <BookOpen className="h-4 w-4" />,
  onboarding: <Users className="h-4 w-4" />,
  monetization: <DollarSign className="h-4 w-4" />,
};

export function UnmetNeedsSpotlight({ needs }: UnmetNeedsSpotlightProps) {
  const sorted = [...needs].sort((a, b) => b.impactScore - a.impactScore);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-red-500/5 via-amber-500/5 to-orange-500/5 border-amber-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-500" />
            Unmet Needs Spotlight
          </CardTitle>
          <CardDescription>
            AI-ranked user needs that aren't being served — prioritized by business impact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Critical', count: needs.filter(n => n.severity === 'critical').length, color: 'text-red-500 bg-red-500/10' },
              { label: 'High', count: needs.filter(n => n.severity === 'high').length, color: 'text-orange-500 bg-orange-500/10' },
              { label: 'Medium', count: needs.filter(n => n.severity === 'medium').length, color: 'text-amber-500 bg-amber-500/10' },
              { label: 'Low', count: needs.filter(n => n.severity === 'low').length, color: 'text-blue-500 bg-blue-500/10' },
            ].map(s => (
              <div key={s.label} className={`text-center p-3 rounded-lg ${s.color}`}>
                <p className="text-2xl font-bold">{s.count}</p>
                <p className="text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {sorted.map((need, idx) => {
        const config = severityConfig[need.severity];
        return (
          <Card key={need.id} className={`${config.bg} transition-all hover:shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 font-bold text-sm shrink-0">
                  #{idx + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={config.color}>
                        {need.severity === 'critical' ? <AlertTriangle className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}
                      </span>
                      <h4 className="font-semibold">{need.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={config.badge}>
                        {need.severity.charAt(0).toUpperCase() + need.severity.slice(1)}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        {categoryIcons[need.category]}
                        {need.category.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{need.description}</p>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Impact Score</span>
                        <span className="font-bold">{need.impactScore}/100</span>
                      </div>
                      <Progress value={need.impactScore} className="h-2" />
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      <Users className="h-3 w-3 mr-1" />
                      {need.affectedUsers}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded bg-background/60 border">
                      <p className="font-medium text-muted-foreground mb-1">📊 Evidence</p>
                      <p>{need.evidence}</p>
                    </div>
                    <div className="p-2 rounded bg-background/60 border">
                      <p className="font-medium text-muted-foreground mb-1">💡 Suggested Action</p>
                      <p>{need.suggestedAction}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {needs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">All Needs Addressed</h3>
            <p className="text-muted-foreground">No critical unmet needs detected. Run AI analysis to check again.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
