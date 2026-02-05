import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Bell, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { trackAlertCreated } from '@/services/analytics';

interface PatternInfo {
  patternId: string;
  patternName: string;
}

interface BacktestAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruments: string[];
  patterns: PatternInfo[];
  timeframe: string;
}

export function BacktestAlertDialog({
  open,
  onOpenChange,
  instruments,
  patterns,
  timeframe,
}: BacktestAlertDialogProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<Set<string>>(
    new Set(instruments)
  );
  const [selectedPatterns, setSelectedPatterns] = useState<Set<string>>(
    new Set(patterns.map(p => p.patternId))
  );

  const toggleInstrument = (instrument: string) => {
    const newSet = new Set(selectedInstruments);
    if (newSet.has(instrument)) {
      newSet.delete(instrument);
    } else {
      newSet.add(instrument);
    }
    setSelectedInstruments(newSet);
  };

  const togglePattern = (patternId: string) => {
    const newSet = new Set(selectedPatterns);
    if (newSet.has(patternId)) {
      newSet.delete(patternId);
    } else {
      newSet.add(patternId);
    }
    setSelectedPatterns(newSet);
  };

  const totalAlerts = selectedInstruments.size * selectedPatterns.size;

  const handleCreate = async () => {
    if (selectedInstruments.size === 0 || selectedPatterns.size === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one instrument and one pattern.',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Create alerts for each instrument
      for (const instrument of selectedInstruments) {
        const response = await supabase.functions.invoke('create-alert', {
          body: {
            symbol: instrument.toUpperCase(),
            patterns: Array.from(selectedPatterns),
            timeframe,
            action: 'create',
          },
        });

        if (response.error) {
          console.error(`Error creating alert for ${instrument}:`, response.error);
          errorCount++;
          continue;
        }

        const result = response.data;

        if (result.code === 'ALERT_LIMIT') {
          toast({
            title: 'Alert Limit Reached',
            description: `You've reached your ${result.max} alert limit. Upgrade to create more alerts.`,
            variant: 'destructive',
          });
          break;
        }

        if (result.success) {
          successCount += result.alerts?.length || selectedPatterns.size;
          
          // Track analytics
          selectedPatterns.forEach(p => {
            trackAlertCreated({
              symbol: instrument.toUpperCase(),
              pattern: p,
              timeframe,
              plan_tier: 'unknown',
            });
          });
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: successCount > 1 ? 'Alerts Created' : 'Alert Created',
          description: `${successCount} alert${successCount > 1 ? 's' : ''} created successfully`,
        });
        onOpenChange(false);
      } else if (errorCount > 0) {
        toast({
          title: 'Error',
          description: 'Failed to create alerts. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Create alert error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create alerts',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-emerald-500" />
            Set Up Alerts
          </DialogTitle>
          <DialogDescription>
            Get notified when these patterns form on your selected instruments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Timeframe display */}
          <div className="flex items-center gap-2">
            <Label className="text-muted-foreground">Timeframe:</Label>
            <Badge variant="secondary">{timeframe}</Badge>
          </div>

          {/* Instruments selection */}
          <div className="space-y-2">
            <Label>Instruments ({selectedInstruments.size} selected)</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {instruments.map(instrument => (
                <div key={instrument} className="flex items-center gap-2">
                  <Checkbox
                    id={`inst-${instrument}`}
                    checked={selectedInstruments.has(instrument)}
                    onCheckedChange={() => toggleInstrument(instrument)}
                  />
                  <label
                    htmlFor={`inst-${instrument}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {instrument}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Patterns selection */}
          <div className="space-y-2">
            <Label>Patterns ({selectedPatterns.size} selected)</Label>
            <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-2">
              {patterns.map(pattern => (
                <div key={pattern.patternId} className="flex items-center gap-2">
                  <Checkbox
                    id={`pat-${pattern.patternId}`}
                    checked={selectedPatterns.has(pattern.patternId)}
                    onCheckedChange={() => togglePattern(pattern.patternId)}
                  />
                  <label
                    htmlFor={`pat-${pattern.patternId}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    {pattern.patternName}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total alerts to create:</span>
              <Badge variant={totalAlerts > 0 ? 'default' : 'secondary'}>
                {totalAlerts} alert{totalAlerts !== 1 ? 's' : ''}
              </Badge>
            </div>
            {totalAlerts > 10 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-amber-500">
                <AlertTriangle className="h-3 w-3" />
                Large number of alerts may count against your plan limit
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={creating || totalAlerts === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Create {totalAlerts} Alert{totalAlerts !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BacktestAlertDialog;
