import { ChartPatternGenerator } from "@/components/ChartPatternGenerator";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const PatternGenerator = () => {
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

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">{t('patternGenerator.title')}</h1>
          <p className="text-xl text-muted-foreground">
            {t('patternGenerator.subtitle')}
          </p>
        </div>
        
        <ChartPatternGenerator />
      </div>
    </div>
  );
};

export default PatternGenerator;