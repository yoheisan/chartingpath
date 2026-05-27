import { PatternLibrary } from "@/components/PatternLibrary";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageMeta } from "@/components/PageMeta";

const PatternLibraryPage = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={t('patternLibrary.seoTitle', 'Pattern Library \u2014 ChartingPath')}
        description={t('patternLibrary.seoDesc', 'Browse ChartingPath\u2019s complete library of chart patterns, candlestick formations, and technical indicators with visual guides.')}
        canonicalPath="/chart-patterns/library"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Pattern Library',
          description: 'Browse ChartingPath\u2019s complete library of chart patterns, candlestick formations, and technical indicators with visual guides.',
          url: 'https://chartingpath.com/chart-patterns/library',
          isPartOf: { '@type': 'WebSite', name: 'ChartingPath', url: 'https://chartingpath.com' }
        }}
      />
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