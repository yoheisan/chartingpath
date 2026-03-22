import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Settings2 } from 'lucide-react';
import { MasterPlan } from '@/hooks/useMasterPlan';
import { Link } from 'react-router-dom';

interface PlanAlertCardProps {
  plans: MasterPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  planAlertCount: number;
}

export function PlanAlertCard({ plans, selectedPlanId, onSelectPlan, planAlertCount }: PlanAlertCardProps) {
  // No plans — prompt user to create one
  if (plans.length === 0) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold mb-1">Auto-alerts from your Trading Plan</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Create a Master Plan in the Copilot to automatically receive alerts when the system detects matching patterns in your defined instrument universe.
              </p>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to="/copilot">
                  Create a Trading Plan
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedPlan = plans.find(p => p.id === selectedPlanId) ?? plans[0];

  // Build a summary of what this plan covers
  const universeItems: string[] = [];
  if (selectedPlan.asset_classes?.length) {
    universeItems.push(...selectedPlan.asset_classes.map(a => a.charAt(0).toUpperCase() + a.slice(1)));
  }
  if (selectedPlan.stock_exchanges?.length) {
    universeItems.push(...selectedPlan.stock_exchanges);
  }
  if (selectedPlan.fx_categories?.length) {
    universeItems.push(...selectedPlan.fx_categories.map(c => c.charAt(0).toUpperCase() + c.slice(1) + ' FX'));
  }
  if (selectedPlan.crypto_categories?.length) {
    universeItems.push(...selectedPlan.crypto_categories.map(c => c.charAt(0).toUpperCase() + c.slice(1) + ' Crypto'));
  }

  const patternItems = selectedPlan.preferred_patterns?.length
    ? selectedPlan.preferred_patterns.slice(0, 3)
    : [];

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">Plan-based Alerts</h4>
              <Badge variant="outline" className="text-xs gap-1 border-primary/40 text-primary shrink-0">
                <Sparkles className="h-3 w-3" />
                {planAlertCount} active
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              Alerts are auto-generated when patterns matching your plan are detected by the system. No manual setup needed.
            </p>

            {/* Plan selector */}
            {plans.length > 1 ? (
              <Select value={selectedPlan.id} onValueChange={onSelectPlan}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">{selectedPlan.name}</span>
              </div>
            )}

            {/* Universe summary chips */}
            {(universeItems.length > 0 || patternItems.length > 0) && (
              <div className="flex flex-wrap gap-1">
                {universeItems.slice(0, 4).map(item => (
                  <Badge key={item} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item}
                  </Badge>
                ))}
                {universeItems.length > 4 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    +{universeItems.length - 4} more
                  </Badge>
                )}
                {patternItems.map(p => (
                  <Badge key={p} variant="outline" className="text-[10px] px-1.5 py-0">
                    {p}
                  </Badge>
                ))}
                {(selectedPlan.preferred_patterns?.length ?? 0) > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{(selectedPlan.preferred_patterns?.length ?? 0) - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Edit link */}
            <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground px-2 -ml-2">
              <Link to="/copilot">
                <Settings2 className="h-3 w-3" />
                Edit plan in Copilot
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
