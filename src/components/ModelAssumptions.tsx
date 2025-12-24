import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface ModelAssumptionsProps {
  instrument?: string;
  timeframe?: string;
  dataProvider?: string;
  slippage?: number;
  commission?: number;
  spread?: number;
  initialCapital?: number;
  engineVersion?: string;
}

const ModelAssumptions: React.FC<ModelAssumptionsProps> = ({
  instrument = "Unknown",
  timeframe = "1h",
  dataProvider = "Yahoo Finance",
  slippage = 0,
  commission = 0,
  spread = 0,
  initialCapital = 10000,
  engineVersion = "v1.0"
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border-muted bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Model Assumptions & Methodology
                </CardTitle>
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="space-y-4 text-sm">
              {/* Data Source */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-foreground">Data Source</p>
                  <p className="text-muted-foreground">{dataProvider} OHLC Data</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Timeframe</p>
                  <p className="text-muted-foreground">{timeframe.toUpperCase()} candles</p>
                </div>
              </div>

              {/* Signal Logic */}
              <div>
                <p className="font-medium text-foreground mb-1">Signal Evaluation</p>
                <p className="text-muted-foreground">
                  All signals are evaluated on <strong>closed candles only</strong>. 
                  Entry/exit decisions are made at the close price of the {timeframe} bar 
                  when conditions are met.
                </p>
              </div>

              {/* Cost Assumptions */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="font-medium text-foreground">Slippage</p>
                  <p className="text-muted-foreground">{slippage}%</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Commission</p>
                  <p className="text-muted-foreground">{commission}%</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Spread</p>
                  <p className="text-muted-foreground">{spread}%</p>
                </div>
              </div>

              {/* Capital */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium text-foreground">Initial Capital</p>
                  <p className="text-muted-foreground">${initialCapital.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Engine Version</p>
                  <p className="text-muted-foreground">{engineVersion}</p>
                </div>
              </div>

              {/* Disclosure */}
              <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-600 dark:text-amber-400 text-xs mb-1">
                      Pattern Detection Disclosure
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pattern detection logic in backtests may differ from exported TradingView scripts 
                      due to platform-specific implementations. Always validate exported scripts 
                      independently before live trading.
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="text-xs text-muted-foreground border-t border-border pt-3">
                <p>
                  <strong>Note:</strong> These results are simulated and do not account for 
                  liquidity constraints, order book depth, or market impact. Past performance 
                  does not guarantee future results.
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ModelAssumptions;
