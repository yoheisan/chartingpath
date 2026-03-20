import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArticleManager } from "@/components/admin/ArticleManager";
import { QuizManager } from "@/components/admin/QuizManager";
import { PatternImageManager } from "@/components/admin/PatternImageManager";
import { AIArticleGenerator } from "@/components/admin/AIArticleGenerator";
import { ContentMigration } from "@/components/admin/ContentMigration";
import { QuizImageGenerator } from "@/components/admin/QuizImageGenerator";
import { useTranslations } from "@/hooks/useTranslations";

const AdminContentManagement = () => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("migrate");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Admin Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2">Content Management System</h1>
          <p className="text-muted-foreground text-lg">
            Manage learning articles, quiz questions, and pattern images
          </p>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="migrate">
                Migrate Content
              </TabsTrigger>
              <TabsTrigger value="generate">
                AI Generator
              </TabsTrigger>
              <TabsTrigger value="articles">
                Learning Articles
              </TabsTrigger>
              <TabsTrigger value="quizzes">
                Quiz Questions
              </TabsTrigger>
              <TabsTrigger value="quiz-images">
                Quiz Images
              </TabsTrigger>
              <TabsTrigger value="images">
                Pattern Images
              </TabsTrigger>
              <TabsTrigger value="translations">
                <Globe className="h-4 w-4 mr-1" />
                Translations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="migrate">
              <ContentMigration onMigrationComplete={() => setActiveTab("articles")} />
            </TabsContent>

            <TabsContent value="generate">
              <AIArticleGenerator onArticleGenerated={() => setActiveTab("articles")} />
            </TabsContent>

            <TabsContent value="articles">
              <ArticleManager />
            </TabsContent>

            <TabsContent value="quizzes">
              <QuizManager />
            </TabsContent>

            <TabsContent value="quiz-images">
              <QuizImageGenerator />
            </TabsContent>

            <TabsContent value="images">
              <PatternImageManager />
            </TabsContent>

            <TabsContent value="translations">
              <div className="text-center py-12 space-y-4">
                <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
                <h3 className="text-xl font-semibold">Translation Management</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Manage automated translations, view coverage stats, and sync translations across all 14 supported languages.
                </p>
                <Link to="/admin/translations">
                  <Button size="lg">
                    Open Translation Dashboard
                  </Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminContentManagement;