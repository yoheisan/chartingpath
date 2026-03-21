import * as React from "react";
import { cn } from "@/lib/utils";

export interface NotificationBadgeProps {
  /** Number of unread items */
  count: number;
  /** Maximum count to display before showing "9+" */
  maxCount?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Position relative to parent */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** Color variant */
  variant?: "default" | "destructive" | "warning" | "success";
  /** Show dot only (no count) for any count */
  dotOnly?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Notification badge component that shows:
 * - Dot only for 1-2 items
 * - Count badge for 3+ items
 * - "9+" for counts > 9
 */
export function NotificationBadge({
  count,
  maxCount = 9,
  size = "sm",
  position = "top-right",
  variant = "destructive",
  dotOnly = false,
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  // Show dot for 1-2 items, count for 3+
  const showDot = dotOnly || count <= 2;
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeClasses = {
    sm: showDot ? "h-2 w-2" : "h-4 min-w-4 text-sm",
    md: showDot ? "h-2.5 w-2.5" : "h-5 min-w-5 text-xs",
    lg: showDot ? "h-3 w-3" : "h-6 min-w-6 text-sm",
  };

  const positionClasses = {
    "top-right": "-top-1 -right-1",
    "top-left": "-top-1 -left-1",
    "bottom-right": "-bottom-1 -right-1",
    "bottom-left": "-bottom-1 -left-1",
  };

  const variantClasses = {
    default: "bg-primary text-primary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    warning: "bg-amber-500 text-white",
    success: "bg-emerald-500 text-white",
  };

  return (
    <span
      className={cn(
        "absolute flex items-center justify-center rounded-full font-semibold animate-in fade-in zoom-in-50 duration-200",
        sizeClasses[size],
        positionClasses[position],
        variantClasses[variant],
        !showDot && "px-1",
        className
      )}
      aria-label={`${count} unread notifications`}
    >
      {!showDot && displayCount}
    </span>
  );
}

/**
 * Wrapper component that positions badge relative to its child
 */
export function WithNotificationBadge({
  children,
  count,
  ...badgeProps
}: NotificationBadgeProps & { children: React.ReactNode }) {
  return (
    <span className="relative inline-flex">
      {children}
      <NotificationBadge count={count} {...badgeProps} />
    </span>
  );
}
