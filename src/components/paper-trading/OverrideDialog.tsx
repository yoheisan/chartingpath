import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperTrade, OVERRIDE_REASONS } from '@/hooks/usePaperTrading';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: PaperTrade | null;
  onConfirm: (trade: PaperTrade, reason: string, notes: string) => void;
  submitting: boolean;
}

export function OverrideDialog({ open, onOpenChange, trade, onConfirm, submitting }: OverrideDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!trade || !selectedReason) return;
    onConfirm(trade, selectedReason, notes);
    setSelectedReason(null);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pull Breaker — Close Trade Early</DialogTitle>
          <DialogDescription>Override the system and close this trade before SL/TP is hit.</DialogDescription>
        </DialogHeader>

        {trade && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Symbol</span>
                <span className="font-medium">{trade.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Direction</span>
                <span className="font-medium capitalize">{trade.trade_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entry</span>
                <span className="font-medium tabular-nums">{trade.entry_price.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Why are you closing early?</p>
              <div className="grid grid-cols-2 gap-1.5">
                {OVERRIDE_REASONS.map((reason) => (
                  <Button
                    key={reason}
                    size="sm"
                    variant={selectedReason === reason ? 'default' : 'outline'}
                    className="h-8 text-xs justify-start"
                    onClick={() => setSelectedReason(reason)}
                  >
                    {reason}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1.5">Notes (optional)</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context..."
                className="h-16 text-sm resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!selectedReason || submitting}>
            {submitting ? 'Closing...' : 'Confirm Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
