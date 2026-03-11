import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, LogIn, Globe, Palette, Crown } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

type UserRole = 'super_admin' | 'admin' | 'moderator' | 'user' | null;

const AuthButton = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const navigate = useNavigate();

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setUserRole(data?.role as UserRole || null);
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      setLoading(false);
    }).catch((err) => {
      console.error('AuthButton getSession error:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserRole(session.user.id);
        } else {
          setUserRole(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) {
        console.error('Sign out error:', error);
      }
      setUser(null);
      setUserRole(null);
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      // Force cleanup even on error
      setUser(null);
      setUserRole(null);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/auth">
            <LogIn className="h-4 w-4 mr-1" />
            {t('accountMenu.login')}
          </Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
        >
          <Link
            to="/auth?mode=signup"
            onClick={() => (window as any).gtag?.('event', 'cta_click', { location: 'navbar_signup' })}
          >
            {t('auth.signUpFree', 'Sign Up Free')}
          </Link>
        </Button>
        <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">{t('auth.joinTraders', 'Join 1,300+ traders')}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <div className="w-6 h-6 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline">{t('accountMenu.account')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">
              {user.email}
            </span>
            {(userRole === 'super_admin' || userRole === 'admin') ? (
              <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                <Crown className="h-3 w-3" />
                {userRole === 'super_admin' ? t('accountMenu.superAdmin') : t('accountMenu.admin')}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t('accountMenu.member')}</span>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/members/account" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            {t('accountMenu.accountSettings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/members/dashboard" className="flex items-center">
            <User className="h-4 w-4 mr-2" />
            {t('accountMenu.memberDashboard')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('accountMenu.language')}</span>
            <LanguageSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('accountMenu.theme')}</span>
            <ThemeSwitcher />
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          onSelect={(e) => e.preventDefault()}
          className="text-red-600 cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('accountMenu.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AuthButton;