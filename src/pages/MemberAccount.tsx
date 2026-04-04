import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import MemberNavigation from "@/components/MemberNavigation";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DataProviderSettings } from "@/components/settings/DataProviderSettings";
import { User, Settings, Shield, Crown, Star, KeyRound, CheckCircle, Database } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackCheckoutCompleted } from "@/services/analytics";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: 'free' | 'starter' | 'pro' | 'pro_plus' | 'elite';
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user' | null;

const MemberAccount = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setCheckoutSuccess(true);
      trackCheckoutCompleted({ plan: 'unknown', billing_cycle: 'monthly' });
      // Clean up the URL
      searchParams.delete('session_id');
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await Promise.all([
          fetchProfile(user.id),
          fetchUserRole(user.id)
        ]);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (data?.role) {
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error('Role fetch error:', error);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setProfile(data || {
        id: '',
        user_id: userId,
        email: user?.email || '',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email address found for your account.",
        variant: "destructive",
      });
      return;
    }

    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox for a link to reset your password.",
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MemberNavigation />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {checkoutSuccess && (
          <Alert className="mb-6 border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
             {t('memberAccount.paymentSuccess')}
             </AlertDescription>
          </Alert>
        )}

         <div className="text-center mb-8">
           <h1 className="text-3xl font-bold mb-2">{t('memberAccount.title')}</h1>
           <p className="text-muted-foreground">{t('memberAccount.subtitle')}</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
           <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">{t('memberAccount.profile')}</TabsTrigger>
              <TabsTrigger value="subscription">{t('memberAccount.subscription')}</TabsTrigger>
              <TabsTrigger value="data-providers">{t('account.dataProviders', 'Data Providers')}</TabsTrigger>
              <TabsTrigger value="preferences">{t('memberAccount.preferences')}</TabsTrigger>
            </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                   <User className="h-5 w-5" />
                   {t('memberAccount.profileInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 ${
                    userRole === 'super_admin' || userRole === 'admin' 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                      : 'bg-gradient-to-r from-primary to-accent'
                  }`}>
                    {userRole === 'super_admin' || userRole === 'admin' ? (
                      <Crown className="h-8 w-8" />
                    ) : (
                      user?.email?.charAt(0).toUpperCase()
                    )}
                  </div>
                  <h3 className="font-semibold">{user?.email}</h3>
                  
                  {/* Role Badge */}
                  <div className="flex justify-center gap-2 mt-2">
                    {userRole === 'super_admin' && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                        <Crown className="h-3 w-3 mr-1" />
                        Super Admin
                      </Badge>
                    )}
                    {userRole === 'admin' && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                    {userRole === 'moderator' && (
                      <Badge variant="secondary">
                        <Star className="h-3 w-3 mr-1" />
                        Moderator
                      </Badge>
                    )}
                    {!userRole && (
                      <Badge variant="outline">Member</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('memberAccount.memberSince')} {profile && new Date(profile.created_at).toLocaleDateString()}
                  </p>
                  
                  {/* Admin Access Links */}
                  {(userRole === 'super_admin' || userRole === 'admin') && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">{t('memberAccount.adminAccess')}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                         <Button variant="outline" size="sm" asChild>
                           <Link to="/admin/kpi">{t('memberAccount.kpiDashboard')}</Link>
                         </Button>
                         <Button variant="outline" size="sm" asChild>
                           <Link to="/admin/credits">{t('memberAccount.creditsTool')}</Link>
                         </Button>
                         <Button variant="outline" size="sm" asChild>
                           <Link to="/admin">{t('memberAccount.adminPanel')}</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="my-6" />

                {/* Password Reset Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                     <KeyRound className="h-4 w-4" />
                     {t('memberAccount.passwordSecurity')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('memberAccount.passwordResetDesc')}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                  >
                    {sendingReset ? t('memberAccount.sendingReset') : t('memberAccount.sendPasswordReset')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>


          <TabsContent value="data-providers">
            <DataProviderSettings userId={profile?.user_id} />
          </TabsContent>

          <TabsContent value="preferences">
            <NotificationSettings userId={profile?.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MemberAccount;