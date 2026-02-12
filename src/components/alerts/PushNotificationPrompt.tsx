import { useState } from 'react';
import { Bell, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PushNotificationPromptProps {
  userId?: string;
}

/**
 * A dismissible banner prompting users to enable push notifications.
 * Always shows unless dismissed or user has already set up notifications.
 */
export function PushNotificationPrompt({ userId }: PushNotificationPromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
  };

  const scrollToSettings = () => {
    const el = document.getElementById('notification-settings');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

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
          <h4 className="font-medium text-sm">Never miss a pattern signal</h4>
          <p className="text-sm text-muted-foreground">
            Enable push notifications to get instant browser alerts when your patterns trigger. Configure your preferences below.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={scrollToSettings}
            className="mt-1"
          >
            <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
            Go to Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
