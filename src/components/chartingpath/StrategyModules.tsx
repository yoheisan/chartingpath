import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Target, 
  TrendingDown, 
  Clock, 
  AlertTriangle, 
  Settings,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react';

interface StrategyModulesProps {
  strategy: any;
  onChange: (section: string, data: any) => void;
}

export const StrategyModules: React.FC<StrategyModulesProps> = ({
  strategy,
  onChange
}) => {
  const updateOrderTypes = (field: string, value: any) => {
    onChange('orderTypes', {
      ...strategy.orderTypes,
      [field]: value
    });
  };

  const updateStopLoss = (field: string, value: any) => {
    onChange('stopLoss', {
      ...strategy.stopLoss,
      [field]: value
    });
  };

  const updateTakeProfit = (field: string, value: any) => {
    onChange('takeProfit', {
      ...strategy.takeProfit,
      [field]: value
    });
  };

  const updateAdvancedControls = (field: string, value: any) => {
    onChange('advancedControls', {
      ...strategy.advancedControls,
      [field]: value
    });
  };

  const updateSessionFilters = (field: string, value: any) => {
    onChange('sessionFilters', {
      ...strategy.sessionFilters,
      [field]: value
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Professional Strategy Modules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure order types, risk management, and advanced trading controls
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="stoploss">Stop Loss</TabsTrigger>
              <TabsTrigger value="takeprofit">Take Profit</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="sessions">Sessions</TabsTrigger>
            </TabsList>

            {/* Order Types */}
            <TabsContent value="orders" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Order Types
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure which order types your strategy can use
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Market Orders</Label>
                        <p className="text-xs text-muted-foreground">Execute immediately at market price</p>
                      </div>
                      <Switch
                        checked={strategy.orderTypes.market}
                        onCheckedChange={(checked) => updateOrderTypes('market', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Limit Orders</Label>
                        <p className="text-xs text-muted-foreground">Execute at specified price or better</p>
                      </div>
                      <Switch
                        checked={strategy.orderTypes.limit}
                        onCheckedChange={(checked) => updateOrderTypes('limit', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Stop Orders</Label>
                        <p className="text-xs text-muted-foreground">Trigger market order when price reached</p>
                      </div>
                      <Switch
                        checked={strategy.orderTypes.stop}
                        onCheckedChange={(checked) => updateOrderTypes('stop', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Pending Orders</Label>
                        <p className="text-xs text-muted-foreground">Advanced pending order logic</p>
                      </div>
                      <Switch
                        checked={strategy.orderTypes.pending}
                        onCheckedChange={(checked) => updateOrderTypes('pending', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stop Loss */}
            <TabsContent value="stoploss" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Stop Loss Configuration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure stop loss methods and parameters
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Stop Loss Type</Label>
                      <Select
                        value={strategy.stopLoss.type}
                        onValueChange={(value) => updateStopLoss('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Pips</SelectItem>
                          <SelectItem value="atr">ATR-based</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="support_resistance">Support/Resistance</SelectItem>
                          <SelectItem value="trailing">Trailing Stop</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                          <SelectItem value="pro_conditional">Pro Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Stop Loss Value</Label>
                      <Input
                        type="number"
                        value={strategy.stopLoss.value}
                        onChange={(e) => updateStopLoss('value', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {strategy.stopLoss.type === 'fixed' ? 'Pips' : 
                         strategy.stopLoss.type === 'atr' ? 'ATR Multiplier' :
                         strategy.stopLoss.type === 'percentage' ? 'Percentage' : 'Value'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={strategy.stopLoss.trailing}
                        onCheckedChange={(checked) => updateStopLoss('trailing', checked)}
                      />
                      <Label>Enable Trailing Stop</Label>
                    </div>

                    {strategy.stopLoss.trailing && (
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Trail Distance:</Label>
                        <Input
                          type="number"
                          value={strategy.stopLoss.trailDistance || 1.0}
                          onChange={(e) => updateStopLoss('trailDistance', parseFloat(e.target.value) || 1.0)}
                          className="w-20"
                          step="0.1"
                          min="0.1"
                        />
                      </div>
                    )}
                  </div>

                  {strategy.stopLoss.type === 'conditional' && (
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <Label className="font-medium">Conditional Stop Loss Rules</Label>
                        <p className="text-xs text-muted-foreground mb-3">
                          Define conditions for dynamic stop loss adjustment
                        </p>
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Condition" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rsi_oversold">RSI Oversold</SelectItem>
                                <SelectItem value="support_break">Support Break</SelectItem>
                                <SelectItem value="time_exit">Time Exit</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="Action" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="tighten">Tighten Stop</SelectItem>
                                <SelectItem value="loosen">Loosen Stop</SelectItem>
                                <SelectItem value="exit">Exit Position</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input placeholder="Value" type="number" step="0.1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Take Profit */}
            <TabsContent value="takeprofit" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Take Profit Configuration
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure take profit methods and targets
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Take Profit Type</Label>
                      <Select
                        value={strategy.takeProfit.type}
                        onValueChange={(value) => updateTakeProfit('type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed Pips</SelectItem>
                          <SelectItem value="ratio">Risk-Reward Ratio</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="resistance">Resistance Level</SelectItem>
                          <SelectItem value="trailing">Trailing TP</SelectItem>
                          <SelectItem value="conditional">Conditional</SelectItem>
                          <SelectItem value="pro_conditional">Pro Conditional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Take Profit Value</Label>
                      <Input
                        type="number"
                        value={strategy.takeProfit.value}
                        onChange={(e) => updateTakeProfit('value', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {strategy.takeProfit.type === 'fixed' ? 'Pips' : 
                         strategy.takeProfit.type === 'ratio' ? 'R Multiple' :
                         strategy.takeProfit.type === 'percentage' ? 'Percentage' : 'Value'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={strategy.takeProfit.trailing}
                        onCheckedChange={(checked) => updateTakeProfit('trailing', checked)}
                      />
                      <Label>Enable Trailing TP</Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={strategy.takeProfit.partialClose || false}
                        onCheckedChange={(checked) => updateTakeProfit('partialClose', checked)}
                      />
                      <Label>Partial Close</Label>
                    </div>
                  </div>

                  {strategy.takeProfit.partialClose && (
                    <Card className="border-dashed">
                      <CardContent className="pt-4">
                        <Label className="font-medium">Partial Take Profit Levels</Label>
                        <div className="grid grid-cols-3 gap-3 mt-3">
                          <div>
                            <Label className="text-xs">TP1 (50%)</Label>
                            <Input type="number" placeholder="1.5" step="0.1" />
                          </div>
                          <div>
                            <Label className="text-xs">TP2 (30%)</Label>
                            <Input type="number" placeholder="2.5" step="0.1" />
                          </div>
                          <div>
                            <Label className="text-xs">TP3 (20%)</Label>
                            <Input type="number" placeholder="4.0" step="0.1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advanced Controls */}
            <TabsContent value="advanced" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Controls
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure advanced trading parameters and filters
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Max Position Lifespan (bars)</Label>
                      <Input
                        type="number"
                        value={strategy.advancedControls.maxLifespan}
                        onChange={(e) => updateAdvancedControls('maxLifespan', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">0 = No limit</p>
                    </div>

                    <div>
                      <Label>Maximum Spread (pips)</Label>
                      <Input
                        type="number"
                        value={strategy.advancedControls.maxSpread}
                        onChange={(e) => updateAdvancedControls('maxSpread', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Block trades if spread exceeds</p>
                    </div>

                    <div>
                      <Label>Pip Gap Filter</Label>
                      <Input
                        type="number"
                        value={strategy.advancedControls.pipGap}
                        onChange={(e) => updateAdvancedControls('pipGap', parseFloat(e.target.value) || 0)}
                        step="0.1"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Minimum pips between trades</p>
                    </div>

                    <div>
                      <Label>Time Gap Filter (minutes)</Label>
                      <Input
                        type="number"
                        value={strategy.advancedControls.timeGap}
                        onChange={(e) => updateAdvancedControls('timeGap', parseInt(e.target.value) || 0)}
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground">Minimum time between trades</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="font-medium">Account Protection</Label>
                    <p className="text-xs text-muted-foreground mb-3">
                      Advanced account protection mechanisms
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Max Daily Loss (%)</Label>
                        <Input
                          type="number"
                          placeholder="5.0"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Max Daily Profit (%)</Label>
                        <Input
                          type="number"
                          placeholder="10.0"
                          step="0.1"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Session Filters */}
            <TabsContent value="sessions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Session Filters
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Control when your strategy can trade based on market sessions
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={strategy.sessionFilters.enabled}
                      onCheckedChange={(checked) => updateSessionFilters('enabled', checked)}
                    />
                    <Label>Enable Session Filtering</Label>
                  </div>

                  {strategy.sessionFilters.enabled && (
                    <div className="space-y-4">
                      <div>
                        <Label className="font-medium">Allowed Trading Sessions</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {[
                            { id: 'sydney', name: 'Sydney Session', time: '21:00 - 06:00 GMT' },
                            { id: 'tokyo', name: 'Tokyo Session', time: '23:00 - 08:00 GMT' },
                            { id: 'london', name: 'London Session', time: '07:00 - 16:00 GMT' },
                            { id: 'newyork', name: 'New York Session', time: '12:00 - 21:00 GMT' },
                            { id: 'london_ny', name: 'London-NY Overlap', time: '12:00 - 16:00 GMT' },
                            { id: 'tokyo_london', name: 'Tokyo-London Overlap', time: '07:00 - 08:00 GMT' }
                          ].map(session => (
                            <div key={session.id} className="flex items-center justify-between p-3 border rounded">
                              <div>
                                <div className="font-medium text-sm">{session.name}</div>
                                <div className="text-xs text-muted-foreground">{session.time}</div>
                              </div>
                              <Switch
                                checked={strategy.sessionFilters.sessions?.includes(session.id) || false}
                                onCheckedChange={(checked) => {
                                  const sessions = strategy.sessionFilters.sessions || [];
                                  if (checked) {
                                    updateSessionFilters('sessions', [...sessions, session.id]);
                                  } else {
                                    updateSessionFilters('sessions', sessions.filter((s: string) => s !== session.id));
                                  }
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Switch
                            checked={strategy.sessionFilters.excludeNews}
                            onCheckedChange={(checked) => updateSessionFilters('excludeNews', checked)}
                          />
                          <Label>Exclude News Events</Label>
                          <Badge variant="outline" className="text-xs">
                            High Impact
                          </Badge>
                        </div>
                        
                        {strategy.sessionFilters.excludeNews && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">Before Event (minutes)</Label>
                              <Input type="number" placeholder="30" min="0" max="1440" />
                            </div>
                            <div>
                              <Label className="text-sm">After Event (minutes)</Label>
                              <Input type="number" placeholder="30" min="0" max="1440" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};