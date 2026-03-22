import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Bot, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MasterPlan } from '@/hooks/useMasterPlan';
import { toast } from 'sonner';

interface PlanAlertGeneratorProps {
  userId: string;
  plans: MasterPlan[];
  onAlertsCreated: () => void;
  canCreateMore: boolean;
  remainingSlots: number;
}

interface MatchedInstrument {
  symbol: string;
  name: string;
  asset_type: string;
  exchange: string | null;
}

export function PlanAlertGenerator({
  userId,
  plans,
  onAlertsCreated,
  canCreateMore,
  remainingSlots,
}: PlanAlertGeneratorProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [matchedInstruments, setMatchedInstruments] = useState<MatchedInstrument[]>([]);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [timeframe, setTimeframe] = useState('1h');
  const [autoPaperTrade, setAutoPaperTrade] = useState(true);
  const [riskPercent, setRiskPercent] = useState(1.0);

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  // When plan changes, fetch matching instruments
  useEffect(() => {
    if (selectedPlan) {
      fetchMatchingInstruments(selectedPlan);
    }
  }, [selectedPlanId]);

  const fetchMatchingInstruments = async (plan: MasterPlan) => {
    setLoading(true);
    try {
      let query = supabase
        .from('instruments')
        .select('symbol, name, asset_type, exchange')
        .eq('is_active', true);

      // Filter by asset classes
      if (plan.asset_classes?.length > 0) {
        const assetTypeMap: Record<string, string[]> = {
          stocks: ['stock'],
          forex: ['fx'],
          crypto: ['crypto'],
          commodities: ['commodity'],
          indices: ['index'],
          etfs: ['etf'],
        };
        const dbTypes = plan.asset_classes.flatMap(ac => assetTypeMap[ac.toLowerCase()] || [ac.toLowerCase()]);
        if (dbTypes.length > 0) {
          query = query.in('asset_type', dbTypes);
        }
      }

      // Filter by exchanges
      if (plan.stock_exchanges?.length > 0) {
        query = query.in('exchange', plan.stock_exchanges);
      }

      query = query.order('symbol').limit(200);

      const { data, error } = await query;
      if (error) throw error;

      setMatchedInstruments((data as MatchedInstrument[]) || []);
      // Auto-select all up to remaining slots
      const symbols = (data || []).map((d: any) => d.symbol);
      setSelectedInstruments(symbols.slice(0, Math.min(symbols.length, remainingSlots)));
    } catch (err) {
      console.error('[PlanAlertGenerator] fetch error:', err);
      toast.error('Failed to load matching instruments');
    } finally {
      setLoading(false);
    }
  };

  const toggleInstrument = (symbol: string) => {
    setSelectedInstruments(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : prev.length < remainingSlots
          ? [...prev, symbol]
          : prev
    );
  };

  const selectAll = () => {
    setSelectedInstruments(
      matchedInstruments.map(i => i.symbol).slice(0, remainingSlots)
    );
  };

  const deselectAll = () => setSelectedInstruments([]);

  const generateAlerts = async () => {
    if (!selectedPlan || selectedInstruments.length === 0) return;

    setGenerating(true);
    let created = 0;
    let failed = 0;

    try {
      // Get the patterns from the plan
      const patterns = selectedPlan.preferred_patterns?.length > 0
        ? selectedPlan.preferred_patterns
        : ['donchian-breakout-long', 'donchian-breakout-short']; // Default patterns

      // Create alerts in batches
      for (const symbol of selectedInstruments) {
        try {
          const response = await supabase.functions.invoke('create-alert', {
            body: {
              symbol,
              patterns,
              timeframe,
              action: 'create',
              auto_paper_trade: autoPaperTrade,
              risk_percent: riskPercent,
              master_plan_id: selectedPlan.id,
            },
          });

          if (response.error) {
            failed++;
            continue;
          }

          const result = response.data;
          if (result.code === 'ALERT_LIMIT') {
            toast.error(`Alert limit reached after creating ${created} alerts`);
            break;
          }

          if (result.success) {
            created++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      if (created > 0) {
        toast.success(`Created ${created} plan-based alerts`, {
          description: failed > 0 ? `${failed} failed` : undefined,
        });
        onAlertsCreated();
      } else if (failed > 0) {
        toast.error(`Failed to create alerts (${failed} errors)`);
      }
    } finally {
      setGenerating(false);
    }
  };

  if (plans.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-5 w-5 text-primary" />
          Generate Alerts from Master Plan
        </CardTitle>
        <CardDescription>
          Auto-create alerts for all instruments matching your plan's universe and patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan selector */}
        <div className="space-y-2">
          <Label className="text-sm">Select Plan</Label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choose a plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                  {p.asset_classes?.length > 0 && (
                    <span className="ml-2 text-muted-foreground">
                      ({p.asset_classes.join(', ')})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Plan summary */}
        {selectedPlan && (
          <div className="flex flex-wrap gap-1.5">
            {selectedPlan.asset_classes?.map(ac => (
              <Badge key={ac} variant="secondary" className="text-xs">{ac}</Badge>
            ))}
            {selectedPlan.stock_exchanges?.map(ex => (
              <Badge key={ex} variant="outline" className="text-xs">{ex}</Badge>
            ))}
            {selectedPlan.preferred_patterns?.slice(0, 3).map(p => (
              <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
            ))}
            {(selectedPlan.preferred_patterns?.length || 0) > 3 && (
              <Badge variant="outline" className="text-xs">
                +{(selectedPlan.preferred_patterns?.length || 0) - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Timeframe */}
        <div className="space-y-2">
          <Label className="text-sm">Timeframe</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hour (Recommended)</SelectItem>
              <SelectItem value="15m">15 Minutes</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="8h">8 Hours</SelectItem>
              <SelectItem value="1d">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Auto paper trade */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Auto Paper Trade</Label>
            <p className="text-xs text-muted-foreground">Auto-open paper trades when triggered</p>
          </div>
          <Switch checked={autoPaperTrade} onCheckedChange={setAutoPaperTrade} />
        </div>

        {autoPaperTrade && (
          <div className="space-y-2 pl-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Risk per trade</Label>
              <span className="text-sm font-medium">{riskPercent.toFixed(1)}%</span>
            </div>
            <Slider
              value={[riskPercent]}
              onValueChange={([v]) => setRiskPercent(v)}
              min={0.5}
              max={5}
              step={0.5}
            />
          </div>
        )}

        {/* Matched instruments */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">
              Matching Instruments
              {!loading && (
                <span className="ml-1.5 text-muted-foreground font-normal">
                  ({matchedInstruments.length} found)
                </span>
              )}
            </Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={selectAll}>
                Select all
              </Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Scanning instruments...
            </div>
          ) : matchedInstruments.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-50" />
              No instruments match this plan's universe.
              <br />
              <span className="text-xs">Check your plan's asset class and exchange settings.</span>
            </div>
          ) : (
            <ScrollArea className="h-48 rounded-lg border">
              <div className="p-2 space-y-0.5">
                {matchedInstruments.map(inst => (
                  <div
                    key={inst.symbol}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedInstruments.includes(inst.symbol)}
                      onCheckedChange={() => toggleInstrument(inst.symbol)}
                      disabled={!selectedInstruments.includes(inst.symbol) && selectedInstruments.length >= remainingSlots}
                    />
                    <span className="text-sm font-medium flex-1">{inst.symbol}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">{inst.name}</span>
                    {inst.exchange && (
                      <Badge variant="outline" className="text-xs px-1 py-0">{inst.exchange}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {selectedInstruments.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              {selectedInstruments.length} selected · {remainingSlots - selectedInstruments.length} slots remaining
            </div>
          )}
        </div>

        {/* Generate button */}
        <Button
          onClick={generateAlerts}
          disabled={generating || selectedInstruments.length === 0 || !canCreateMore}
          className="w-full"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating alerts...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate {selectedInstruments.length} Plan Alerts
            </>
          )}
        </Button>

        {!canCreateMore && (
          <p className="text-xs text-destructive text-center">
            Alert limit reached. Upgrade your plan for more alert slots.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
