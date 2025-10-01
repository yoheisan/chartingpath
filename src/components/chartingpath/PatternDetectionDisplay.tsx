import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface PatternDetectionDisplayProps {
  detections: any[];
}

export const PatternDetectionDisplay: React.FC<PatternDetectionDisplayProps> = ({ detections }) => {
  if (!detections || detections.length === 0) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No patterns detected in the historical data. Try adjusting your pattern configuration or test with different market conditions.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Pattern Detection Results</h3>
      
      {detections.map((detection, idx) => (
        <Card key={idx} className={detection.pattern.detected ? 'border-green-200 bg-green-50' : 'border-gray-200'}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {detection.pattern.detected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-gray-400" />
                )}
                {detection.patternName}
              </CardTitle>
              <Badge variant={detection.pattern.detected ? 'default' : 'secondary'}>
                {detection.pattern.confidence}% Confidence
              </Badge>
            </div>
          </CardHeader>
          
          {detection.pattern.detected && (
            <CardContent className="space-y-3">
              {/* Entry, Stop, Target */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Entry</div>
                  <div className="font-semibold text-blue-600">
                    {detection.pattern.entryPrice?.toFixed(5) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Stop Loss</div>
                  <div className="font-semibold text-red-600 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    {detection.pattern.stopLoss?.toFixed(5) || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Take Profit</div>
                  <div className="font-semibold text-green-600 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {detection.pattern.takeProfit?.toFixed(5) || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Key Levels */}
              {detection.pattern.keyLevels && (
                <div className="pt-3 border-t">
                  <div className="text-sm font-medium mb-2">Key Levels</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(detection.pattern.keyLevels).map(([key, value]) => (
                      typeof value === 'number' && (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground capitalize">{key}:</span>
                          <span className="font-medium">{(value as number).toFixed(5)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Volume Confirmation */}
              {detection.pattern.volumeConfirmed !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4" />
                  <span className="text-muted-foreground">Volume Confirmed:</span>
                  <Badge variant={detection.pattern.volumeConfirmed ? 'default' : 'secondary'}>
                    {detection.pattern.volumeConfirmed ? 'Yes' : 'No'}
                  </Badge>
                </div>
              )}

              {/* Notes */}
              {detection.pattern.notes && (
                <div className="text-sm text-muted-foreground italic">
                  {detection.pattern.notes}
                </div>
              )}
            </CardContent>
          )}

          {!detection.pattern.detected && detection.pattern.notes && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{detection.pattern.notes}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};
