import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  RotateCcw, 
  Save, 
  TrendingUp, 
  Shield, 
  Target,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PatternRules {
  entry: string;
  stopLoss: string;
  target: string;
}

interface PatternRulesEditorProps {
  patternName: string;
  patternId: string;
  defaultRules: PatternRules;
  customRules?: PatternRules;
  onRulesChange: (rules: PatternRules) => void;
}

export const PatternRulesEditor: React.FC<PatternRulesEditorProps> = ({
  patternName,
  patternId,
  defaultRules,
  customRules,
  onRulesChange
}) => {
  const [rules, setRules] = useState<PatternRules>(customRules || defaultRules);
  const [aiRequest, setAiRequest] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'entry' | 'stopLoss' | 'target'>('entry');

  const handleAiAssist = async (ruleType: 'entry' | 'stopLoss' | 'target') => {
    if (!aiRequest.trim()) {
      toast.error('Please describe how you want to modify the rule');
      return;
    }

    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pattern-rules-assistant', {
        body: {
          patternName,
          currentRules: rules[ruleType],
          userRequest: aiRequest,
          ruleType: ruleType === 'entry' ? 'Entry Rule' : ruleType === 'stopLoss' ? 'Stop Loss Rule' : 'Target Rule'
        }
      });

      if (error) throw error;

      const updatedRules = { ...rules, [ruleType]: data.improvedRule };
      setRules(updatedRules);
      onRulesChange(updatedRules);
      setAiRequest('');
      toast.success('Rule updated with AI assistance!');
    } catch (error) {
      console.error('AI assist error:', error);
      toast.error('Failed to get AI assistance. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRuleChange = (ruleType: 'entry' | 'stopLoss' | 'target', value: string) => {
    const updatedRules = { ...rules, [ruleType]: value };
    setRules(updatedRules);
    onRulesChange(updatedRules);
  };

  const handleReset = (ruleType: 'entry' | 'stopLoss' | 'target') => {
    const updatedRules = { ...rules, [ruleType]: defaultRules[ruleType] };
    setRules(updatedRules);
    onRulesChange(updatedRules);
    toast.success('Rule reset to default');
  };

  const isModified = (ruleType: 'entry' | 'stopLoss' | 'target') => {
    return rules[ruleType] !== defaultRules[ruleType];
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Professional Entry & Exit Rules
          <Badge variant="outline" className="ml-auto">
            {patternName}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            These rules are based on professional trading methodologies. Use AI assistance to customize them for your strategy.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entry" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Entry
              {isModified('entry') && <div className="w-2 h-2 rounded-full bg-primary" />}
            </TabsTrigger>
            <TabsTrigger value="stopLoss" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Stop Loss
              {isModified('stopLoss') && <div className="w-2 h-2 rounded-full bg-primary" />}
            </TabsTrigger>
            <TabsTrigger value="target" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Target
              {isModified('target') && <div className="w-2 h-2 rounded-full bg-primary" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Entry Rule</Label>
                {isModified('entry') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('entry')}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset to Default
                  </Button>
                )}
              </div>
              <Textarea
                value={rules.entry}
                onChange={(e) => handleRuleChange('entry', e.target.value)}
                className="min-h-[100px] font-mono text-sm"
                placeholder="Enter your entry rule..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Assistant
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  placeholder="e.g., 'Add volume confirmation' or 'Make more conservative'"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiAssist('entry');
                    }
                  }}
                />
                <Button
                  onClick={() => handleAiAssist('entry')}
                  disabled={isAiLoading || !aiRequest.trim()}
                  className="shrink-0"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="stopLoss" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Stop Loss Rule</Label>
                {isModified('stopLoss') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('stopLoss')}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset to Default
                  </Button>
                )}
              </div>
              <Textarea
                value={rules.stopLoss}
                onChange={(e) => handleRuleChange('stopLoss', e.target.value)}
                className="min-h-[100px] font-mono text-sm"
                placeholder="Enter your stop loss rule..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Assistant
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  placeholder="e.g., 'Tighten stop loss' or 'Add trailing stop'"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiAssist('stopLoss');
                    }
                  }}
                />
                <Button
                  onClick={() => handleAiAssist('stopLoss')}
                  disabled={isAiLoading || !aiRequest.trim()}
                  className="shrink-0"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="target" className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Target Rule</Label>
                {isModified('target') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReset('target')}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset to Default
                  </Button>
                )}
              </div>
              <Textarea
                value={rules.target}
                onChange={(e) => handleRuleChange('target', e.target.value)}
                className="min-h-[100px] font-mono text-sm"
                placeholder="Enter your target rule..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                AI Assistant
              </Label>
              <div className="flex gap-2">
                <Input
                  value={aiRequest}
                  onChange={(e) => setAiRequest(e.target.value)}
                  placeholder="e.g., 'Use measured move' or 'Add multiple targets'"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiAssist('target');
                    }
                  }}
                />
                <Button
                  onClick={() => handleAiAssist('target')}
                  disabled={isAiLoading || !aiRequest.trim()}
                  className="shrink-0"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Improving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Improve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
