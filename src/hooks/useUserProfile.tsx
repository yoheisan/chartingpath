import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: "free" | "starter" | "lite" | "pro" | "pro_plus" | "elite";
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

export const useUserProfile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getInitialData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (mounted) {
          setUser(user);
          
          if (user) {
            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .single();

            if (profileError) {
              console.error('Profile fetch error:', profileError);
              setError(profileError.message);
            } else {
              setProfile(profileData);
            }
          }
          
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    getInitialData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Fetch updated profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (profileError) {
              console.error('Profile fetch error:', profileError);
              setError(profileError.message);
            } else {
              setProfile(profileData);
            }
          } else {
            setProfile(null);
          }
          
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        setError(profileError.message);
      } else {
        setProfile(profileData);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get tier display name
  const getTierDisplayName = (plan: string) => {
    switch (plan) {
      case 'free': return 'Free';
      case 'starter': return 'Starter';
      case 'pro': return 'Pro';
      case 'pro_plus': return 'Pro+';
      case 'elite': return 'Elite';
      default: return 'Free';
    }
  };

  // Helper function to check feature access
  const hasFeatureAccess = (feature: 'visual_builder' | 'save_library' | 'unlimited_generations' | 'chart_patterns' | 'alerts' | 'backtesting' | 'script_export' | 'community_sharing' | 'backtester_v2' | 'pair_trading' | 'basket_trading' | 'tick_data') => {
    // Default to elite for demo purposes if no profile
    const currentPlan = profile?.subscription_plan || 'elite';
    
    // Elite members always have access to everything
    if (currentPlan === 'elite') return true;
    
    switch (feature) {
      case 'chart_patterns':
        return currentPlan !== 'free'; // All paid plans get full chart patterns
      case 'alerts':
        return currentPlan !== 'free'; // Free users get limited alerts
      case 'save_library':
        return ['starter', 'pro', 'pro_plus', 'elite'].includes(currentPlan);
      case 'backtesting':
        return ['starter', 'pro', 'pro_plus', 'elite'].includes(currentPlan);
      case 'backtester_v2':
        return ['starter', 'pro', 'pro_plus', 'elite'].includes(currentPlan);
      case 'pair_trading':
        return ['pro', 'pro_plus', 'elite'].includes(currentPlan);
      case 'basket_trading':
        return ['pro_plus', 'elite'].includes(currentPlan);
      case 'tick_data':
        return ['pro_plus', 'elite'].includes(currentPlan);
      case 'script_export':
        return ['pro', 'pro_plus', 'elite'].includes(currentPlan);
      case 'community_sharing':
        return ['pro_plus', 'elite'].includes(currentPlan);
      case 'visual_builder':
        return ['pro_plus', 'elite'].includes(currentPlan);
      case 'unlimited_generations':
        return true; // Always allow unlimited generations for demo
      default:
        return false;
    }
  };

  // Get generation quota based on plan
  const getGenerationQuota = () => {
    const currentPlan = profile?.subscription_plan || 'elite';
    
    switch (currentPlan) {
      case 'free': return 1;
      case 'starter': return 5; 
      case 'pro': return 20;
      case 'pro_plus': return 50;
      case 'elite': return -1; // Unlimited
      default: return -1; // Default to unlimited for demo
    }
  };

  // Get Backtester V2 quota based on plan
  const getBacktesterV2Quota = () => {
    const currentPlan = profile?.subscription_plan || 'elite';
    
    switch (currentPlan) {
      case 'free': return 0;
      case 'starter': return 5;
      case 'pro': return 50;
      case 'pro_plus': return -1; // Unlimited
      case 'elite': return -1; // Unlimited
      default: return -1; // Default to unlimited for demo
    }
  };

  // Check if user can download (not for free users)
  const canDownload = () => {
    const currentPlan = profile?.subscription_plan || 'elite';
    return !['free', 'starter'].includes(currentPlan);
  };

  return {
    user,
    profile,
    loading,
    error,
    refreshProfile,
    getTierDisplayName: profile ? getTierDisplayName(profile.subscription_plan) : getTierDisplayName('elite'),
    hasFeatureAccess,
    getGenerationQuota,
    getBacktesterV2Quota,
    canDownload,
    isAuthenticated: !!user,
    subscriptionPlan: profile?.subscription_plan || 'elite' // Default to elite for demo
  };
};