import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

const About = () => {
  return (
    <>
      <Helmet>
        <title>About ChartingPath — Built by a Trader</title>
        <meta name="description" content="ChartingPath is a solo-built pattern intelligence platform tracking 63K+ real chart pattern outcomes across FX and US equities." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        <section className="container mx-auto px-4 md:px-6 lg:px-8 pt-24 pb-20 max-w-3xl">

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-10">
            Built by a trader who couldn't find the data.
          </h1>

          <div className="space-y-6 text-muted-foreground leading-relaxed text-base md:text-lg">
            <p>
              ChartingPath started with a simple frustration: every pattern scanner shows you when a head and shoulders forms. Nobody tracks what actually happens next.
            </p>

            <p>
              Does it work? At what timeframe? On which instruments? Under what market conditions?
            </p>

            <p>
              I built ChartingPath to answer those questions — and to make that answer get sharper every day as more patterns are detected and tracked through to outcome.
            </p>

            <p>
              What started as a pattern scanner is now becoming something more: the largest labeled dataset of chart pattern outcomes in existence. That data doesn't just help individual traders — it's the foundation for systematic pattern research that's never been possible before.
            </p>

            <p>
              ChartingPath is a solo-built platform. Every line of code, every edge function, every pattern detection is built and maintained by me. That means decisions happen fast, the product improves weekly, and the data stays honest.
            </p>
          </div>

          {/* Founder */}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-foreground font-semibold text-lg">Yohei</p>
            <p className="text-muted-foreground text-sm">Tokyo, Japan</p>
          </div>

          {/* CTA */}
          <div className="mt-16 pt-8 border-t border-border">
            <p className="text-foreground text-lg font-medium mb-4">
              Want to explore the data or discuss research access?
            </p>
            <Button asChild size="lg" className="gap-2">
              <a href="mailto:yohei@chartingpath.com">
                <Mail className="h-4 w-4" />
                Get in touch
              </a>
            </Button>
          </div>

        </section>
      </div>
    </>
  );
};

export default About;
