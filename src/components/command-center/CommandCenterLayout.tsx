import { useState, useCallback } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { CommandCenterChart } from './CommandCenterChart';
import { WatchlistPanel } from './WatchlistPanel';
import { AlertsHistoryPanel } from './AlertsHistoryPanel';
import { QuickResearchPanel } from './QuickResearchPanel';
import { MarketOverviewPanel } from './MarketOverviewPanel';

interface CommandCenterLayoutProps {
  userId?: string;
}

export function CommandCenterLayout({ userId }: CommandCenterLayoutProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<string>('AAPL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1d');

  const handleSymbolSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Sidebar - Watchlist + Active Patterns */}
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <div className="h-full flex flex-col border-r border-border">
            <WatchlistPanel
              userId={userId}
              selectedSymbol={selectedSymbol}
              onSymbolSelect={handleSymbolSelect}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Main Content Area */}
        <ResizablePanel defaultSize={55} minSize={40}>
          <ResizablePanelGroup direction="vertical" className="h-full">
            {/* Main Chart */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <CommandCenterChart
                symbol={selectedSymbol}
                timeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Bottom Panels - Alerts + Quick Research */}
            <ResizablePanel defaultSize={30} minSize={15} maxSize={50}>
              <ResizablePanelGroup direction="horizontal" className="h-full">
                {/* Alerts History */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <AlertsHistoryPanel userId={userId} />
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Quick Research */}
                <ResizablePanel defaultSize={50} minSize={30}>
                  <QuickResearchPanel onSymbolSelect={handleSymbolSelect} />
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Sidebar - Market Overview */}
        <ResizablePanel defaultSize={25} minSize={15} maxSize={35}>
          <div className="h-full border-l border-border">
            <MarketOverviewPanel onSymbolSelect={handleSymbolSelect} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
