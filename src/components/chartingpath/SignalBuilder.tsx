import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Plus, 
  Trash2, 
  Zap, 
  ArrowUp, 
  ArrowDown, 
  Shuffle,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Copy,
  Filter,
  MoreVertical,
  Settings,
  AlertCircle,
  Save
} from 'lucide-react';

const OPERATORS = [
  { value: 'above', label: 'Above' },
  { value: 'below', label: 'Below' },
  { value: 'equal', label: 'Above or Equal' },
  { value: 'crosses_above', label: 'Cross Above' },
  { value: 'crosses_below', label: 'Cross Below' },
  { value: 'greater_than', label: 'Greater Than' },
  { value: 'less_than', label: 'Less Than' }
];

const TIMEFRAMES = ['Current', 'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN1'];

const ORDER_TYPES = [
  { value: 'market', label: 'Market Order' },
  { value: 'limit', label: 'Limit Order' },
  { value: 'stop', label: 'Stop Order' },
  { value: 'pending', label: 'Pending Order' }
];

const INDICATOR_OPTIONS = [
  'Open | S1', 'Open | S0', 'Close | S1', 'Close | S0', 'High | S1', 'Low | S1',
  'MA | Daily 200', 'MA20', 'MA200', 'MA5', 'MA50', 'RSI', 'RSI15', 'MACD',
  'Bands | Lower | S0', 'Bands | Main | S0', 'Bands | Main | S1', 'SAR', 'AO',
  'Envelopes', 'Stochastic', 'ADX', 'CCI', 'ATR', 'StdDev'
];

interface Signal {
  id: string;
  name: string;
  type: 'entry' | 'exit';
  direction: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop' | 'pending';
  conditionGroups: ConditionGroup[];
  enabled: boolean;
  description?: string;
}

interface ConditionGroup {
  id: string;
  logic: 'ANY' | 'ALL';
  conditions: SignalCondition[];
}

interface SignalCondition {
  id: string;
  indicatorA: string;
  indicatorATimeframe?: string;
  operator: 'above' | 'below' | 'equal' | 'crosses_above' | 'crosses_below' | 'greater_than' | 'less_than';
  indicatorB: string;
  indicatorBTimeframe?: string;
  value?: number;
  enabled: boolean;
}

interface SignalBuilderProps {
  indicators: any[];
  signals: Signal[];
  onChange: (signals: Signal[]) => void;
}

