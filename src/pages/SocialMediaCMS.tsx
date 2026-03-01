import { useState } from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ContentLibraryManager } from "@/components/cms/ContentLibraryManager";
import { ScheduledPostsManager } from "@/components/cms/ScheduledPostsManager";
import { SocialAccountsManager } from "@/components/cms/SocialAccountsManager";
import { PostAnalytics } from "@/components/cms/PostAnalytics";
import { MarketReportScheduler } from "@/components/cms/MarketReportScheduler";
import { EducationalContentManager } from "@/components/cms/EducationalContentManager";
import { AutoFollowQueueManager } from "@/components/cms/AutoFollowQueueManager";
import { DiscoveryManager } from "@/components/cms/DiscoveryManager";
import { Calendar, Library, Settings, TrendingUp, ArrowLeft, GraduationCap, UserPlus, Radar } from "lucide-react";

export default function SocialMediaCMS() {
  const [activeTab, setActiveTab] = useState("schedule");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Admin Dashboard
        </Link>
        <h1 className="text-4xl font-bold mb-2">Social Media CMS</h1>
        <p className="text-muted-foreground">
          Manage automated Market Breadth Reports and Q&A content distribution across X and Instagram
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="schedule" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="educational" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Educational</span>
          </TabsTrigger>
          <TabsTrigger value="follow-queue" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Follow Queue</span>
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <Radar className="h-4 w-4" />
            <span className="hidden sm:inline">Discovery</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            <span className="hidden sm:inline">Library</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="space-y-4">
          <MarketReportScheduler />
          <Card className="p-6">
            <ScheduledPostsManager />
          </Card>
        </TabsContent>

        <TabsContent value="educational" className="space-y-4">
          <Card className="p-6">
            <EducationalContentManager />
          </Card>
        </TabsContent>

        <TabsContent value="follow-queue" className="space-y-4">
          <AutoFollowQueueManager />
        </TabsContent>

        <TabsContent value="discovery" className="space-y-4">
          <DiscoveryManager />
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <Card className="p-6">
            <ContentLibraryManager />
          </Card>
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          <Card className="p-6">
            <SocialAccountsManager />
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="p-6">
            <PostAnalytics />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}