import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

// Timeout for auth check (5 seconds - faster for better UX)
const AUTH_TIMEOUT_MS = 5000;

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook that requires authentication for a page.
 * Redirects to /auth with redirect param if not authenticated.
 * NEVER shows an error state - always redirects unauthenticated users.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(true);
  const hasRedirectedRef = useRef(false);

  const redirectToAuth = useCallback(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    navigate(`/auth?redirect=${redirectPath}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  useEffect(() => {
    mountedRef.current = true;
    hasRedirectedRef.current = false;

    const checkAuth = async () => {
      // Set up timeout - if auth check takes too long, redirect to login
      const timeoutId = setTimeout(() => {
        if (mountedRef.current && loading) {
          console.log("[useRequireAuth] Auth check timed out, redirecting to login");
          redirectToAuth();
        }
      }, AUTH_TIMEOUT_MS);

      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        clearTimeout(timeoutId);
        
        if (!mountedRef.current) return;
        
        if (authError || !authUser) {
          // No user - redirect to auth (not an error, just unauthenticated)
          redirectToAuth();
          return;
        }
        
        setUser(authUser);
        setLoading(false);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("[useRequireAuth] Auth check failed:", err);
        
        if (!mountedRef.current) return;
        
        // On any error, redirect to auth
        redirectToAuth();
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        redirectToAuth();
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [redirectToAuth]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
  };
}
