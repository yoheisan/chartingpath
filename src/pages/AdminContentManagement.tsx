import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ArticleManager } from "@/components/admin/ArticleManager";
import { QuizManager } from "@/components/admin/QuizManager";
import { PatternImageManager } from "@/components/admin/PatternImageManager";
import { useTranslations } from "@/hooks/useTranslations";

const AdminContentManagement = () => {
  const { t } = useTranslations();
  const [activeTab, setActiveTab] = useState("articles");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Content Management System</h1>
          <p className="text-muted-foreground text-lg">
            Manage learning articles, quiz questions, and pattern images
          </p>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="articles">
                Learning Articles
              </TabsTrigger>
              <TabsTrigger value="quizzes">
                Quiz Questions
              </TabsTrigger>
              <TabsTrigger value="images">
                Pattern Images
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              <ArticleManager />
            </TabsContent>

            <TabsContent value="quizzes">
              <QuizManager />
            </TabsContent>

            <TabsContent value="images">
              <PatternImageManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AdminContentManagement;