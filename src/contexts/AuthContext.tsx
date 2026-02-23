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
