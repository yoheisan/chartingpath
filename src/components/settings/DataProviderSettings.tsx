import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Unplug, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface ProviderConnection {
  provider: string;
  is_active: boolean;
  verified_at: string | null;
}

export function DataProviderSettings({ userId }: { userId?: string }) {
  const { t } = useTranslation();
  const [providers, setProviders] = useState<ProviderConnection[]>([]);
  const [loading, setLoading] = useState(true);

  // EODHD form
  const [eodhdKey, setEodhdKey] = useState('');
  const [eodhdConnecting, setEodhdConnecting] = useState(false);

  // Alpaca form
  const [alpacaKey, setAlpacaKey] = useState('');
  const [alpacaSecret, setAlpacaSecret] = useState('');
  const [alpacaConnecting, setAlpacaConnecting] = useState(false);

  useEffect(() => {
    if (userId) fetchProviders();
  }, [userId]);

  const fetchProviders = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('user_data_providers')
      .select('provider, is_active, verified_at');
    setProviders((data as ProviderConnection[]) || []);
    setLoading(false);
  };

  const getProvider = (name: string) => providers.find(p => p.provider === name);

  const connectProvider = async (provider: 'eodhd' | 'alpaca') => {
    const setConnecting = provider === 'eodhd' ? setEodhdConnecting : setAlpacaConnecting;
    setConnecting(true);

    try {
      const body: Record<string, string> = { provider };
      if (provider === 'eodhd') {
        body.api_key = eodhdKey;
      } else {
        body.api_key = alpacaKey;
        body.api_secret = alpacaSecret;
      }

      const { data, error } = await supabase.functions.invoke('verify-data-provider', { body });

      if (error || !data?.success) {
        toast.error(data?.message || error?.message || t('account.providerVerifyFailed', 'Verification failed'));
        return;
      }

      toast.success(data.message);
      setEodhdKey('');
      setAlpacaKey('');
      setAlpacaSecret('');
      await fetchProviders();
    } catch (e: any) {
      toast.error(e.message || t('account.providerConnectError', 'Connection error'));
    } finally {
      setConnecting(false);
    }
  };

  const disconnectProvider = async (provider: string) => {
    try {
      await supabase.functions.invoke('verify-data-provider', {
        body: { provider, action: 'disconnect' },
      });
      toast.success(t('account.providerDisconnected', 'Provider disconnected'));
      await fetchProviders();
    } catch {
      toast.error(t('account.providerDisconnectError', 'Failed to disconnect'));
    }
  };

  const eodhd = getProvider('eodhd');
  const alpaca = getProvider('alpaca');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {t('account.dataProviders', 'Data Providers')}
        </CardTitle>
        <CardDescription>
          {t('account.dataProvidersDesc', 'Connect your own data provider to unlock intraday (1H/4H/8H) pattern scanning at no cost to ChartingPath.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EODHD Card */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('account.eodhdTitle', 'EODHD — Intraday FX & Stocks')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('account.eodhdDesc', 'Connect your EODHD account to unlock 1H, 4H, and 8H pattern scanning across FX and global stocks. Get your API key at eodhd.com (All-In-One plan from $83/mo).')}
              </p>
            </div>
            {eodhd?.is_active && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('account.connected', 'Connected')}
              </Badge>
            )}
          </div>

          {eodhd?.is_active ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('account.verifiedAt', 'Verified')}: {eodhd.verified_at ? new Date(eodhd.verified_at).toLocaleDateString() : '—'}
              </span>
              <Button variant="ghost" size="sm" onClick={() => disconnectProvider('eodhd')}>
                <Unplug className="h-3.5 w-3.5 mr-1" />
                {t('account.disconnect', 'Disconnect')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="eodhd-key">{t('account.apiKey', 'API Key')}</Label>
              <div className="flex gap-2">
                <Input
                  id="eodhd-key"
                  type="password"
                  placeholder={t('account.enterApiKey', 'Enter your EODHD API key')}
                  value={eodhdKey}
                  onChange={(e) => setEodhdKey(e.target.value)}
                />
                <Button
                  onClick={() => connectProvider('eodhd')}
                  disabled={!eodhdKey || eodhdConnecting}
                >
                  {eodhdConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('account.connectEodhd', 'Connect EODHD')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Alpaca Card */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{t('account.alpacaTitle', 'Alpaca — US Stocks Real-Time')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('account.alpacaDesc', 'Connect your free Alpaca account for real-time US stock data and live trading. Alpaca accounts are free at alpaca.markets.')}
              </p>
            </div>
            {alpaca?.is_active && (
              <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                <CheckCircle className="h-3 w-3 mr-1" />
                {t('account.connected', 'Connected')}
              </Badge>
            )}
          </div>

          {alpaca?.is_active ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t('account.verifiedAt', 'Verified')}: {alpaca.verified_at ? new Date(alpaca.verified_at).toLocaleDateString() : '—'}
              </span>
              <Button variant="ghost" size="sm" onClick={() => disconnectProvider('alpaca')}>
                <Unplug className="h-3.5 w-3.5 mr-1" />
                {t('account.disconnect', 'Disconnect')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <Label htmlFor="alpaca-key">{t('account.apiKey', 'API Key')}</Label>
                <Input
                  id="alpaca-key"
                  type="password"
                  placeholder={t('account.enterAlpacaKey', 'Enter your Alpaca API key')}
                  value={alpacaKey}
                  onChange={(e) => setAlpacaKey(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="alpaca-secret">{t('account.secretKey', 'Secret Key')}</Label>
                <Input
                  id="alpaca-secret"
                  type="password"
                  placeholder={t('account.enterAlpacaSecret', 'Enter your Alpaca secret key')}
                  value={alpacaSecret}
                  onChange={(e) => setAlpacaSecret(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={() => connectProvider('alpaca')}
                disabled={!alpacaKey || !alpacaSecret || alpacaConnecting}
              >
                {alpacaConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('account.connectAlpaca', 'Connect Alpaca')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
