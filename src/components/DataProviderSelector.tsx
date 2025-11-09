import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, Zap, TrendingUp } from 'lucide-react';
import { PROVIDER_CAPABILITIES } from '../../engine/backtester-v2/data/providerFactory';

interface DataProviderSelectorProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  userPlan: 'free' | 'starter' | 'pro' | 'elite';
  instrumentType?: 'stock' | 'forex' | 'crypto' | 'etf';
}

export const DataProviderSelector: React.FC<DataProviderSelectorProps> = ({
  selectedProvider,
  onProviderChange,
  userPlan,
  instrumentType = 'stock'
}) => {
  const getAvailableProviders = () => {
    const providers = [];
    
    // Always available: Yahoo Finance, Dukascopy
    providers.push(
      { value: 'yahoo', label: 'Yahoo Finance', badge: 'Free', recommended: instrumentType === 'stock' },
      { value: 'dukascopy', label: 'Dukascopy', badge: 'Free', recommended: instrumentType === 'forex' }
    );
    
    // Pro and Elite: Premium providers
    if (userPlan === 'pro' || userPlan === 'elite') {
      providers.push(
        { value: 'twelve', label: 'Twelve Data', badge: 'Pro', recommended: false },
        { value: 'eodhd', label: 'EODHD', badge: 'Elite', recommended: userPlan === 'elite' }
      );
    }
    
    return providers;
  };

  const providers = getAvailableProviders();
  const currentCapabilities = PROVIDER_CAPABILITIES[selectedProvider as keyof typeof PROVIDER_CAPABILITIES];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Zap className="w-4 h-4" />
          Data Provider
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Select value={selectedProvider} onValueChange={onProviderChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map(provider => (
                <SelectItem key={provider.value} value={provider.value}>
                  <div className="flex items-center gap-2">
                    {provider.label}
                    <Badge variant={provider.badge === 'Free' ? 'secondary' : 'default'} className="text-xs">
                      {provider.badge}
                    </Badge>
                    {provider.recommended && (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentCapabilities && (
          <div className="p-3 bg-muted rounded-lg space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <Info className="w-3 h-3 mt-0.5 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium">{currentCapabilities.notes}</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span className="font-medium">Instruments:</span> {currentCapabilities.instruments.join(', ')}
                  </div>
                  <div>
                    <span className="font-medium">History:</span> {Math.floor(currentCapabilities.historicalDays / 365)} years
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span> {currentCapabilities.cost}
                  </div>
                  <div>
                    <span className="font-medium">Rate:</span> {currentCapabilities.rateLimit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {userPlan === 'starter' && (
          <div className="text-xs text-muted-foreground">
            Upgrade to Pro or Elite for premium data providers with better coverage and reliability.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
