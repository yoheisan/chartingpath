import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import i18n from '@/i18n/config';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isAuthenticated = !!user;

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST to avoid race conditions
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthLoading(false);

        // Check admin status using setTimeout to avoid deadlock
        if (session?.user) {
          const user = session.user;
          setTimeout(async () => {
            try {
              const { data } = await supabase.rpc('is_admin', { _user_id: user.id });
              if (mounted) setIsAdmin(data === true);
            } catch {
              if (mounted) setIsAdmin(false);
            }
            // Load user's saved language preference from DB
            try {
              const { data: lang } = await supabase.rpc('get_user_language', { p_user_id: user.id });
              if (mounted && lang && lang !== i18n.language) {
                await i18n.changeLanguage(lang);
                try { localStorage.setItem('cp_language', lang); } catch {}
              }
            } catch {}

            // Onboarding + welcome email for new signups
            if (event === 'SIGNED_IN' && user.created_at) {
              const isNewUser = Date.now() - new Date(user.created_at).getTime() < 60000;
              if (!isNewUser) {
                // Returning user — mark onboarding as complete so tour never shows
                try { localStorage.setItem('chartingpath_onboarding_completed', 'true'); } catch {}
              }
              if (isNewUser) {
                try {
                  const { data: prefs } = await supabase
                    .from('user_email_preferences')
                    .select('welcome_sent')
                    .eq('user_id', user.id)
                    .single();

                  if (!prefs?.welcome_sent) {
                    const SUPABASE_URL = 'https://dgznlsckoamseqcpzfqm.supabase.co';
                    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnem5sc2Nrb2Ftc2VxY3B6ZnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MzA2MzcsImV4cCI6MjA3MTMwNjYzN30.qvXqakZccAMJK7pFpcxHRFu-mrGEA4R1Zo21uzjcMt8';

                    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        apikey: SUPABASE_ANON_KEY,
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        to: user.email,
                        subject: undefined,
                        template: 'welcome',
                        language: i18n.language || 'en',
                        data: {
                          name: user.user_metadata?.full_name?.split(' ')[0] ||
                                user.user_metadata?.display_name?.split(' ')[0] ||
                                user.email?.split('@')[0],
                        },
                      }),
                    });

                    await supabase.from('user_email_preferences').upsert({
                      user_id: user.id,
                      welcome_sent: true,
                    });

                    (window as any).gtag?.('event', 'sign_up', {
                      method: user.app_metadata?.provider || 'email',
                    });

                    console.log('[AuthContext] Welcome email sent to', user.email);
                  }
                } catch (err) {
                  console.error('[AuthContext] Welcome email error:', err);
                }
              }
            }
          }, 0);
        } else {
          setIsAdmin(false);
        }
      }
    });

    // Timeout safeguard - if auth check takes too long, proceed anyway
    const timeoutId = setTimeout(() => {
      if (mounted && isAuthLoading) {
        console.warn('Auth check timeout - proceeding');
        setIsAuthLoading(false);
      }
    }, 5000);

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthLoading(false);
        clearTimeout(timeoutId);

        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data } = await supabase.rpc('is_admin', { _user_id: session.user.id });
              if (mounted) setIsAdmin(data === true);
            } catch {
              if (mounted) setIsAdmin(false);
            }
            // Load user's saved language preference from DB
            try {
              const { data: lang } = await supabase.rpc('get_user_language', { p_user_id: session.user.id });
              if (mounted && lang && lang !== i18n.language) {
                await i18n.changeLanguage(lang);
                try { localStorage.setItem('cp_language', lang); } catch {}
              }
            } catch {}
          }, 0);
        }
      }
    }).catch((err) => {
      console.error('Auth session check failed:', err);
      if (mounted) {
        setIsAuthLoading(false);
        clearTimeout(timeoutId);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      isAuthenticated,
      isAuthLoading,
      isAdmin,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
