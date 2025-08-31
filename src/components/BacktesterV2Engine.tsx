import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Zap, 
  Crown, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBacktesterV2Usage } from '@/hooks/useBacktesterV2Usage';
import { BacktestParams } from './BacktestParametersPanel';

interface BacktesterV2EngineProps {
  selectedStrategy: string;
  params: BacktestParams;
  onRunV2Backtest: () => void;
  isRunning: boolean;
}

const BacktesterV2Engine: React.FC<BacktesterV2EngineProps> = ({
  selectedStrategy,
  params,
  onRunV2Backtest,
  isRunning
}) => {
  const { hasFeatureAccess, subscriptionPlan } = useUserProfile();
  const { 
    currentUsage, 
    quota, 
    hasUnlimited, 
    canRunBacktest, 
    usagePercentage 
  } = useBacktesterV2Usage();

  const hasV2Access = hasFeatureAccess('backtester_v2');
  const hasPairTrading = hasFeatureAccess('pair_trading');
  const hasBasketTrading = hasFeatureAccess('basket_trading');
  const hasTickData = hasFeatureAccess('tick_data');

  const handleUpgrade = () => {
    window.open('/pricing', '_blank');
  };

  const getUpgradeMessage = () => {
    if (!hasV2Access) {
      return "Upgrade to Starter to access Backtester V2";
    }
    if (!canRunBacktest && !hasUnlimited) {
      return `Daily limit reached (${currentUsage}/${quota}). Upgrade to Pro+ for unlimited runs`;
    }
    return null;
  };

  const getStrategyTypeRestriction = () => {
    // Simulate different strategy types based on name
    const strategyName = selectedStrategy.toLowerCase();
    
    if (strategyName.includes('pair') || strategyName.includes('spread')) {
      if (!hasPairTrading) {
        return "This pair trading strategy requires Pro plan or higher";
      }
    }
    
    if (strategyName.includes('basket') || strategyName.includes('portfolio')) {
      if (!hasBasketTrading) {
        return "This basket strategy requires Pro+ plan or higher";
      }
    }
    
    return null;
  };

  const strategyRestriction = getStrategyTypeRestriction();
  const upgradeMessage = getUpgradeMessage();
  const canExecute = hasV2Access && canRunBacktest && !strategyRestriction;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Backtester V2 Engine
          <Badge variant="secondary" className="ml-auto">
            Advanced
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="font-medium">{subscriptionPlan.toUpperCase()} Plan</span>
          </div>
          {!hasV2Access && (
            <Button variant="outline" size="sm" onClick={handleUpgrade}>
              <ArrowUpRight className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>

        {/* Usage Tracking */}
        {hasV2Access && !hasUnlimited && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Daily Usage</span>
              <span className="font-medium">{currentUsage}/{quota} runs</span>
            </div>
            <Progress value={usagePercentage} className="h-2" />
            {usagePercentage > 80 && (
              <div className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                <span>Approaching daily limit</span>
              </div>
            )}
          </div>
        )}

        {/* Feature Comparison */}
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span>Single Asset Strategies</span>
            {!hasV2Access && <Badge variant="outline" className="ml-auto text-xs">Starter+</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-500" />
            <span>Pair Trading Strategies</span>
            {!hasPairTrading ? (
              <Badge variant="outline" className="ml-auto text-xs">Pro+</Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto text-xs">Available</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-500" />
            <span>Portfolio/Basket Strategies</span>
            {!hasBasketTrading ? (
              <Badge variant="outline" className="ml-auto text-xs">Pro++</Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto text-xs">Available</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-orange-500" />
            <span>Tick-level Data & Analysis</span>
            {!hasTickData ? (
              <Badge variant="outline" className="ml-auto text-xs">Pro++</Badge>
            ) : (
              <Badge variant="secondary" className="ml-auto text-xs">Available</Badge>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          {canExecute ? (
            <Button 
              onClick={onRunV2Backtest}
              disabled={isRunning || !selectedStrategy}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-background border-t-transparent mr-2" />
                  Running V2 Engine...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Run V2 Backtest
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-3">
              {(upgradeMessage || strategyRestriction) && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-warning mb-1">Access Restricted</p>
                      <p className="text-muted-foreground">
                        {strategyRestriction || upgradeMessage}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleUpgrade}
                variant="outline" 
                className="w-full"
              >
                <Crown className="h-4 w-4 mr-2" />
                View Pricing Plans
              </Button>
            </div>
          )}
        </div>

        {/* Benefits Preview */}
        {hasV2Access && (
          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg">
            <div className="font-medium text-primary mb-1">V2 Engine Benefits:</div>
            <ul className="space-y-0.5">
              <li>• Advanced metrics & risk analysis</li>
              <li>• Realistic execution modeling</li>
              <li>• Portfolio-level backtesting</li>
              {hasTickData && <li>• Tick-level precision</li>}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BacktesterV2Engine;