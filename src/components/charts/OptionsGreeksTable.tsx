/**
 * OptionsGreeksTable - Educational Greeks visualization for options articles
 * 
 * Shows how Delta, Gamma, Theta, and Vega affect an options strategy
 */

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, Activity, Zap, BarChart3 } from 'lucide-react';
import { GreeksTableData } from '@/utils/optionsStrategyMapping';

interface OptionsGreeksTableProps {
  data: GreeksTableData;
  strategyName?: string;
}

const GreekIcon = ({ greek }: { greek: string }) => {
  switch (greek) {
    case 'delta': return <TrendingUp className="h-4 w-4" />;
    case 'gamma': return <Zap className="h-4 w-4" />;
    case 'theta': return <Clock className="h-4 w-4" />;
    case 'vega': return <Activity className="h-4 w-4" />;
    default: return <BarChart3 className="h-4 w-4" />;
  }
};

const getGreekColor = (greek: string, value: string): string => {
  const lowerValue = value.toLowerCase();
  
  if (greek === 'theta') {
    if (lowerValue.includes('positive')) return 'text-green-500';
    if (lowerValue.includes('negative')) return 'text-red-500';
  }
  
  if (greek === 'vega') {
    if (lowerValue.includes('positive')) return 'text-blue-500';
    if (lowerValue.includes('negative')) return 'text-orange-500';
  }
  
  if (greek === 'gamma') {
    if (lowerValue.includes('positive')) return 'text-purple-500';
    if (lowerValue.includes('negative')) return 'text-amber-500';
  }
  
  return 'text-foreground';
};

const GreekBadge = ({ greek, value }: { greek: string; value: string }) => {
  const lowerValue = value.toLowerCase();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  
  if (lowerValue.includes('positive')) variant = 'default';
  if (lowerValue.includes('negative')) variant = 'destructive';
  if (lowerValue.includes('near zero') || lowerValue.includes('neutral')) variant = 'outline';
  
  return <Badge variant={variant} className="text-xs">{value}</Badge>;
};

const OptionsGreeksTable = memo(({ data, strategyName }: OptionsGreeksTableProps) => {
  const greeks = [
    { key: 'delta', name: 'Delta (Δ)', description: 'Directional exposure per $1 move', symbol: 'Δ' },
    { key: 'gamma', name: 'Gamma (Γ)', description: 'Rate of delta change', symbol: 'Γ' },
    { key: 'theta', name: 'Theta (Θ)', description: 'Daily time decay', symbol: 'Θ' },
    { key: 'vega', name: 'Vega (ν)', description: 'Sensitivity to IV change', symbol: 'ν' },
  ];

  return (
    <Card className="w-full bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          How the Greeks Affect {strategyName || 'This Strategy'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Greek</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Value</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">Impact</th>
              </tr>
            </thead>
            <tbody>
              {greeks.map(({ key, name, description }) => {
                const greekData = data[key as keyof GreeksTableData];
                return (
                  <tr key={key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-md bg-muted ${getGreekColor(key, greekData.value)}`}>
                          <GreekIcon greek={key} />
                        </div>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <GreekBadge greek={key} value={greekData.value} />
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {greekData.impact}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Quick Reference */}
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-xs font-medium text-muted-foreground mb-2">Quick Reference</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>Positive = Benefits you</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Negative = Works against you</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Neutral = No direct impact</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Mixed = Depends on position</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OptionsGreeksTable.displayName = 'OptionsGreeksTable';

export default OptionsGreeksTable;
