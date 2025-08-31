import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus, TrendingUp, Calendar, Percent } from 'lucide-react';

export interface BasketAsset {
  symbol: string;
  targetWeight: number;
  side: 'long' | 'short';
}

export interface BasketConfig {
  id: string;
  name: string;
  assets: BasketAsset[];
  dcaConfig: {
    enabled: boolean;
    contributionAmount: number;
    frequency: 'weekly' | 'monthly' | 'quarterly';
  };
  rebalancingConfig: {
    enabled: boolean;
    frequency: 'monthly' | 'quarterly' | 'annually' | 'drift-based';
    driftThreshold: number;
  };
}

interface BasketManagerProps {
  baskets: BasketConfig[];
  onBasketsChange: (baskets: BasketConfig[]) => void;
}

export const BasketManager: React.FC<BasketManagerProps> = ({
  baskets,
  onBasketsChange
}) => {
  const [editingBasket, setEditingBasket] = useState<BasketConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const instruments = [
    'SPY', 'QQQ', 'IWM', 'TLT', 'GLD', 'VTI', 'VXUS',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META',
    'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'
  ];

  const createNewBasket = (): BasketConfig => ({
    id: `basket_${Date.now()}`,
    name: '',
    assets: [{ symbol: 'SPY', targetWeight: 50, side: 'long' }],
    dcaConfig: {
      enabled: false,
      contributionAmount: 1000,
      frequency: 'monthly'
    },
    rebalancingConfig: {
      enabled: true,
      frequency: 'quarterly',
      driftThreshold: 5
    }
  });

  const handleCreateBasket = () => {
    const newBasket = createNewBasket();
    setEditingBasket(newBasket);
    setIsCreatingNew(true);
  };

  const handleSaveBasket = () => {
    if (!editingBasket || !editingBasket.name.trim()) return;

    const updatedBaskets = isCreatingNew
      ? [...baskets, editingBasket]
      : baskets.map(b => b.id === editingBasket.id ? editingBasket : b);

    // Normalize weights to sum to 100%
    const totalWeight = editingBasket.assets.reduce((sum, asset) => sum + Math.abs(asset.targetWeight), 0);
    if (totalWeight > 0) {
      editingBasket.assets = editingBasket.assets.map(asset => ({
        ...asset,
        targetWeight: (asset.targetWeight / totalWeight) * 100
      }));
    }

    onBasketsChange(updatedBaskets);
    setEditingBasket(null);
    setIsCreatingNew(false);
  };

  const handleDeleteBasket = (basketId: string) => {
    onBasketsChange(baskets.filter(b => b.id !== basketId));
  };

  const addAssetToBasket = () => {
    if (!editingBasket) return;
    
    setEditingBasket({
      ...editingBasket,
      assets: [
        ...editingBasket.assets,
        { symbol: 'SPY', targetWeight: 10, side: 'long' }
      ]
    });
  };

  const removeAssetFromBasket = (index: number) => {
    if (!editingBasket) return;
    
    setEditingBasket({
      ...editingBasket,
      assets: editingBasket.assets.filter((_, i) => i !== index)
    });
  };

  const updateAsset = (index: number, updates: Partial<BasketAsset>) => {
    if (!editingBasket) return;
    
    setEditingBasket({
      ...editingBasket,
      assets: editingBasket.assets.map((asset, i) => 
        i === index ? { ...asset, ...updates } : asset
      )
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Basket Management</h3>
        <Button onClick={handleCreateBasket} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Basket
        </Button>
      </div>

      {/* Existing Baskets */}
      <div className="grid gap-4">
        {baskets.map((basket) => (
          <Card key={basket.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{basket.name}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {basket.assets.length} assets
                    </Badge>
                    {basket.dcaConfig.enabled && (
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        DCA {basket.dcaConfig.frequency}
                      </Badge>
                    )}
                    {basket.rebalancingConfig.enabled && (
                      <Badge variant="secondary">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Rebal. {basket.rebalancingConfig.frequency}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingBasket(basket)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteBasket(basket.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {basket.assets.map((asset, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant={asset.side === 'long' ? 'default' : 'destructive'}>
                      {asset.symbol}
                    </Badge>
                    <span className="text-muted-foreground">
                      {asset.targetWeight.toFixed(1)}%
                    </span>
                  </div>
                ))
                }
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Basket Modal */}
      {editingBasket && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>
              {isCreatingNew ? 'Create New Basket' : 'Edit Basket'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-2">
              <Label>Basket Name</Label>
              <Input
                value={editingBasket.name}
                onChange={(e) => setEditingBasket({
                  ...editingBasket,
                  name: e.target.value
                })}
                placeholder="e.g., Conservative Portfolio, Growth Stocks"
              />
            </div>

            <Separator />

            {/* Assets Configuration */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Assets</Label>
                <Button onClick={addAssetToBasket} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Asset
                </Button>
              </div>

              {editingBasket.assets.map((asset, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 border rounded">
                  <div className="col-span-4">
                    <Select
                      value={asset.symbol}
                      onValueChange={(value) => updateAsset(index, { symbol: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {instruments.map((instrument) => (
                          <SelectItem key={instrument} value={instrument}>
                            {instrument}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Select
                      value={asset.side}
                      onValueChange={(value: 'long' | 'short') => updateAsset(index, { side: value })}
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

                  <div className="col-span-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Percent className="h-3 w-3" />
                      <span className="text-sm font-medium">
                        {asset.targetWeight.toFixed(1)}%
                      </span>
                    </div>
                    <Slider
                      value={[asset.targetWeight]}
                      onValueChange={([value]) => updateAsset(index, { targetWeight: value })}
                      max={100}
                      min={-100}
                      step={0.5}
                      className="w-full"
                    />
                  </div>

                  <div className="col-span-1">
                    <Button
                      onClick={() => removeAssetFromBasket(index)}
                      size="sm"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* DCA Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Dollar Cost Averaging</Label>
                <Switch
                  checked={editingBasket.dcaConfig.enabled}
                  onCheckedChange={(checked) => setEditingBasket({
                    ...editingBasket,
                    dcaConfig: { ...editingBasket.dcaConfig, enabled: checked }
                  })}
                />
              </div>

              {editingBasket.dcaConfig.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contribution Amount ($)</Label>
                    <Input
                      type="number"
                      value={editingBasket.dcaConfig.contributionAmount}
                      onChange={(e) => setEditingBasket({
                        ...editingBasket,
                        dcaConfig: {
                          ...editingBasket.dcaConfig,
                          contributionAmount: Number(e.target.value)
                        }
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={editingBasket.dcaConfig.frequency}
                      onValueChange={(value: 'weekly' | 'monthly' | 'quarterly') => setEditingBasket({
                        ...editingBasket,
                        dcaConfig: { ...editingBasket.dcaConfig, frequency: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Rebalancing Configuration */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Automatic Rebalancing</Label>
                <Switch
                  checked={editingBasket.rebalancingConfig.enabled}
                  onCheckedChange={(checked) => setEditingBasket({
                    ...editingBasket,
                    rebalancingConfig: { ...editingBasket.rebalancingConfig, enabled: checked }
                  })}
                />
              </div>

              {editingBasket.rebalancingConfig.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Rebalance Frequency</Label>
                    <Select
                      value={editingBasket.rebalancingConfig.frequency}
                      onValueChange={(value: 'monthly' | 'quarterly' | 'annually' | 'drift-based') => setEditingBasket({
                        ...editingBasket,
                        rebalancingConfig: { ...editingBasket.rebalancingConfig, frequency: value }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="drift-based">Drift-Based Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Drift Threshold (%)</Label>
                    <div className="space-y-2">
                      <Slider
                        value={[editingBasket.rebalancingConfig.driftThreshold]}
                        onValueChange={([value]) => setEditingBasket({
                          ...editingBasket,
                          rebalancingConfig: { ...editingBasket.rebalancingConfig, driftThreshold: value }
                        })}
                        max={20}
                        min={1}
                        step={0.5}
                        className="w-full"
                      />
                      <div className="text-sm text-muted-foreground text-center">
                        {editingBasket.rebalancingConfig.driftThreshold}%
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveBasket} className="flex-1">
                {isCreatingNew ? 'Create Basket' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingBasket(null);
                  setIsCreatingNew(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
