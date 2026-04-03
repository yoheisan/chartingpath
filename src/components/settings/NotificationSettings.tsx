import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, Smartphone, Loader2, Sun } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface NotificationSettingsProps {
  userId?: string;
}

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const { t } = useTranslation();
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushDbEnabled, setPushDbEnabled] = useState(true);
  const [morningBriefEnabled, setMorningBriefEnabled] = useState(true);
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
          .select('email_notifications_enabled, push_notifications_enabled, morning_brief_enabled')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('[NotificationSettings] Error loading preferences:', error);
          return;
        }

        if (data) {
          setEmailEnabled(data.email_notifications_enabled ?? true);
          setPushDbEnabled(data.push_notifications_enabled ?? true);
          setMorningBriefEnabled((data as any).morning_brief_enabled ?? true);
        }
      } catch (err) {
        console.error('[NotificationSettings] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [userId]);

  const savePreference = async (field: 'email_notifications_enabled' | 'push_notifications_enabled' | 'morning_brief_enabled', value: boolean) => {
    if (!userId) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', userId);

      if (error) throw error;

      toast.success(t('alerts.notif.preferenceSaved'));
    } catch (err: any) {
      console.error('[NotificationSettings] Save error:', err);
      toast.error(t('alerts.notif.preferenceFailed'));
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
            {t('alerts.notif.title')}
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
          {t('alerts.notif.title')}
        </CardTitle>
        <CardDescription>
          {t('alerts.notif.subtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Push Notifications - Browser Subscription */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="push-notifications" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              {t('alerts.notif.pushNotifications')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('alerts.notif.pushDesc')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSupported ? (
              <Badge variant="secondary">{t('alerts.notif.notSupported')}</Badge>
            ) : permission === 'denied' ? (
              <Badge variant="destructive">{t('alerts.notif.blocked')}</Badge>
            ) : pushLoading || saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : permission === 'default' ? (
              <Button
                size="sm"
                onClick={handlePushSubscriptionToggle}
                disabled={pushLoading}
              >
                {t('alerts.notif.enable')}
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
              {t('alerts.notif.enablePrompt')}
            </p>
            {window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovable.dev') ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ {t('alerts.notif.previewWarning')}
              </p>
            ) : null}
          </div>
        )}

        {isSupported && permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-4 text-sm space-y-3">
            <p className="text-destructive font-medium">
              {t('alerts.notif.pushBlocked')}
            </p>
            {window.location.hostname.includes('lovable.app') || window.location.hostname.includes('lovable.dev') ? (
              <p className="text-muted-foreground text-xs">
                {t('alerts.notif.publishHint')}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground font-medium text-xs">{t('alerts.notif.howToUnblock')}</p>
                <ol className="text-muted-foreground text-xs list-decimal list-inside space-y-1.5">
                  <li>{t('alerts.notif.step1')}</li>
                  <li>{t('alerts.notif.step2')}</li>
                  <li>{t('alerts.notif.step3')}</li>
                  <li>{t('alerts.notif.step4')}</li>
                </ol>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => window.location.reload()}
                >
                  {t('alerts.notif.refreshNow')}
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
                {t('alerts.notif.patternAlertPush')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('alerts.notif.patternAlertPushDesc')}
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
              {t('alerts.notif.emailNotifications')}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t('alerts.notif.emailDesc')}
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
          <p className="font-medium">{t('alerts.notif.whatYoullReceive')}</p>
          <ul className="space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-emerald-500" />
              {t('alerts.notif.patternAlertsTrigger')}
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-amber-500" />
              {t('alerts.notif.newPatternsWatchlist')}
            </li>
            <li className="flex items-center gap-2">
              <Bell className="h-3 w-3 text-blue-500" />
              {t('alerts.notif.scriptReadyAlerts')}
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
            {t('alerts.notif.sendTestNotification')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}