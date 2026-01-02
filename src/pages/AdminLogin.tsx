import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, ArrowLeft, Key } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    const waitForSession = async () => {
      for (let i = 0; i < 6; i++) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) return session;
        await new Promise((r) => setTimeout(r, 250));
      }
      return null;
    };

    // Check for reset password parameter and verify session
    const checkPasswordReset = async () => {
      const resetParam = searchParams.get("reset");

      if (resetParam === "true") {
        try {
          // PKCE recovery links arrive as ?reset=true&code=...
          const code = searchParams.get("code");
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);
            if (error) throw error;

            // Remove one-time params to avoid re-processing on refresh
            const next = new URL(window.location.href);
            next.searchParams.delete("code");
            next.searchParams.delete("state");
            window.history.replaceState(
              {},
              document.title,
              `${next.pathname}?${next.searchParams.toString()}`
            );
          }

          const session = await waitForSession();

          if (session && isMounted) {
            setIsResetPassword(true);
            setIsForgotPassword(false);
          } else if (isMounted) {
            // No session found - the reset link may have expired
            toast({
              title: "Reset Link Expired",
              description:
                "This password reset link has expired or already been used. Please request a new one.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          if (!isMounted) return;
          toast({
            title: "Reset Link Error",
            description: error?.message || "Unable to verify the reset link. Please request a new one.",
            variant: "destructive",
          });
        }

        return;
      }

      // Check if user is already logged in as admin
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isMounted) {
        const { data: adminCheck } = await supabase.rpc("is_admin", { _user_id: user.id });
        if (adminCheck) {
          navigate("/admin/translation-management");
        }
      }
    };

    checkPasswordReset();

    // Set up auth state listener to handle password reset flows
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      if (event === 'PASSWORD_RECOVERY') {
        // User clicked password reset link and is now authenticated
        setIsResetPassword(true);
        setIsForgotPassword(false);
      }
      // Note: Don't auto-redirect on SIGNED_IN here - let the form handler do it
      // to avoid race conditions with the login form submission
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, searchParams, toast]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/login?reset=true`
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description: "Please check your email for password reset instructions",
      });
      
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({
        title: "Reset Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated. You can now log in.",
      });

      // Reset form and redirect to login
      setIsResetPassword(false);
      setNewPassword("");
      setConfirmPassword("");
      navigate("/admin/login");
    } catch (error: any) {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // First, authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Check if user has admin privileges
        const { data: isAdminUser, error: roleError } = await supabase
          .rpc('is_admin', { _user_id: data.user.id });

        if (roleError) {
          throw new Error("Failed to verify admin privileges");
        }

        if (!isAdminUser) {
          await supabase.auth.signOut();
          throw new Error("Access denied. Admin privileges required.");
        }

        // Log admin session
        const { error: sessionError } = await supabase
          .from('admin_sessions')
          .insert({
            user_id: data.user.id,
            ip_address: null, // Could be enhanced to capture real IP
            user_agent: navigator.userAgent
          });

        if (sessionError) {
          console.error('Failed to log admin session:', sessionError);
        }

        toast({
          title: "Admin Access Granted",
          description: "Welcome to the admin dashboard",
        });

        navigate("/admin/translation-management");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-md">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
                <Shield className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isResetPassword ? "Set New Password" : isForgotPassword ? "Reset Password" : "Admin Portal"}
            </CardTitle>
            <CardDescription>
              {isResetPassword 
                ? "Enter your new admin password"
                : isForgotPassword 
                ? "Enter your admin email to receive password reset instructions"
                : "Secure access for platform administrators"
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isResetPassword ? (
              // Reset Password Form
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Key className="h-4 w-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setIsResetPassword(false);
                    navigate("/admin/login");
                  }}
                >
                  Back to Admin Login
                </Button>
              </form>
            ) : isForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="Enter your admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Reset Link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                >
                  Back to Admin Login
                </Button>
              </form>
            ) : (
              // Regular Admin Login Form
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      type="email"
                      placeholder="Enter your admin email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminPassword"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Forgot Password?
                  </Button>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Login
                    </>
                  )}
                </Button>
              </form>
            )}

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground text-center">
                <Shield className="inline h-4 w-4 mr-1" />
                Admin access requires special privileges. Contact the super administrator if you need access.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;