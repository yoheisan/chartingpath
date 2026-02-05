import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import MemberNavigation from "@/components/MemberNavigation";
import LearningProgress from "@/components/LearningProgress";
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { User, Settings, Shield, Crown, Star, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
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
                    Member since {profile && new Date(profile.created_at).toLocaleDateString()}
                  </p>
                  
                  {/* Admin Access Links */}
                  {(userRole === 'super_admin' || userRole === 'admin') && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">Admin Access</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/admin/kpi">KPI Dashboard</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/admin/credits">Credits Tool</Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link to="/admin">Admin Panel</Link>
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
                    Password & Security
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Click the button below to receive a password reset link via email.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={handlePasswordReset}
                    disabled={sendingReset}
                  >
                    {sendingReset ? "Sending..." : "Send Password Reset Email"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionManager />
          </TabsContent>

          <TabsContent value="learning">
            <LearningProgress />
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