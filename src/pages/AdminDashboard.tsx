import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, LogOut, ArrowLeft, Settings, Globe, FileText, Share2, TrendingUp, BarChart3, Brain, BookOpen, MessageSquare, Activity, Database, KeyRound, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import UserManagement from "@/components/UserManagement";
import { InstrumentSearchAnalytics } from "@/components/admin/InstrumentSearchAnalytics";
import { InternalDocs } from "@/components/admin/InternalDocs";
import { CopilotFeedbackDashboard } from "@/components/admin/CopilotFeedbackDashboard";
import { ServiceHealthDashboard } from "@/components/admin/ServiceHealthDashboard";
import { PipelineHealthDashboard } from "@/components/admin/PipelineHealthDashboard";
import { LoginAttemptsPanel } from "@/components/admin/LoginAttemptsPanel";
import { GA4Panel } from "@/components/admin/GA4Panel";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("");
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate("/admin/login");
          return;
        }

        // Check admin privileges
        const { data: adminCheck, error } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (error) {
          console.error('Error checking admin role:', error);
          navigate("/admin/login");
          return;
        }

        if (!adminCheck) {
          toast({
            title: "Access Denied",
            description: "Admin privileges required",
            variant: "destructive",
          });
          navigate("/admin/login");
          return;
        }

        // Get specific role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        setUserRole(roleData?.role || 'admin');
        setIsAdmin(true);
      } catch (error) {
        console.error('Admin access check failed:', error);
        navigate("/admin/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const handleLogout = async () => {
    try {
      // Update admin session
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('admin_sessions')
          .update({ logout_time: new Date().toISOString(), is_active: false })
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      await supabase.auth.signOut();
      toast({
        title: "Logged Out",
        description: "Admin session ended successfully",
      });
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" />
                Back to Site
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <Badge variant={userRole === 'super_admin' ? 'default' : 'secondary'}>
                  {userRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                </Badge>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            User Management
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/content")}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Content Management
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/translations")}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            Translations
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/social-cms")}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Social Media CMS
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/kpi")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            KPI Dashboard
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/journey-analytics")}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Journey Analytics
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/cron-monitor")}
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            Cron Monitor
          </Button>
          <Button
            variant={activeTab === "analytics" ? "default" : "outline"}
            onClick={() => setActiveTab("analytics")}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Search Analytics
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "outline"}
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
          <Button
            variant={activeTab === "copilot-feedback" ? "default" : "outline"}
            onClick={() => setActiveTab("copilot-feedback")}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Copilot Feedback
          </Button>
          <Button
            variant={activeTab === "docs" ? "default" : "outline"}
            onClick={() => setActiveTab("docs")}
            className="flex items-center gap-2"
          >
            <BookOpen className="h-4 w-4" />
            Internal Docs
          </Button>
          <Button
            variant={activeTab === "service-health" ? "default" : "outline"}
            onClick={() => setActiveTab("service-health")}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Service Health
          </Button>
          <Button
            variant={activeTab === "pipeline-health" ? "default" : "outline"}
            onClick={() => setActiveTab("pipeline-health")}
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            Pipeline Health
          </Button>
          <Button
            variant={activeTab === "login-attempts" ? "default" : "outline"}
            onClick={() => setActiveTab("login-attempts")}
            className="flex items-center gap-2"
          >
            <KeyRound className="h-4 w-4" />
            Login Attempts
          </Button>
          <Button
            variant={activeTab === "ga4" ? "default" : "outline"}
            onClick={() => setActiveTab("ga4")}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Google Analytics
          </Button>
        </div>

        {/* Tab Content */}
        {activeTab === "users" && <UserManagement userRole={userRole} />}
        
        {activeTab === "analytics" && <InstrumentSearchAnalytics />}
        
        {activeTab === "settings" && (
          <Card>
            <CardHeader>
              <CardTitle>Admin Settings</CardTitle>
              <CardDescription>
                Configure platform settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Settings functionality coming soon...
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === "docs" && <InternalDocs />}

        {activeTab === "copilot-feedback" && <CopilotFeedbackDashboard />}

        {activeTab === "service-health" && <ServiceHealthDashboard />}

        {activeTab === "pipeline-health" && <PipelineHealthDashboard />}

        {activeTab === "login-attempts" && <LoginAttemptsPanel />}

        {activeTab === "ga4" && <GA4Panel />}
      </div>
    </div>
  );
};

export default AdminDashboard;