import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

const Privacy = () => {
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
          <h1>{t('privacy.pageTitle')}</h1>
          <p><strong>{t('privacy.lastUpdated')}</strong></p>

          <p>{t('privacy.intro')}</p>

          <h2>{t('privacy.s1Title')}</h2>
          <p>{t('privacy.s1p1')}</p>
          <p>{t('privacy.s1p2')}</p>
          <p>{t('privacy.s1p3')}</p>
          <p>{t('privacy.s1p4')}</p>
          <p>{t('privacy.s1p5')}</p>

          <h2>{t('privacy.s2Title')}</h2>
          <p>{t('privacy.s2intro')}</p>
          <ul>
            <li>{t('privacy.s2li1')}</li>
            <li>{t('privacy.s2li2')}</li>
            <li>{t('privacy.s2li3')}</li>
            <li>{t('privacy.s2li4')}</li>
            <li>{t('privacy.s2li5')}</li>
            <li>{t('privacy.s2li6')}</li>
          </ul>

          <h2>{t('privacy.s3Title')}</h2>
          <p>{t('privacy.s3intro')}</p>
          <ul>
            <li>{t('privacy.s3li1')}</li>
            <li>{t('privacy.s3li2')}</li>
            <li>{t('privacy.s3li3')}</li>
            <li>{t('privacy.s3li4')}</li>
          </ul>

          <h2>{t('privacy.s4Title')}</h2>
          <p>{t('privacy.s4p1')}</p>
          <p>{t('privacy.s4p2')}</p>

          <h2>{t('privacy.s5Title')}</h2>
          <p>{t('privacy.s5p1')}</p>

          <h2>{t('privacy.s6Title')}</h2>
          <p>{t('privacy.s6p1')}</p>
          <p>{t('privacy.s6p2')}</p>

          <h2>{t('privacy.s7Title')}</h2>
          <p>{t('privacy.s7p1')}</p>
          <p>{t('privacy.s7p2')}</p>
          <ul>
            <li>{t('privacy.s7li1')}</li>
            <li>{t('privacy.s7li2')}</li>
            <li>{t('privacy.s7li3')}</li>
            <li>{t('privacy.s7li4')}</li>
            <li>{t('privacy.s7li5')}</li>
          </ul>
          <p>{t('privacy.s7p3')}</p>

          <h2>{t('privacy.s8Title')}</h2>
          <p>{t('privacy.s8p1')}</p>

          <h2>{t('privacy.s9Title')}</h2>
          <p>{t('privacy.s9p1')}</p>
          <p>{t('privacy.s9p2')}</p>
          <p>{t('privacy.s9p3')}</p>

          <h2>{t('privacy.s10Title')}</h2>
          <p>{t('privacy.s10intro')}</p>
          <ul>
            <li>{t('privacy.s10li1')}</li>
            <li>{t('privacy.s10li2')}</li>
            <li>{t('privacy.s10li3')}</li>
            <li>{t('privacy.s10li4')}</li>
            <li>{t('privacy.s10li5')}</li>
            <li>{t('privacy.s10li6')}</li>
          </ul>
          <p>{t('privacy.s10p1')}</p>

          <h2>{t('privacy.s11Title')}</h2>
          <p>{t('privacy.s11p1')}</p>

          <h2>{t('privacy.s12Title')}</h2>
          <p>{t('privacy.s12p1')}</p>

          <h2>{t('privacy.s13Title')}</h2>
          <p>{t('privacy.s13p1')}</p>

          <h2>{t('privacy.s14Title')}</h2>
          <p>{t('privacy.s14p1')}</p>

          <h2>{t('privacy.s15Title')}</h2>
          <p>{t('privacy.s15p1')}</p>
          <p>{t('privacy.s15p2')}</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
