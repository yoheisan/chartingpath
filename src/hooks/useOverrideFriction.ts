import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface OverrideConstraints {
  require_written_reason: boolean;
  cooldown_seconds: number;
}

export function useOverrideFriction() {
  const { user } = useAuth();
  const [constraints, setConstraints] = useState<OverrideConstraints | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch override constraints from active master plan
  useEffect(() => {
    if (!user?.id) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("master_plans" as any)
        .select("override_constraints")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && (data as any).override_constraints) {
        setConstraints((data as any).override_constraints as OverrideConstraints);
      }
    };
    fetch();
  }, [user?.id]);

  const isActive = constraints?.require_written_reason === true;
  const cooldownSeconds = constraints?.cooldown_seconds ?? 30;

  const startCountdown = useCallback(() => {
    if (!isActive) return;
    setCountdown(cooldownSeconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isActive, cooldownSeconds]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return {
    isActive,
    requireWrittenReason: isActive,
    countdown,
    countdownActive: countdown > 0,
    startCountdown,
    cooldownSeconds,
  };
}
