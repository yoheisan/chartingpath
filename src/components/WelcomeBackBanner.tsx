import { useState, useEffect } from 'react';
import { X, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const DISMISS_KEY = 'welcome-back-banner-dismissed';

const WelcomeBackBanner = () => {
  const { user, isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);
  const [lastSignIn, setLastSignIn] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Already dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const load = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('last_sign_in_at')
        .eq('user_id', user.id)
        .maybeSingle();

      const signInAt = (profile as any)?.last_sign_in_at as string | null;
      if (!signInAt) return;

      const lastDate = new Date(signInAt);
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      if (lastDate > twoDaysAgo) return; // Signed in recently

      // Count new patterns since last sign in
      const { count: newCount } = await supabase
        .from('live_pattern_detections')
        .select('id', { count: 'exact', head: true })
        .gte('detected_at', signInAt);

      if (newCount && newCount > 0) {
        setCount(newCount);
        setLastSignIn(signInAt);
        setVisible(true);
      }
    };

    load();
  }, [isAuthenticated, user]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISS_KEY, '1');
  };

  if (!visible) return null;

  const timeAgo = lastSignIn
    ? formatDistanceToNow(new Date(lastSignIn), { addSuffix: true })
    : '';

  return (
    <div className="w-full bg-primary/10 border-b border-primary/20 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            <span className="font-semibold">Welcome back</span> — {count.toLocaleString()} new pattern{count !== 1 ? 's' : ''} detected since your last visit{timeAgo ? ` (${timeAgo})` : ''}.
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default WelcomeBackBanner;
