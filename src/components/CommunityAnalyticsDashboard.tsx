import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, HelpCircle, Bot, User, AlertTriangle, TrendingUp, Clock, ThumbsUp } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format, subDays } from 'date-fns';

interface ModeratorReport {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface AnalyticsData {
  totalMessages: number;
  totalQuestions: number;
  aiResponses: number;
  userResponses: number;
  avgResponseTime: number;
  topCategories: Record<string, number>;
  sentimentScore: number;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

const CommunityAnalyticsDashboard: React.FC = () => {
  const [reports, setReports] = useState<ModeratorReport[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchModeratorReports(),
        fetchAnalytics(),
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchModeratorReports = async () => {
    const { data, error } = await supabase
      .from('moderator_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    setReports(data || []);
  };

  const fetchAnalytics = async () => {
    const endDate = new Date();
    const startDate = subDays(endDate, selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90);

    // Fetch messages data
    const { data: messages, error: messagesError } = await supabase
      .from('community_messages')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (messagesError) throw messagesError;

    // Process analytics
    const totalMessages = messages?.length || 0;
    const totalQuestions = messages?.filter(m => m.message_type === 'question').length || 0;
    const aiResponses = messages?.filter(m => m.is_ai_response).length || 0;
    const userResponses = totalMessages - aiResponses;

    // Calculate top categories from moderator reports
    const categoryCount: Record<string, number> = {};
    reports.forEach(report => {
      categoryCount[report.category] = (categoryCount[report.category] || 0) + 1;
    });

    setAnalytics({
      totalMessages,
      totalQuestions,
      aiResponses,
      userResponses,
      avgResponseTime: 25, // Mock data
      topCategories: categoryCount,
      sentimentScore: 0.72, // Mock data
    });
  };

  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('moderator_reports')
        .update({ 
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null
        })
        .eq('id', reportId);

      if (error) throw error;

      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus as any }
          : report
      ));

      toast({
        title: "Status Updated",
        description: `Report status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    }
  };

  const getChartData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'AI Responses', value: analytics.aiResponses, color: '#8884d8' },
      { name: 'User Messages', value: analytics.userResponses, color: '#82ca9d' },
      { name: 'Questions', value: analytics.totalQuestions, color: '#ffc658' },
    ];
  };

  const getCategoryChartData = () => {
    if (!analytics?.topCategories) return [];
    
    return Object.entries(analytics.topCategories).map(([category, count], index) => ({
      name: category.replace('_', ' ').toUpperCase(),
      value: count,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
  };

  if (loading) {
    return <div className="p-6">Loading analytics dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Community Analytics & Moderation</h2>
        <div className="flex gap-2">
          {['7d', '30d', '90d'].map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalMessages || 0}</div>
            <p className="text-xs text-muted-foreground">+12% from last period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalQuestions || 0}</div>
            <p className="text-xs text-muted-foreground">AI assisted: {analytics?.aiResponses || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.avgResponseTime || 0}m</div>
            <p className="text-xs text-muted-foreground">-8% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Sentiment</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((analytics?.sentimentScore || 0) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Positive sentiment</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Moderator Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Moderator Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{report.subject}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {report.description.substring(0, 150)}
                            {report.description.length > 150 ? '...' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={PRIORITY_COLORS[report.priority]}>
                            {report.priority}
                          </Badge>
                          <Badge className={STATUS_COLORS[report.status]}>
                            {report.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Category: {report.category.replace('_', ' ')}</span>
                        <span>{format(new Date(report.created_at), 'MMM d, HH:mm')}</span>
                      </div>
                      
                      <div className="flex gap-2">
                        {report.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, 'in_progress')}
                          >
                            Start Working
                          </Button>
                        )}
                        {report.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                          >
                            Mark Resolved
                          </Button>
                        )}
                        {report.status === 'resolved' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateReportStatus(report.id, 'closed')}
                          >
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Message Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Report Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getCategoryChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityAnalyticsDashboard;