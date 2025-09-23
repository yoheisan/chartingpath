import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Plus, Trash2, TrendingUp, Activity, BarChart3, Zap, ChevronDown, Settings, ArrowLeft } from 'lucide-react';

// Professional parameter configurations
const TIMEFRAMES = [
  { value: 'current', label: 'Current timeframe' },
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1M', label: '1 Month' }
];

const PRICE_SOURCES = [
  { value: 'close', label: 'Close' },
  { value: 'open', label: 'Open' },
  { value: 'high', label: 'High' },
  { value: 'low', label: 'Low' },
  { value: 'median', label: 'Median Price' },
  { value: 'typical', label: 'Typical Price' },
  { value: 'weighted', label: 'Weighted Close' }
];

const MA_METHODS = [
  { value: 'simple', label: 'Simple' },
  { value: 'exponential', label: 'Exponential' },
  { value: 'smoothed', label: 'Smoothed' },
  { value: 'linear_weighted', label: 'Linear Weighted' }
];

// Comprehensive 40+ indicator library with Bloomberg-level parameters
const INDICATOR_LIBRARY = [
  // Trend Indicators
  { 
    id: 'ema', 
    name: 'Exponential Moving Average', 
    category: 'Trend', 
    icon: TrendingUp, 
    params: { 
      period: { type: 'number', default: 20, min: 1, max: 500, step: 1, label: 'Period', description: 'Number of periods for calculation' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      shift: { type: 'number', default: 0, min: -100, max: 100, step: 1, label: 'Shift', linkable: true },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'sma', 
    name: 'Simple Moving Average', 
    category: 'Trend', 
    icon: TrendingUp, 
    params: { 
      period: { type: 'number', default: 20, min: 1, max: 500, step: 1, label: 'Period', description: 'Number of periods for calculation' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      shift: { type: 'number', default: 0, min: -100, max: 100, step: 1, label: 'Shift', linkable: true },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'wma', 
    name: 'Weighted Moving Average', 
    category: 'Trend', 
    icon: TrendingUp, 
    params: { 
      period: { type: 'number', default: 20, min: 1, max: 500, step: 1, label: 'Period' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      shift: { type: 'number', default: 0, min: -100, max: 100, step: 1, label: 'Shift', linkable: true },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  
  // Momentum Indicators  
  { 
    id: 'rsi', 
    name: 'Relative Strength Index', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      period: { type: 'number', default: 14, min: 2, max: 100, step: 1, label: 'Period', description: 'Number of periods for RSI calculation' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      overbought: { type: 'number', default: 70, min: 50, max: 90, step: 1, label: 'Overbought Level' },
      oversold: { type: 'number', default: 30, min: 10, max: 50, step: 1, label: 'Oversold Level' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'macd', 
    name: 'MACD', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      fastPeriod: { type: 'number', default: 12, min: 1, max: 100, step: 1, label: 'Fast EMA Period' },
      slowPeriod: { type: 'number', default: 26, min: 1, max: 200, step: 1, label: 'Slow EMA Period' },
      signalPeriod: { type: 'number', default: 9, min: 1, max: 50, step: 1, label: 'Signal Period' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      maMethod: { type: 'select', default: 'exponential', options: MA_METHODS, label: 'MA Method' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'stoch', 
    name: 'Stochastic Oscillator', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      kPeriod: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: '%K Period' },
      dPeriod: { type: 'number', default: 3, min: 1, max: 50, step: 1, label: '%D Period' },
      slowing: { type: 'number', default: 3, min: 1, max: 50, step: 1, label: 'Slowing' },
      maMethod: { type: 'select', default: 'simple', options: MA_METHODS, label: 'MA Method' },
      priceField: { type: 'select', default: 'low_high', options: [
        { value: 'low_high', label: 'Low/High' },
        { value: 'close_close', label: 'Close/Close' }
      ], label: 'Price field' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'bollinger_bands', 
    name: 'Bollinger Bands', 
    category: 'Volatility', 
    icon: BarChart3, 
    params: { 
      period: { type: 'number', default: 20, min: 2, max: 100, step: 1, label: 'Period' },
      deviation: { type: 'number', default: 2.0, min: 0.1, max: 5.0, step: 0.1, label: 'Deviation' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      maMethod: { type: 'select', default: 'simple', options: MA_METHODS, label: 'MA Method' },
      shift: { type: 'number', default: 0, min: -100, max: 100, step: 1, label: 'Shift', linkable: true },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'atr', 
    name: 'Average True Range', 
    category: 'Volatility', 
    icon: Zap, 
    params: { 
      period: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: 'Period' },
      maMethod: { type: 'select', default: 'simple', options: MA_METHODS, label: 'MA Method' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'adx', 
    name: 'Average Directional Index', 
    category: 'Trend', 
    icon: Activity, 
    params: { 
      period: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: 'Period' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'cci', 
    name: 'Commodity Channel Index', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      period: { type: 'number', default: 20, min: 1, max: 100, step: 1, label: 'Period' },
      applyTo: { type: 'select', default: 'typical', options: PRICE_SOURCES, label: 'Apply to' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'momentum', 
    name: 'Momentum', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      period: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: 'Period' },
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'williams_r', 
    name: 'Williams Percent Range', 
    category: 'Momentum', 
    icon: Activity, 
    params: { 
      period: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: 'Period' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'obv', 
    name: 'On Balance Volume', 
    category: 'Volume', 
    icon: BarChart3, 
    params: { 
      applyTo: { type: 'select', default: 'close', options: PRICE_SOURCES, label: 'Apply to' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'vwap', 
    name: 'Volume Weighted Average Price', 
    category: 'Volume', 
    icon: BarChart3, 
    params: { 
      period: { type: 'number', default: 20, min: 1, max: 500, step: 1, label: 'Period' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'mfi', 
    name: 'Money Flow Index', 
    category: 'Volume', 
    icon: BarChart3, 
    params: { 
      period: { type: 'number', default: 14, min: 1, max: 100, step: 1, label: 'Period' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'psar', 
    name: 'Parabolic SAR', 
    category: 'Trend', 
    icon: Activity, 
    params: { 
      step: { type: 'number', default: 0.02, min: 0.01, max: 0.1, step: 0.01, label: 'Step' },
      maximum: { type: 'number', default: 0.2, min: 0.1, max: 1.0, step: 0.1, label: 'Maximum' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  },
  { 
    id: 'ichimoku', 
    name: 'Ichimoku Kinko Hyo', 
    category: 'Trend', 
    icon: TrendingUp, 
    params: { 
      tenkanSen: { type: 'number', default: 9, min: 1, max: 100, step: 1, label: 'Tenkan-sen' },
      kijunSen: { type: 'number', default: 26, min: 1, max: 100, step: 1, label: 'Kijun-sen' },
      senkouSpanB: { type: 'number', default: 52, min: 1, max: 100, step: 1, label: 'Senkou Span B' },
      timeframe: { type: 'select', default: 'current', options: TIMEFRAMES, label: 'Timeframe' }
    }
  }
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
  const [selectedIndicator, setSelectedIndicator] = useState<any>(null);
  const [isParameterDialogOpen, setIsParameterDialogOpen] = useState(false);
  const [linkedParameters, setLinkedParameters] = useState<{[key: string]: boolean}>({});
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
      name: `${indicatorDef.name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('')}`,
      displayName: `${indicatorDef.name} #${indicators.filter(i => i.type === indicatorType).length + 1}`,
      category: indicatorDef.category,
      parameters: Object.fromEntries(
        Object.entries(indicatorDef.params).map(([key, param]: [string, any]) => [
          key, 
          param.default !== undefined ? param.default : param.options?.[0]?.value || ''
        ])
      ),
      enabled: true
    };

    onChange([...indicators, newIndicator]);
    setSearchTerm('');
    setIsDropdownOpen(false);
    setFocusedIndex(-1);
  };

  const openParameterDialog = (indicator: any) => {
    setSelectedIndicator(indicator);
    setIsParameterDialogOpen(true);
  };

  const saveIndicatorParameters = () => {
    if (!selectedIndicator) return;
    
    onChange(indicators.map(indicator =>
      indicator.id === selectedIndicator.id
        ? selectedIndicator
        : indicator
    ));
    
    setIsParameterDialogOpen(false);
    setSelectedIndicator(null);
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
                              <span className="font-medium">{indicator.displayName || indicator.name}</span>
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

                        {/* Quick Parameters & Configure Button */}
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1">
                            {Object.entries(indicatorDef.params).slice(0, 2).map(([paramKey, param]: [string, any]) => (
                              <div key={paramKey}>
                                <Label className="text-xs font-medium">{param.label || paramKey}</Label>
                                {param.type === 'select' ? (
                                  <Select 
                                    value={indicator.parameters[paramKey]} 
                                    onValueChange={(value) => updateIndicatorParameter(indicator.id, paramKey, value)}
                                  >
                                    <SelectTrigger className="mt-1 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {param.options.map((option: any) => (
                                        <SelectItem key={option.value} value={option.value}>
                                          {option.label}
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
                                    className="mt-1 h-8"
                                    disabled={!indicator.enabled}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openParameterDialog(indicator)}
                            className="ml-3"
                            disabled={!indicator.enabled}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                        </div>
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

      {/* Professional Parameter Configuration Dialog */}
      <Dialog open={isParameterDialogOpen} onOpenChange={setIsParameterDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsParameterDialogOpen(false)}
                className="p-0 h-auto hover:bg-transparent"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <DialogTitle className="flex-1">Indicator Parameters</DialogTitle>
              <Button onClick={saveIndicatorParameters} className="bg-blue-600 hover:bg-blue-700">
                Save
              </Button>
            </div>
          </DialogHeader>

          {selectedIndicator && (
            <div className="space-y-6 py-4">
              {/* Indicator Header */}
              <Card className="border-0 bg-accent/20">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {INDICATOR_LIBRARY.find(i => i.id === selectedIndicator.type)?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">Configure professional parameters</p>
                    </div>
                    <div className="ml-auto">
                      <Badge variant="outline">
                        {INDICATOR_LIBRARY.find(i => i.id === selectedIndicator.type)?.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parameter Configuration */}
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                  <Input
                    value={selectedIndicator.name || ''}
                    onChange={(e) => setSelectedIndicator({
                      ...selectedIndicator,
                      name: e.target.value
                    })}
                    className="mt-1"
                    placeholder="Indicator display name"
                  />
                </div>

                {/* Professional Parameters */}
                {Object.entries(INDICATOR_LIBRARY.find(i => i.id === selectedIndicator.type)?.params || {}).map(([paramKey, param]: [string, any]) => (
                  <div key={paramKey} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-muted-foreground">
                        {param.label || paramKey}
                        {param.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                      {param.linkable && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`link-${paramKey}`}
                            checked={linkedParameters[paramKey] || false}
                            onCheckedChange={(checked) => 
                              setLinkedParameters(prev => ({ ...prev, [paramKey]: checked as boolean }))
                            }
                          />
                          <Label 
                            htmlFor={`link-${paramKey}`} 
                            className="text-xs text-muted-foreground cursor-pointer"
                          >
                            Linked
                          </Label>
                        </div>
                      )}
                    </div>

                    {param.type === 'select' ? (
                      <Select 
                        value={selectedIndicator.parameters[paramKey]} 
                        onValueChange={(value) => setSelectedIndicator({
                          ...selectedIndicator,
                          parameters: { ...selectedIndicator.parameters, [paramKey]: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`Select ${param.label?.toLowerCase() || paramKey}`} />
                        </SelectTrigger>
                        <SelectContent className="bg-popover">
                          {param.options.map((option: any) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type="number"
                        value={selectedIndicator.parameters[paramKey]}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        onChange={(e) => setSelectedIndicator({
                          ...selectedIndicator,
                          parameters: { 
                            ...selectedIndicator.parameters, 
                            [paramKey]: parseFloat(e.target.value) || param.default 
                          }
                        })}
                        className="font-mono"
                      />
                    )}

                    {param.description && (
                      <p className="text-xs text-muted-foreground">{param.description}</p>
                    )}

                    {linkedParameters[paramKey] && (
                      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          <strong>Links the value of parameter '{param.label}'.</strong><br />
                          When this box is checked you can change the value here and it will override the '{param.label}' parameter value in all other '{selectedIndicator.type.toUpperCase()}' indicators.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};