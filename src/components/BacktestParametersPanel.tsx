import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  DollarSign, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Plus
} from "lucide-react";

interface Strategy {
  id: string;
  name: string;
  category: string;
  description: string;
}

interface BacktestParametersPanelProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  params: BacktestParams;
  onParamsChange: (params: BacktestParams) => void;
  strategies: Strategy[];
  isGuidedBuilder?: boolean; // true = guided builder (30 days limit), false = advanced engine (custom periods)
}

export interface BacktestParams {
  instrument: string;
  timeframe: string;
  period: string;
  fromDate: string;
  toDate: string;
  initialCapital: number;
  positionSizingType: string;
  positionSize: number;
  stopLoss?: number;
  takeProfit?: number;
  orderType: string;
  commission: number;
  slippage: number;
}

const INSTRUMENT_CATEGORIES = {
  FX: {
    label: 'Foreign Exchange',
    instruments: [
      'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
      'EURGBP', 'EURJPY', 'GBPJPY', 'AUDNZD', 'EURAUD', 'GBPAUD', 'CHFJPY'
    ]
  },
  Crypto: {
    label: 'Cryptocurrency',
    instruments: [
      'BTCUSD', 'ETHUSD', 'ADAUSD', 'XRPUSD', 'SOLUSD', 'DOTUSD', 'MATICUSD',
      'LINKUSD', 'LTCUSD', 'BCHUSD', 'XMRUSD', 'ETCUSD', 'EOSUSD', 'TRXUSD'
    ]
  },
  Indices: {
    label: 'Stock Indices',
    instruments: [
      'SPX500', 'NAS100', 'US30', 'GER30', 'UK100', 'FRA40', 'AUS200',
      'JPN225', 'HK50', 'EUSTX50', 'SPAIN35', 'NETH25', 'SWI20', 'ITA40'
    ]
  },
  Commodities: {
    label: 'Commodities',
    instruments: [
      'XAUUSD', 'XAGUSD', 'XPTUSD', 'XPDUSD', 'USOIL', 'UKOIL', 'NGAS',
      'WHEAT', 'CORN', 'SOYBEAN', 'COFFEE', 'SUGAR', 'COCOA', 'COTTON'
    ]
  }
};

const TIMEFRAMES = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1H', label: '1 Hour' },
  { value: '4H', label: '4 Hours' },
  { value: '1D', label: '1 Day' },
  { value: '1W', label: '1 Week' }
];

const BACKTEST_PERIODS = [
  { value: 'custom', label: 'Custom Range' },
  { value: '1M', label: 'Last 1 Month' },
  { value: '3M', label: 'Last 3 Months' },
  { value: '6M', label: 'Last 6 Months' },
  { value: '1Y', label: 'Last 1 Year' },
  { value: '2Y', label: 'Last 2 Years' },
  { value: '3Y', label: 'Last 3 Years' },
  { value: '5Y', label: 'Last 5 Years' }
];

