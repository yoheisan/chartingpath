import { useAuth } from "@/contexts/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { CommandCenterLayout } from "@/components/command-center";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
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
  /** URL to navigate back to (e.g. Edge Atlas) */
  backUrl?: string;
  /** Label for the back button */
  backLabel?: string;
}

const MemberDashboard = () => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
    <>
      <PageMeta
        title="Trading Dashboard — Charts, Patterns & Market Overview | ChartingPath"
        description="Your full trading command centre. Live charts with pattern overlays, watchlist, and market overview across forex, crypto, stocks and commodities."
        canonicalPath="/members/dashboard"
      />
      {routeState?.backUrl && (
        <div className="bg-muted/30 border-b border-border/40 px-4 py-2">
          <button
            onClick={() => navigate(routeState.backUrl!)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {routeState.backLabel || 'Back'}
          </button>
        </div>
      )}
      <CommandCenterLayout 
        userId={user?.id} 
        initialPlaybackPattern={routeState?.playbackPattern}
        initialSymbol={routeState?.initialSymbol}
      />
    </>
  );
};

export default MemberDashboard;
