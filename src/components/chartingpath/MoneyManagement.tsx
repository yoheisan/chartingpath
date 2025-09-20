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
import { Slider } from '@/components/ui/slider';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  PieChart,
  BarChart3,
  Calculator,
  Shield,
  Zap
} from 'lucide-react';

interface MoneyManagementProps {
  settings: any;
  riskSettings: any;
  onChange: (data: { moneyManagement: any; riskSettings: any }) => void;
}

export const MoneyManagement: React.FC<MoneyManagementProps> = ({
  settings,
  riskSettings,
  onChange
}) => {
  const updateMoneyManagement = (field: string, value: any) => {
    onChange({
      moneyManagement: { ...settings, [field]: value },
      riskSettings
    });
  };

  const updateRiskSettings = (field: string, value: any) => {
    onChange({
      moneyManagement: settings,
      riskSettings: { ...riskSettings, [field]: value }
    });
  };

  const calculatePositionSize = () => {
    const accountSize = 100000; // Example account size
    const riskAmount = (accountSize * riskSettings.riskPerTrade) / 100;
    const stopLossPoints = 50; // Example stop loss in points
    
    switch (settings.method) {
      case 'fixed_percent':
        return (riskAmount / stopLossPoints).toFixed(2);
      case 'fixed_lot':
        return settings.amount.toFixed(2);
      case 'linear_scaling':
        return (riskAmount * settings.scalingFactor / stopLossPoints).toFixed(2);
      default:
        return '0.00';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Professional Money Management
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure position sizing, risk parameters, and smart defaults for professional trading
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="positioning" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="positioning">Position Sizing</TabsTrigger>
              <TabsTrigger value="risk">Risk Management</TabsTrigger>
              <TabsTrigger value="scaling">Scaling & Martingale</TabsTrigger>
              <TabsTrigger value="calculator">Calculator</TabsTrigger>
            </TabsList>

            {/* Position Sizing */}
            <TabsContent value="positioning" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Position Sizing Methods
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select and configure your preferred position sizing method
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="font-medium">Position Sizing Method</Label>
                    <Select
                      value={settings.method}
                      onValueChange={(value) => updateMoneyManagement('method', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed_percent">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <div>
                              <div className="font-medium">% Equity Per Trade</div>
                              <div className="text-xs text-muted-foreground">Risk fixed percentage of account</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="fixed_lot">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Fixed Lot Size</div>
                              <div className="text-xs text-muted-foreground">Trade same lot size always</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="linear_scaling">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Linear Scaling</div>
                              <div className="text-xs text-muted-foreground">Scale position based on performance</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="manual_sequence">
                          <div className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Manual Sequence</div>
                              <div className="text-xs text-muted-foreground">Define custom lot sequence</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Method-specific configurations */}
                  {settings.method === 'fixed_percent' && (
                    <Card className="border-dashed bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label className="flex items-center gap-2">
                              Risk Per Trade (%)
                              <Badge variant="outline">Recommended: 1-2%</Badge>
                            </Label>
                            <div className="mt-2">
                              <Slider
                                value={[settings.amount || 2.0]}
                                onValueChange={(value) => updateMoneyManagement('amount', value[0])}
                                max={10}
                                min={0.1}
                                step={0.1}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>0.1%</span>
                                <span className="font-medium">{settings.amount || 2.0}%</span>
                                <span>10%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Account Size ($)</Label>
                              <Input
                                type="number"
                                value={100000}
                                disabled
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Risk Amount ($)</Label>
                              <Input
                                type="number"
                                value={(100000 * (settings.amount || 2.0) / 100).toFixed(2)}
                                disabled
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settings.method === 'fixed_lot' && (
                    <Card className="border-dashed bg-accent/5">
                      <CardContent className="pt-4">
                        <div>
                          <Label>Fixed Lot Size</Label>
                          <Input
                            type="number"
                            value={settings.amount || 0.1}
                            onChange={(e) => updateMoneyManagement('amount', parseFloat(e.target.value) || 0.1)}
                            step="0.01"
                            min="0.01"
                            className="mt-2"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Standard lot = 100,000 units | Mini lot = 10,000 units | Micro lot = 1,000 units
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settings.method === 'linear_scaling' && (
                    <Card className="border-dashed bg-green-50">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Base Risk (%)</Label>
                            <Input
                              type="number"
                              value={settings.amount || 2.0}
                              onChange={(e) => updateMoneyManagement('amount', parseFloat(e.target.value) || 2.0)}
                              step="0.1"
                              min="0.1"
                              max="10"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label>Scaling Factor</Label>
                            <Input
                              type="number"
                              value={settings.scalingFactor || 1.1}
                              onChange={(e) => updateMoneyManagement('scalingFactor', parseFloat(e.target.value) || 1.1)}
                              step="0.1"
                              min="0.5"
                              max="2.0"
                              className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Multiply position size by this factor after wins
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {settings.method === 'manual_sequence' && (
                    <Card className="border-dashed bg-orange-50">
                      <CardContent className="pt-4">
                        <Label>Lot Size Sequence</Label>
                        <Input
                          placeholder="0.1, 0.2, 0.3, 0.5, 0.8"
                          value={settings.sequence || ''}
                          onChange={(e) => updateMoneyManagement('sequence', e.target.value)}
                          className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Comma-separated lot sizes for sequential trades
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Management */}
            <TabsContent value="risk" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Management & Smart Defaults
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Professional risk parameters with beginner safety features
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="flex items-center gap-2">
                        Risk Per Trade (%)
                        <Badge variant="default" className="bg-green-500">Smart Default</Badge>
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[riskSettings.riskPerTrade || 2.0]}
                          onValueChange={(value) => updateRiskSettings('riskPerTrade', value[0])}
                          max={10}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Conservative (0.1%)</span>
                          <span className="font-medium">{riskSettings.riskPerTrade || 2.0}%</span>
                          <span>Aggressive (10%)</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2">
                        Maximum Drawdown (%)
                        <Badge variant="outline">Account Protection</Badge>
                      </Label>
                      <div className="mt-2">
                        <Slider
                          value={[riskSettings.maxDrawdown || 10.0]}
                          onValueChange={(value) => updateRiskSettings('maxDrawdown', value[0])}
                          max={50}
                          min={1}
                          step={1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>1%</span>
                          <span className="font-medium">{riskSettings.maxDrawdown || 10.0}%</span>
                          <span>50%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Max Trades Per Day</Label>
                      <Input
                        type="number"
                        value={riskSettings.maxTradesPerDay || 5}
                        onChange={(e) => updateRiskSettings('maxTradesPerDay', parseInt(e.target.value) || 5)}
                        min="0"
                        max="100"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">0 = No limit</p>
                    </div>

                    <div>
                      <Label>Max Open Positions</Label>
                      <Input
                        type="number"
                        value={riskSettings.maxOpenPositions || 1}
                        onChange={(e) => updateRiskSettings('maxOpenPositions', parseInt(e.target.value) || 1)}
                        min="1"
                        max="10"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="font-medium text-base">ATR-Based Stops (Smart Default)</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Professional risk management using Average True Range for dynamic stops
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">ATR Period</Label>
                        <Input
                          type="number"
                          value={riskSettings.atrPeriod || 14}
                          onChange={(e) => updateRiskSettings('atrPeriod', parseInt(e.target.value) || 14)}
                          min="1"
                          max="100"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Stop Loss ATR Multiplier</Label>
                        <Input
                          type="number"
                          value={riskSettings.atrStopMultiplier || 2.0}
                          onChange={(e) => updateRiskSettings('atrStopMultiplier', parseFloat(e.target.value) || 2.0)}
                          step="0.1"
                          min="0.1"
                          max="10.0"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Take Profit ATR Multiplier</Label>
                        <Input
                          type="number"
                          value={riskSettings.atrTpMultiplier || 4.0}
                          onChange={(e) => updateRiskSettings('atrTpMultiplier', parseFloat(e.target.value) || 4.0)}
                          step="0.1"
                          min="0.1"
                          max="20.0"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scaling & Martingale */}
            <TabsContent value="scaling" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Scaling & Martingale Systems
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Advanced position scaling methods with built-in guardrails
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.scaling || false}
                      onCheckedChange={(checked) => updateMoneyManagement('scaling', checked)}
                    />
                    <Label>Enable Position Scaling</Label>
                  </div>

                  {settings.scaling && (
                    <Card className="border-dashed bg-blue-50">
                      <CardContent className="pt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Scaling Method</Label>
                            <Select
                              value={settings.scalingMethod || 'winners_only'}
                              onValueChange={(value) => updateMoneyManagement('scalingMethod', value)}
                            >
                              <SelectTrigger className="mt-2">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="winners_only">Scale After Winners Only</SelectItem>
                                <SelectItem value="linear_progression">Linear Progression</SelectItem>
                                <SelectItem value="performance_based">Performance Based</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Scale Factor</Label>
                              <Input
                                type="number"
                                value={settings.scaleFactor || 1.2}
                                onChange={(e) => updateMoneyManagement('scaleFactor', parseFloat(e.target.value) || 1.2)}
                                step="0.1"
                                min="1.0"
                                max="3.0"
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Max Scale Level</Label>
                              <Input
                                type="number"
                                value={settings.maxScaleLevel || 3}
                                onChange={(e) => updateMoneyManagement('maxScaleLevel', parseInt(e.target.value) || 3)}
                                min="1"
                                max="10"
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Separator />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={settings.martingale || false}
                          onCheckedChange={(checked) => updateMoneyManagement('martingale', checked)}
                        />
                        <Label>Enable Martingale</Label>
                      </div>
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        High Risk
                      </Badge>
                    </div>

                    {settings.martingale && (
                      <Card className="border-destructive bg-red-50">
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div className="p-3 bg-red-100 border border-red-200 rounded-md">
                              <div className="flex items-center gap-2 text-red-800 font-medium text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                Martingale Guardrails Active
                              </div>
                              <p className="text-red-700 text-xs mt-1">
                                Built-in safety limits prevent catastrophic losses
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Martingale Multiplier</Label>
                                <Input
                                  type="number"
                                  value={settings.martingaleMultiplier || 2.0}
                                  onChange={(e) => updateMoneyManagement('martingaleMultiplier', parseFloat(e.target.value) || 2.0)}
                                  step="0.1"
                                  min="1.1"
                                  max="3.0"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Max Martingale Steps</Label>
                                <Input
                                  type="number"
                                  value={settings.maxMartingaleSteps || 3}
                                  onChange={(e) => updateMoneyManagement('maxMartingaleSteps', parseInt(e.target.value) || 3)}
                                  min="1"
                                  max="5"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Max Risk Per Cycle (%)</Label>
                                <Input
                                  type="number"
                                  value={settings.maxMartingaleRisk || 10.0}
                                  onChange={(e) => updateMoneyManagement('maxMartingaleRisk', parseFloat(e.target.value) || 10.0)}
                                  step="0.5"
                                  min="1.0"
                                  max="20.0"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Reset After Wins</Label>
                                <Input
                                  type="number"
                                  value={settings.martingaleResetWins || 1}
                                  onChange={(e) => updateMoneyManagement('martingaleResetWins', parseInt(e.target.value) || 1)}
                                  min="1"
                                  max="5"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Position Size Calculator */}
            <TabsContent value="calculator" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Position Size Calculator
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Real-time position size calculations based on your settings
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4">
                        <h3 className="font-medium mb-3">Current Settings</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Method:</span>
                            <span className="font-medium">{settings.method.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Per Trade:</span>
                            <span className="font-medium">{riskSettings.riskPerTrade || 2.0}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Account Size:</span>
                            <span className="font-medium">$100,000</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Risk Amount:</span>
                            <span className="font-medium">${(100000 * (riskSettings.riskPerTrade || 2.0) / 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="pt-4">
                        <h3 className="font-medium mb-3">Calculated Position Size</h3>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600 mb-2">
                            {calculatePositionSize()} lots
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Based on 50-point stop loss
                          </p>
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Standard Lots:</span>
                            <span className="font-medium">{(parseFloat(calculatePositionSize()) / 1).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mini Lots:</span>
                            <span className="font-medium">{(parseFloat(calculatePositionSize()) * 10).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Micro Lots:</span>
                            <span className="font-medium">{(parseFloat(calculatePositionSize()) * 100).toFixed(2)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-dashed">
                    <CardContent className="pt-4">
                      <h3 className="font-medium mb-3">Position Size Scenarios</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Stop Loss (Points)</th>
                              <th className="text-left p-2">Position Size (Lots)</th>
                              <th className="text-left p-2">Risk Amount ($)</th>
                              <th className="text-left p-2">Potential Loss</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[25, 50, 75, 100, 150].map(stopLoss => {
                              const risk = (100000 * (riskSettings.riskPerTrade || 2.0) / 100);
                              const positionSize = (risk / stopLoss);
                              return (
                                <tr key={stopLoss} className="border-b">
                                  <td className="p-2">{stopLoss}</td>
                                  <td className="p-2 font-medium">{positionSize.toFixed(2)}</td>
                                  <td className="p-2">${risk.toFixed(2)}</td>
                                  <td className="p-2 text-red-600">-${risk.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};