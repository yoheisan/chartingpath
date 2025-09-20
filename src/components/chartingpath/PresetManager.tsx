import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Download } from 'lucide-react';

interface PresetManagerProps {
  currentStrategy: any;
  onLoadPreset: (preset: any) => void;
}

export const PresetManager: React.FC<PresetManagerProps> = ({
  currentStrategy,
  onLoadPreset
}) => {
  const presets = [
    { id: 'ema_rsi', name: 'EMA + RSI Trend', description: 'Popular trend following system' },
    { id: 'bollinger_revert', name: 'Bollinger Mean Reversion', description: 'Mean reversion strategy' },
    { id: 'breakout_atr', name: 'Breakout + ATR', description: 'Breakout system with ATR stops' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Strategy Presets & Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {presets.map(preset => (
              <Card key={preset.id} className="border-dashed">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{preset.name}</h3>
                      <p className="text-sm text-muted-foreground">{preset.description}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onLoadPreset(preset)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Load
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};