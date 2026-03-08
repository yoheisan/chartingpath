import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, User, CheckCircle2, BarChart3, Bell, Zap, FlaskConical, Shield, ChevronDown, Globe } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { trackSignupCompleted } from "@/services/analytics";
import { getCanonicalAppOrigin, redirectToCanonicalOriginIfNeeded } from "@/utils/canonicalOrigin";
import { getImplicitRecoveryClient } from "@/utils/implicitRecoveryClient";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase as sbClient } from "@/integrations/supabase/client";

// Fire-and-forget login attempt tracker
const trackLoginAttempt = (payload: {
  email?: string;
  success: boolean;
  method: string;
  error_message?: string;
  user_id?: string;
}) => {
  sbClient.functions.invoke("track-login", { body: payload }).catch(() => {});
};

const Auth = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const rawRedirect = searchParams.get("redirect");
  const redirectPath = (() => {
    if (!rawRedirect) return "/members/trading";
    try {
      const decoded = decodeURIComponent(rawRedirect);
      return decoded.startsWith("/") ? decoded : "/members/trading";
    } catch {
      return "/members/trading";
    }
  })();

  // Default to signup mode for new visitors (no redirect = likely new user)
  const [isSignUp, setIsSignUp] = useState(!rawRedirect);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [recoveryHint, setRecoveryHint] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetCooldown, setResetCooldown] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser, isAuthLoading } = useAuth();

  // If user is already authenticated, redirect immediately
  useEffect(() => {
    if (!isAuthLoading && authUser && !isResetPassword) {
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthLoading, authUser, isResetPassword, navigate, redirectPath]);

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

    const resetFlag = urlParams.get("reset") === "true" || urlParams.get("type") === "recovery";
    const hashTypeIsRecovery = hashParams.get("type") === "recovery";
    const hasImplicitTokens = hashParams.get("access_token") !== null || hashParams.get("refresh_token") !== null;
    const hasCode = urlParams.get("code") !== null;

    // KEY FIX: An OAuth callback (Google, etc.) returns with a `code` param
    // but WITHOUT reset/recovery indicators. We must NOT treat this as a
    // password recovery flow — let the onAuthStateChange listener handle it.
    const isOAuthCallback = hasCode && !resetFlag && !hashTypeIsRecovery;

    // OAuth callback — the useAuth() redirect effect above handles navigation
    // once PKCE exchange completes. Skip recovery logic but keep onAuthStateChange.
    if (!isOAuthCallback) {
      const hasCallbackParams = hasCode || hashTypeIsRecovery || hasImplicitTokens;

      // If we arrived here with reset=true but WITHOUT callback params, the recovery link
      // was not successfully verified (different browser/device, in-app email webview, etc.).
      if (resetFlag && !hasCallbackParams) {
        setLoading(true);
        (async () => {
          const { waitForSupabaseSession } = await import("@/utils/supabaseRecovery");
          const session = await waitForSupabaseSession(supabase, { attempts: 15, delayMs: 200 });

          if (session) {
            setRecoveryHint(null);
            setIsForgotPassword(false);
            setIsResetPassword(true);
            return;
          }

          setIsSignUp(false);
          setIsResetPassword(false);
          setIsForgotPassword(true);
          setRecoveryHint(
            "We couldn't verify the reset link in this browser. Request ONE new reset email from the same browser/device you will open it on, then open ONLY the newest email link once."
          );
        })().finally(() => setLoading(false));
        // Don't return — still register the listener below
      }

      const isRecovery = resetFlag || hasCallbackParams;

      if (isRecovery) {
        // Run the recovery exchange exactly once (StrictMode-safe), then show reset UI.
        (async () => {
          setLoading(true);

          try {
            const url = new URL(window.location.href);
            const hash = url.hash.startsWith("#") ? url.hash.substring(1) : "";
            const innerHashParams = new URLSearchParams(hash);
            const hasImplicitSessionTokens = Boolean(
              innerHashParams.get("access_token") && innerHashParams.get("refresh_token")
            );

            const { hasPersistentBrowserStorage } = await import("@/utils/safeStorage");

            if (!hasPersistentBrowserStorage() && !hasImplicitSessionTokens) {
              setIsSignUp(false);
              setIsResetPassword(false);
              setIsForgotPassword(true);
              setRecoveryHint(
                "Your email app/browser is blocking local storage (common in in-app browsers/private mode). Open the reset link in Safari/Chrome, then try again."
              );
              toast({
                title: "Browser storage blocked",
                description:
                  "This environment blocks local storage (common in in-app browsers/private mode), so password reset links can't be verified here. Please open the link in a standard browser (Safari/Chrome) and try again.",
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
                "This link doesn't match a reset request from this browser/device. Please request ONE new reset email from the same browser/device you will open it on, then open ONLY the newest email link once."
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
      }
    }

    // Always register onAuthStateChange to handle OAuth & sign-in events
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
        const provider = user.app_metadata?.provider;

        // Detect first-ever login (new signup via OAuth)
        const isNewUser =
          user.created_at &&
          user.last_sign_in_at &&
          Math.abs(new Date(user.created_at).getTime() - new Date(user.last_sign_in_at).getTime()) < 10_000;

        if (isNewUser && provider && provider !== "email") {
          (window as any).gtag?.('event', 'sign_up', { method: provider });
        }

        // Track OAuth / auto sign-in (password logins tracked separately)
        if (provider && provider !== "email") {
          trackLoginAttempt({ email: user.email, success: true, method: provider, user_id: user.id });
        }

        setTimeout(() => {
          void ensureProfileForUser(user).finally(() => {
            // New OAuth users → dashboard; returning users → redirect path
            const dest = isNewUser ? '/members/dashboard' : redirectPath;
            navigate(dest);
          });
        }, 0);
      } else if (event === "PASSWORD_RECOVERY") {
        setIsResetPassword(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirectPath, toast]);

  const handleSocialAuth = async (provider: 'google') => {
    setLoading(true);
    
    try {
      const oauthRedirectTo = `${getCanonicalAppOrigin()}/auth/?redirect=${encodeURIComponent(redirectPath)}`;

      // Detect if we're on a custom domain (not Lovable preview/project domains)
      const isCustomDomain =
        !window.location.hostname.includes("lovable.app") &&
        !window.location.hostname.includes("lovableproject.com");

      if (isCustomDomain) {
        // Bypass auth-bridge by getting OAuth URL directly
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: oauthRedirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        // For Lovable domains, use normal flow (auth-bridge handles it)
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: oauthRedirectTo,
            skipBrowserRedirect: true,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      }
    } catch (error: any) {
      toast({
        title: t('auth.toastAuthError'),
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
      const implicitClient = getImplicitRecoveryClient();

      const { error } = await implicitClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${getCanonicalAppOrigin()}/auth/?reset=true`,
      });

      if (error) throw error;

      toast({
        title: t('auth.toastResetEmailSent'),
        description: t('auth.toastCheckResetEmail'),
      });

      setResetCooldown(60);
      // Keep the user on this screen so they don't accidentally request multiple emails.
      setIsForgotPassword(true);
    } catch (error: any) {
      toast({
        title: t('auth.toastResetError'),
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
          title: t('auth.toastPasswordMismatch'),
          description: t('auth.toastPasswordsDoNotMatch'),
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
        title: t('auth.toastPasswordUpdated'),
        description: t('auth.toastPasswordUpdatedDesc'),
      });

      // Clear URL params and redirect
      window.history.replaceState({}, document.title, '/auth');
      setIsResetPassword(false);
      
    } catch (error: any) {
      toast({
        title: t('auth.toastUpdateError'),
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

    trackEvent("auth_page.submitted", { mode: isSignUp ? "register" : "login" });

    try {
      if (isSignUp) {

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getCanonicalAppOrigin()}/auth/?redirect=${encodeURIComponent(
              "/members/trading"
            )}`,
          }
        });

        if (error) throw error;

        if (data.user) {
          // Fire GA4 signup conversion event
          (window as any).gtag?.('event', 'sign_up', { method: 'email' });

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
          title: t('auth.toastAccountCreated'),
          description: t('auth.toastCheckEmail'),
        });
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          trackLoginAttempt({ email, success: false, method: "password", error_message: error.message });
          throw error;
        }

        trackLoginAttempt({ email, success: true, method: "password", user_id: data.user?.id });

        // Fire GA4 login event
        (window as any).gtag?.('event', 'login', { method: 'email' });

        toast({
          title: t('auth.toastWelcomeBack'),
          description: t('auth.toastSignedIn'),
        });

        navigate(redirectPath);
      }
    } catch (error: any) {
      toast({
        title: t('auth.toastAuthError'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Track auth page view and abandonment
  const formInteracted = useRef(false);
  
  useEffect(() => {
    const context = searchParams.get("context") || "direct";
    const pattern = searchParams.get("pattern");
    const symbol = searchParams.get("symbol");
    trackEvent("auth_page.viewed", { context, pattern: pattern || undefined, symbol: symbol || undefined });
    
    return () => {
      if (!formInteracted.current) {
        trackEvent("auth_page.abandoned", { context, had_interaction: false });
      }
    };
  }, []);
  
  const handleFormInteraction = () => {
    if (!formInteracted.current) {
      formInteracted.current = true;
      trackEvent("auth_page.form_start", {});
    }
  };

  // Contextual messaging from URL params
  const sharedContext = searchParams.get("context");
  const sharedPattern = searchParams.get("pattern");
  const sharedSymbol = searchParams.get("symbol");

  // Context-based headline for the auth page
  const contextHeadline = (() => {
    switch (sharedContext) {
      case 'screener':
        return t('auth.contextScreener');
      case 'backtest':
        return t('auth.contextBacktest');
      case 'shared_backtest':
        return sharedPattern 
          ? (sharedSymbol 
              ? t('auth.contextSharedBacktestSymbol', { pattern: decodeURIComponent(sharedPattern), symbol: decodeURIComponent(sharedSymbol) })
              : t('auth.contextSharedBacktest', { pattern: decodeURIComponent(sharedPattern) }))
          : t('auth.contextCreateAlerts');
      case 'alert':
        return t('auth.contextAlert');
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Top bar: Back + Language switcher for guests */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('auth.backToHome')}
          </Link>
          {!authUser && (
            <LanguageSwitcher />
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          {/* Left column: Value proposition */}
          <div className="space-y-6 md:pt-4">
            {/* Contextual message based on where user came from */}
            {contextHeadline && (
              <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-sm font-medium text-foreground">
                  🎯 {contextHeadline}
                </p>
              </div>
            )}
            
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('auth.headline')}</h2>
              <p className="text-muted-foreground">
                {t('auth.subheadline')}
              </p>
            </div>

            {/* Free tier benefits */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{t('auth.freeAccountIncludes')}</h3>
              {[
                { icon: FlaskConical, text: t('auth.backtestsPerDay') },
                { icon: Zap, text: t('auth.liveScreenerAccess') },
                { icon: Bell, text: t('auth.patternAlertSetup') },
                { icon: BarChart3, text: t('auth.edgeAtlasRankings') },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{text}</span>
                </div>
              ))}
            </div>

            {/* Social proof */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-foreground">1,100+</p>
                <p className="text-xs text-muted-foreground">{t('auth.instrumentsTracked')}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-foreground">320K+</p>
                <p className="text-xs text-muted-foreground">{t('auth.patternOutcomes')}</p>
              </div>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-3">
              {[t('auth.noCreditCard'), t('auth.freeForever'), t('auth.cancelAnytime')].map((text) => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right column: Auth form */}
          <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-glow">
                <User className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {isResetPassword ? t('auth.setNewPassword') : isForgotPassword ? t('auth.resetPassword') : isSignUp ? t('auth.createAccount') : t('auth.welcomeBack')}
            </CardTitle>
            <CardDescription>
              {isResetPassword
                ? t('auth.enterNewPassword')
                : isForgotPassword 
                  ? t('auth.enterEmailForReset')
                  : isSignUp 
                    ? t('auth.createFreeAccount')
                    : t('auth.signInToAccount')
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
                  <Label htmlFor="newPassword">{t('auth.newPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={t('auth.newPasswordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmNewPassword">{t('auth.confirmNewPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      placeholder={t('auth.confirmNewPasswordPlaceholder')}
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
                      {t('auth.updatingPassword')}
                    </>
                  ) : (
                    t('auth.updatePassword')
                  )}
                </Button>
              </form>
            ) : isForgotPassword ? (
              // Forgot Password Form
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
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
                      {t('auth.sendingResetLink')}
                    </>
                  ) : resetCooldown > 0 ? (
                    t('auth.resendIn', { seconds: resetCooldown })
                  ) : (
                    t('auth.sendResetLink')
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setIsForgotPassword(false)}
                >
                  {t('auth.backToSignIn')}
                </Button>
              </form>
            ) : (
              // Regular Auth Form — Google first, then email
              <>
                {/* Social Authentication - Bold Google button for maximum conversion */}
                <div className="space-y-3">
                  <Button
                    onClick={() => handleSocialAuth('google')}
                    disabled={loading}
                    className="w-full h-12 text-base font-medium bg-[#4285F4] hover:bg-[#3367D6] text-white shadow-md"
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {t('auth.continueWithGoogle')}
                  </Button>

                  {/* Collapsed email form toggle */}
                  {!showEmailForm ? (
                    <Button
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => { setShowEmailForm(true); handleFormInteraction(); }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      {t('auth.orWithEmail')}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <>
                      <div className="relative">
                        <Separator />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="bg-card px-2 text-sm text-muted-foreground">{t('auth.orWithEmail')}</span>
                        </div>
                      </div>

                      <form onSubmit={handleAuth} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('auth.email')}</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="email"
                              type="email"
                              placeholder={t('auth.emailPlaceholder')}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onFocus={handleFormInteraction}
                              className="pl-10"
                              required
                              autoFocus
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">{t('auth.password')}</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="password"
                              type="password"
                              placeholder={t('auth.passwordPlaceholder')}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="pl-10"
                              required
                              minLength={6}
                            />
                          </div>
                        </div>

                        {!isSignUp && (
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="link"
                              className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
                              onClick={() => setIsForgotPassword(true)}
                            >
                              {t('auth.forgotPassword')}
                            </Button>
                          </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {isSignUp ? t('auth.creatingAccount') : t('auth.signingIn')}
                            </>
                          ) : (
                            isSignUp ? t('auth.createAccount') : t('auth.signIn')
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? t('auth.alreadyHaveAccount') : t('auth.dontHaveAccount')}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setIsForgotPassword(false);
                    }}
                  >
                    {isSignUp ? t('auth.signIn') : t('auth.createAccount')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
