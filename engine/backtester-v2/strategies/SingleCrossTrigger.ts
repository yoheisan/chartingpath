import { SignalSet } from "../exec/execution";

export interface SingleCrossTriggerParams {
  tradableSymbol: string;
  triggerSymbol?: string; // Cross-instrument trigger
  longThreshold: number;
  shortThreshold: number;
  exitLongThreshold?: number;
  exitShortThreshold?: number;
  positionSize: number; // Fixed position size
  stopLoss?: number; // Percentage
  takeProfit?: number; // Percentage
}

export class SingleCrossTriggerStrategy {
  private position: "LONG" | "SHORT" | "FLAT" = "FLAT";
  private entryPrice?: number;

  constructor(private params: SingleCrossTriggerParams) {}

  generateSignals(
    date: string,
    prices: Record<string, number>,
    indicators?: Record<string, number>
  ): SignalSet {
    const tradablePrice = prices[this.params.tradableSymbol];
    const triggerPrice = this.params.triggerSymbol 
      ? prices[this.params.triggerSymbol] 
      : tradablePrice;

    if (!tradablePrice || !triggerPrice) {
      return { signals: [] };
    }

    const signals: SignalSet = { signals: [] };

    // Exit logic (stop loss / take profit)
    if (this.position !== "FLAT" && this.entryPrice) {
      const currentReturn = (tradablePrice - this.entryPrice) / this.entryPrice;
      const positionReturn = this.position === "LONG" ? currentReturn : -currentReturn;

      if (this.params.stopLoss && positionReturn <= -this.params.stopLoss) {
        signals.signals.push({
          symbol: this.params.tradableSymbol,
          action: "CLOSE",
          tag: "stop_loss"
        });
        this.position = "FLAT";
        this.entryPrice = undefined;
        return signals;
      }

      if (this.params.takeProfit && positionReturn >= this.params.takeProfit) {
        signals.signals.push({
          symbol: this.params.tradableSymbol,
          action: "CLOSE",
          tag: "take_profit"
        });
        this.position = "FLAT";
        this.entryPrice = undefined;
        return signals;
      }
    }

    // Entry/Exit logic based on thresholds
    const triggerValue = indicators?.trigger || triggerPrice;

    switch (this.position) {
      case "FLAT":
        if (triggerValue > this.params.longThreshold) {
          signals.signals.push({
            symbol: this.params.tradableSymbol,
            action: "BUY",
            quantity: this.params.positionSize,
            tag: "long_entry"
          });
          this.position = "LONG";
          this.entryPrice = tradablePrice;
        } else if (triggerValue < this.params.shortThreshold) {
          signals.signals.push({
            symbol: this.params.tradableSymbol,
            action: "SELL",
            quantity: this.params.positionSize,
            tag: "short_entry"
          });
          this.position = "SHORT";
          this.entryPrice = tradablePrice;
        }
        break;

      case "LONG":
        const exitLongThreshold = this.params.exitLongThreshold ?? this.params.shortThreshold;
        if (triggerValue < exitLongThreshold) {
          signals.signals.push({
            symbol: this.params.tradableSymbol,
            action: "CLOSE",
            tag: "long_exit"
          });
          this.position = "FLAT";
          this.entryPrice = undefined;
        }
        break;

      case "SHORT":
        const exitShortThreshold = this.params.exitShortThreshold ?? this.params.longThreshold;
        if (triggerValue > exitShortThreshold) {
          signals.signals.push({
            symbol: this.params.tradableSymbol,
            action: "CLOSE",
            tag: "short_exit"
          });
          this.position = "FLAT";
          this.entryPrice = undefined;
        }
        break;
    }

    return signals;
  }

  getPosition(): string {
    return this.position;
  }

  reset(): void {
    this.position = "FLAT";
    this.entryPrice = undefined;
  }
}