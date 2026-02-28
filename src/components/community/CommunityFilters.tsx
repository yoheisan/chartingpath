import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface CommunityFiltersProps {
  activeAssetType: string;
  activeDirection: string;
  onAssetTypeChange: (value: string) => void;
  onDirectionChange: (value: string) => void;
}

const ASSET_TYPES = [
  { value: '', label: 'All Markets' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'fx', label: 'Forex' },
  { value: 'commodities', label: 'Commodities' },
];

const DIRECTIONS = [
  { value: '', label: 'All' },
  { value: 'long', label: '📈 Long' },
  { value: 'short', label: '📉 Short' },
];

export const CommunityFilters: React.FC<CommunityFiltersProps> = ({
  activeAssetType,
  activeDirection,
  onAssetTypeChange,
  onDirectionChange,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Market</span>
      {ASSET_TYPES.map(({ value, label }) => (
        <Button
          key={value}
          variant={activeAssetType === value ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAssetTypeChange(value)}
        >
          {label}
        </Button>
      ))}

      <div className="w-px h-5 bg-border mx-2" />

      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mr-1">Direction</span>
      {DIRECTIONS.map(({ value, label }) => (
        <Button
          key={value}
          variant={activeDirection === value ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onDirectionChange(value)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
};
