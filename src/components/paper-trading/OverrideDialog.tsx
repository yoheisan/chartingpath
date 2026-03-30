import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PaperTrade, OVERRIDE_REASONS } from '@/hooks/usePaperTrading';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: PaperTrade | null;
  onConfirm: (trade: PaperTrade, reason: string, notes: string, manualPrice?: number) => void;
  submitting: boolean;
}

export function OverrideDialog({ open, onOpenChange, trade, onConfirm, submitting }: OverrideDialogProps) {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [livePriceUnavailable, setLivePriceUnavailable] = useState(false);
  const [checkingPrice, setCheckingPrice] = useState(false);
  const [manualExitPrice, setManualExitPrice] = useState('');

  // Check live price when dialog opens with a trade
  useEffect(() => {
    if (!open || !trade) return;
    setSelectedReason(null);
    setNotes('');
    setLivePriceUnavailable(false);
    setManualExitPrice(String(trade.entry_price));
    setCheckingPrice(true);

    supabase
      .from('live_pattern_detections')
      .select('current_price')
      .eq('instrument', trade.symbol)
      .not('current_price', 'is', null)
      .order('last_confirmed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data?.current_price) {
          setLivePriceUnavailable(true);
        }
      })
      .catch(() => setLivePriceUnavailable(true))
      .finally(() => setCheckingPrice(false));
  }, [open, trade]);

  const handleConfirm = () => {
    if (!trade || !selectedReason) return;
    if (livePriceUnavailable) {
      const price = Number(manualExitPrice);
      if (isNaN(price) || price <= 0) return;
      onConfirm(trade, selectedReason, notes, price);
    } else {
      onConfirm(trade, selectedReason, notes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('paperTrading.pullBreakerTitle')}</DialogTitle>
          <DialogDescription>{t('paperTrading.pullBreakerDesc')}</DialogDescription>
        </DialogHeader>

        {trade && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted/30 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.symbol')}</span>
                <span className="font-medium">{trade.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.direction')}</span>
                <span className="font-medium capitalize">{trade.trade_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.entry')}</span>
                <span className="font-medium tabular-nums">{trade.entry_price.toFixed(2)}</span>
              </div>
            </div>

            {checkingPrice && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Checking live price…
              </div>
            )}

            {livePriceUnavailable && !checkingPrice && (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-md bg-amber-500/10 border border-amber-500/20 p-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400">Live price unavailable — enter exit price manually.</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Exit Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={manualExitPrice}
                    onChange={(e) => setManualExitPrice(e.target.value)}
                    className="h-8 text-sm font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium mb-2">{t('paperTrading.whyClosingEarly')}</p>
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
              <p className="text-sm font-medium mb-1.5">{t('paperTrading.notesOptional')}</p>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('paperTrading.notesPlaceholder')}
                className="h-16 text-sm resize-none"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('paperTrading.cancel')}</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!selectedReason || submitting || checkingPrice || (livePriceUnavailable && (!manualExitPrice || isNaN(Number(manualExitPrice)) || Number(manualExitPrice) <= 0))}
          >
            {submitting ? t('paperTrading.closing') : t('paperTrading.confirmClose')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
