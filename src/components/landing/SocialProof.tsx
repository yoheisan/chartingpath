import { useTranslation } from 'react-i18next';
import { Quote } from 'lucide-react';

const testimonials = [
  { quoteKey: 'socialProof.quote1', authorKey: 'socialProof.author1', roleKey: 'socialProof.role1' },
  { quoteKey: 'socialProof.quote2', authorKey: 'socialProof.author2', roleKey: 'socialProof.role2' },
  { quoteKey: 'socialProof.quote3', authorKey: 'socialProof.author3', roleKey: 'socialProof.role3' },
];

export function SocialProof() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-4 md:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-start">
          {/* Left — section header */}
          <div className="lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
              {t('socialProof.sectionLabel')}
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold mb-3">{t('socialProof.title')}</h2>
            <p className="text-base text-muted-foreground leading-relaxed">{t('socialProof.subtitle')}</p>
          </div>

          {/* Right — testimonials */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((item, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm relative flex flex-col"
              >
                <Quote className="h-5 w-5 text-primary/30 mb-4" />
                <p className="text-sm text-foreground leading-relaxed mb-6 flex-1">
                  "{t(item.quoteKey)}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {t(item.authorKey).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(item.authorKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(item.roleKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SocialProof;
