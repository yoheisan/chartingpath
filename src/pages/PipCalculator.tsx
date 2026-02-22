import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PipCalculator = () => {
  const { t } = useTranslation();
  const [currencyPair, setCurrencyPair] = useState("");
  const [lotSize, setLotSize] = useState("");
  const [accountCurrency, setAccountCurrency] = useState("");
  const [leverage, setLeverage] = useState("");
  const [pipValue, setPipValue] = useState<number | null>(null);

  const currencyPairs = [
    "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "NZD/USD",
    "EUR/GBP", "EUR/JPY", "GBP/JPY", "CHF/JPY", "AUD/JPY", "CAD/JPY", "NZD/JPY"
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];
  const leverageOptions = ["50:1", "100:1", "200:1", "500:1"];

  const calculatePipValue = () => {
    if (!currencyPair || !lotSize || !accountCurrency) return;

    // Simplified pip value calculation
    const lot = parseFloat(lotSize);
    const isJpyPair = currencyPair.includes("JPY");
    
    let baseValue = lot * (isJpyPair ? 0.01 : 0.0001);
    
    // For demonstration - in reality this would need real-time exchange rates
    if (currencyPair.endsWith("USD") && accountCurrency === "USD") {
      baseValue = lot * (isJpyPair ? 0.01 : 0.0001) * 100000;
    } else {
      // Simplified conversion rate
      baseValue = lot * (isJpyPair ? 0.91 : 9.10);
    }
    
    setPipValue(baseValue);
    
    // Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'calc_pip_submit', {
        event_category: 'Tools',
        event_label: currencyPair
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToHome')}
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {t('pipCalculator.title')}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('pipCalculator.subtitle')}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Calculator Form */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pipCalculator.calculatePipValue')}</CardTitle>
              <CardDescription>
                {t('pipCalculator.enterParams')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currency-pair">{t('pipCalculator.currencyPair')}</Label>
                <Select value={currencyPair} onValueChange={setCurrencyPair}>
                  <SelectTrigger id="currency-pair">
                    <SelectValue placeholder={t('pipCalculator.selectCurrencyPair')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencyPairs.map((pair) => (
                      <SelectItem key={pair} value={pair}>
                        {pair}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lot-size">{t('pipCalculator.lotSize')}</Label>
                <Input
                  id="lot-size"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  value={lotSize}
                  onChange={(e) => setLotSize(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account-currency">{t('pipCalculator.accountCurrency')}</Label>
                <Select value={accountCurrency} onValueChange={setAccountCurrency}>
                  <SelectTrigger id="account-currency">
                    <SelectValue placeholder={t('pipCalculator.selectAccountCurrency')} />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leverage">{t('pipCalculator.leverage')}</Label>
                <Select value={leverage} onValueChange={setLeverage}>
                  <SelectTrigger id="leverage">
                    <SelectValue placeholder={t('pipCalculator.selectLeverage')} />
                  </SelectTrigger>
                  <SelectContent>
                    {leverageOptions.map((lev) => (
                      <SelectItem key={lev} value={lev}>
                        {lev}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={calculatePipValue}
                className="w-full"
                disabled={!currencyPair || !lotSize || !accountCurrency}
              >
                {t('pipCalculator.calculate')}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle>{t('pipCalculator.results')}</CardTitle>
              <CardDescription>
                {t('pipCalculator.yourPipValue')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pipValue !== null ? (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-2">{t('pipCalculator.pipValueIs')}</div>
                    <div className="text-3xl font-bold text-primary">
                      ${pipValue.toFixed(2)} {t('pipCalculator.perPip')}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Currency Pair:</span>
                      <span className="text-foreground">{currencyPair}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lot Size:</span>
                      <span className="text-foreground">{lotSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Account Currency:</span>
                      <span className="text-foreground">{accountCurrency}</span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('pipCalculator.enterToSee')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>{t('common.disclaimer')}</strong> {t('pipCalculator.disclaimer')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PipCalculator;