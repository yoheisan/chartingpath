import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from '@/hooks/useUserProfile';
import { PineScriptEngine } from './PineScriptEngine';
import { Code, Play, Save, FileText, Lightbulb } from 'lucide-react';

interface Strategy {
  id?: string;
  name: string;
  description: string;
  strategy_code: string;
  strategy_type: 'custom' | 'template';
  is_active: boolean;
}

interface StrategyEditorProps {
  strategy?: Strategy;
  onSave?: (strategy: Strategy) => void;
  onCancel?: () => void;
}

const STRATEGY_TEMPLATES = [
  {
    name: "MACD Golden Cross",
    category: "MACD",
    entry: "MACD line crosses above signal line with bullish trend confirmation",
    difficulty: "Beginner",
    successRate: "65%",
    riskReward: "1:2"
  },
  {
    name: "RSI Mean Reversion",
    category: "RSI",
    entry: "RSI crosses back from oversold (30) with volume confirmation",
    difficulty: "Intermediate",
    successRate: "58%",
    riskReward: "1:1.8"
  },
  {
    name: "Bollinger Band Squeeze",
    category: "Bollinger Bands",
    entry: "Low volatility squeeze followed by breakout with volume",
    difficulty: "Advanced",
    successRate: "72%",
    riskReward: "1:3"
  }
];

export const StrategyEditor = ({ strategy, onSave, onCancel }: StrategyEditorProps) => {
  const { user } = useUserProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Strategy>({
    name: strategy?.name || '',
    description: strategy?.description || '',
    strategy_code: strategy?.strategy_code || '',
    strategy_type: strategy?.strategy_type || 'custom',
    is_active: strategy?.is_active || false,
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (templateName: string) => {
    const template = STRATEGY_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      const generatedCode = PineScriptEngine.generateStrategyVersion(template);
      setFormData(prev => ({
        ...prev,
        name: template.name,
        description: `${template.entry} - ${template.difficulty} level strategy with ${template.successRate} success rate.`,
        strategy_code: generatedCode,
        strategy_type: 'template'
      }));
      setSelectedTemplate(templateName);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.name.trim() || !formData.strategy_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Strategy name and code are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (strategy?.id) {
        // Update existing strategy
        const { error } = await supabase
          .from('user_strategies')
          .update({
            name: formData.name,
            description: formData.description,
            strategy_code: formData.strategy_code,
            strategy_type: formData.strategy_type,
            is_active: formData.is_active,
          })
          .eq('id', strategy.id);

        if (error) throw error;
        
        toast({
          title: "Strategy Updated",
          description: `${formData.name} has been updated successfully`,
        });
      } else {
        // Create new strategy
        const { error } = await supabase
          .from('user_strategies')
          .insert({
            user_id: user.id,
            name: formData.name,
            description: formData.description,
            strategy_code: formData.strategy_code,
            strategy_type: formData.strategy_type,
            is_active: formData.is_active,
          });

        if (error) throw error;
        
        toast({
          title: "Strategy Created",
          description: `${formData.name} has been created successfully`,
        });
      }

      onSave?.(formData);
    } catch (error) {
      console.error('Error saving strategy:', error);
      toast({
        title: "Error",
        description: "Failed to save strategy",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTest = () => {
    // TODO: Implement strategy testing/validation
    toast({
      title: "Strategy Test",
      description: "Strategy syntax validation coming soon",
    });
  };

  return (
    <div className="space-y-6">
      {/* Strategy Templates */}
      {!strategy?.id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Strategy Templates
            </CardTitle>
            <CardDescription>
              Start with a proven strategy template or create your own from scratch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {STRATEGY_TEMPLATES.map((template) => (
                <Card 
                  key={template.name}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedTemplate === template.name ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTemplateSelect(template.name)}
                >
                  <CardContent className="p-4">
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{template.category}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Success Rate:</span>
                        <span className="font-medium">{template.successRate}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Risk:Reward:</span>
                        <span className="font-medium">{template.riskReward}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategy Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {strategy?.id ? 'Edit Strategy' : 'Create Strategy'}
          </CardTitle>
          <CardDescription>
            {strategy?.id ? 'Modify your existing strategy' : 'Build your algorithmic trading strategy'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Strategy Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Trading Strategy"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Strategy Type</Label>
              <Select 
                value={formData.strategy_type} 
                onValueChange={(value: 'custom' | 'template') => 
                  setFormData(prev => ({ ...prev, strategy_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom Strategy</SelectItem>
                  <SelectItem value="template">Template Based</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your strategy logic and conditions..."
              rows={3}
            />
          </div>

          {/* Strategy Code */}
          <div className="space-y-2">
            <Label htmlFor="code">PineScript Code</Label>
            <Textarea
              id="code"
              value={formData.strategy_code}
              onChange={(e) => setFormData(prev => ({ ...prev, strategy_code: e.target.value }))}
              placeholder="//@version=6&#10;strategy(&quot;My Strategy&quot;, overlay=true)&#10;&#10;// Your strategy logic here..."
              className="font-mono text-sm min-h-[300px]"
            />
            <p className="text-xs text-muted-foreground">
              Write your strategy in PineScript v6 format. Include entry/exit conditions and risk management.
            </p>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="active">Activate strategy for live trading</Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : strategy?.id ? 'Update Strategy' : 'Create Strategy'}
            </Button>
            
            <Button variant="outline" onClick={handleTest}>
              <Play className="h-4 w-4 mr-2" />
              Test Strategy
            </Button>
            
            {onCancel && (
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};