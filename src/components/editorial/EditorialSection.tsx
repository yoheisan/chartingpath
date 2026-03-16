import { ReactNode } from "react";

interface EditorialSectionProps {
  children: ReactNode;
  className?: string;
  /** Whether to add top border separator */
  border?: boolean;
  /** Max width class (default max-w-5xl) */
  maxWidth?: string;
}

/**
 * Consistently spaced editorial section container.
 */
export function EditorialSection({
  children,
  className = "",
  border = false,
  maxWidth = "max-w-5xl",
}: EditorialSectionProps) {
  return (
    <section
      className={`py-20 ${border ? "border-t border-border/30" : ""} ${className}`}
    >
      <div className={`${maxWidth} mx-auto px-4 md:px-6 lg:px-8`}>
        {children}
      </div>
    </section>
  );
}
