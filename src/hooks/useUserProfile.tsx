import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: "starter" | "pro" | "pro_plus" | "elite";
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
      case 'pro': return 'Pro';
      case 'pro_plus': return 'Pro+';
      case 'elite': return 'Elite';
      default: return 'Starter';
    }
  };

  // Helper function to check feature access
  const hasFeatureAccess = (feature: 'visual_builder' | 'save_library' | 'unlimited_generations') => {
    if (!profile) return false;
    
    switch (feature) {
      case 'visual_builder':
        return ['pro_plus', 'elite'].includes(profile.subscription_plan);
      case 'save_library':
        return ['pro_plus', 'elite'].includes(profile.subscription_plan);
      case 'unlimited_generations':
        return profile.subscription_plan === 'elite';
      default:
        return false;
    }
  };

  // Get generation quota based on plan
  const getGenerationQuota = () => {
    if (!profile) return 0;
    
    switch (profile.subscription_plan) {
      case 'pro': return 5;
      case 'pro_plus': return 20;
      case 'elite': return 100;
      default: return 0;
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    refreshProfile,
    getTierDisplayName: profile ? getTierDisplayName(profile.subscription_plan) : 'Starter',
    hasFeatureAccess,
    getGenerationQuota,
    isAuthenticated: !!user,
    subscriptionPlan: profile?.subscription_plan || 'starter'
  };
};