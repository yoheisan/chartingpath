import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Filter
} from 'lucide-react';

const OPERATORS = [
  { id: 'crosses_above', label: 'Crosses Above', description: 'When indicator A crosses above indicator B', icon: ArrowUp },
  { id: 'crosses_below', label: 'Crosses Below', description: 'When indicator A crosses below indicator B', icon: ArrowDown },
  { id: 'greater_than', label: 'Greater Than', description: 'When indicator A is greater than indicator B' },
  { id: 'less_than', label: 'Less Than', description: 'When indicator A is less than indicator B' },
  { id: 'equals', label: 'Equals', description: 'When indicator A equals indicator B (within tolerance)' },
  { id: 'slope_up', label: 'Slope Up', description: 'When indicator has positive slope' },
  { id: 'slope_down', label: 'Slope Down', description: 'When indicator has negative slope' },
  { id: 'distance_atr', label: 'Distance in ATR', description: 'Distance between indicators in ATR units' }
];

const LOGIC_OPERATORS = [
  { id: 'and', label: 'AND', description: 'All conditions must be true' },
  { id: 'or', label: 'OR', description: 'Any condition can be true' }
];

const TIMEFRAMES = [
  { id: 'current', label: 'Current Timeframe' },
  { id: 'M1', label: '1 Minute' },
  { id: 'M5', label: '5 Minutes' },
  { id: 'M15', label: '15 Minutes' },
  { id: 'M30', label: '30 Minutes' },
  { id: 'H1', label: '1 Hour' },
  { id: 'H4', label: '4 Hours' },
  { id: 'D1', label: 'Daily' },
  { id: 'W1', label: 'Weekly' }
];

interface SignalBuilderProps {
  indicators: any[];
  signals: any[];
  onChange: (signals: any[]) => void;
}

