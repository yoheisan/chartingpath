import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Badge } from '@/components/ui/badge';
import { SubFilters, useStockExchanges } from '@/hooks/useAgentScoringSettings';
import { AssetClassFilter } from './TradeOpportunityTable';
import { useTranslation } from 'react-i18next';

interface Props {
  assetClass: AssetClassFilter;
  subFilters: SubFilters;
  onChange: (sf: SubFilters) => void;
}

const FX_CATEGORIES = [
  { value: 'all', label: 'All Pairs' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'exotic', label: 'Exotic' },
] as const;

const CRYPTO_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'major', label: 'Major (Top 10)' },
  { value: 'alt', label: 'Altcoins' },
] as const;

export const CRYPTO_MAJORS = new Set([
  'BTC', 'ETH', 'BNB', 'XRP', 'SOL', 'ADA', 'DOGE', 'TRX', 'AVAX', 'LINK',
]);

export const InstrumentSubFilters: React.FC<Props> = ({ assetClass, subFilters, onChange }) => {
  const { t } = useTranslation();
  const { data: exchanges = [] } = useStockExchanges();

  if (assetClass === 'all' || assetClass === 'commodities') return null;

  return (
    <div className="space-y-2">
      {assetClass === 'forex' && (
        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pair Category</span>
          <ToggleGroup
            type="single"
            value={subFilters.fxCategory || 'all'}
            onValueChange={(v) => v && onChange({ ...subFilters, fxCategory: v as any })}
            className="flex flex-wrap gap-1"
          >
            {FX_CATEGORIES.map((c) => (
              <ToggleGroupItem key={c.value} value={c.value} size="sm" className="text-xs h-7 px-2.5">
                {c.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {assetClass === 'crypto' && (
        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Coin Category</span>
          <ToggleGroup
            type="single"
            value={subFilters.cryptoCategory || 'all'}
            onValueChange={(v) => v && onChange({ ...subFilters, cryptoCategory: v as any })}
            className="flex flex-wrap gap-1"
          >
            {CRYPTO_CATEGORIES.map((c) => (
              <ToggleGroupItem key={c.value} value={c.value} size="sm" className="text-xs h-7 px-2.5">
                {c.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {assetClass === 'stocks' && exchanges.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Exchange</span>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant={(!subFilters.stockExchanges || subFilters.stockExchanges.length === 0) ? 'default' : 'outline'}
              className="text-xs cursor-pointer h-7 px-2.5"
              onClick={() => onChange({ ...subFilters, stockExchanges: [] })}
            >
              All
            </Badge>
            {exchanges.map((ex) => {
              const selected = subFilters.stockExchanges?.includes(ex);
              return (
                <Badge
                  key={ex}
                  variant={selected ? 'default' : 'outline'}
                  className="text-xs cursor-pointer h-7 px-2.5"
                  onClick={() => {
                    const current = subFilters.stockExchanges || [];
                    const next = selected ? current.filter(e => e !== ex) : [...current, ex];
                    onChange({ ...subFilters, stockExchanges: next });
                  }}
                >
                  {ex}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
