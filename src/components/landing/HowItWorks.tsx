import { Card, CardContent } from "@/components/ui/card";
import { Search, FlaskConical, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    step: 1,
    title: "Scan",
    description: "Run Setup Finder to scan markets for pattern-based setups.",
    icon: Search,
    link: "/projects/setup-finder/new",
  },
  {
    step: 2,
    title: "Test",
    description: "Backtest your playbook to validate rules on historical data.",
    icon: FlaskConical,
    link: "/strategy-workspace",
  },
  {
    step: 3,
    title: "Trigger",
    description: "Create alerts to get notified when conditions are met.",
    icon: Bell,
    link: "/members/alerts",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">The Playbook Loop</h2>
          <p className="text-muted-foreground">From hypothesis to execution in minutes</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((item, idx) => (
            <Link key={item.step} to={item.link} className="block group">
              <Card className="text-center h-full hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <item.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="text-sm text-primary font-medium mb-1">Step {item.step}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  
                  {idx < steps.length - 1 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <ArrowRight className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
