import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, XCircle, Info, TrendingDown, DollarSign, Lightbulb } from 'lucide-react';
import type { BrokenPath } from '@/services/journeyAnalyticsService';

interface BrokenPathsAnalysisProps {
  brokenPaths: BrokenPath[];
}

export function BrokenPathsAnalysis({ brokenPaths }: BrokenPathsAnalysisProps) {
  const getSeverityIcon = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: 'critical' | 'warning' | 'info') => {
    switch (severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'warning': return <Badge className="bg-amber-500 hover:bg-amber-600">Warning</Badge>;
      case 'info': return <Badge variant="secondary">Info</Badge>;
    }
  };

  const totalRevenueLoss = brokenPaths.reduce((acc, p) => acc + p.potentialRevenueLoss, 0);
  const criticalCount = brokenPaths.filter(p => p.severity === 'critical').length;
  const warningCount = brokenPaths.filter(p => p.severity === 'warning').length;

  if (brokenPaths.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">All Paths Healthy!</h3>
          <p className="text-muted-foreground">
            No critical conversion issues detected. All user journeys are performing within acceptable ranges.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Alert */}
      <Alert variant={criticalCount > 0 ? 'destructive' : 'default'}>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>
          {criticalCount > 0 
            ? `${criticalCount} Critical Issue${criticalCount > 1 ? 's' : ''} Detected`
            : `${warningCount} Warning${warningCount > 1 ? 's' : ''} to Review`
          }
        </AlertTitle>
        <AlertDescription className="mt-2">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Est. Monthly Revenue Loss: <strong>${totalRevenueLoss.toFixed(0)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              <span>Total Users Lost: <strong>{brokenPaths.reduce((acc, p) => acc + p.dropOffCount, 0).toLocaleString()}</strong></span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Broken Paths List */}
      <div className="space-y-4">
        {brokenPaths.map((path, index) => (
          <Card key={index} className={
            path.severity === 'critical' ? 'border-red-500/50' :
            path.severity === 'warning' ? 'border-amber-500/50' : ''
          }>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSeverityIcon(path.severity)}
                  <div>
                    <CardTitle className="text-base">
                      {path.stepFrom} → {path.stepTo}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Conversion bottleneck identified
                    </CardDescription>
                  </div>
                </div>
                {getSeverityBadge(path.severity)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Conversion Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Actual Conversion</p>
                  <p className="text-2xl font-bold text-red-500">
                    {path.actualConversion.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Expected Benchmark</p>
                  <p className="text-2xl font-bold text-green-500">
                    {path.expectedConversion.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar Comparison */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Performance vs Benchmark</span>
                  <span>{((path.actualConversion / path.expectedConversion) * 100).toFixed(0)}% of target</span>
                </div>
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 to-amber-500 rounded-full"
                    style={{ width: `${Math.min((path.actualConversion / path.expectedConversion) * 100, 100)}%` }}
                  />
                  <div 
                    className="absolute inset-y-0 left-0 border-r-2 border-green-500"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <span><strong>{path.dropOffCount.toLocaleString()}</strong> users dropped</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span><strong>${path.potentialRevenueLoss.toFixed(0)}</strong>/mo potential loss</span>
                </div>
              </div>

              {/* Suggested Fix */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-primary">Suggested Action</p>
                    <p className="text-sm text-muted-foreground mt-1">{path.suggestedFix}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
