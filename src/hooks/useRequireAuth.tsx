import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

// Timeout for auth check (8 seconds)
const AUTH_TIMEOUT_MS = 8000;

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Hook that requires authentication for a page.
 * Redirects to /auth with redirect param if not authenticated.
 * Returns user, loading state, authentication status, and error.
 * Includes timeout handling to prevent infinite loading.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const checkAuth = async () => {
    setLoading(true);
    setError(null);

    // Set timeout to prevent infinite loading
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current && loading) {
        setLoading(false);
        setError("Authentication check timed out. Please refresh and try again.");
      }
    }, AUTH_TIMEOUT_MS);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!mountedRef.current) return;
      
      // Clear timeout since we got a response
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (authError || !user) {
        // Redirect to auth with the current path as redirect param
        const redirectPath = encodeURIComponent(location.pathname + location.search);
        navigate(`/auth?redirect=${redirectPath}`, { replace: true });
        return;
      }
      
      setUser(user);
      setLoading(false);
    } catch (err: any) {
      console.error("[useRequireAuth] Auth check error:", err);
      
      if (!mountedRef.current) return;
      
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Redirect on auth error
      const redirectPath = encodeURIComponent(location.pathname);
      navigate(`/auth?redirect=${redirectPath}`, { replace: true });
    }
  };

  const retry = () => {
    checkAuth();
  };

  useEffect(() => {
    mountedRef.current = true;
    
    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        const redirectPath = encodeURIComponent(location.pathname);
        navigate(`/auth?redirect=${redirectPath}`, { replace: true });
      } else if (session?.user) {
        setUser(session.user);
        setLoading(false);
        setError(null);
      }
    });

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname, location.search]);

  return {
    user,
    loading,
    isAuthenticated: !!user,
    error,
    retry,
  };
}