export const SignalBuilder: React.FC<SignalBuilderProps> = ({
  indicators,
  signals,
  onChange
}) => {
  const [draggedSignal, setDraggedSignal] = useState<string | null>(null);

  const createNewSignal = (type: 'entry' | 'exit') => {
    if (indicators.length < 2) return;

    const newSignal = {
      id: `signal_${Date.now()}`,
      type,
      direction: 'long' as 'long' | 'short',
      conditions: [{
        id: `condition_${Date.now()}`,
        leftIndicator: indicators[0].id,
        operator: 'crosses_above',
        rightIndicator: indicators[1].id,
        timeframe: 'current',
        enabled: true,
        weight: 1.0
      }],
      logicOperator: 'and',
      enabled: true,
      name: `${type} Signal ${signals.filter(s => s.type === type).length + 1}`,
      preview: false,
      mtfEnabled: false
    };

    onChange([...signals, newSignal]);
  };

  const removeSignal = (signalId: string) => {
    onChange(signals.filter(s => s.id !== signalId));
  };

  const duplicateSignal = (signal: any) => {
    const duplicated = {
      ...signal,
      id: `signal_${Date.now()}`,
      name: `${signal.name} (Copy)`,
      conditions: signal.conditions.map((c: any) => ({
        ...c,
        id: `condition_${Date.now() + Math.random()}`
      }))
    };
    onChange([...signals, duplicated]);
  };

  const updateSignal = (signalId: string, field: string, value: any) => {
    onChange(signals.map(signal =>
      signal.id === signalId ? { ...signal, [field]: value } : signal
    ));
  };

  const addConditionToSignal = (signalId: string) => {
    if (indicators.length < 2) return;

    const newCondition = {
      id: `condition_${Date.now()}`,
      leftIndicator: indicators[0].id,
      operator: 'crosses_above',
      rightIndicator: indicators[1].id,
      timeframe: 'current',
      enabled: true,
      weight: 1.0
    };

    onChange(signals.map(signal =>
      signal.id === signalId
        ? { ...signal, conditions: [...signal.conditions, newCondition] }
        : signal
    ));
  };

  const removeConditionFromSignal = (signalId: string, conditionId: string) => {
    onChange(signals.map(signal =>
      signal.id === signalId
        ? { ...signal, conditions: signal.conditions.filter((c: any) => c.id !== conditionId) }
        : signal
    ));
  };

  const updateCondition = (signalId: string, conditionId: string, field: string, value: any) => {
    onChange(signals.map(signal =>
      signal.id === signalId
        ? {
            ...signal,
            conditions: signal.conditions.map((c: any) =>
              c.id === conditionId ? { ...c, [field]: value } : c
            )
          }
        : signal
    ));
  };

  const getIndicatorOptions = () => {
    return indicators
      .filter(i => i.enabled)
      .map(indicator => ({
        value: indicator.id,
        label: indicator.name,
        category: indicator.category
      }));
  };

  const getIndicatorDisplayName = (indicatorId: string) => {
    const indicator = indicators.find(i => i.id === indicatorId);
    return indicator ? indicator.name : 'Unknown Indicator';
  };

  const getSignalPreview = (signal: any) => {
    // Simulate last-bar result for preview
    return Math.random() > 0.5 ? 'True' : 'False';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Professional Signal Builder
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Build entry and exit signals with drag-and-drop logic, multi-timeframe conditions, and live preview
          </p>
        </CardHeader>
        <CardContent>
          {/* Quick Actions */}
          <div className="flex gap-2 mb-6">
            <Button
              onClick={() => createNewSignal('entry')}
              disabled={indicators.length < 2}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Entry Signal
            </Button>
            <Button
              onClick={() => createNewSignal('exit')}
              disabled={indicators.length < 2}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Exit Signal
            </Button>
            {indicators.length < 2 && (
              <Badge variant="destructive" className="ml-2">
                Need 2+ indicators
              </Badge>
            )}
          </div>

          {/* Signals List */}
          {signals.length > 0 && (
            <div className="space-y-4">
              {signals.map(signal => (
                <Card 
                  key={signal.id} 
                  className={`border-l-4 ${
                    signal.type === 'entry' 
                      ? signal.direction === 'long' ? 'border-l-green-500' : 'border-l-red-500'
                      : 'border-l-orange-500'
                  } ${draggedSignal === signal.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={() => setDraggedSignal(signal.id)}
                  onDragEnd={() => setDraggedSignal(null)}
                >
                  <CardContent className="pt-4">
                    {/* Signal Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={signal.type === 'entry' ? 'default' : 'secondary'}>
                            {signal.type}
                          </Badge>
                          <Badge 
                            variant={signal.direction === 'long' ? 'default' : 'destructive'}
                            className={signal.direction === 'long' ? 'bg-green-500' : 'bg-red-500'}
                          >
                            {signal.direction}
                          </Badge>
                          {signal.mtfEnabled && (
                            <Badge variant="outline" className="text-xs">
                              MTF
                            </Badge>
                          )}
                        </div>
                        <Input
                          value={signal.name}
                          onChange={(e) => updateSignal(signal.id, 'name', e.target.value)}
                          className="font-medium border-none bg-transparent p-0 h-auto focus-visible:ring-0"
                        />
                        {signal.preview && (
                          <Badge 
                            variant={getSignalPreview(signal) === 'True' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {getSignalPreview(signal)}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSignal(signal.id, 'preview', !signal.preview)}
                          title="Toggle Preview"
                        >
                          {signal.preview ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicateSignal(signal)}
                          title="Duplicate Signal"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSignal(signal.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Signal Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div>
                        <Label className="text-xs">Signal Type</Label>
                        <Select
                          value={signal.type}
                          onValueChange={(value) => updateSignal(signal.id, 'type', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entry">Entry</SelectItem>
                            <SelectItem value="exit">Exit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Direction</Label>
                        <Select
                          value={signal.direction}
                          onValueChange={(value) => updateSignal(signal.id, 'direction', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long</SelectItem>
                            <SelectItem value="short">Short</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-xs">Logic Operator</Label>
                        <Select
                          value={signal.logicOperator}
                          onValueChange={(value) => updateSignal(signal.id, 'logicOperator', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LOGIC_OPERATORS.map(op => (
                              <SelectItem key={op.id} value={op.id}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Conditions */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">
                          Conditions ({signal.conditions.length})
                        </Label>
                        <Button
                          onClick={() => addConditionToSignal(signal.id)}
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Condition
                        </Button>
                      </div>

                      {signal.conditions.map((condition: any, index: number) => (
                        <div key={condition.id}>
                          {index > 0 && (
                            <div className="flex items-center justify-center py-2">
                              <Badge variant="outline" className="text-xs">
                                {signal.logicOperator.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                          
                          <Card className="border-dashed">
                            <CardContent className="pt-3">
                              <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                {/* Left Indicator */}
                                <div>
                                  <Label className="text-xs">When</Label>
                                  <Select
                                    value={condition.leftIndicator}
                                    onValueChange={(value) => updateCondition(signal.id, condition.id, 'leftIndicator', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getIndicatorOptions().map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          <div className="flex items-center gap-2">
                                            <span>{option.label}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {option.category}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="price">Price</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="close">Close</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Operator */}
                                <div>
                                  <Label className="text-xs">Condition</Label>
                                  <Select
                                    value={condition.operator}
                                    onValueChange={(value) => updateCondition(signal.id, condition.id, 'operator', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {OPERATORS.map(op => (
                                        <SelectItem key={op.id} value={op.id}>
                                          <div className="flex items-center gap-2">
                                            {op.icon && <op.icon className="w-3 h-3" />}
                                            {op.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Right Indicator */}
                                <div>
                                  <Label className="text-xs">Than</Label>
                                  <Select
                                    value={condition.rightIndicator}
                                    onValueChange={(value) => updateCondition(signal.id, condition.id, 'rightIndicator', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getIndicatorOptions().map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                          <div className="flex items-center gap-2">
                                            <span>{option.label}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {option.category}
                                            </Badge>
                                          </div>
                                        </SelectItem>
                                      ))}
                                      <SelectItem value="price">Price</SelectItem>
                                      <SelectItem value="high">High</SelectItem>
                                      <SelectItem value="low">Low</SelectItem>
                                      <SelectItem value="close">Close</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Timeframe */}
                                <div>
                                  <Label className="text-xs">Timeframe</Label>
                                  <Select
                                    value={condition.timeframe}
                                    onValueChange={(value) => updateCondition(signal.id, condition.id, 'timeframe', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIMEFRAMES.map(tf => (
                                        <SelectItem key={tf.id} value={tf.id}>
                                          {tf.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Weight */}
                                <div>
                                  <Label className="text-xs">Weight</Label>
                                  <Input
                                    type="number"
                                    value={condition.weight}
                                    onChange={(e) => updateCondition(signal.id, condition.id, 'weight', parseFloat(e.target.value) || 1.0)}
                                    min="0.1"
                                    max="10"
                                    step="0.1"
                                  />
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => updateCondition(signal.id, condition.id, 'enabled', !condition.enabled)}
                                    className={condition.enabled ? 'text-green-600' : 'text-muted-foreground'}
                                  >
                                    {condition.enabled ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeConditionFromSignal(signal.id, condition.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Condition Preview */}
                              <div className="mt-2 text-xs text-muted-foreground">
                                {getIndicatorDisplayName(condition.leftIndicator)} {' '}
                                {OPERATORS.find(op => op.id === condition.operator)?.label.toLowerCase()} {' '}
                                {getIndicatorDisplayName(condition.rightIndicator)}
                                {condition.timeframe !== 'current' && ` (${TIMEFRAMES.find(tf => tf.id === condition.timeframe)?.label})`}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>

                    {/* Signal Controls */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={signal.enabled}
                            onCheckedChange={(checked) => updateSignal(signal.id, 'enabled', checked)}
                          />
                          <Label className="text-xs">Enabled</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={signal.mtfEnabled}
                            onCheckedChange={(checked) => updateSignal(signal.id, 'mtfEnabled', checked)}
                          />
                          <Label className="text-xs">Multi-Timeframe</Label>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {signal.conditions.filter((c: any) => c.enabled).length} of {signal.conditions.length} conditions active
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {signals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No signals created yet</p>
              <p className="text-sm">Add entry and exit signals to define your trading logic</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};