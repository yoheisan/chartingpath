import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface NotificationSettingsProps {
  userId?: string;
}

/**
 * Notification settings panel for managing push and email notifications.
 * Persists preferences to the profiles table in Supabase.
 */
export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushDbEnabled, setPushDbEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    isSupported,
    permission,
    isSubscribed,
    loading: pushLoading,
    subscribe,
    unsubscribe,
  } = usePushNotifications(userId);

  // Load preferences from database
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email_notifications_enabled, push_notifications_enabled')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[NotificationSettings] Error loading preferences:', error);
          return;
        }

        if (data) {
          setEmailEnabled(data.email_notifications_enabled ?? true);
          setPushDbEnabled(data.push_notifications_enabled ?? true);
        }
      } catch (err) {
        console.error('[NotificationSettings] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const savePreference = async (field: 'email_notifications_enabled' | 'push_notifications_enabled', value: boolean) => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Notification preference saved');
    } catch (err: any) {
      console.error('[NotificationSettings] Save error:', err);
      toast.error('Failed to save preference');
      // Revert on error
      if (field === 'email_notifications_enabled') {
        setEmailEnabled(!value);
      } else {
        setPushDbEnabled(!value);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToggle = async (enabled: boolean) => {
    setEmailEnabled(enabled);
    await savePreference('email_notifications_enabled', enabled);
  };

  const handlePushDbToggle = async (enabled: boolean) => {
    setPushDbEnabled(enabled);
    await savePreference('push_notifications_enabled', enabled);
  };

  const handlePushSubscriptionToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      // If subscription succeeds, also enable in database
      if (success && !pushDbEnabled) {
        setPushDbEnabled(true);
        await savePreference('push_notifications_enabled', true);
      }
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
        {/* Push Notifications - Browser Subscription */}
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
            ) : pushLoading || saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : permission === 'default' ? (
              <Button
                size="sm"
                onClick={handlePushSubscriptionToggle}
                disabled={pushLoading}
              >
                Enable
              </Button>
            ) : (
              <Switch
                id="push-notifications"
                checked={isSubscribed}
                onCheckedChange={handlePushSubscriptionToggle}
              />
            )}
          </div>
        </div>

        {/* Permission Status Messages */}
        {isSupported && permission === 'default' && (
          <div className="rounded-lg bg-muted p-3 text-sm space-y-2">
            <p className="text-muted-foreground">
              Click "Enable" to receive real-time pattern alerts in your browser. You'll be asked to allow notifications.
            </p>
            {window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovable.dev') ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Testing in preview? Push notifications work best on your published app URL.
              </p>
            ) : null}
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm space-y-3">
            <p className="text-destructive font-medium">
              Push notifications are blocked by your browser.
            </p>
            {window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovable.dev') ? (
              <p className="text-muted-foreground text-xs">
                You're in the Lovable preview. To enable push notifications, <strong>publish your app</strong> and test on your published URL—push permissions are tied to the domain.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium text-xs">How to unblock in Chrome:</p>
                <ol className="text-muted-foreground text-xs list-decimal list-inside space-y-1.5">
                  <li>Click the <strong>lock / tune icon</strong> (🔒) in the address bar (left of the URL)</li>
                  <li>Click <strong>"Site settings"</strong></li>
                  <li>Find <strong>"Notifications"</strong> and change it from "Block" to <strong>"Allow"</strong></li>
                  <li>Come back to this tab and <strong>refresh the page</strong></li>
                </ol>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  I've allowed it — Refresh now
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Push Preference (database toggle) - only show if subscribed */}
        {isSubscribed && (
          <div className="flex items-center justify-between pl-6 border-l-2 border-muted">
            <div className="space-y-1">
              <Label htmlFor="push-db-enabled" className="text-sm">
                Pattern Alert Push
              </Label>
              <p className="text-xs text-muted-foreground">
                Send push when patterns are detected
              </p>
            </div>
            <Switch
              id="push-db-enabled"
              checked={pushDbEnabled}
              onCheckedChange={handlePushDbToggle}
              disabled={saving}
            />
          </div>
        )}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="space-y-1">
            <Label htmlFor="email-notifications" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive pattern alerts via email
            </p>
          </div>
          <Switch
            id="email-notifications"
            checked={emailEnabled}
            onCheckedChange={handleEmailToggle}
            disabled={saving}
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
