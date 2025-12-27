import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, TrendingUp, Clock, Play } from 'lucide-react';
import { wedgeConfig, featuredPresets, getFullSymbol } from '@/config/wedge';
import { trackPresetLoaded, track } from '@/services/analytics';

interface CryptoPresetPanelProps {
  onPresetLoad: (preset: { symbol: string; pattern: string; timeframe: string }) => void;
  onOneClickBacktest?: () => void;
  isBacktesting?: boolean;
}

export const CryptoPresetPanel: React.FC<CryptoPresetPanelProps> = ({ 
  onPresetLoad, 
  onOneClickBacktest,
  isBacktesting = false 
}) => {
  const [selectedSymbol, setSelectedSymbol] = React.useState<string>(wedgeConfig.featuredSymbols[0]);
  const [selectedPattern, setSelectedPattern] = React.useState<string>(wedgeConfig.featuredPatterns[0]);

  const handleLoadPreset = () => {
    const preset = {
      symbol: getFullSymbol(selectedSymbol),
      pattern: selectedPattern,
      timeframe: wedgeConfig.wedgeTimeframe,
    };
    
    // Track the event
    trackPresetLoaded({
      symbol: selectedSymbol,
      pattern: selectedPattern,
      timeframe: wedgeConfig.wedgeTimeframe,
    });
    
    onPresetLoad(preset);
  };

  const handleQuickPreset = (preset: typeof featuredPresets[number]) => {
    const fullPreset = {
      symbol: getFullSymbol(preset.symbol),
      pattern: preset.pattern,
      timeframe: wedgeConfig.wedgeTimeframe,
    };
    
    // Track the event
    trackPresetLoaded({
      symbol: preset.symbol,
      pattern: preset.pattern,
      timeframe: wedgeConfig.wedgeTimeframe,
    });
    
    onPresetLoad(fullPreset);
  };

  const handleOneClickBacktest = () => {
    // First load the default preset
    const preset = {
      symbol: getFullSymbol('BTC'),
      pattern: 'Breakout',
      timeframe: wedgeConfig.wedgeTimeframe,
    };
    
    // Track the one-click event
    track('one_click_backtest_used', {
      symbol: 'BTC',
      pattern: 'Breakout',
      timeframe: wedgeConfig.wedgeTimeframe,
      wedgeEnabled: true,
    });
    
    onPresetLoad(preset);
    
    // Trigger backtest after a short delay to allow state to update
    if (onOneClickBacktest) {
      setTimeout(() => {
        onOneClickBacktest();
      }, 300);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-primary" />
            Crypto 1H Presets
            <Badge variant="secondary" className="ml-2">
              <Clock className="h-3 w-3 mr-1" />
              1H
            </Badge>
          </CardTitle>
          
          {/* One-Click Backtest CTA */}
          {onOneClickBacktest && (
            <Button 
              onClick={handleOneClickBacktest}
              disabled={isBacktesting}
              className="bg-primary hover:bg-primary/90 gap-2"
              size="sm"
            >
              <Play className="h-4 w-4" />
              {isBacktesting ? 'Running...' : 'Run BTC 1H Backtest'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Custom Preset Builder */}
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-muted-foreground mb-1 block">Symbol</label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wedgeConfig.featuredSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}/USDT
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground mb-1 block">Pattern</label>
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {wedgeConfig.featuredPatterns.map((pattern) => (
                  <SelectItem key={pattern} value={pattern}>
                    {pattern === 'DoubleTopBottom' ? 'Double Top/Bottom' : pattern}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleLoadPreset} className="h-9">
            <TrendingUp className="h-4 w-4 mr-1" />
            Load Preset
          </Button>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">Featured Presets (1-click)</label>
          <div className="flex flex-wrap gap-1.5">
            {featuredPresets.slice(0, 10).map((preset, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleQuickPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
