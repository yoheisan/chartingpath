import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { GuardrailCheck } from '@/hooks/useDeployGuardrails';
import { Shield, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DeployModalProps {
  open: boolean;
  onClose: () => void;
  checks: GuardrailCheck[];
  paperStats: { tradeCount: number; winRate: number; totalR: number };
}

export function DeployModal({ open, onClose, checks, paperStats }: DeployModalProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [accountBalance, setAccountBalance] = useState(0);
  const [capital, setCapital] = useState(0);
  const [riskAgreed, setRiskAgreed] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const verifyConnection = async () => {
    setVerifying(true);
    setVerifyError('');
    try {
      const res = await supabase.functions.invoke('alpaca-broker', {
        body: { action: 'verify', api_key: apiKey, api_secret: apiSecret },
      });
      if (res.error || !res.data?.success) {
        setVerifyError(res.data?.error || 'Invalid credentials — check your Alpaca API keys and try again');
        return;
      }
      setAccountBalance(res.data.balance ?? 0);
      setCapital(Math.round((res.data.balance ?? 0) * 0.5));
      setStep(1);
    } catch {
      setVerifyError('Connection failed. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const goLive = async () => {
    if (!user) return;
    await supabase.from('broker_connections').upsert({
      user_id: user.id,
      broker: 'alpaca',
      api_key_encrypted: apiKey,
      api_secret_encrypted: apiSecret,
      is_live: true,
      is_paused: false,
      capital_allocated: capital,
      account_balance: accountBalance,
      connected_at: new Date().toISOString(),
    } as any, { onConflict: 'user_id' });

    toast({ title: t('paperTrading.copilotLiveTitle'), description: t('paperTrading.copilotLiveDesc') });
    onClose();
  };

  const stepTitles = [
    t('paperTrading.connectAlpaca'),
    t('paperTrading.setCapital'),
    t('paperTrading.beforeGoLive'),
    t('paperTrading.confirmGoLive'),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Shield className="h-4 w-4 text-blue-400" />
            {stepTitles[step]}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 mb-2">
          {[0,1,2,3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-blue-500' : 'bg-muted'}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="flex flex-col gap-3">
            <Input
              type="password"
              placeholder={t('paperTrading.apiKey')}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            <Input
              type="password"
              placeholder={t('paperTrading.secretKey')}
              value={apiSecret}
              onChange={e => setApiSecret(e.target.value)}
              className="bg-secondary/50 border-border"
            />
            {verifyError && <p className="text-sm text-red-400">{verifyError}</p>}
            <Button onClick={verifyConnection} disabled={!apiKey || !apiSecret || verifying}>
              {verifying ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('paperTrading.verifying')}</> : t('paperTrading.verifyConnection')}
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              {t('paperTrading.accountBalance')}: <span className="text-foreground font-mono">${accountBalance.toLocaleString()}</span>
            </p>
            <Slider
              min={0}
              max={accountBalance}
              step={100}
              value={[capital]}
              onValueChange={([v]) => setCapital(v)}
            />
            <div className="flex items-center justify-between">
              <Input
                type="number"
                value={capital}
                onChange={e => setCapital(Math.min(Number(e.target.value), accountBalance))}
                className="w-32 bg-secondary/50 border-border font-mono"
              />
              <span className="text-sm text-muted-foreground">
                {t('paperTrading.allocated', { amount: `$${capital.toLocaleString()}` })}
              </span>
            </div>
            <Button onClick={() => setStep(2)}>{t('paperTrading.continue')}</Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-3">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <span className="text-foreground">{t('paperTrading.riskRealOrders')}</span></li>
              <li>• {t('paperTrading.riskAutonomous')}</li>
              <li>• <span className="text-foreground">{t('paperTrading.riskPauseAnytime')}</span></li>
              <li>• {t('paperTrading.riskPastPerformance')}</li>
              <li>• <span className="text-foreground">{t('paperTrading.riskNotAdviser')}</span></li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="risk-ack"
                checked={riskAgreed}
                onCheckedChange={(v) => setRiskAgreed(v === true)}
              />
              <label htmlFor="risk-ack" className="text-sm text-foreground cursor-pointer">
                {t('paperTrading.riskAcknowledge')}
              </label>
            </div>
            <Button onClick={() => setStep(3)} disabled={!riskAgreed}>{t('paperTrading.continue')}</Button>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="rounded-md bg-secondary/50 p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.broker')}</span>
                <span className="text-foreground font-mono">Alpaca</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.capital')}</span>
                <span className="text-foreground font-mono">${capital.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('paperTrading.paperTrackRecord')}</span>
                <span className="text-foreground font-mono">
                  {paperStats.tradeCount} {t('paperTrading.trades').toLowerCase()} · {paperStats.winRate}% · {paperStats.totalR >= 0 ? '+' : ''}{paperStats.totalR.toFixed(1)}R
                </span>
              </div>
            </div>

            <div className="space-y-1">
              {checks.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {c.passed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <XCircle className="h-3.5 w-3.5 text-red-500" />}
                  <span className={c.passed ? 'text-muted-foreground' : 'text-red-400'}>{c.detail}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={goLive}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              {t('paperTrading.goLive')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}