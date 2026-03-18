import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { useAuth } from '@/contexts/AuthContext';

export function EmailLeadCapture() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    try {
      await supabase.from('email_leads').insert({ email, source: 'landing_page' });
      trackEvent('email_lead.captured', { source: 'landing_page' });
      setSubmitted(true);
    } catch {
      // Silent fail — don't block UX
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-xl text-center">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">{t('emailCapture.thankYou', "You're in! We'll send you the best setups.")}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 border-t border-border/20">
      <div className="container mx-auto max-w-xl text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{t('emailCapture.title', 'Get Grade A setups in your inbox')}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t('emailCapture.subtitle', 'Weekly digest of the highest-quality pattern signals. No spam, unsubscribe anytime.')}
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
          <Input
            type="email"
            placeholder={t('emailCapture.placeholder', 'your@email.com')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" disabled={loading} size="sm">
            {loading ? '...' : t('emailCapture.subscribe', 'Subscribe')}
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-2">
          {t('emailCapture.privacy', 'We respect your privacy. Unsubscribe anytime.')}
        </p>
      </div>
    </section>
  );
}
