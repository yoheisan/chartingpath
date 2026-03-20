import { PatternLibrary } from "@/components/PatternLibrary";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const PatternLibraryPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToHome')}
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('patternLibrary.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('patternLibrary.subtitle')}
          </p>
        </div>
        
        <PatternLibrary />
      </div>
    </div>
  );
};

export default PatternLibraryPage;