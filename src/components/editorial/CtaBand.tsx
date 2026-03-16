import { ReactNode } from "react";

interface CtaBandProps {
  children: ReactNode;
  className?: string;
}

/**
 * Full-width gradient CTA band using the primary color.
 */
export function CtaBand({ children, className = "" }: CtaBandProps) {
  return (
    <section
      className={`bg-gradient-to-r from-primary to-accent py-16 ${className}`}
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 text-center">
        {children}
      </div>
    </section>
  );
}
