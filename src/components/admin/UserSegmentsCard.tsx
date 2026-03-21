import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, DollarSign, Target } from 'lucide-react';
import type { UserSegment, TrafficSource } from '@/services/journeyAnalyticsService';

interface UserSegmentsCardProps {
  segments: UserSegment[];
  trafficSources: TrafficSource[];
}

export function UserSegmentsCard({ segments, trafficSources }: UserSegmentsCardProps) {
  const getSegmentColor = (id: string) => {
    switch (id) {
      case 'power-users': return 'bg-green-500';
      case 'engaged': return 'bg-blue-500';
      case 'explorers': return 'bg-amber-500';
      case 'bounced': return 'bg-red-500';
      default: return 'bg-muted';
    }
  };

  const getSegmentBgColor = (id: string) => {
    switch (id) {
      case 'power-users': return 'bg-green-500/10 border-green-500/30';
      case 'engaged': return 'bg-blue-500/10 border-blue-500/30';
      case 'explorers': return 'bg-amber-500/10 border-amber-500/30';
      case 'bounced': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-muted border-border';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* User Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            User Segments
          </CardTitle>
          <CardDescription>
            Behavioral segmentation based on journey completion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {segments.map(segment => (
            <div 
              key={segment.id} 
              className={`p-4 rounded-lg border ${getSegmentBgColor(segment.id)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getSegmentColor(segment.id)}`} />
                  <span className="font-medium">{segment.name}</span>
                </div>
                <Badge variant="outline">{segment.count.toLocaleString()} users</Badge>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">{segment.description}</p>
              
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Share of users</span>
                  <span className="font-medium">{segment.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={segment.percentage} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3 w-3 text-muted-foreground" />
                  <span>Avg LTV: <strong>${segment.avgLTV}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span>Conv: <strong>{segment.conversionRate}%</strong></span>
                </div>
              </div>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {segment.characteristics.map((char, i) => (
                  <Badge key={i} variant="secondary" className="text-sm">
                    {char}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Traffic Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Traffic Sources
          </CardTitle>
          <CardDescription>
            Performance breakdown by acquisition channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trafficSources.slice(0, 6).map((source, index) => {
              const maxSessions = trafficSources[0]?.sessions || 1;
              const barWidth = (source.sessions / maxSessions) * 100;
              
              return (
                <div key={source.source} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium w-4 text-muted-foreground">
                        {index + 1}.
                      </span>
                      <span className="font-medium capitalize">
                        {source.source}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {source.sessions.toLocaleString()} sessions
                    </Badge>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span>Signups: </span>
                      <strong className="text-foreground">{source.signups}</strong>
                    </div>
                    <div>
                      <span>Conv: </span>
                      <strong className={source.conversionRate > 2 ? 'text-green-500' : 'text-foreground'}>
                        {source.conversionRate.toFixed(1)}%
                      </strong>
                    </div>
                    <div>
                      <span>Avg Time: </span>
                      <strong className="text-foreground">
                        {source.avgSessionDuration < 60 
                          ? `${source.avgSessionDuration.toFixed(0)}m`
                          : `${(source.avgSessionDuration / 60).toFixed(1)}h`
                        }
                      </strong>
                    </div>
                    <div>
                      <span>Bounce: </span>
                      <strong className={source.bounceRate > 60 ? 'text-red-500' : 'text-foreground'}>
                        {source.bounceRate.toFixed(0)}%
                      </strong>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {trafficSources.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No traffic source data available yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
