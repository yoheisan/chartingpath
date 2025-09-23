import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Search, Plus, Trash2, TrendingUp, Activity, BarChart3, Zap, ChevronDown } from 'lucide-react';

// Comprehensive 40+ indicator library
const INDICATOR_LIBRARY = [
  // Trend Indicators
  { id: 'ema', name: 'Exponential Moving Average', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'sma', name: 'Simple Moving Average', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'wma', name: 'Weighted Moving Average', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'hma', name: 'Hull Moving Average', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'tema', name: 'Triple EMA', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'dema', name: 'Double EMA', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'kama', name: 'Kaufman Adaptive MA', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'vwma', name: 'Volume Weighted MA', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 } }},
  { id: 'alma', name: 'Arnaud Legoux MA', category: 'Trend', icon: TrendingUp, params: { length: { default: 20, min: 1, max: 500, step: 1 }, offset: { default: 0.85, min: 0, max: 1, step: 0.01 }, sigma: { default: 6, min: 1, max: 10, step: 1 } }},
  { id: 'ichimoku', name: 'Ichimoku Cloud', category: 'Trend', icon: TrendingUp, params: { tenkan: { default: 9, min: 1, max: 100, step: 1 }, kijun: { default: 26, min: 1, max: 100, step: 1 }, senkou: { default: 52, min: 1, max: 100, step: 1 } }},
  
  // Momentum Indicators
  { id: 'rsi', name: 'Relative Strength Index', category: 'Momentum', icon: Activity, params: { length: { default: 14, min: 2, max: 100, step: 1 } }},
  { id: 'macd', name: 'MACD', category: 'Momentum', icon: Activity, params: { fast: { default: 12, min: 1, max: 100, step: 1 }, slow: { default: 26, min: 1, max: 200, step: 1 }, signal: { default: 9, min: 1, max: 50, step: 1 } }},
  { id: 'stoch', name: 'Stochastic Oscillator', category: 'Momentum', icon: Activity, params: { k: { default: 14, min: 1, max: 100, step: 1 }, d: { default: 3, min: 1, max: 50, step: 1 }, smooth: { default: 3, min: 1, max: 50, step: 1 } }},
  { id: 'stoch_rsi', name: 'Stochastic RSI', category: 'Momentum', icon: Activity, params: { rsi_length: { default: 14, min: 2, max: 100, step: 1 }, stoch_length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'williams_r', name: 'Williams %R', category: 'Momentum', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'roc', name: 'Rate of Change', category: 'Momentum', icon: Activity, params: { length: { default: 10, min: 1, max: 100, step: 1 } }},
  { id: 'momentum', name: 'Momentum', category: 'Momentum', icon: Activity, params: { length: { default: 10, min: 1, max: 100, step: 1 } }},
  { id: 'cci', name: 'Commodity Channel Index', category: 'Momentum', icon: Activity, params: { length: { default: 20, min: 1, max: 100, step: 1 } }},
  { id: 'mfi', name: 'Money Flow Index', category: 'Momentum', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'tsi', name: 'True Strength Index', category: 'Momentum', icon: Activity, params: { long: { default: 25, min: 1, max: 100, step: 1 }, short: { default: 13, min: 1, max: 50, step: 1 } }},
  
  // Volatility Indicators
  { id: 'bollinger_bands', name: 'Bollinger Bands', category: 'Volatility', icon: BarChart3, params: { length: { default: 20, min: 2, max: 100, step: 1 }, mult: { default: 2.0, min: 0.1, max: 5.0, step: 0.1 } }},
  { id: 'atr', name: 'Average True Range', category: 'Volatility', icon: Zap, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'keltner', name: 'Keltner Channels', category: 'Volatility', icon: BarChart3, params: { length: { default: 20, min: 2, max: 100, step: 1 }, mult: { default: 2.0, min: 0.1, max: 5.0, step: 0.1 } }},
  { id: 'donchian', name: 'Donchian Channels', category: 'Volatility', icon: BarChart3, params: { length: { default: 20, min: 1, max: 100, step: 1 } }},
  { id: 'price_channel', name: 'Price Channel', category: 'Volatility', icon: BarChart3, params: { length: { default: 20, min: 1, max: 100, step: 1 } }},
  { id: 'chaikin_volatility', name: 'Chaikin Volatility', category: 'Volatility', icon: Zap, params: { length: { default: 10, min: 1, max: 100, step: 1 } }},
  
  // Volume Indicators
  { id: 'volume_sma', name: 'Volume SMA', category: 'Volume', icon: BarChart3, params: { length: { default: 20, min: 1, max: 100, step: 1 } }},
  { id: 'vwap', name: 'Volume Weighted Avg Price', category: 'Volume', icon: BarChart3, params: {} },
  { id: 'obv', name: 'On Balance Volume', category: 'Volume', icon: BarChart3, params: {} },
  { id: 'ad_line', name: 'Accumulation/Distribution', category: 'Volume', icon: BarChart3, params: {} },
  { id: 'chaikin_osc', name: 'Chaikin Oscillator', category: 'Volume', icon: BarChart3, params: { fast: { default: 3, min: 1, max: 20, step: 1 }, slow: { default: 10, min: 1, max: 50, step: 1 } }},
  { id: 'volume_oscillator', name: 'Volume Oscillator', category: 'Volume', icon: BarChart3, params: { short: { default: 5, min: 1, max: 50, step: 1 }, long: { default: 10, min: 1, max: 100, step: 1 } }},
  { id: 'ease_of_movement', name: 'Ease of Movement', category: 'Volume', icon: BarChart3, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  
  // Support/Resistance
  { id: 'pivot_points', name: 'Pivot Points', category: 'Support/Resistance', icon: TrendingUp, params: { type: { default: 'traditional', options: ['traditional', 'fibonacci', 'camarilla'] } }},
  { id: 'support_resistance', name: 'Support/Resistance', category: 'Support/Resistance', icon: TrendingUp, params: { lookback: { default: 50, min: 10, max: 200, step: 1 } }},
  { id: 'fractal', name: 'Fractal', category: 'Support/Resistance', icon: TrendingUp, params: { periods: { default: 2, min: 1, max: 10, step: 1 } }},
  
  // Oscillators
  { id: 'ao', name: 'Awesome Oscillator', category: 'Oscillators', icon: Activity, params: { fast: { default: 5, min: 1, max: 50, step: 1 }, slow: { default: 34, min: 1, max: 100, step: 1 } }},
  { id: 'ac', name: 'Accelerator Oscillator', category: 'Oscillators', icon: Activity, params: { fast: { default: 5, min: 1, max: 50, step: 1 }, slow: { default: 34, min: 1, max: 100, step: 1 } }},
  { id: 'adx', name: 'Average Directional Index', category: 'Oscillators', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'aroon', name: 'Aroon', category: 'Oscillators', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'dmi', name: 'Directional Movement Index', category: 'Oscillators', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'psar', name: 'Parabolic SAR', category: 'Oscillators', icon: Activity, params: { start: { default: 0.02, min: 0.01, max: 0.1, step: 0.01 }, increment: { default: 0.02, min: 0.01, max: 0.1, step: 0.01 }, maximum: { default: 0.2, min: 0.1, max: 1.0, step: 0.1 } }},
  { id: 'trix', name: 'TRIX', category: 'Oscillators', icon: Activity, params: { length: { default: 14, min: 1, max: 100, step: 1 } }},
  { id: 'ultimate_osc', name: 'Ultimate Oscillator', category: 'Oscillators', icon: Activity, params: { short: { default: 7, min: 1, max: 50, step: 1 }, medium: { default: 14, min: 1, max: 100, step: 1 }, long: { default: 28, min: 1, max: 200, step: 1 } }}
];

interface IndicatorLibraryProps {
  indicators: any[];
  onChange: (indicators: any[]) => void;
}

export const IndicatorLibrary: React.FC<IndicatorLibraryProps> = ({
  indicators,
  onChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = ['all', ...Array.from(new Set(INDICATOR_LIBRARY.map(i => i.category)))];
  
  const filteredIndicators = INDICATOR_LIBRARY.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || indicator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsDropdownOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        setFocusedIndex(prev => Math.min(prev + 1, filteredIndicators.length - 1));
        e.preventDefault();
        break;
      case 'ArrowUp':
        setFocusedIndex(prev => Math.max(prev - 1, 0));
        e.preventDefault();
        break;
      case 'Enter':
        if (focusedIndex >= 0 && focusedIndex < filteredIndicators.length) {
          addIndicator(filteredIndicators[focusedIndex].id);
        }
        e.preventDefault();
        break;
      case 'Escape':
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        e.preventDefault();
        break;
    }
  };

  const addIndicator = (indicatorType: string) => {
    const indicatorDef = INDICATOR_LIBRARY.find(i => i.id === indicatorType);
    if (!indicatorDef) return;

    const newIndicator = {
      id: `${indicatorType}_${Date.now()}`,
      type: indicatorType,
      name: `${indicatorDef.name} #${indicators.filter(i => i.type === indicatorType).length + 1}`,
      category: indicatorDef.category,
      parameters: Object.fromEntries(
        Object.entries(indicatorDef.params).map(([key, param]: [string, any]) => [
          key, 
          param.default !== undefined ? param.default : param.options?.[0] || ''
        ])
      ),
      enabled: true
    };

    onChange([...indicators, newIndicator]);
    setSearchTerm('');
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
  };

  const removeIndicator = (indicatorId: string) => {
    onChange(indicators.filter(i => i.id !== indicatorId));
  };

  const updateIndicatorParameter = (indicatorId: string, paramKey: string, value: any) => {
    onChange(indicators.map(indicator => 
      indicator.id === indicatorId 
        ? { 
            ...indicator, 
            parameters: { ...indicator.parameters, [paramKey]: value }
          }
        : indicator
    ));
  };

  const toggleIndicator = (indicatorId: string) => {
    onChange(indicators.map(indicator =>
      indicator.id === indicatorId
        ? { ...indicator, enabled: !indicator.enabled }
        : indicator
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Professional Indicator Library (40+ Indicators)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Select from over 40 professional-grade technical indicators with auto-generated parameters
          </p>
        </CardHeader>
        <CardContent>
          {/* Integrated Search and Dropdown */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
                <Input
                  ref={inputRef}
                  placeholder="Search and select indicators..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setFocusedIndex(-1);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(!isDropdownOpen);
                    setFocusedIndex(-1);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {filteredIndicators.length > 0 ? (
                    <div className="p-1">
                      {filteredIndicators.map((indicator, index) => (
                        <button
                          key={indicator.id}
                          type="button"
                          onClick={() => addIndicator(indicator.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground rounded-sm transition-colors ${
                            index === focusedIndex ? 'bg-accent text-accent-foreground' : ''
                          }`}
                          onMouseEnter={() => setFocusedIndex(index)}
                        >
                          <indicator.icon className="w-4 h-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{indicator.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{indicator.category}</div>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {indicator.category}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No indicators found</p>
                      <p className="text-xs">Try adjusting your search or category filter</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Indicators */}
          {indicators.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <h3 className="font-semibold text-lg">Active Indicators ({indicators.length})</h3>
              
              <div className="grid gap-4">
                {indicators.map(indicator => {
                  const indicatorDef = INDICATOR_LIBRARY.find(i => i.id === indicator.type);
                  if (!indicatorDef) return null;

                  return (
                    <Card key={indicator.id} className={`border-l-4 ${indicator.enabled ? 'border-l-primary' : 'border-l-muted'}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <indicatorDef.icon className="w-5 h-5" />
                            <div>
                              <span className="font-medium">{indicator.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {indicatorDef.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleIndicator(indicator.id)}
                              className={indicator.enabled ? 'text-primary' : 'text-muted-foreground'}
                            >
                              {indicator.enabled ? 'Enabled' : 'Disabled'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeIndicator(indicator.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Parameters */}
                        {Object.keys(indicatorDef.params).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Object.entries(indicatorDef.params).map(([paramKey, param]: [string, any]) => (
                              <div key={paramKey}>
                                <Label className="text-xs font-medium">{paramKey.charAt(0).toUpperCase() + paramKey.slice(1)}</Label>
                                {param.options ? (
                                  <Select 
                                    value={indicator.parameters[paramKey]} 
                                    onValueChange={(value) => updateIndicatorParameter(indicator.id, paramKey, value)}
                                  >
                                    <SelectTrigger className="mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.options.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <Input
                                    type="number"
                                    value={indicator.parameters[paramKey]}
                                    min={param.min}
                                    max={param.max}
                                    step={param.step}
                                    onChange={(e) => updateIndicatorParameter(
                                      indicator.id, 
                                      paramKey, 
                                      parseFloat(e.target.value) || param.default
                                    )}
                                    className="mt-1"
                                    disabled={!indicator.enabled}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {indicators.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No indicators added yet</p>
              <p className="text-sm">Select indicators from the dropdown above to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};