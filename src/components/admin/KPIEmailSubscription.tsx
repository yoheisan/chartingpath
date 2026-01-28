import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, Send, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KPISubscription {
  id: string;
  email: string;
  is_active: boolean;
  frequency: string;
  last_sent_at: string | null;
  include_journey_analytics: boolean;
  include_user_stats: boolean;
  include_revenue_metrics: boolean;
  include_broken_paths: boolean;
}

export function KPIEmailSubscription() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [subscription, setSubscription] = useState<KPISubscription | null>(null);
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [includeJourney, setIncludeJourney] = useState(true);
  const [includeUsers, setIncludeUsers] = useState(true);
  const [includeRevenue, setIncludeRevenue] = useState(true);
  const [includeBrokenPaths, setIncludeBrokenPaths] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('admin_kpi_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        return;
      }

      if (data) {
        setSubscription(data);
        setEmail(data.email);
        setIsActive(data.is_active);
        setFrequency(data.frequency);
        setIncludeJourney(data.include_journey_analytics);
        setIncludeUsers(data.include_user_stats);
        setIncludeRevenue(data.include_revenue_metrics);
        setIncludeBrokenPaths(data.include_broken_paths);
      } else {
        // Pre-fill with user email
        setEmail(user.email || '');
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSubscription = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to receive reports.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const subscriptionData = {
        user_id: user.id,
        email,
        is_active: isActive,
        frequency,
        include_journey_analytics: includeJourney,
        include_user_stats: includeUsers,
        include_revenue_metrics: includeRevenue,
        include_broken_paths: includeBrokenPaths,
      };

      if (subscription) {
        const { error } = await supabase
          .from('admin_kpi_subscriptions')
          .update(subscriptionData)
          .eq('id', subscription.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('admin_kpi_subscriptions')
          .insert(subscriptionData)
          .select()
          .single();

        if (error) throw error;
        setSubscription(data);
      }

      toast({
        title: 'Subscription Saved',
        description: isActive 
          ? `You'll receive ${frequency} KPI reports at ${email}`
          : 'Email reports are currently disabled',
      });
    } catch (error) {
      console.error('Error saving subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to save subscription settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address first.',
        variant: 'destructive',
      });
      return;
    }

    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-weekly-kpi-report');

      if (error) throw error;

      toast({
        title: 'Test Email Sent',
        description: data?.message || `Report sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test email. Check edge function logs.',
        variant: 'destructive',
      });
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Weekly KPI Email Reports</CardTitle>
              <CardDescription>
                Receive automated performance insights in your inbox
              </CardDescription>
            </div>
          </div>
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Enable Email Reports</p>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Reports will be sent automatically' : 'No reports will be sent'}
              </p>
            </div>
          </div>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email">Recipient Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@yourcompany.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Frequency */}
        <div className="space-y-2">
          <Label>Report Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly (Recommended)</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Report Contents */}
        <div className="space-y-3">
          <Label>Report Contents</Label>
          <div className="grid gap-3">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Journey Analytics & Health Score</span>
              <Switch checked={includeJourney} onCheckedChange={setIncludeJourney} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">User Statistics</span>
              <Switch checked={includeUsers} onCheckedChange={setIncludeUsers} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Revenue Metrics</span>
              <Switch checked={includeRevenue} onCheckedChange={setIncludeRevenue} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">Broken Paths & Alerts</span>
              <Switch checked={includeBrokenPaths} onCheckedChange={setIncludeBrokenPaths} />
            </div>
          </div>
        </div>

        {/* Last Sent Info */}
        {subscription?.last_sent_at && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            Last sent: {new Date(subscription.last_sent_at).toLocaleString()}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={saveSubscription} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            onClick={sendTestEmail} 
            disabled={sendingTest || !email}
          >
            {sendingTest ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
