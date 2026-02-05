import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Mail, Smartphone, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface NotificationSettingsProps {
  userId?: string;
  emailEnabled?: boolean;
  onEmailChange?: (enabled: boolean) => void;
}

/**
 * Notification settings panel for managing push and email notifications.
 * Displays permission status and allows toggling notification channels.
 */
export function NotificationSettings({
  userId,
  emailEnabled = true,
  onEmailChange,
}: NotificationSettingsProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  const handlePushToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive alerts about pattern signals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Push Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive real-time alerts in your browser
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSupported ? (
              <Badge variant="secondary">Not Supported</Badge>
            ) : permission === 'denied' ? (
              <Badge variant="destructive">Blocked</Badge>
            ) : loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handlePushToggle}
              />
            )}
          </div>
        </div>

        {/* Permission Status */}
        {isSupported && permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm">
            <p className="text-destructive">
              Push notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications.
            </p>
          </div>
        )}

        {/* Email Notifications */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-1">
            <Label htmlFor="email-notifications" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive daily digests and high-priority alerts
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailEnabled}
            onCheckedChange={onEmailChange}
          />
        </div>

        {/* Notification Types Info */}
        <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
          <p className="font-medium">What you'll receive:</p>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-emerald-500" />
              Pattern alerts when signals trigger
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-amber-500" />
              New patterns on your watchlist symbols
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-blue-500" />
              Script-ready alerts with pre-built code
            </li>
          </ul>
        </div>

        {/* Test Notification */}
        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              new Notification('ChartingPath Test', {
                body: 'Push notifications are working!',
                icon: '/lovable-uploads/a1391ff3-a490-4835-ba42-3564ff90dfc7.png',
              });
            }}
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