const BacktestParametersPanel: React.FC<BacktestParametersPanelProps> = ({
  selectedStrategy,
  onStrategyChange,
  params,
  onParamsChange,
  strategies,
  isGuidedBuilder = false
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<keyof typeof INSTRUMENT_CATEGORIES | 'ALL'>('ALL');
  const [instrumentSearch, setInstrumentSearch] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  // Helper function to get filtered instruments based on category and search
  const getFilteredInstruments = () => {
    const allInstruments: Array<{instrument: string, category: string}> = [];
    
    if (selectedCategory === 'ALL') {
      Object.entries(INSTRUMENT_CATEGORIES).forEach(([categoryKey, category]) => {
        category.instruments.forEach(instrument => {
          allInstruments.push({
            instrument,
            category: category.label
          });
        });
      });
    } else {
      INSTRUMENT_CATEGORIES[selectedCategory as keyof typeof INSTRUMENT_CATEGORIES].instruments.forEach(instrument => {
        allInstruments.push({
          instrument,
          category: INSTRUMENT_CATEGORIES[selectedCategory as keyof typeof INSTRUMENT_CATEGORIES].label
        });
      });
    }

    return allInstruments.filter(item =>
      item.instrument.toLowerCase().includes(instrumentSearch.toLowerCase())
    );
  };

  // Helper function to get instrument description
  const getInstrumentDescription = (instrument: string) => {
    const descriptions: Record<string, string> = {
      'EURUSD': 'Euro / US Dollar',
      'GBPUSD': 'British Pound / US Dollar',
      'USDJPY': 'US Dollar / Japanese Yen',
      'USDCHF': 'US Dollar / Swiss Franc',
      'AUDUSD': 'Australian Dollar / US Dollar',
      'USDCAD': 'US Dollar / Canadian Dollar',
      'NZDUSD': 'New Zealand Dollar / US Dollar',
      'BTCUSD': 'Bitcoin / US Dollar',
      'ETHUSD': 'Ethereum / US Dollar',
      'SPX500': 'S&P 500 Index',
      'NAS100': 'NASDAQ 100 Index',
      'US30': 'Dow Jones Industrial Average',
      'XAUUSD': 'Gold / US Dollar',
      'XAGUSD': 'Silver / US Dollar',
    };
    return descriptions[instrument] || instrument;
  };
  const updateParam = (key: keyof BacktestParams, value: any) => {
    onParamsChange({ ...params, [key]: value });
  };

  const calculateDateRange = (period: string) => {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    let fromDate: string;

    switch (period) {
      case '1M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
        break;
      case '3M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0];
        break;
      case '6M':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0];
        break;
      case '1Y':
        fromDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '2Y':
        fromDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '3Y':
        fromDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      case '5Y':
        fromDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      default:
        return; // Custom range - don't update dates
    }

    updateParam('fromDate', fromDate);
    updateParam('toDate', toDate);
  };

  const handlePeriodChange = (value: string) => {
    console.log('=== PERIOD CHANGE START ===');
    console.log('New value:', value);
    console.log('Current params before update:', JSON.stringify(params, null, 2));
    
    updateParam('period', value);
    
    if (value !== 'custom') {
      console.log('Calculating date range for:', value);
      calculateDateRange(value);
    }
    
    console.log('=== PERIOD CHANGE END ===');
  };

  const validateSettings = () => {
    const warnings = [];
    
    if (!selectedStrategy) warnings.push("No strategy selected");
    if (params.stopLoss && params.stopLoss <= 0) warnings.push("Stop loss must be > 0");
    if (params.takeProfit && params.takeProfit <= 0) warnings.push("Take profit must be > 0");
    if (params.positionSize <= 0) warnings.push("Position size must be > 0");
    if (new Date(params.fromDate) >= new Date(params.toDate)) warnings.push("Invalid date range");
    
    return warnings;
  };

  const warnings = validateSettings();

  return (
    <div className="space-y-6">
      {/* Strategy Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Strategy & Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="strategy">Strategy</Label>
            <Select value={selectedStrategy} onValueChange={onStrategyChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                {strategies.slice(0, 20).map((strategy) => (
                  <SelectItem key={strategy.id} value={strategy.name}>
                    {strategy.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="instrument">Instrument</Label>
              <div className="relative">
                {/* Custom Dropdown Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-between h-10 px-3"
                   onClick={() => {
                     console.log('Dropdown button clicked, current state:', dropdownOpen);
                     setDropdownOpen(!dropdownOpen);
                   }}
                >
                  <span className="flex items-center gap-2">
                    {params.instrument ? (
                      <>
                        <span className="w-5 h-5 bg-primary/10 rounded-sm flex items-center justify-center text-xs font-bold">
                          {params.instrument.substring(0, 2)}
                        </span>
                        {params.instrument}
                      </>
                    ) : (
                      'Select instrument'
                    )}
                  </span>
                  <div className={`transform transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </Button>

                 {/* Custom Dropdown Content */}
                 {dropdownOpen && (
                   <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-xl z-[9999] max-h-96 overflow-hidden">
                     {/* Debug indicator */}
                     <div className="p-1 bg-green-100 dark:bg-green-900 text-xs text-green-800 dark:text-green-200">
                       Dropdown Open - Categories Available
                     </div>
                     
                     {/* Search Input */}
                     <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                       <Input
                         placeholder="Search instruments..."
                         value={instrumentSearch}
                         onChange={(e) => setInstrumentSearch(e.target.value)}
                         className="h-9"
                         autoFocus
                       />
                     </div>

                     {/* Category Tabs */}
                     <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                       <Button
                         type="button"
                         variant={selectedCategory === 'ALL' ? 'default' : 'ghost'}
                         size="sm"
                         onClick={() => {
                           console.log('Selected ALL category');
                           setSelectedCategory('ALL');
                         }}
                         className="h-7 px-3 text-xs"
                       >
                         All
                       </Button>
                       {Object.entries(INSTRUMENT_CATEGORIES).map(([key, category]) => (
                         <Button
                           key={key}
                           type="button"
                           variant={selectedCategory === key ? 'default' : 'ghost'}
                           size="sm"
                           onClick={() => {
                             console.log('Selected category:', key);
                             setSelectedCategory(key as keyof typeof INSTRUMENT_CATEGORIES);
                           }}
                           className="h-7 px-3 text-xs"
                         >
                           {category.label.replace(' Exchange', '').replace('Stock ', '')}
                         </Button>
                       ))}
                     </div>

                    {/* Instruments List */}
                    <div className="max-h-60 overflow-y-auto">
                      {getFilteredInstruments().map((item) => (
                        <div
                          key={item.instrument}
                          className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer border-b border-border/50 last:border-b-0"
                          onClick={() => {
                            updateParam('instrument', item.instrument);
                            setDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className="w-6 h-6 bg-primary/20 rounded-sm flex items-center justify-center text-xs font-bold text-primary">
                              {item.instrument.substring(0, 2)}
                            </div>
                            {/* Symbol and Name */}
                            <div>
                              <div className="font-medium text-sm">{item.instrument}</div>
                              <div className="text-xs text-muted-foreground">
                                {getInstrumentDescription(item.instrument)}
                              </div>
                            </div>
                          </div>
                          {/* Category Badge */}
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {item.category.toLowerCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                      {getFilteredInstruments().length === 0 && (
                        <div className="p-6 text-center text-muted-foreground">
                          No instruments found
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Overlay to close dropdown */}
                {dropdownOpen && (
                  <div 
                    className="fixed inset-0 z-[9998]" 
                    onClick={() => setDropdownOpen(false)} 
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="timeframe">Timeframe</Label>
              <Select value={params.timeframe} onValueChange={(value) => updateParam('timeframe', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="period">Backtest Period</Label>
            <div className="text-xs text-muted-foreground mb-1">
              Current: {params.period || 'undefined'} | 
              Type: {typeof params.period} | 
              All keys: {Object.keys(params).join(', ')}
            </div>
            <Select 
              value={params.period || ''} 
              onValueChange={(value) => {
                console.log('Select onValueChange called with:', value);
                handlePeriodChange(value);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="z-[9999] bg-background">
                {BACKTEST_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-xs text-green-600 mt-1">
              Available periods: {BACKTEST_PERIODS.map(p => p.value).join(', ')}
            </div>
          </div>

          {params.period && params.period !== 'custom' && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Period: {params.fromDate || 'Calculating...'} to {params.toDate || 'Calculating...'}
                  {params.period && ` (${BACKTEST_PERIODS.find(p => p.value === params.period)?.label})`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                type="date"
                value={params.fromDate}
                onChange={(e) => updateParam('fromDate', e.target.value)}
                disabled={params.period !== 'custom'}
              />
            </div>

            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                type="date"
                value={params.toDate}
                onChange={(e) => updateParam('toDate', e.target.value)}
                disabled={params.period !== 'custom'}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capital & Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Capital & Risk
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="initialCapital">Initial Capital ($)</Label>
            <Input
              type="number"
              value={params.initialCapital}
              onChange={(e) => updateParam('initialCapital', Number(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="positionSizingType">Position Sizing</Label>
            <Select 
              value={params.positionSizingType} 
              onValueChange={(value) => updateParam('positionSizingType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage of Capital</SelectItem>
                <SelectItem value="fixed">Fixed Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="positionSize">
              Position Size ({params.positionSizingType === 'percentage' ? '%' : '$'})
            </Label>
            <Input
              type="number"
              step="0.1"
              value={params.positionSize}
              onChange={(e) => updateParam('positionSize', Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stopLoss">Stop Loss (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.stopLoss || ''}
                onChange={(e) => updateParam('stopLoss', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label htmlFor="takeProfit">Take Profit (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={params.takeProfit || ''}
                onChange={(e) => updateParam('takeProfit', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Execution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="orderType">Order Type</Label>
            <Select value={params.orderType} onValueChange={(value) => updateParam('orderType', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market Order</SelectItem>
                <SelectItem value="limit">Limit Order</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="commission">Commission (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={params.commission}
                onChange={(e) => updateParam('commission', Number(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="slippage">Slippage (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={params.slippage}
                onChange={(e) => updateParam('slippage', Number(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Warnings */}
      {warnings.length > 0 && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-warning mb-2">Validation Warnings</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BacktestParametersPanel;