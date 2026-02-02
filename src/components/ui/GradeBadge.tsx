import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * Unified grade color configuration used across the entire application.
 * Ensures consistent theming for pattern quality grades (A-F).
 */
export const GRADE_CONFIG = {
  A: { 
    bg: 'bg-emerald-500/15', 
    text: 'text-emerald-500', 
    border: 'border-emerald-500/30',
    solid: 'bg-emerald-500 text-white',
    label: 'Excellent'
  },
  B: { 
    bg: 'bg-green-500/15', 
    text: 'text-green-500', 
    border: 'border-green-500/30',
    solid: 'bg-green-500 text-white',
    label: 'Good'
  },
  C: { 
    bg: 'bg-yellow-500/15', 
    text: 'text-yellow-500', 
    border: 'border-yellow-500/30',
    solid: 'bg-yellow-500 text-white',
    label: 'Fair'
  },
  D: { 
    bg: 'bg-orange-500/15', 
    text: 'text-orange-500', 
    border: 'border-orange-500/30',
    solid: 'bg-orange-500 text-white',
    label: 'Weak'
  },
  F: { 
    bg: 'bg-red-500/15', 
    text: 'text-red-500', 
    border: 'border-red-500/30',
    solid: 'bg-red-500 text-white',
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
  solid = false,
  showTooltip = true,
  className 
}: GradeBadgeProps) {
  // Extract grade from either prop
  const displayGrade = grade 
    ? ((/^[A-F]$/.test(grade) ? grade : 'C') as GradeLetter)
    : extractGrade(quality);
  
  const config = getGradeConfig(displayGrade);
  
  const sizeClasses = {
    sm: 'w-5 h-5 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-9 h-9 text-sm',
  };
  
  const badgeContent = (
    <span 
      className={cn(
        'inline-flex items-center justify-center rounded-full font-bold border',
        sizeClasses[size],
        solid ? config.solid : [config.bg, config.text, config.border],
        className
      )}
    >
      {displayGrade}
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
