import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Trash2, Plus, Layers, PieChart, Target } from 'lucide-react';
import { BasketConfig } from './BasketManager';

export interface PortfolioAllocation {
  basketId: string;
  basketName: string;
  allocation: number; // Percentage of portfolio
}

export interface PortfolioConfig {
  id: string;
  name: string;
  description: string;
  allocations: PortfolioAllocation[];
  initialCapital: number;
  riskLevel: 'conservative' | 'moderate' | 'aggressive';
}

interface PortfolioManagerProps {
  portfolios: PortfolioConfig[];
  availableBaskets: BasketConfig[];
  onPortfoliosChange: (portfolios: PortfolioConfig[]) => void;
}

export const PortfolioManager: React.FC<PortfolioManagerProps> = ({
  portfolios,
  availableBaskets,
  onPortfoliosChange
}) => {
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioConfig | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const createNewPortfolio = (): PortfolioConfig => ({
    id: `portfolio_${Date.now()}`,
    name: '',
    description: '',
    allocations: [],
    initialCapital: 100000,
    riskLevel: 'moderate'
  });

  const handleCreatePortfolio = () => {
    const newPortfolio = createNewPortfolio();
    setEditingPortfolio(newPortfolio);
    setIsCreatingNew(true);
  };

  const handleSavePortfolio = () => {
    if (!editingPortfolio || !editingPortfolio.name.trim()) return;

    // Normalize allocations to sum to 100%
    const totalAllocation = editingPortfolio.allocations.reduce((sum, alloc) => sum + alloc.allocation, 0);
    if (totalAllocation > 0) {
      editingPortfolio.allocations = editingPortfolio.allocations.map(alloc => ({
        ...alloc,
        allocation: (alloc.allocation / totalAllocation) * 100
      }));
    }

    const updatedPortfolios = isCreatingNew
      ? [...portfolios, editingPortfolio]
      : portfolios.map(p => p.id === editingPortfolio.id ? editingPortfolio : p);

    onPortfoliosChange(updatedPortfolios);
    setEditingPortfolio(null);
    setIsCreatingNew(false);
  };

  const handleDeletePortfolio = (portfolioId: string) => {
    onPortfoliosChange(portfolios.filter(p => p.id !== portfolioId));
  };

  const addBasketToPortfolio = (basketId: string) => {
    if (!editingPortfolio) return;
    
    const basket = availableBaskets.find(b => b.id === basketId);
    if (!basket) return;

    // Check if basket is already added
    if (editingPortfolio.allocations.some(alloc => alloc.basketId === basketId)) {
      return;
    }

    setEditingPortfolio({
      ...editingPortfolio,
      allocations: [
        ...editingPortfolio.allocations,
        {
          basketId,
          basketName: basket.name,
          allocation: 25 // Default allocation
        }
      ]
    });
  };

  const removeBasketFromPortfolio = (basketId: string) => {
    if (!editingPortfolio) return;
    
    setEditingPortfolio({
      ...editingPortfolio,
      allocations: editingPortfolio.allocations.filter(alloc => alloc.basketId !== basketId)
    });
  };

  const updateAllocation = (basketId: string, allocation: number) => {
    if (!editingPortfolio) return;
    
    setEditingPortfolio({
      ...editingPortfolio,
      allocations: editingPortfolio.allocations.map(alloc => 
        alloc.basketId === basketId ? { ...alloc, allocation } : alloc
      )
    });
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'aggressive': return 'bg-red-100 text-red-800 hover:bg-red-100';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const totalAllocation = editingPortfolio?.allocations.reduce((sum, alloc) => sum + alloc.allocation, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Portfolio Management</h3>
        <Button onClick={handleCreatePortfolio} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Portfolio
        </Button>
      </div>

      {/* Available Baskets Info */}
      {availableBaskets.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <p className="text-amber-800 text-sm">
              No baskets available. Create some baskets first to build portfolios.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Existing Portfolios */}
      <div className="grid gap-4">
        {portfolios.map((portfolio) => (
          <Card key={portfolio.id} className="border-l-4 border-l-accent">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">{portfolio.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {portfolio.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getRiskBadgeColor(portfolio.riskLevel)}>
                      {portfolio.riskLevel}
                    </Badge>
                    <Badge variant="outline">
                      <Layers className="h-3 w-3 mr-1" />
                      {portfolio.allocations.length} baskets
                    </Badge>
                    <Badge variant="outline">
                      <Target className="h-3 w-3 mr-1" />
                      ${portfolio.initialCapital.toLocaleString()}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingPortfolio(portfolio)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeletePortfolio(portfolio.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <PieChart className="h-4 w-4" />
                  Basket Allocations
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {portfolio.allocations.map((allocation, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded">
                      <span>{allocation.basketName}</span>
                      <Badge variant="secondary">
                        {allocation.allocation.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit/Create Portfolio Modal */}
      {editingPortfolio && (
        <Card className="border-2 border-accent">
          <CardHeader>
            <CardTitle>
              {isCreatingNew ? 'Create New Portfolio' : 'Edit Portfolio'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Portfolio Name</Label>
                <Input
                  value={editingPortfolio.name}
                  onChange={(e) => setEditingPortfolio({
                    ...editingPortfolio,
                    name: e.target.value
                  })}
                  placeholder="e.g., Retirement Portfolio"
                />
              </div>

              <div className="space-y-2">
                <Label>Initial Capital ($)</Label>
                <Input
                  type="number"
                  value={editingPortfolio.initialCapital}
                  onChange={(e) => setEditingPortfolio({
                    ...editingPortfolio,
                    initialCapital: Number(e.target.value)
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={editingPortfolio.description}
                onChange={(e) => setEditingPortfolio({
                  ...editingPortfolio,
                  description: e.target.value
                })}
                placeholder="Brief description of portfolio strategy"
              />
            </div>

            <Separator />

            {/* Basket Allocations */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Basket Allocations</Label>
                <div className="text-sm">
                  Total: <span className={totalAllocation === 100 ? 'text-green-600' : 'text-amber-600'}>
                    {totalAllocation.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Available Baskets to Add */}
              {availableBaskets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Add Basket:</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableBaskets
                      .filter(basket => !editingPortfolio.allocations.some(alloc => alloc.basketId === basket.id))
                      .map(basket => (
                        <Button
                          key={basket.id}
                          variant="outline"
                          size="sm"
                          onClick={() => addBasketToPortfolio(basket.id)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          {basket.name}
                        </Button>
                      ))}
                  </div>
                </div>
              )}

              {/* Current Allocations */}
              <div className="space-y-3">
                {editingPortfolio.allocations.map((allocation, index) => (
                  <div key={allocation.basketId} className="p-3 border rounded space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{allocation.basketName}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeBasketFromPortfolio(allocation.basketId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Allocation</span>
                        <span className="font-medium">{allocation.allocation.toFixed(1)}%</span>
                      </div>
                      <Slider
                        value={[allocation.allocation]}
                        onValueChange={([value]) => updateAllocation(allocation.basketId, value)}
                        max={100}
                        min={0}
                        step={0.5}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {editingPortfolio.allocations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No baskets allocated. Add baskets to create your portfolio.
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSavePortfolio} 
                className="flex-1"
                disabled={!editingPortfolio.name.trim() || editingPortfolio.allocations.length === 0}
              >
                {isCreatingNew ? 'Create Portfolio' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingPortfolio(null);
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
