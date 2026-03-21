import { Button } from "@/components/ui/button";
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
    <div className="group flex flex-col h-full rounded-xl border border-border/30 bg-card/30 hover:border-primary/40 hover:bg-card/60 transition-all duration-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <Icon className="h-4.5 w-4.5 text-primary shrink-0" />
        <h3 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <span className="ml-auto text-sm uppercase tracking-wider text-muted-foreground/60 font-medium whitespace-nowrap">
          {bestFor}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {description}
      </p>

      {/* Bullets */}
      <ul className="space-y-1.5 mb-5 flex-grow">
        {bullets.map((bullet, idx) => (
          <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1 h-1 rounded-full bg-primary/40 flex-shrink-0" />
            {bullet}
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Button 
        asChild 
        variant="ghost"
        size="sm"
        className="w-full justify-between text-xs font-medium text-muted-foreground hover:text-primary"
        onClick={handleClick}
      >
        <Link to={effectiveLink}>
          {ctaText}
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </Button>
    </div>
  );
};

export default ActionCard;
