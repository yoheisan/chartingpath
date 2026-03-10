import { Search, FlaskConical, TrendingUp, FileCode } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackEvent } from '@/lib/analytics';

export const HowItWorks = () => {
  const { t } = useTranslation();

  const stages = [
    {
      stage: 1,
      title: t('howItWorks.discover'),
      subtitle: t('howItWorks.discoverSubtitle'),
      description: t('howItWorks.discoverDesc'),
      icon: Search,
      link: "/patterns/live",
    },
    {
      stage: 2,
      title: t('howItWorks.research'),
      subtitle: t('howItWorks.researchSubtitle'),
      description: t('howItWorks.researchDesc'),
      icon: FlaskConical,
      link: "/projects/pattern-lab/new",
    },
    {
      stage: 3,
      title: t('howItWorks.execute'),
      subtitle: t('howItWorks.executeSubtitle'),
      description: t('howItWorks.executeDesc'),
      icon: TrendingUp,
      link: "/patterns/live",
    },
    {
      stage: 4,
      title: t('howItWorks.automate'),
      subtitle: t('howItWorks.automateSubtitle'),
      description: t('howItWorks.automateDesc'),
      icon: FileCode,
      link: "/members/scripts",
    },
  ];

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">{t('howItWorks.sectionTitle')}</p>
          <h2 className="text-3xl font-bold">{t('howItWorks.sectionSubtitle')}</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-px bg-border/30 rounded-xl overflow-hidden border border-border/30">
          {stages.map((item) => (
            <Link
              key={item.stage}
              to={item.link}
              className="group bg-card hover:bg-muted/40 transition-colors p-6 relative"
              onClick={() => trackEvent('landing.cta_click', { button: `how_it_works_step_${item.stage}`, label: item.title })}
            >
              <div className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-4">
                {t('howItWorks.step', 'Step')} {item.stage}
              </div>
              <div className="mb-3">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
              <div className="text-xs text-primary/80 font-medium mb-2">{item.subtitle}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </Link>
          ))}
        </div>
        
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          {t('howItWorks.footerNote')}
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
