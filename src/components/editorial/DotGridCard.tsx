import { ReactNode } from "react";

interface DotGridCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card with a subtle dot-grid texture background.
 */
export function DotGridCard({ children, className = "" }: DotGridCardProps) {
  return (
    <div
      className={`rounded-2xl border border-border/40 bg-card p-8 md:p-12 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {children}
    </div>
  );
}
