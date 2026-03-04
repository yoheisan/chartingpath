import { useAuth } from '@/contexts/AuthContext';
import { useScanRequests } from '@/hooks/useScanRequests';

/**
 * Invisible component that checks for completed scan requests on mount
 * and shows toast notifications. Place inside AuthProvider.
 */
export function ScanNotificationListener() {
  const { user } = useAuth();
  // The hook handles fetching + showing toasts automatically
  useScanRequests(user?.id);
  return null;
}
