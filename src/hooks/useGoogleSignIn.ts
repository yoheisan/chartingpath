import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCanonicalAppOrigin } from '@/utils/canonicalOrigin';
import { trackEvent } from '@/lib/analytics';

/**
 * Reusable hook for Google OAuth sign-in.
 * Used across AuthGateDialog, CopilotAuthGate, DashboardAuthNudge, etc.
 */
export function useGoogleSignIn() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    trackEvent('auth.form_start', { method: 'google' });
    try {
      const redirectPath = window.location.pathname + window.location.search;
      const oauthRedirectTo = `${getCanonicalAppOrigin()}/auth/?redirect=${encodeURIComponent(redirectPath)}`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error.message);
      trackEvent('auth.signup_failed', { method: 'google', reason: error?.message ?? 'unknown' });
      setLoading(false);
    }
  }, []);

  return { signInWithGoogle, googleLoading: loading };
}
