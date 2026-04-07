import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const About = () => {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('aboutPage2.title', "About ChartingPath — Built by TradingView's First Hire in Japan");
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="container mx-auto px-4 md:px-6 lg:px-8 pt-24 pb-20 max-w-3xl">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-10">
            {t('aboutPage2.headline', "I was TradingView's first hire in Japan.")}
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
            <p>{t('aboutPage2.p1', 'The excitement of joining TradingView early — watching individual traders finally get access to institutional-grade charting tools. Growing the Japan user base from 50,000 to 200,000. The energy of being part of something that was genuinely democratizing trading.')}</p>
            <p>{t('aboutPage2.p2', 'But working that close to traders every day, one question kept coming up: "I can see the pattern — but does it actually work?" TradingView gave traders the best charts in the world. But nobody was tracking what happened after a pattern formed.')}</p>
            <p>{t('aboutPage2.p3', "That question wouldn't leave. Does a head and shoulders on EUR/USD on the 4H chart actually break down? How often? With what risk-reward? No platform had the answer — not even TradingView.")}</p>
            <p>{t('aboutPage2.p4', 'So I built ChartingPath. Every pattern detected, every outcome tracked — win or loss, how far it ran, how long it took. What started as a personal obsession is now the largest labeled dataset of chart pattern outcomes in existence.')}</p>
            <p>{t('aboutPage2.p5', 'ChartingPath is solo-built, just like the early days at TradingView taught me — move fast, stay close to users, and let the data speak for itself.')}</p>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-foreground font-semibold text-lg">{t('aboutPage2.founderName', 'Yohei')}</p>
            <p className="text-muted-foreground text-sm">{t('aboutPage2.founderRole', 'Founder, ChartingPath · Ex-TradingView Japan (first hire)')}</p>
            <p className="text-muted-foreground text-sm">{t('aboutPage2.founderLocation', 'Tokyo, Japan')}</p>
          </div>

          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-foreground text-lg font-medium mb-4">
              {t('aboutPage2.ctaText', 'Want to explore the data or discuss research access?')}
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:contact@chartingpath.com">
                <Mail className="h-4 w-4" />
                {t('aboutPage2.ctaButton', 'Get in touch')}
              </a>
            </Button>
          </div>

          

        </section>
      </div>
  );
};

export default About;
