import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackOptions {
  sessionId?: string;
  userId?: string;
}

export function useCopilotFeedback(options: FeedbackOptions = {}) {
  const sessionIdRef = useRef(options.sessionId || crypto.randomUUID());

  const trackQuestion = useCallback(async (question: string, response?: string) => {
    try {
      // Get current user if available
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.functions.invoke('analyze-copilot-feedback', {
        body: {
          question,
          response,
          sessionId: sessionIdRef.current,
          userId: user?.id || options.userId,
        }
      });
    } catch (error) {
      // Don't block the UI on analytics failures
      console.error('[CopilotFeedback] Failed to track:', error);
    }
  }, [options.userId]);

  return {
    trackQuestion,
    sessionId: sessionIdRef.current,
  };
}