export const SignalBuilder: React.FC<SignalBuilderProps> = ({ 
  indicators, 
  signals, 
  onChange 
}) => {
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  const addSignal = (type: 'entry' | 'exit', direction: 'buy' | 'sell') => {
    const newSignal: Signal = {
      id: Date.now().toString(),
      name: `${direction === 'buy' ? 'Open' : 'Close'} ${direction === 'buy' ? 'Buy' : direction === 'sell' ? 'Sell' : ''}`,
      type,
      direction,
      orderType: 'market',
      conditionGroups: [],
      enabled: true
    };
    onChange([...signals, newSignal]);
    setSelectedSignal(newSignal.id);
  };

  const updateSignal = (signalId: string, updates: Partial<Signal>) => {
    onChange(signals.map(signal => 
      signal.id === signalId ? { ...signal, ...updates } : signal
    ));
  };

  const addConditionGroup = (signalId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    const newGroup: ConditionGroup = {
      id: Date.now().toString(),
      logic: 'ALL',
      conditions: []
    };
    
    updateSignal(signalId, {
      conditionGroups: [...signal.conditionGroups, newGroup]
    });
  };

  const updateConditionGroup = (signalId: string, groupId: string, updates: Partial<ConditionGroup>) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    updateSignal(signalId, {
      conditionGroups: signal.conditionGroups.map(group =>
        group.id === groupId ? { ...group, ...updates } : group
      )
    });
  };

  const addCondition = (signalId: string, groupId: string) => {
    const newCondition: SignalCondition = {
      id: Date.now().toString(),
      indicatorA: '',
      operator: 'above',
      indicatorB: '',
      enabled: true
    };
    
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    updateConditionGroup(signalId, groupId, {
      conditions: [...(signal.conditionGroups.find(g => g.id === groupId)?.conditions || []), newCondition]
    });
  };

  const updateCondition = (signalId: string, groupId: string, conditionId: string, updates: Partial<SignalCondition>) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    const group = signal.conditionGroups.find(g => g.id === groupId);
    if (!group) return;

    updateConditionGroup(signalId, groupId, {
      conditions: group.conditions.map(condition =>
        condition.id === conditionId ? { ...condition, ...updates } : condition
      )
    });
  };

  const removeCondition = (signalId: string, groupId: string, conditionId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    const group = signal.conditionGroups.find(g => g.id === groupId);
    if (!group) return;

    updateConditionGroup(signalId, groupId, {
      conditions: group.conditions.filter(c => c.id !== conditionId)
    });
  };

  const removeSignal = (signalId: string) => {
    onChange(signals.filter(signal => signal.id !== signalId));
    if (selectedSignal === signalId) {
      setSelectedSignal(null);
    }
  };

  const duplicateSignal = (signalId: string) => {
    const signal = signals.find(s => s.id === signalId);
    if (!signal) return;

    const duplicated: Signal = {
      ...signal,
      id: Date.now().toString(),
      name: `${signal.name} (Copy)`,
      conditionGroups: signal.conditionGroups.map(group => ({
        ...group,
        id: Date.now().toString() + Math.random(),
        conditions: group.conditions.map(condition => ({
          ...condition,
          id: Date.now().toString() + Math.random()
        }))
      }))
    };
    
    onChange([...signals, duplicated]);
  };

  const selectedSignalData = signals.find(s => s.id === selectedSignal);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Signals
            <Badge variant="outline">{signals.length}</Badge>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Signal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="z-50 bg-card border border-border shadow-lg">
                <DropdownMenuItem onClick={() => addSignal('entry', 'buy')}>
                  Open Buy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSignal('entry', 'sell')}>
                  Open Sell
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSignal('exit', 'buy')}>
                  Close Buy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addSignal('exit', 'sell')}>
                  Close Sell
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedSignal || 'overview'} onValueChange={setSelectedSignal}>
          <TabsList className="grid w-full grid-cols-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {signals.map((signal) => (
              <TabsTrigger key={signal.id} value={signal.id} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${signal.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                {signal.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {signals.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Signals Configured</h3>
                <p className="text-sm mb-4">Create entry and exit signals to define your trading logic</p>
                <p className="text-xs">Signals determine when to open and close positions based on indicator conditions</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {signals.map((signal) => (
                  <div key={signal.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={signal.enabled}
                          onCheckedChange={(checked) => updateSignal(signal.id, { enabled: checked })}
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant={signal.type === 'entry' ? 'default' : 'secondary'}>
                            {signal.type.toUpperCase()}
                          </Badge>
                          <Badge variant={signal.direction === 'buy' ? 'default' : 'destructive'}>
                            {signal.direction.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="font-medium">{signal.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSignal(signal.id)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="z-50 bg-card border border-border shadow-lg">
                            <DropdownMenuItem onClick={() => duplicateSignal(signal.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => removeSignal(signal.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {signal.conditionGroups.length === 0 
                        ? 'No conditions configured'
                        : `${signal.conditionGroups.length} condition group(s) with ${signal.conditionGroups.reduce((acc, group) => acc + group.conditions.length, 0)} total conditions`
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {signals.map((signal) => (
            <TabsContent key={signal.id} value={signal.id} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{signal.name}</h3>
                  <p className="text-sm text-muted-foreground">Configure signal conditions and behavior</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`enabled-${signal.id}`}>Enabled</Label>
                    <Switch
                      id={`enabled-${signal.id}`}
                      checked={signal.enabled}
                      onCheckedChange={(checked) => updateSignal(signal.id, { enabled: checked })}
                    />
                  </div>
                  <Select
                    value={signal.orderType}
                    onValueChange={(value) => updateSignal(signal.id, { orderType: value as any })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-card border border-border shadow-lg">
                      {ORDER_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => {
                      // Save signal logic would go here
                      console.log('Saving signal:', signal);
                    }}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Condition Groups</h4>
                  <Button 
                    size="sm" 
                    onClick={() => addConditionGroup(signal.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Group
                  </Button>
                </div>

                {signal.conditionGroups.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No condition groups</p>
                    <p className="text-sm text-muted-foreground">Add a condition group to start building signal logic</p>
                  </div>
                ) : (
                  signal.conditionGroups.map((group, groupIndex) => (
                    <div key={group.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Select
                            value={group.logic}
                            onValueChange={(value: 'ANY' | 'ALL') => 
                              updateConditionGroup(signal.id, group.id, { logic: value })
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-card border border-border shadow-lg">
                              <SelectItem value="ALL">ALL</SelectItem>
                              <SelectItem value="ANY">ANY</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-muted-foreground">
                            of the following are met
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addCondition(signal.id, group.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Condition
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              updateSignal(signal.id, {
                                conditionGroups: signal.conditionGroups.filter(g => g.id !== group.id)
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {group.conditions.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No conditions in this group
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {group.conditions.map((condition, conditionIndex) => (
                            <div key={condition.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                              <Switch
                                checked={condition.enabled}
                                onCheckedChange={(checked) => 
                                  updateCondition(signal.id, group.id, condition.id, { enabled: checked })
                                }
                              />
                              
                              <Select
                                value={condition.indicatorA}
                                onValueChange={(value) => 
                                  updateCondition(signal.id, group.id, condition.id, { indicatorA: value })
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select indicator" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-card border border-border shadow-lg max-h-60 overflow-y-auto">
                                  {INDICATOR_OPTIONS.map(indicator => (
                                    <SelectItem key={indicator} value={indicator}>
                                      {indicator}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={condition.operator}
                                onValueChange={(value) => 
                                  updateCondition(signal.id, group.id, condition.id, { operator: value as any })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-card border border-border shadow-lg">
                                  {OPERATORS.map(op => (
                                    <SelectItem key={op.value} value={op.value}>
                                      {op.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={condition.indicatorB}
                                onValueChange={(value) => 
                                  updateCondition(signal.id, group.id, condition.id, { indicatorB: value })
                                }
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue placeholder="Select value/indicator" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-card border border-border shadow-lg max-h-60 overflow-y-auto">
                                  {INDICATOR_OPTIONS.map(indicator => (
                                    <SelectItem key={indicator} value={indicator}>
                                      {indicator}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="30">30</SelectItem>
                                  <SelectItem value="70">70</SelectItem>
                                  <SelectItem value="0">0</SelectItem>
                                </SelectContent>
                              </Select>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCondition(signal.id, group.id, condition.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};