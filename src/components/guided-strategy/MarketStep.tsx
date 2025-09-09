import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Globe, Clock, Zap } from 'lucide-react';
import { GuidedStrategyAnswers } from '../GuidedStrategyBuilder';

interface MarketStepProps {
  answers: Partial<GuidedStrategyAnswers>;
  onAnswersChange: (stepKey: keyof GuidedStrategyAnswers, stepAnswers: any) => void;
  subscriptionPlan: string;
}

const allInstruments = [
  // Forex
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD',
  'EUR/GBP', 'EUR/JPY', 'GBP/JPY', 'XAU/USD', 'XAG/USD',
  // Stocks  
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  // Crypto
  'BTC/USD', 'ETH/USD', 'ADA/USD', 'DOT/USD', 'LINK/USD', 'UNI/USD', 'SOL/USD',
  // Commodities
  'Gold', 'Silver', 'Oil', 'Natural Gas',
  // Indices
  'S&P 500', 'NASDAQ', 'DAX', 'FTSE'
];

const timeframes = [
  { id: '1m', label: '1 Minute', category: 'scalping' },
  { id: '5m', label: '5 Minutes', category: 'scalping' },
  { id: '15m', label: '15 Minutes', category: 'intraday' },
  { id: '1h', label: '1 Hour', category: 'intraday' },
  { id: '4h', label: '4 Hours', category: 'swing' },
  { id: '1d', label: '1 Day', category: 'swing' },
  { id: '1w', label: '1 Week', category: 'position' },
];

export const MarketStep: React.FC<MarketStepProps> = ({
  answers,
  onAnswersChange,
  subscriptionPlan
}) => {
  const currentAnswers = answers.market || {
    instruments: [],
    timeframes: []
  };

  const handleInstrumentToggle = (instrument: string) => {
    const instruments = currentAnswers.instruments || [];
    const newInstruments = instruments.includes(instrument)
      ? instruments.filter(i => i !== instrument)
      : [...instruments, instrument];
    
    onAnswersChange('market', {
      ...currentAnswers,
      instruments: newInstruments
    });
  };

  const handleTimeframeToggle = (timeframe: string) => {
    const timeframes = currentAnswers.timeframes || [];
    const newTimeframes = timeframes.includes(timeframe)
      ? timeframes.filter(t => t !== timeframe)
      : [...timeframes, timeframe];
    
    onAnswersChange('market', {
      ...currentAnswers,
      timeframes: newTimeframes
    });
  };

  const isComplete = currentAnswers.instruments?.length > 0 && 
                   currentAnswers.timeframes?.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Select Your Preferred Instruments
            <Badge variant="secondary" className="ml-2">
              {currentAnswers.instruments?.length || 0} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {allInstruments.map((instrument) => (
              <Button
                key={instrument}
                variant={currentAnswers.instruments?.includes(instrument) ? "default" : "outline"}
                size="sm"
                onClick={() => handleInstrumentToggle(instrument)}
              >
                {instrument}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            What Timeframes Do You Prefer?
            <Badge variant="secondary" className="ml-2">
              {currentAnswers.timeframes?.length || 0} selected
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['scalping', 'intraday', 'swing', 'position'].map((category) => (
              <div key={category}>
                <h4 className="font-medium capitalize mb-2">{category} Trading</h4>
                <div className="flex flex-wrap gap-2">
                  {timeframes
                    .filter(tf => tf.category === category)
                    .map((timeframe) => (
                      <Button
                        key={timeframe.id}
                        variant={currentAnswers.timeframes?.includes(timeframe.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleTimeframeToggle(timeframe.id)}
                      >
                        {timeframe.label}
                      </Button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isComplete && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-primary">
              <Globe className="w-4 h-4" />
              <span className="font-medium">Market Selection Complete!</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              You've selected {currentAnswers.instruments?.length} instruments 
              across {currentAnswers.timeframes?.length} timeframes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};