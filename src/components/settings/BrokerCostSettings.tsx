import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Wallet, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBrokerCosts } from '@/hooks/useBrokerCosts';

/**
 * Broker cost assumptions. These figures decide which alerts count as having an
 * edge, so they belong to the user, not to us. Everything here is a researched
 * approximation from public comparisons, not a live feed.
 */
export function BrokerCostSettings() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { profiles, selection, selectedProfile, defaultProfile, loading, saving, save } = useBrokerCosts();

  const [chosenId, setChosenId] = useState<string | null>(null);
  const [spread, setSpread] = useState<string>('');
  const [commission, setCommission] = useState<string>('');

  useEffect(() => {
    setChosenId(selection.brokerProfileId ?? defaultProfile?.id ?? null);
    setSpread(selection.customSpreadPips === null ? '' : String(selection.customSpreadPips));
    setCommission(selection.customCommissionPerLot === null ? '' : String(selection.customCommissionPerLot));
  }, [selection.brokerProfileId, selection.customSpreadPips, selection.customCommissionPerLot, defaultProfile?.id]);

  const chosen = profiles.find((p) => p.id === chosenId) ?? null;
  const isCustom = !!chosen?.is_custom;

  const onSave = async () => {
    const ok = await save({
      brokerProfileId: chosenId,
      customSpreadPips: isCustom && spread !== '' ? Number(spread) : null,
      customCommissionPerLot: isCustom && commission !== '' ? Number(commission) : null,
    });
    toast({
      title: ok
        ? t('brokerCosts.saved', 'Broker costs updated')
        : t('brokerCosts.saveFailed', 'Could not save broker costs'),
      description: ok
        ? t('brokerCosts.savedDesc', 'Edge calculations now use these figures.')
        : t('brokerCosts.saveFailedDesc', 'Please try again.'),
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {t('brokerCosts.title', 'Broker costs')}
        </CardTitle>
        <CardDescription>
          {t('brokerCosts.description', 'Cost is charged in R, and R is your stop distance — so the same spread is trivial on a daily trade and fatal on a 15m one. This setting directly changes which alerts count as having an edge.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('brokerCosts.loading', 'Loading profiles…')}</p>
        ) : (
          <>
            <RadioGroup value={chosenId ?? ''} onValueChange={setChosenId} className="space-y-2">
              {profiles.map((p) => (
                <label
                  key={p.id}
                  htmlFor={`broker-${p.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 hover:bg-muted/40"
                >
                  <RadioGroupItem id={`broker-${p.id}`} value={p.id} className="mt-1" />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-[11px]">{p.account_type}</Badge>
                      {p.is_default && (
                        <Badge variant="secondary" className="text-[11px]">
                          {t('brokerCosts.defaultBadge', 'Default')}
                        </Badge>
                      )}
                    </div>
                    {!p.is_custom && (
                      <p className="text-xs text-muted-foreground">
                        {t('brokerCosts.figures', '{{spread}} pips spread · {{commission}} round-trip commission per standard lot', {
                          spread: Number(p.typical_spread_pips).toFixed(2),
                          commission: `$${Number(p.commission_per_lot_roundtrip).toFixed(2)}`,
                        })}
                      </p>
                    )}
                    {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                    <p className="text-[11px] text-muted-foreground">
                      {t('brokerCosts.updatedAt', 'Figures last reviewed {{date}}', {
                        date: new Date(p.updated_at).toLocaleDateString(),
                      })}
                      {p.source_url && (
                        <>
                          {' · '}
                          <a
                            href={p.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline"
                          >
                            {t('brokerCosts.source', 'Source')}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </label>
              ))}
            </RadioGroup>

            {isCustom && (
              <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="custom-spread" className="text-sm">
                    {t('brokerCosts.customSpread', 'Your typical spread (pips, EUR/USD)')}
                  </Label>
                  <Input
                    id="custom-spread"
                    type="number"
                    step="0.01"
                    min={0}
                    value={spread}
                    onChange={(e) => setSpread(e.target.value)}
                    placeholder="0.90"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="custom-commission" className="text-sm">
                    {t('brokerCosts.customCommission', 'Round-trip commission per standard lot (USD)')}
                  </Label>
                  <Input
                    id="custom-commission"
                    type="number"
                    step="0.01"
                    min={0}
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="7.00"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              {t('brokerCosts.disclaimer', 'These are researched approximations from public broker comparisons, not live feeds. Spreads widen materially in the Asian session, on minors and crosses, and around news. Non-FX asset classes use a percentage-of-price cost on the same basis.')}
            </p>

            <div className="flex items-center gap-3">
              <Button onClick={onSave} disabled={saving || !chosenId}>
                {saving ? t('brokerCosts.saving', 'Saving…') : t('brokerCosts.save', 'Save broker costs')}
              </Button>
              {selectedProfile && (
                <span className="text-xs text-muted-foreground">
                  {t('brokerCosts.current', 'Currently using: {{name}}', { name: selectedProfile.name })}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
