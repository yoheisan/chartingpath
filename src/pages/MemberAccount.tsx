import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Settings, Crown, Star, Zap, ArrowLeft, Mail, Calendar, Shield, CreditCard } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MemberNavigation from "@/components/MemberNavigation";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  subscription_plan: 'starter' | 'pro' | 'elite';
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

const MemberAccount = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        await fetchProfile(user.id);
        setEmail(user.email || "");
      } else {
        navigate('/auth');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile fetch error:', error);
        return;
      }

      setProfile(data || {
        id: '',
        user_id: userId,
        email: user?.email || '',
        subscription_plan: 'starter',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const updateEmail = async () => {
    if (!email || email === user?.email) {
      toast({
        title: "No Changes",
        description: "Email is the same as current email",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email Update Sent",
        description: "Check your new email address to confirm the change",
      });
    } catch (error) {
      console.error('Email update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        title: "Password Error",
        description: "Passwords don't match or are empty",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully",
      });

      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Password update error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro': return <Star className="h-4 w-4" />;
      case 'elite': return <Crown className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'from-blue-500 to-purple-500';
      case 'elite': return 'from-purple-500 to-pink-500';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading account...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground mb-8">
              Please log in to access your account settings.
            </p>
            <Button asChild>
              <Link to="/auth">Log In</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        {/* Member Navigation */}
        <MemberNavigation />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
              <User className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Account Settings
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage your account, subscription, and preferences
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Account Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="font-semibold text-foreground">{user.email}</h3>
                  <p className="text-sm text-muted-foreground">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan</span>
                    <Badge className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} text-white`}>
                      {getPlanIcon(profile.subscription_plan)}
                      <span className="ml-1 capitalize">{profile.subscription_plan}</span>
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={profile.subscription_status === 'active' ? 'default' : 'secondary'}>
                      {profile.subscription_status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Member ID</span>
                    <span className="text-sm font-mono">{user.id.slice(0, 8)}</span>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to="/pricing">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Link>
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="w-full">
                        Sign Out
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Sign Out</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to sign out of your account?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleSignOut}>
                          Sign Out
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Account Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Email Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Settings
                </CardTitle>
                <CardDescription>
                  Update your email address for account notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </div>
                <Button onClick={updateEmail} disabled={updating}>
                  {updating ? "Updating..." : "Update Email"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  You'll receive a confirmation email to verify the new address
                </p>
              </CardContent>
            </Card>

            {/* Password Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password Settings
                </CardTitle>
                <CardDescription>
                  Change your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
                <Button onClick={updatePassword} disabled={updating}>
                  {updating ? "Updating..." : "Update Password"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
              </CardContent>
            </Card>

            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
                <CardDescription>
                  Your current plan and benefits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold capitalize">{profile.subscription_plan} Plan</h4>
                      <Badge className={`bg-gradient-to-r ${getPlanColor(profile.subscription_plan)} text-white`}>
                        {getPlanIcon(profile.subscription_plan)}
                        <span className="ml-1">Active</span>
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {profile.subscription_plan === 'starter' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Basic Pip & Risk Calculators</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Free Community Access</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-red-500">✗</span>
                            <span>No Chart Pattern Alerts</span>
                          </div>
                        </>
                      )}
                      
                      {profile.subscription_plan === 'pro' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Advanced Script Library (20+ scripts)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Chart Pattern Email Alerts (3 alerts)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Video Course: Zero to First Bot</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Premium Community Access</span>
                          </div>
                        </>
                      )}

                      {profile.subscription_plan === 'elite' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Everything in Pro</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Unlimited Chart Pattern Alerts</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Priority Support</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            <span>Script Generator Early Access</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link to="/pricing">Compare Plans</Link>
                    </Button>
                    {profile.subscription_plan === 'starter' && (
                      <Button asChild>
                        <Link to="/pricing">Upgrade Now</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberAccount;