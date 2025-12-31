import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook that requires authentication for a page.
 * Redirects to /auth with next param if not authenticated.
 * Returns user, loading state, and authentication status.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (!mounted) return;
        
        if (error || !user) {
          // Redirect to auth with the current path as next
          const nextPath = encodeURIComponent(location.pathname + location.search);
          navigate(`/auth?redirect=${nextPath}`, { replace: true });
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error("[useRequireAuth] Auth check error:", error);
        const nextPath = encodeURIComponent(location.pathname);
        navigate(`/auth?redirect=${nextPath}`, { replace: true });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        const nextPath = encodeURIComponent(location.pathname);
        navigate(`/auth?redirect=${nextPath}`, { replace: true });
      } else if (session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, location.search]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
