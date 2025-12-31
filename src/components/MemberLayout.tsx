import { ReactNode } from "react";

interface MemberLayoutProps {
  children: ReactNode;
}

/**
 * MemberLayout - A clean app shell for authenticated member pages.
 * Does NOT include header/footer (those come from App.tsx global Layout).
 * Provides consistent spacing and container for member-area content.
 */
const MemberLayout = ({ children }: MemberLayoutProps) => {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {children}
    </div>
  );
};

export default MemberLayout;
