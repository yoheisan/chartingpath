import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

/**
 * Unified grade color configuration used across the entire application.
 * Ensures consistent theming for pattern quality grades (A-F).
 */
export const GRADE_CONFIG = {
  A: { 
    bg: 'bg-grade-a/15', 
    text: 'text-grade-a', 
    border: 'border-grade-a/30',
    solid: 'bg-grade-a text-primary-foreground',
    label: 'Excellent'
  },
  B: { 
    bg: 'bg-grade-b/15', 
    text: 'text-grade-b', 
    border: 'border-grade-b/30',
    solid: 'bg-grade-b text-primary-foreground',
    label: 'Good'
  },
  C: { 
    bg: 'bg-grade-c/15', 
    text: 'text-grade-c', 
    border: 'border-grade-c/30',
    solid: 'bg-grade-c text-primary-foreground',
    label: 'Fair'
  },
  D: { 
    bg: 'bg-grade-d/15', 
    text: 'text-grade-d', 
    border: 'border-grade-d/30',
    solid: 'bg-grade-d text-primary-foreground',
    label: 'Weak'
  },
  F: { 
    bg: 'bg-grade-f/15', 
    text: 'text-grade-f', 
    border: 'border-grade-f/30',
    solid: 'bg-grade-f text-primary-foreground',
    label: 'Poor'
  },
} as const;

export type GradeLetter = 'A' | 'B' | 'C' | 'D' | 'F';

const FALLBACK_CONFIG = { 
  bg: 'bg-muted', 
  text: 'text-muted-foreground', 
  border: 'border-border',
  solid: 'bg-muted text-muted-foreground',
  label: 'Unknown'
};

/**
 * Extract the grade letter from various quality object formats.
 * Handles the backend field mismatch where grade may be in 'score' field.
 */
export function extractGrade(quality?: { 
  grade?: string; 
  score?: string | number;
  numericScore?: number;
}): GradeLetter {
  if (!quality) return 'C';
  
  // Direct grade field
  if (quality.grade && /^[A-F]$/.test(quality.grade)) {
    return quality.grade as GradeLetter;
  }
  
  // Grade letter stored in score field (backend mapping issue)
  if (typeof quality.score === 'string' && /^[A-F]$/.test(quality.score)) {
    return quality.score as GradeLetter;
  }
  
  // Default
  return 'C';
}

/**
 * Get the color configuration for a grade.
 */
export function getGradeConfig(grade: GradeLetter | string) {
  return GRADE_CONFIG[grade as GradeLetter] || FALLBACK_CONFIG;
}

interface GradeBadgeProps {
  /** Direct grade letter (A-F) */
  grade?: GradeLetter | string;
  /** Quality object from API - will extract grade from it */
  quality?: { grade?: string; score?: string | number };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Visual style variant */
  variant?: 'circle' | 'pill';
  /** Use solid background instead of translucent */
  solid?: boolean;
  /** Show tooltip with explanation */
  showTooltip?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Unified GradeBadge component for consistent grade display across the app.
 * 
 * Usage:
 * - With direct grade: <GradeBadge grade="A" />
 * - With quality object: <GradeBadge quality={setup.quality} />
 */
export function GradeBadge({ 
  grade, 
  quality, 
  size = 'md',
  variant = 'circle',
  solid = false,
  showTooltip = true,
  className 
}: GradeBadgeProps) {
  // Extract grade from either prop
  const displayGrade = grade 
    ? ((/^[A-F]$/.test(grade) ? grade : 'C') as GradeLetter)
    : extractGrade(quality);
  
  const config = getGradeConfig(displayGrade);
  
  const circleSizeClasses = {
    sm: 'w-5 h-5 text-sm',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };

  const pillSizeClasses = {
    sm: 'px-2 py-0.5 text-sm',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };
  
  const badgeContent = (
    <span
      className={cn(
        'inline-flex items-center justify-center border',
        variant === 'circle' ? 'rounded-full font-bold' : 'rounded-full font-semibold',
        variant === 'circle' ? circleSizeClasses[size] : pillSizeClasses[size],
        solid ? config.solid : [config.bg, config.text, config.border],
        className
      )}
    >
      {variant === 'pill' ? `Grade ${displayGrade}` : displayGrade}
    </span>
  );
  
  if (!showTooltip) return badgeContent;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badgeContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs font-medium mb-1">
            Pattern Grade: {displayGrade} ({config.label})
          </p>
          <p className="text-xs text-muted-foreground">
            Based on trend alignment, R:R structure, volume, symmetry, historical win rate, and volatility regime.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default GradeBadge;
