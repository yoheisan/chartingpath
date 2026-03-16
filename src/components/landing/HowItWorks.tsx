import { Search, FlaskConical, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { trackEvent } from '@/lib/analytics';
import { Button } from "@/components/ui/button";
import { FadeIn, SectionNum, DotGridCard } from "@/components/editorial";

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
    <section className="py-20 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <FadeIn>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-14">
            <div>
              <SectionNum n="01" label={t('howItWorks.sectionTitle')} />
              <h2 className="text-3xl font-bold mt-4">{t('howItWorks.sectionSubtitle')}</h2>
            </div>
          </div>
        </FadeIn>

        <div className="grid md:grid-cols-3 gap-6">
          {useCases.map((item, i) => (
            <FadeIn key={item.slug} delay={i * 100}>
              <DotGridCard className="!p-7 flex flex-col h-full group hover:border-primary/30 transition-colors">
                {/* Step number */}
                <span className="text-[11px] font-mono text-muted-foreground/40 uppercase tracking-widest mb-4">
                  {String(i + 1).padStart(2, '0')}/{String(useCases.length).padStart(2, '0')}
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
              </DotGridCard>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
