import { DatabaseQuiz } from "@/components/DatabaseQuiz";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const TradingKnowledgeQuizPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/chart-patterns/quiz" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('quizHub.backToQuizHub')}
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('tradingKnowledgeQuiz.title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('tradingKnowledgeQuiz.subtitle')}
          </p>
        </div>
        
        <DatabaseQuiz 
          title={t('tradingKnowledgeQuiz.title')}
          limit={25}
        />
      </div>
    </div>
  );
};

export default TradingKnowledgeQuizPage;
