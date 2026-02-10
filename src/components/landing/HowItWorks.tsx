import { Card, CardContent } from "@/components/ui/card";
import { Search, FlaskConical, TrendingUp, FileCode, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const stages = [
  {
    stage: 1,
    title: "Discover",
    subtitle: "Find Signals",
    description: "Scan markets for pattern-based setups with entry, SL, and TP levels.",
    icon: Search,
    link: "/patterns/live",
    color: "from-blue-500 to-cyan-500",
  },
  {
    stage: 2,
    title: "Research",
    subtitle: "Validate History",
    description: "Backtest patterns to see historical win rates and performance metrics.",
    icon: FlaskConical,
    link: "/projects/pattern-lab/new",
    color: "from-purple-500 to-pink-500",
  },
  {
    stage: 3,
    title: "Execute",
    subtitle: "Take the Trade",
    description: "Set alerts and automate with pre-calculated levels ready to trade.",
    icon: TrendingUp,
    link: "/patterns/live",
    color: "from-green-500 to-emerald-500",
  },
  {
    stage: 4,
    title: "Automate",
    subtitle: "Export Scripts",
    description: "Generate Pine Script or trading bot code for automated execution.",
    icon: FileCode,
    link: "/members/scripts",
    color: "from-orange-500 to-amber-500",
  },
];

export const HowItWorks = () => {
  return (
    <section className="py-16 px-6 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">Your Trading Journey</h2>
          <p className="text-muted-foreground">From signal discovery to automated execution</p>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          {stages.map((item, idx) => (
            <Link key={item.stage} to={item.link} className="block group">
              <Card className="text-center h-full hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
                <CardContent className="p-5">
                  {/* Stage number badge */}
                  <div className={`absolute top-0 left-0 w-8 h-8 bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-bold rounded-br-lg`}>
                    {item.stage}
                  </div>
                  
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-3 mt-2">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${item.color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <item.icon className="h-5 w-5 text-foreground" />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <h3 className="font-bold text-lg mb-0.5 group-hover:text-primary transition-colors">{item.title}</h3>
                  <div className="text-xs text-primary font-medium mb-2">{item.subtitle}</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                  
                  {/* Arrow connector (except last) */}
                  {idx < stages.length - 1 && (
                    <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        
        <p className="text-center text-xs text-muted-foreground mt-6">
          Each stage builds on the last—start anywhere based on your current needs.
        </p>
      </div>
    </section>
  );
};

export default HowItWorks;
