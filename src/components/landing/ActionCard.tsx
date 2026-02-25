import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { track } from "@/services/analytics";
import { trackEvent } from '@/lib/analytics';

export interface ActionCardProps {
  title: string;
  description: string;
  bullets: string[];
  ctaText: string;
  ctaLink: string;
  icon: LucideIcon;
  bestFor: string;
  slug: string;
  requiresAuth?: boolean;
  isAuthenticated?: boolean;
  onCtaClick?: () => void;
}

export const ActionCard = ({
  title,
  description,
  bullets,
  ctaText,
  ctaLink,
  icon: Icon,
  bestFor,
  slug,
  requiresAuth = false,
  isAuthenticated = false,
  onCtaClick,
}: ActionCardProps) => {
  const handleClick = () => {
    track('pricing_clicked', { source: `landing_actioncard_${slug}` });
    trackEvent('landing.cta_click', { button: `action_card_${slug}` });
    onCtaClick?.();
  };

  const effectiveLink = requiresAuth && !isAuthenticated 
    ? `/auth?redirect=${encodeURIComponent(ctaLink)}`
    : ctaLink;

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 h-full flex flex-col bg-card/50 backdrop-blur-sm">
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <Badge variant="secondary" className="text-xs">
            {bestFor}
          </Badge>
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>

        {/* Bullets */}
        <ul className="space-y-2 mb-6 flex-grow">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
              {bullet}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Button 
          asChild 
          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          variant="outline"
          onClick={handleClick}
        >
          <Link to={effectiveLink}>
            {ctaText}
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ActionCard;
