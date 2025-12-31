import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function SetupCardSkeleton() {
  return (
    <Card className="border-border/50 bg-card/50">
      {/* Thumbnail placeholder */}
      <Skeleton className="h-[100px] w-full rounded-t-lg rounded-b-none" />
      
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div>
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-6 rounded" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* Trade Levels */}
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div key={i}>
              <Skeleton className="h-3 w-10 mb-1" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
        </div>
        
        <Skeleton className="h-px w-full" />
        
        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded" />
          <Skeleton className="h-8 flex-1 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export function SetupGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SetupCardSkeleton key={i} />
      ))}
    </div>
  );
}
