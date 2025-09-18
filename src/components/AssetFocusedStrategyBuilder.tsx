import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Zap
} from 'lucide-react';

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  assetTypes: string[];
  expectedReturn: string;
  winRate: string;
  timeHorizon: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: React.ElementType;
  color: string;
  quickTest: {
    duration: string;
    capital: number;
    expectedTrades: number;
  };
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'trend-following',
    name: 'Trend Following',
    description: 'Rides market momentum, buying when prices rise and selling when they fall',
    assetTypes: ['Stocks', 'Forex', 'Crypto', 'ETFs'],
    expectedReturn: '12-25%',
    winRate: '45-55%',
    timeHorizon: 'Medium to Long',
    riskLevel: 'Medium',
    complexity: 'Beginner',
    icon: TrendingUp,
    color: 'bg-blue-500',
    quickTest: { duration: '30 days', capital: 10000, expectedTrades: 15 }
  },
  {
    id: 'mean-reversion',
    name: 'Mean Reversion',
    description: 'Profits from price corrections, buying oversold and selling overbought assets',
    assetTypes: ['Stocks', 'Forex', 'Commodities'],
    expectedReturn: '8-18%',
    winRate: '60-70%',
    timeHorizon: 'Short to Medium',
    riskLevel: 'Medium',
    complexity: 'Intermediate',
    icon: TrendingDown,
    color: 'bg-green-500',
    quickTest: { duration: '30 days', capital: 10000, expectedTrades: 25 }
  },
  {
    id: 'breakout',
    name: 'Breakout Trading',
    description: 'Captures explosive moves when prices break through key resistance levels',
    assetTypes: ['Stocks', 'Crypto', 'Commodities'],
    expectedReturn: '15-35%',
    winRate: '40-50%',
    timeHorizon: 'Short',
    riskLevel: 'High',
    complexity: 'Intermediate',
    icon: Zap,
    color: 'bg-orange-500',
    quickTest: { duration: '30 days', capital: 10000, expectedTrades: 12 }
  },
  {
    id: 'pairs-trading',
    name: 'Pairs Trading',
    description: 'Market-neutral strategy trading correlated assets against each other',
    assetTypes: ['Stocks', 'ETFs'],
    expectedReturn: '8-15%',
    winRate: '55-65%',
    timeHorizon: 'Medium',
    riskLevel: 'Low',
    complexity: 'Advanced',
    icon: BarChart3,
    color: 'bg-purple-500',
    quickTest: { duration: '30 days', capital: 20000, expectedTrades: 20 }
  }
];

interface AssetFocusedStrategyBuilderProps {
  onStrategySelect: (strategy: any) => void;
  onQuickTest: (strategy: any, asset: string) => void;
}

export const AssetFocusedStrategyBuilder: React.FC<AssetFocusedStrategyBuilderProps> = ({
  onStrategySelect,
  onQuickTest
}) => {
  const [selectedAsset, setSelectedAsset] = useState<string>('');
  const [testingStrategy, setTestingStrategy] = useState<string>('');

  const assetTypes = ['Stocks', 'Forex', 'Crypto', 'ETFs', 'Commodities'];
  
  const filteredStrategies = selectedAsset 
    ? strategyTemplates.filter(s => s.assetTypes.includes(selectedAsset))
    : strategyTemplates;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return '';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Intermediate': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Advanced': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      default: return '';
    }
  };

  const handleQuickTest = async (strategy: StrategyTemplate) => {
    if (!selectedAsset) return;
    
    setTestingStrategy(strategy.id);
    
    // Simulate quick test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onQuickTest(strategy, selectedAsset);
    setTestingStrategy('');
  };

  return (
    <div className="space-y-6">
      {/* Asset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Select Your Trading Asset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedAsset} onValueChange={setSelectedAsset}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose the type of asset you want to trade" />
            </SelectTrigger>
            <SelectContent>
              {assetTypes.map(asset => (
                <SelectItem key={asset} value={asset}>
                  {asset}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAsset && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing strategies optimized for {selectedAsset.toLowerCase()} trading
            </p>
          )}
        </CardContent>
      </Card>

      {/* Strategy Templates */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredStrategies.map(strategy => {
          const IconComponent = strategy.icon;
          const isCurrentlyTesting = testingStrategy === strategy.id;
          
          return (
            <Card key={strategy.id} className="relative overflow-hidden">
              {/* Strategy Header */}
              <div className={`h-2 ${strategy.color}`} />
              
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${strategy.color} text-white`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {strategy.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Strategy Metrics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Expected Return</p>
                      <p className="font-medium">{strategy.expectedReturn}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Win Rate</p>
                      <p className="font-medium">{strategy.winRate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Time Horizon</p>
                      <p className="font-medium">{strategy.timeHorizon}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Risk Level</p>
                      <p className="font-medium">{strategy.riskLevel}</p>
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                  <Badge className={getRiskColor(strategy.riskLevel)}>
                    {strategy.riskLevel} Risk
                  </Badge>
                  <Badge className={getComplexityColor(strategy.complexity)}>
                    {strategy.complexity}
                  </Badge>
                </div>

                {/* Quick Test Info */}
                {selectedAsset && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm">
                    <h4 className="font-medium mb-2 flex items-center gap-1">
                      <PlayCircle className="w-4 h-4" />
                      Quick Test Preview
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Duration</p>
                        <p className="font-medium">{strategy.quickTest.duration}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Test Capital</p>
                        <p className="font-medium">${strategy.quickTest.capital.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expected Trades</p>
                        <p className="font-medium">{strategy.quickTest.expectedTrades}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onStrategySelect(strategy)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Select Strategy
                  </Button>
                  
                  {selectedAsset && (
                    <Button 
                      size="sm" 
                      onClick={() => handleQuickTest(strategy)}
                      disabled={isCurrentlyTesting || !selectedAsset}
                      className="flex-1"
                    >
                      {isCurrentlyTesting ? (
                        <>
                          <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Quick Test
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStrategies.length === 0 && selectedAsset && (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Strategies Available</h3>
            <p className="text-sm text-muted-foreground">
              We don't currently have strategies optimized for {selectedAsset.toLowerCase()}. 
              Try selecting a different asset type.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};