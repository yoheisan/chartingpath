import { Search, FlaskConical, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackEvent } from '@/lib/analytics';
import { Button } from "@/components/ui/button";

export const HowItWorks = () => {
  const { t } = useTranslation();

  const useCases = [
    {
      title: t('howItWorks.findTitle'),
      description: t('howItWorks.findDesc'),
      bullets: [
        t('howItWorks.findBullet1'),
        t('howItWorks.findBullet2'),
        t('howItWorks.findBullet3'),
      ],
      icon: Search,
      cta: t('howItWorks.findCta'),
      link: "/patterns/live",
      slug: "find",
    },
    {
      title: t('howItWorks.validateTitle'),
      description: t('howItWorks.validateDesc'),
      bullets: [
        t('howItWorks.validateBullet1'),
        t('howItWorks.validateBullet2'),
        t('howItWorks.validateBullet3'),
      ],
      icon: FlaskConical,
      cta: t('howItWorks.validateCta'),
      link: "/projects/pattern-lab/new",
      slug: "validate",
    },
    {
      title: t('howItWorks.actTitle'),
      description: t('howItWorks.actDesc'),
      bullets: [
        t('howItWorks.actBullet1'),
        t('howItWorks.actBullet2'),
        t('howItWorks.actBullet3'),
      ],
      icon: Bell,
      cta: t('howItWorks.actCta'),
      link: "/members/dashboard",
      slug: "act",
    },
  ];

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start">
          {/* Left — section header */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
              {t('howItWorks.sectionTitle')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">{t('howItWorks.sectionSubtitle')}</h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t('howItWorks.sectionDesc', 'From detection to execution in three steps. Each one backed by real data.')}
            </p>
          </div>

          {/* Right — 3 use-case cards */}
          <div className="grid gap-5">
            {useCases.map((item, i) => (
              <div
                key={item.slug}
                className="group relative rounded-xl border border-border/40 bg-card p-7 md:p-8 flex flex-col md:flex-row md:items-start gap-5 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Icon + step */}
                <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-2 shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-mono text-muted-foreground/40 uppercase tracking-widest">
                    {i + 1}/{useCases.length}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {item.description}
                  </p>
                  <ul className="space-y-1.5 mb-5">
                    {item.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="mt-1.5 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => trackEvent('landing.cta_click', { button: `usecase_${item.slug}` })}
                  >
                    <Link to={item.link}>
                      {item.cta}
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
