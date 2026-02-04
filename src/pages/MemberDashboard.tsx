import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useLocation } from "react-router-dom";
import { CommandCenterLayout } from "@/components/command-center";
import { Skeleton } from "@/components/ui/skeleton";
import type { SetupWithVisuals } from "@/types/VisualSpec";

/** Route state passed when navigating from Historical Occurrences for playback */
interface PlaybackPatternState {
  playbackPattern?: {
    occurrenceId: string;
    symbol: string;
    timeframe: string;
    patternId: string;
    patternName: string;
    direction: 'long' | 'short';
    setup: SetupWithVisuals;
    enablePlayback: boolean;
  };
}

const MemberDashboard = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const location = useLocation();
  const routeState = location.state as PlaybackPatternState | null;

  // Loading state - auth check
  if (authLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // If still no user after auth check, the hook will redirect
  if (!user) {
    return null;
  }

  return (
    <CommandCenterLayout 
      userId={user.id} 
      initialPlaybackPattern={routeState?.playbackPattern}
    />
  );
};

export default MemberDashboard;
