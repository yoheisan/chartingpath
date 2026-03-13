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
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            {t('howItWorks.sectionTitle')}
          </p>
          <h2 className="text-3xl font-bold">{t('howItWorks.sectionSubtitle')}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((item, i) => (
            <div
              key={item.slug}
              className="group relative rounded-xl border border-border/40 bg-card p-7 flex flex-col transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              {/* Step number */}
              <span className="absolute top-4 right-5 text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest">
                {i + 1}/{useCases.length}
              </span>

              {/* Icon */}
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>

              {/* Title & desc */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {item.description}
              </p>

              {/* Bullets */}
              <ul className="space-y-1.5 mb-6 flex-1">
                {item.bullets.map((b, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-1 h-1 w-1 rounded-full bg-primary/60 shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                onClick={() => trackEvent('landing.cta_click', { button: `usecase_${item.slug}` })}
              >
                <Link to={item.link}>
                  {item.cta}
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
