import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  Target,
  BarChart3,
  Info
} from 'lucide-react';

interface RewardTargets {
  expectedReturn: number;
  winRate: number;
  riskReward: number;
  profitFactor: number;
}

interface RewardAnalysisValidatorProps {
  targets: RewardTargets;
}

export const RewardAnalysisValidator: React.FC<RewardAnalysisValidatorProps> = ({ targets }) => {
  
  // Mathematical validation of targets
  const validateTargets = () => {
    const { winRate, riskReward, profitFactor } = targets;
    
    // Calculate theoretical profit factor from win rate and risk-reward
    const theoreticalPF = (winRate / 100) * riskReward / ((1 - winRate / 100) * 1);
    
    // Check if targets are mathematically consistent
    const isConsistent = Math.abs(profitFactor - theoreticalPF) < 0.5;
    
    // Assess difficulty level
    const getDifficulty = () => {
      if (winRate > 70 && riskReward > 2) return 'Extremely Difficult';
      if (winRate > 60 && riskReward > 1.5) return 'Challenging';
      if (winRate > 50 && riskReward > 1.2) return 'Moderate';
      return 'Conservative';
    };

    // Strategy recommendations based on targets
    const getStrategyRecommendations = () => {
      if (winRate >= 65) {
        return ['Mean Reversion', 'Range Trading', 'Support/Resistance'];
      } else if (riskReward >= 2) {
        return ['Trend Following', 'Breakout', 'Momentum'];
      } else {
        return ['Scalping', 'Grid Trading', 'High Frequency'];
      }
    };

    return {
      theoreticalPF,
      isConsistent,
      difficulty: getDifficulty(),
      strategies: getStrategyRecommendations(),
      warnings: generateWarnings()
    };
  };

  const generateWarnings = () => {
    const warnings = [];
    const { winRate, riskReward, profitFactor, expectedReturn } = targets;

    if (profitFactor > 3) {
      warnings.push({
        type: 'high',
        message: `Profit Factor of ${profitFactor} is extremely ambitious. Professional traders typically achieve 1.3-2.0.`
      });
    }

    if (winRate > 70) {
      warnings.push({
        type: 'medium', 
        message: `${winRate}% win rate is very high. Consider if this is realistic for your trading style.`
      });
    }

    if (riskReward > 2 && winRate > 60) {
      warnings.push({
        type: 'high',
        message: `High win rate (${winRate}%) AND high risk-reward (1:${riskReward}) is mathematically challenging.`
      });
    }

    if (expectedReturn > 20) {
      warnings.push({
        type: 'high',
        message: `${expectedReturn}% annual return is above professional hedge fund averages (8-15%).`
      });
    }

    return warnings;
  };

  const analysis = validateTargets();
  const warnings = generateWarnings();

  return (
    <div className="space-y-4">
      {/* Mathematical Validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Mathematical Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">Your Target Profit Factor</div>
              <div className="text-2xl font-bold text-primary">{targets.profitFactor}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">Mathematical Profit Factor</div>
              <div className="text-2xl font-bold text-muted-foreground">
                {analysis.theoreticalPF.toFixed(2)}
              </div>
            </div>
          </div>

          {analysis.isConsistent ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your targets are mathematically consistent. Profit factor aligns with win rate and risk-reward ratio.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Mathematical inconsistency detected. With {targets.winRate}% win rate and 1:{targets.riskReward} risk-reward, 
                expected profit factor is {analysis.theoreticalPF.toFixed(2)}, not {targets.profitFactor}.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <Badge variant={analysis.difficulty === 'Conservative' ? 'default' : 
                           analysis.difficulty === 'Moderate' ? 'secondary' : 'destructive'}>
              {analysis.difficulty}
            </Badge>
            <span className="text-sm text-muted-foreground">Difficulty Level</span>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended Strategy Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Based on your {targets.winRate}% win rate target, these strategies are most suitable:
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.strategies.map((strategy, idx) => (
                <Badge key={idx} variant="outline">
                  {strategy}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
              <AlertTriangle className="w-5 h-5" />
              Reality Check
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warnings.map((warning, idx) => (
              <Alert key={idx} variant={warning.type === 'high' ? 'destructive' : 'default'}>
                <Info className="h-4 w-4" />
                <AlertDescription>{warning.message}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Professional Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Professional Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Hedge Funds</div>
              <div className="font-semibold">8-15% Annual</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Prop Traders</div>
              <div className="font-semibold">45-65% Win Rate</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Professional PF</div>
              <div className="font-semibold">1.3-2.0</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="font-semibold">8-15%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entry/Exit Rule Implications */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <TrendingUp className="w-5 h-5" />
            Strategy Design Implications
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <p><strong>Entry Rules:</strong> With {targets.winRate}% target win rate, you need highly selective entries with strong confirmation signals.</p>
          <p><strong>Exit Rules:</strong> 1:{targets.riskReward} risk-reward requires tight stops and patient profit targets.</p>
          <p><strong>Position Sizing:</strong> High profit factor target suggests smaller, more precise positions.</p>
          <p><strong>Market Conditions:</strong> These targets work best in trending or strongly directional markets.</p>
        </CardContent>
      </Card>
    </div>
  );
};