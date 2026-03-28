import { usePlatformDataVersion } from '@/hooks/usePlatformDataVersion';
import { formatDistanceToNow } from 'date-fns';
import { Database } from 'lucide-react';

export function DataVersionBadge() {
  const version = usePlatformDataVersion();

  if (!version) return null;

  const updatedLabel = version.activated_at
    ? formatDistanceToNow(new Date(version.activated_at), { addSuffix: true })
    : 'N/A';

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
      <Database className="h-3 w-3" />
      Data: v{version.version} · Updated {updatedLabel}
    </span>
  );
}
