import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface OnboardingStepProps {
  icon: ReactNode;
  title: string;
  description: string;
  stepIndex: number;
  totalSteps: number;
  action?: ReactNode;
}

export function OnboardingStep({ icon, title, description, stepIndex, totalSteps, action }: OnboardingStepProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="p-4 rounded-2xl bg-primary/10">
        {icon}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{description}</p>
      </div>
      {action}
      {/* Progress dots */}
      <div className="flex items-center gap-1.5 pt-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all',
              i === stepIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}
