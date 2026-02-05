import { useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";

interface UseRequireAuthResult {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook that requires authentication for a page.
 * Redirects to /auth with redirect param if not authenticated.
 *
 * IMPORTANT: This hook intentionally avoids `supabase.auth.getUser()`.
 * `getUser()` hits the network and can be slow in some regions, which caused
 * false "timeout" redirects even when the user was actually logged in.
 */
export function useRequireAuth(): UseRequireAuthResult {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const hasRedirectedRef = useRef(false);

  const redirectToAuth = useCallback(() => {
    if (hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    navigate(`/auth?redirect=${redirectPath}`, { replace: true });
  }, [navigate, location.pathname, location.search]);

  useEffect(() => {
    // Wait for the central AuthProvider to resolve session state.
    if (isAuthLoading) return;

    if (!user) {
      redirectToAuth();
    }
  }, [isAuthLoading, user, redirectToAuth]);

  return {
    user,
    loading: isAuthLoading,
    isAuthenticated: !!user,
  };
}

