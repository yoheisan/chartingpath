import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Clock,
  AlertTriangle,
  CheckCircle,
  PlayCircle,
  Building2,
  Users,
  Crown,
  TrendingUp,
  Activity,
  Info,
  Target
} from 'lucide-react';
import { professionalStrategies, getStrategiesByAsset, ProfessionalStrategy } from '@/utils/ProfessionalStrategyTemplates';

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
    ? getStrategiesByAsset(selectedAsset)
    : professionalStrategies;

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'Advanced': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return '';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Trend': return 'bg-blue-500';
      case 'Mean Reversion': return 'bg-green-500';
      case 'Momentum': return 'bg-orange-500';
      case 'Arbitrage': return 'bg-purple-500';
      case 'Market Neutral': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const handleQuickTest = async (strategy: ProfessionalStrategy) => {
    if (!selectedAsset) return;
    
    setTestingStrategy(strategy.id);
    
    // Simulate quick test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onQuickTest(strategy, selectedAsset);
    setTestingStrategy('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Professional Strategy Library
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Industry-standard trading strategies used by professional traders worldwide. 
            These are proven configurations - results depend on market conditions and execution.
          </p>
        </CardHeader>
      </Card>

      {/* Asset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
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
              Showing {filteredStrategies.length} professional strategies optimized for {selectedAsset.toLowerCase()} trading
            </p>
          )}
        </CardContent>
      </Card>

      {/* Strategy Templates */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {filteredStrategies.map(strategy => {
          const IconComponent = strategy.icon;
          const isCurrentlyTesting = testingStrategy === strategy.id;
          
          return (
            <Card key={strategy.id} className="relative overflow-hidden">
              {/* Strategy Header */}
              <div className={`h-2 ${getCategoryColor(strategy.category)}`} />
              
              <CardHeader className="pb-4">
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
                
                {/* Category and Complexity */}
                <div className="flex gap-2 mt-3">
                  <Badge variant="outline" className="text-xs">
                    {strategy.category}
                  </Badge>
                  <Badge className={getComplexityColor(strategy.complexity)}>
                    {strategy.complexity}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Timeframes */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Optimal Timeframes
                  </h4>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Best:</span> {strategy.timeframes.optimal}</p>
                    <p><span className="font-medium">Suitable:</span> {strategy.timeframes.primary.join(', ')}</p>
                    <p className="text-muted-foreground text-xs">{strategy.timeframes.description}</p>
                  </div>
                </div>

                <Separator />

                {/* Entry/Exit Conditions */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <h5 className="font-medium text-green-700 dark:text-green-300 mb-1">Entry Signals</h5>
                    <ul className="space-y-1">
                      {strategy.parameters.entryConditions.slice(0, 2).map((condition, idx) => (
                        <li key={idx} className="text-muted-foreground">• {condition}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-red-700 dark:text-red-300 mb-1">Exit Signals</h5>
                    <ul className="space-y-1">
                      {strategy.parameters.exitConditions.slice(0, 2).map((condition, idx) => (
                        <li key={idx} className="text-muted-foreground">• {condition}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Separator />

                {/* Risk Management */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Risk Management
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p><span className="font-medium">Stop Loss:</span> {strategy.parameters.riskManagement.stopLoss}</p>
                    <p><span className="font-medium">Take Profit:</span> {strategy.parameters.riskManagement.takeProfit}</p>
                    <p><span className="font-medium">Position Size:</span> {strategy.parameters.riskManagement.positionSizing}</p>
                  </div>
                </div>

                <Separator />

                {/* Market Conditions */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    Market Conditions
                  </h4>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium text-green-600">Best:</span> {strategy.marketConditions.best}</p>
                    <p><span className="font-medium text-red-600">Avoid:</span> {strategy.marketConditions.avoid}</p>
                  </div>
                </div>

                <Separator />

                {/* Professional Usage */}
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Building2 className="w-4 h-4" />
                    Professional Usage
                  </h4>
                  <div className="flex gap-2 mb-2">
                    {strategy.professionalUse.hedgeFunds && (
                      <Badge variant="outline" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Hedge Funds
                      </Badge>
                    )}
                    {strategy.professionalUse.institutionalTraders && (
                      <Badge variant="outline" className="text-xs">
                        <Building2 className="w-3 h-3 mr-1" />
                        Institutions
                      </Badge>
                    )}
                    {strategy.professionalUse.retailTraders && (
                      <Badge variant="outline" className="text-xs">
                        <Users className="w-3 h-3 mr-1" />
                        Retail
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{strategy.professionalUse.description}</p>
                </div>

                {/* Disclaimer */}
                <div className="bg-muted/50 rounded-lg p-3 text-xs">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      <span className="font-medium">Professional Configuration:</span> These parameters represent 
                      industry-standard settings. Actual performance depends on market conditions, execution, 
                      and individual risk management.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onStrategySelect(strategy)}
                    className="flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Customize Strategy
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
              We don't currently have professional strategies optimized for {selectedAsset.toLowerCase()}. 
              Try selecting a different asset type.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};