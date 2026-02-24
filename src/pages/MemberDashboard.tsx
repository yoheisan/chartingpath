import { useAuth } from "@/contexts/AuthContext";
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
  /** Symbol to pre-select on the dashboard chart (from /study/:symbol redirect) */
  initialSymbol?: string;
}

const MemberDashboard = () => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  const routeState = location.state as PlaybackPatternState | null;

  // Show skeleton only while auth state is resolving
  if (isAuthLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="space-y-4 text-center">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
      </div>
    );
  }

  // Render for both authenticated and anonymous users
  return (
    <CommandCenterLayout 
      userId={user?.id} 
      initialPlaybackPattern={routeState?.playbackPattern}
      initialSymbol={routeState?.initialSymbol}
    />
  );
};

export default MemberDashboard;
