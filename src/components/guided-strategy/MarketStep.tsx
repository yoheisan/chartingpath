import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, Globe, Clock, Zap, HelpCircle } from 'lucide-react';
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
    timeframes: []
  };

  const handleTimeframeToggle = (timeframe: string) => {
    onAnswersChange('market', {
      ...currentAnswers,
      timeframes: [timeframe] // Only allow single selection
    });
  };

  const isComplete = currentAnswers.timeframes?.length > 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              What Timeframe Do You Prefer?
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">
                    <strong>Select one timeframe</strong> that determines your trade duration and monitoring frequency. <strong>Scalping</strong> (1-15min) requires constant attention for quick profits, 
                    <strong>Intraday</strong> (15min-4h) holds positions within the day, <strong>Swing</strong> (4h-1d) captures multi-day trends, 
                    <strong>Position</strong> (1w+) targets long-term moves with minimal monitoring.
                  </p>
                </TooltipContent>
              </Tooltip>
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
              You've selected a {currentAnswers.timeframes?.[0] || 'timeframe'} for your strategy.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
    </TooltipProvider>
  );
};