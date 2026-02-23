import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t('common.backToHome')}
          </Link>
        </div>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1>{t('terms.pageTitle')}</h1>
          <p><strong>{t('terms.lastUpdated')}</strong></p>

          <p>{t('terms.intro')}</p>

          <h2>{t('terms.s1Title')}</h2>
          <p>{t('terms.s1p1')}</p>
          <p>{t('terms.s1p2')}</p>
          <p>{t('terms.s1p3')}</p>

          <h2>{t('terms.s2Title')}</h2>
          <p>{t('terms.s2p1')}</p>
          <p>{t('terms.s2p2')}</p>

          <h2>{t('terms.s3Title')}</h2>
          <p>{t('terms.s3p1')}</p>
          <ul>
            <li>{t('terms.s3plan1')}</li>
            <li>{t('terms.s3plan2')}</li>
            <li>{t('terms.s3plan3')}</li>
            <li>{t('terms.s3plan4')}</li>
            <li>{t('terms.s3plan5')}</li>
          </ul>
          <p>{t('terms.s3p2')}</p>
          <p>{t('terms.s3p3')}</p>
          <p>{t('terms.s3p4')}</p>

          <h2>{t('terms.s4Title')}</h2>
          <p>{t('terms.s4p1')}</p>
          <p>{t('terms.s4p2')}</p>
          <p>{t('terms.s4p3')}</p>
          <p>{t('terms.s4p4')}</p>
          <p>{t('terms.s4p5')}</p>
          <p>{t('terms.s4p6')}</p>
          <p>{t('terms.s4p7')}</p>

          <h2>{t('terms.s5Title')}</h2>
          <p>{t('terms.s5p1')}</p>
          <p>{t('terms.s5p2')}</p>
          <p>{t('terms.s5p3')}</p>

          <h2>{t('terms.s6Title')}</h2>
          <p>{t('terms.s6p1')}</p>
          <p>{t('terms.s6p2')}</p>
          <p>{t('terms.s6p3')}</p>

          <h2>{t('terms.s7Title')}</h2>
          <p>{t('terms.s7p1')}</p>
          <p>{t('terms.s7p2')}</p>

          <h2>{t('terms.s8Title')}</h2>
          <p>{t('terms.s8p1')}</p>
          <p>{t('terms.s8p2')}</p>

          <h2>{t('terms.s9Title')}</h2>
          <p>{t('terms.s9p1')}</p>

          <h2>{t('terms.s10Title')}</h2>
          <p>{t('terms.s10p1')}</p>
          <p>{t('terms.s10p2')}</p>
          <p>{t('terms.s10p3')}</p>
          <p>{t('terms.s10p4')}</p>

          <h2>{t('terms.s11Title')}</h2>
          <p>{t('terms.s11p1')}</p>
          <p>{t('terms.s11p2')}</p>
          <p>{t('terms.s11p3')}</p>

          <h2>{t('terms.s12Title')}</h2>
          <p>{t('terms.s12p1')}</p>

          <h2>{t('terms.s13Title')}</h2>
          <p>{t('terms.s13p1')}</p>

          <h2>{t('terms.s14Title')}</h2>
          <p>{t('terms.s14p1')}</p>
          <p>{t('terms.s14p2')}</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
