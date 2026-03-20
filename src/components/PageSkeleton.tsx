import { Skeleton } from "@/components/ui/skeleton";

/** Generic page skeleton — gives instant visual structure while the real page loads */
export const PageSkeleton = () => (
  <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 min-h-[80vh] animate-in fade-in duration-200">
    {/* Header area */}
    <div className="mb-8 space-y-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96 max-w-full" />
    </div>

    {/* Content cards */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      ))}
    </div>

    {/* Secondary content area */}
    <div className="mt-8 space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  </div>
);

/** Dashboard-style skeleton with sidebar stats */
export const DashboardSkeleton = () => (
  <div className="container mx-auto px-4 md:px-6 lg:px-8 py-8 animate-in fade-in duration-200">
    {/* Nav placeholder */}
    <div className="flex items-center gap-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-lg" />
      ))}
    </div>

    {/* Stats row */}
    <div className="grid gap-4 md:grid-cols-4 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16" />
        </div>
      ))}
    </div>

    {/* Main content */}
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  </div>
);
