import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { trackSignupCompleted } from "@/services/analytics";
import { getCanonicalAppOrigin, redirectToCanonicalOriginIfNeeded } from "@/utils/canonicalOrigin";


const Auth = () => {
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/members/trading";
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recoveryHint, setRecoveryHint] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = window.setInterval(() => {
      setResetCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [resetCooldown]);

  useEffect(() => {
    redirectToCanonicalOriginIfNeeded();

    // Check URL for recovery token
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const hasCallbackParams =
      urlParams.get("code") !== null ||
      hashParams.get("type") === "recovery" ||
      hashParams.get("access_token") !== null ||
      hashParams.get("refresh_token") !== null;

    const resetFlag = urlParams.get("reset") === "true" || urlParams.get("type") === "recovery";

    // If we arrived here with reset=true but WITHOUT callback params, it means the recovery link
    // was not successfully verified (common causes: opened in a different browser/device,
    // or an in-app email webview that blocks storage).
    if (resetFlag && !hasCallbackParams) {
      setIsSignUp(false);
      setIsResetPassword(false);
      setIsForgotPassword(true);
      setRecoveryHint(
        "We couldn’t verify the reset link in this browser. Request ONE new reset email from the same browser/device you will open it on, then open ONLY the newest email link once."
      );
      return;
    }

    const isRecovery = resetFlag || hasCallbackParams;

    if (isRecovery) {
      // Run the recovery exchange exactly once (StrictMode-safe), then show reset UI.
      (async () => {
        setLoading(true);

        try {
          const { hasPersistentBrowserStorage } = await import("@/utils/safeStorage");
          if (!hasPersistentBrowserStorage()) {
            setIsSignUp(false);
            setIsResetPassword(false);
            setIsForgotPassword(true);
            setRecoveryHint(
              "Your email app/browser is blocking local storage (common in in-app browsers/private mode). Open the reset link in Safari/Chrome, then try again."
            );
            toast({
              title: "Browser storage blocked",
              description:
                "This environment blocks local storage (common in in-app browsers/private mode), so password reset links can’t be verified here. Please open the link in a standard browser (Safari/Chrome) and try again.",
              variant: "destructive",
            });
            return;
          }

          const { exchangeRecoverySessionFromUrlOnce, waitForSupabaseSession, cleanRecoveryUrl } =
            await import("@/utils/supabaseRecovery");

          await exchangeRecoverySessionFromUrlOnce(supabase);
          cleanRecoveryUrl();

          const session = await waitForSupabaseSession(supabase);

          if (session) {
            setRecoveryHint(null);
            setIsForgotPassword(false);
            setIsResetPassword(true);
          } else {
            // Link was invalid/expired/used (or consumed by a mail security scanner).
            setIsSignUp(false);
            setIsResetPassword(false);
            setIsForgotPassword(true);
            setRecoveryHint(
              "That reset link is invalid/expired. Request ONE new reset email and open ONLY the newest email link once."
            );
            toast({
              title: "Reset Link Expired",
              description:
                "This password reset link has expired or already been used. Please request a new one, then open ONLY the newest email link once.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          const message =
            typeof error?.message === "string"
              ? error.message
              : "Unable to verify the reset link. Please request a new one.";

          const isPkceVerifierIssue =
            /code verifier|code_verifier|bad_code_verifier|code challenge does not match|flow state/i.test(
              message
            );

          if (isPkceVerifierIssue) {
            setIsSignUp(false);
            setIsResetPassword(false);
            setIsForgotPassword(true);
            setRecoveryHint(
              "This link doesn’t match a reset request from this browser/device. Please request ONE new reset email from the same browser/device you will open it on, then open ONLY the newest email link once."
            );
          }

          toast({
            title: "Reset Link Error",
            description: isPkceVerifierIssue
              ? "This reset link doesn't match the most recent reset request in this browser/device. Request ONE new reset email from the SAME browser/device you will open it on, then open ONLY the newest email link once."
              : message,
            variant: "destructive",
          });
        } finally {
          setLoading(false);
        }
      })();

      return;
    }

    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        navigate(redirectPath);
      }
    };
    checkUser();

    // Listen for auth changes (keep callback synchronous to avoid auth deadlocks)
    const ensureProfileForUser = async (user: any) => {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existingProfile) {
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email,
          subscription_plan: "starter",
        });

        if (profileError) {
          // eslint-disable-next-line no-console
          console.error("Profile creation error:", profileError);
        } else {
          trackSignupCompleted();
        }
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const user = session.user;
        // Defer Supabase calls outside the callback.
        setTimeout(() => {
          void ensureProfileForUser(user).finally(() => {
            navigate(redirectPath);
          });
        }, 0);
      } else if (event === "PASSWORD_RECOVERY") {
        setIsResetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectPath, toast]);

  const handleSocialAuth = async (provider: 'google' | 'linkedin_oidc' | 'facebook' | 'apple' | 'twitter') => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${getCanonicalAppOrigin()}/auth/?reset=true`
      });

      if (error) throw error;

      toast({
        title: "Reset Email Sent",
        description:
          "Please check your email for the reset link. Open the MOST RECENT email link once (older links will fail).",
      });

      setResetCooldown(60);
      // Keep the user on this screen so they don't accidentally request multiple emails.
      setIsForgotPassword(true);
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

    try {
      if (password !== confirmPassword) {
        toast({
          title: "Password Mismatch",
          description: "Passwords do not match",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated",
      });

      // Clear URL params and redirect
      window.history.replaceState({}, document.title, '/auth');
      setIsResetPassword(false);
      
    } catch (error: any) {
      toast({
        title: "Update Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          toast({
            title: "Password Mismatch",
            description: "Passwords do not match",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getCanonicalAppOrigin()}/members/trading`
          }
        });

        if (error) throw error;

        if (data.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              email: data.user.email,
              subscription_plan: 'starter'
            });

          if (profileError) {
            console.error('Profile creation error:', profileError);
          }
        }

        toast({
          title: "Account Created",
          description: "Please check your email to verify your account",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome Back",
          description: "You have been logged in successfully",
        });

        navigate(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
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

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isResetPassword ? "Set New Password" : isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isResetPassword
                ? "Enter your new password below"
                : isForgotPassword 
                  ? "Enter your email to receive password reset instructions"
                  : isSignUp 
                    ? "Sign up to access chart pattern alerts and member features"
                    : "Sign in to your ChartingPath account"
              }
            </CardDescription>
          </CardHeader>

           <CardContent>
             {recoveryHint ? (
               <div className="mb-4 rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                 {recoveryHint}
               </div>
             ) : null}

             {isResetPassword ? (
              // Password Reset Form
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
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
                    "Update Password"
                  )}
                </Button>
              </form>
            ) : isForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading || resetCooldown > 0}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending Reset Link...
                    </>
                  ) : resetCooldown > 0 ? (
                    `Resend in ${resetCooldown}s`
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
                  Back to Sign In
                </Button>
              </form>
            ) : (
              // Regular Auth Form
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {!isSignUp && (
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
                  )}

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isSignUp ? "Creating Account..." : "Signing In..."}
                      </>
                    ) : (
                      isSignUp ? "Create Account" : "Sign In"
                    )}
                  </Button>
                </form>

                {/* Social Authentication - Only show if not in forgot password mode */}
                <div className="mt-6 space-y-4">
                  <div className="relative">
                    <Separator />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-background px-2 text-sm text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('apple')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Apple
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('facebook')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('linkedin_oidc')}
                      disabled={loading}
                      className="w-full"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#0A66C2">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      LinkedIn
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleSocialAuth('twitter')}
                      disabled={loading}
                      className="w-full col-span-2"
                    >
                      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      Continue with X (Twitter)
                    </Button>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setIsForgotPassword(false);
                    }}
                    className="text-primary hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Sign Up"}
                  </Button>
                </div>

                {isSignUp && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground text-center">
                      By creating an account, you agree to our Terms of Service and Privacy Policy.
                      Chart pattern alerts are available for Pro and Elite subscribers only.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;