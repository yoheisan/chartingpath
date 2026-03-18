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
    <section className="py-16 px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium mb-3">
            {t('socialProof.sectionLabel')}
          </p>
          <h2 className="text-2xl font-bold mb-2">{t('socialProof.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('socialProof.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm relative"
            >
              <Quote className="h-5 w-5 text-primary/30 mb-3" />
              <p className="text-sm text-foreground leading-relaxed mb-4">
                "{t(item.quoteKey)}"
              </p>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {t(item.authorKey).charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t(item.authorKey)}</p>
                  <p className="text-[11px] text-muted-foreground">{t(item.roleKey)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default SocialProof;
