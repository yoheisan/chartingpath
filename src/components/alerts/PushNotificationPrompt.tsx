import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface PushNotificationPromptProps {
  userId?: string;
}

/**
 * A dismissible banner prompting users to enable push notifications.
 * Only shows when push is supported, not yet granted, and not dismissed.
 */
export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('push-prompt-dismissed') === 'true';
  });

  const { isSupported, permission, isSubscribed, loading, subscribe } = usePushNotifications(userId);

  // Don't show if: not supported, already subscribed, already granted, or dismissed
  if (!isSupported || isSubscribed || permission === 'granted' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('push-prompt-dismissed', 'true');
  };

  const handleEnable = async () => {
    await subscribe();
  };

  const isBlocked = permission === 'denied';

  return (
    <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-4 mb-6">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="rounded-full bg-primary/10 p-2 mt-0.5">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-sm">
            {isBlocked ? 'Push notifications are blocked' : 'Never miss a pattern signal'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {isBlocked
              ? 'To enable: click the lock/tune icon in your browser\'s address bar → find "Notifications" → change to "Allow" → refresh the page.'
              : 'Enable push notifications to get instant alerts when your patterns trigger — right in your browser.'}
          </p>
          {!isBlocked && (
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="mt-1"
            >
              <Bell className="h-3.5 w-3.5 mr-1.5" />
              {loading ? 'Enabling...' : 'Enable Push Notifications'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
