import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, ArrowRight, Settings2, Lock, TrendingUp } from 'lucide-react';
import { MasterPlan } from '@/hooks/useMasterPlan';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface PlanAlertCardProps {
  plans: MasterPlan[];
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  planAlertCount: number;
  maxPlanAlerts: number;
  tierName: string;
}

export function PlanAlertCard({ plans, selectedPlanId, onSelectPlan, planAlertCount, maxPlanAlerts, tierName }: PlanAlertCardProps) {
  const { t } = useTranslation();
  const isLocked = maxPlanAlerts === 0;

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
              <h4 className="text-sm font-semibold mb-1">{t('planAlerts.title')}</h4>
              <p className="text-xs text-muted-foreground mb-3">
                {t('planAlerts.createPlanPrompt')}
              </p>
              {isLocked ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    <span>{t('planAlerts.lockedMessage')}</span>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-1.5">
                    <Link to="/projects/pricing">
                      <TrendingUp className="h-3.5 w-3.5" />
                      {t('planAlerts.upgradeToUnlock')}
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <Link to="/copilot">
                    {t('planAlerts.createPlan')}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Has plans but tier is locked
  if (isLocked) {
    return (
      <Card className="border-dashed border-muted-foreground/30 bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted shrink-0">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <h4 className="text-sm font-semibold">{t('planAlerts.planBasedAlerts')}</h4>
              <p className="text-xs text-muted-foreground">
                {t('planAlerts.lockedDescription')}
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="text-sm">
                  {t('planAlerts.tierStatus', { tier: tierName })}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {t('planAlerts.tierComparison')}
                </span>
              </div>
              <Button asChild size="sm" className="gap-1.5">
                <Link to="/projects/pricing">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {t('planAlerts.upgradeForPlanAlerts')}
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

  const atLimit = planAlertCount >= maxPlanAlerts;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold">{t('planAlerts.planBasedAlerts')}</h4>
              <Badge variant="outline" className={`text-xs gap-1 shrink-0 ${atLimit ? 'border-amber-500/40 text-amber-500' : 'border-primary/40 text-primary'}`}>
                <Sparkles className="h-3 w-3" />
                {t('planAlerts.perPlanUsage', { used: planAlertCount, max: maxPlanAlerts })}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('planAlerts.autoDescription')}
            </p>

            {/* At limit warning */}
            {atLimit && (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="text-xs text-amber-500">
                  {t('planAlerts.limitReached')}{' '}
                  <Link to="/projects/pricing" className="underline hover:no-underline font-medium">
                    {t('planAlerts.upgradeForMore')}
                  </Link>
                </span>
              </div>
            )}

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
                  <Badge key={item} variant="secondary" className="text-sm px-1.5 py-0">
                    {item}
                  </Badge>
                ))}
                {universeItems.length > 4 && (
                  <Badge variant="secondary" className="text-sm px-1.5 py-0">
                    +{universeItems.length - 4} {t('planAlerts.more')}
                  </Badge>
                )}
                {patternItems.map(p => (
                  <Badge key={p} variant="outline" className="text-sm px-1.5 py-0">
                    {p}
                  </Badge>
                ))}
                {(selectedPlan.preferred_patterns?.length ?? 0) > 3 && (
                  <Badge variant="outline" className="text-sm px-1.5 py-0">
                    +{(selectedPlan.preferred_patterns?.length ?? 0) - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Edit link */}
            <Button asChild size="sm" variant="ghost" className="h-7 gap-1 text-xs text-muted-foreground px-2 -ml-2">
              <Link to="/copilot">
                <Settings2 className="h-3 w-3" />
                {t('planAlerts.editInCopilot')}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
