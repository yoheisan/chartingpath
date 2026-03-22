import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Database, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface DataScalingCardProps {
  planCounts: {
    free: number;
    lite: number;
    plus: number;
    pro: number;
    elite: number;
  };
}

// EODHD plan thresholds
const PLANS = {
  current: {
    name: 'All-World',
    cost: 79,
    callsPerDay: 100000,
  },
  extended: {
    name: 'Extended',
    cost: 249,
    callsPerDay: 500000,
    minUsers: 10,
    enables: '1H resolution for full 8,500+ universe',
  },
  enterprise: {
    name: 'Enterprise',
    cost: 2499,
    callsPerDay: Infinity,
    minUsers: 100,
    enables: '15m resolution for full 8,500+ universe',
  },
};

export const DataScalingCard = ({ planCounts }: DataScalingCardProps) => {
  const payingUsers = planCounts.lite + planCounts.plus + planCounts.pro + planCounts.elite;
  const monthlyRevenue = 
    (planCounts.lite * 12) + 
    (planCounts.plus * 29) + 
    (planCounts.pro * 79) + 
    (planCounts.elite * 199);

  // Determine current and next milestone
  const extendedProgress = Math.min(100, (payingUsers / PLANS.extended.minUsers) * 100);
  const enterpriseProgress = Math.min(100, (payingUsers / PLANS.enterprise.minUsers) * 100);

  const shouldUpgradeExtended = monthlyRevenue >= PLANS.extended.cost;
  const shouldUpgradeEnterprise = monthlyRevenue >= PLANS.enterprise.cost;

  const currentPlan = shouldUpgradeEnterprise 
    ? 'enterprise' 
    : shouldUpgradeExtended 
      ? 'extended' 
      : 'current';

  const nextMilestone = currentPlan === 'current' 
    ? PLANS.extended 
    : currentPlan === 'extended' 
      ? PLANS.enterprise 
      : null;

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">EODHD Data Scaling</CardTitle>
          </div>
          <Badge 
            variant={currentPlan === 'current' ? 'secondary' : 'default'}
            className={currentPlan !== 'current' ? 'bg-green-500' : ''}
          >
            {PLANS[currentPlan as keyof typeof PLANS].name}
          </Badge>
        </div>
        <CardDescription>
          Infrastructure scaling milestones based on paying users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-primary">{payingUsers}</p>
            <p className="text-xs text-muted-foreground">Paying Users</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">${monthlyRevenue}</p>
            <p className="text-xs text-muted-foreground">MRR</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold">${PLANS[currentPlan as keyof typeof PLANS].cost}</p>
            <p className="text-xs text-muted-foreground">Data Cost</p>
          </div>
        </div>

        {/* Plan Breakdown */}
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">LITE: {planCounts.lite}</Badge>
          <Badge variant="outline">PLUS: {planCounts.plus}</Badge>
          <Badge variant="outline">PRO: {planCounts.pro}</Badge>
          <Badge variant="outline">TEAM: {planCounts.team}</Badge>
        </div>

        {/* Milestones */}
        <div className="space-y-3 pt-2 border-t">
          {/* Extended Milestone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {shouldUpgradeExtended ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={shouldUpgradeExtended ? 'text-green-600 font-medium' : ''}>
                  Extended ($249/mo)
                </span>
              </div>
              <span className="text-muted-foreground">
                {payingUsers}/{PLANS.extended.minUsers} users
              </span>
            </div>
            <Progress value={extendedProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Enables: {PLANS.extended.enables}
            </p>
          </div>

          {/* Enterprise Milestone */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {shouldUpgradeEnterprise ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                )}
                <span className={shouldUpgradeEnterprise ? 'text-green-600 font-medium' : ''}>
                  Enterprise ($2,499/mo)
                </span>
              </div>
              <span className="text-muted-foreground">
                {payingUsers}/{PLANS.enterprise.minUsers} users
              </span>
            </div>
            <Progress value={enterpriseProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Enables: {PLANS.enterprise.enables}
            </p>
          </div>
        </div>

        {/* Recommendation */}
        {nextMilestone && (
          <div className={`p-3 rounded-lg text-sm ${
            shouldUpgradeExtended && !shouldUpgradeEnterprise
              ? 'bg-amber-500/10 border border-amber-500/30'
              : 'bg-muted/50'
          }`}>
            {shouldUpgradeExtended && !shouldUpgradeEnterprise ? (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-amber-600">Ready to Upgrade</p>
                  <p className="text-xs text-muted-foreground">
                    MRR (${monthlyRevenue}) exceeds Extended plan cost (${PLANS.extended.cost}).
                    Upgrade to enable full 1H resolution.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                <strong>{PLANS.extended.minUsers - payingUsers}</strong> more paying users needed 
                to break even on Extended plan upgrade.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
