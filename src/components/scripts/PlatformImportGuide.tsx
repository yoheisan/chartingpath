import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MonitorPlay, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Settings,
  Play
} from "lucide-react";

// Import guide images
import tradingviewPineEditor from "@/assets/guides/tradingview-pine-editor.png";
import tradingviewAddToChart from "@/assets/guides/tradingview-add-to-chart.png";
import mt4Metaeditor from "@/assets/guides/mt4-metaeditor.png";
import mt5Navigator from "@/assets/guides/mt5-navigator.png";
import chartSlTpLevels from "@/assets/guides/chart-sl-tp-levels.png";

interface StepProps {
  number: number;
  title: string;
  description: string;
  image?: string;
  imageAlt?: string;
  warning?: string;
  tip?: string;
}

function Step({ number, title, description, image, imageAlt, warning, tip }: StepProps) {
  return (
    <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
        {number}
      </div>
      <div className="flex-1 space-y-3">
        <div>
          <h4 className="font-semibold text-foreground">{title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        
        {image && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img 
              src={image} 
              alt={imageAlt || title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}
        
        {warning && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{warning}</p>
          </div>
        )}
        
        {tip && (
          <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-primary">{tip}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function PlatformImportGuide() {
  const [activeTab, setActiveTab] = useState("tradingview");

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-primary" />
          Platform Import Guides
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Step-by-step instructions for importing your exported scripts
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="tradingview" className="gap-2">
              <MonitorPlay className="w-4 h-4" />
              TradingView
            </TabsTrigger>
            <TabsTrigger value="mt4" className="gap-2">
              <Settings className="w-4 h-4" />
              MetaTrader 4
            </TabsTrigger>
            <TabsTrigger value="mt5" className="gap-2">
              <Play className="w-4 h-4" />
              MetaTrader 5
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tradingview" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Pine Script v5</Badge>
              <Badge variant="secondary">Tested ✓</Badge>
            </div>
            
            <div className="space-y-4">
              <Step
                number={1}
                title="Open Pine Editor"
                description="In TradingView, click the 'Pine Editor' tab at the bottom of the chart. This opens the script editor where you can paste your code."
                image={tradingviewPineEditor}
                imageAlt="TradingView interface with Pine Editor tab highlighted"
              />
              
              <Step
                number={2}
                title="Create New Script"
                description="Click 'Open' → 'New blank indicator' or 'New blank strategy' depending on your export type. Clear any default code."
              />
              
              <Step
                number={3}
                title="Paste Your Script"
                description="Copy the entire exported script and paste it into the editor. Make sure to replace all default content."
                image={tradingviewAddToChart}
                imageAlt="Pine Script code in editor with Add to Chart button"
                tip="Use Ctrl+A to select all existing code before pasting to ensure clean replacement."
              />
              
              <Step
                number={4}
                title="Add to Chart"
                description="Click the green 'Add to Chart' button. For strategies, this will also add it to the Strategy Tester."
                warning="Check the chart timeframe matches your pattern's timeframe before adding."
              />
              
              <Step
                number={5}
                title="Verify Entry Levels"
                description="Confirm the dynamic SL/TP lines appear on the chart. Check if the SL breach warning is displayed (orange background)."
                image={chartSlTpLevels}
                imageAlt="Chart showing Stop Loss and Take Profit levels"
                tip="The script enters at current market price and recalculates levels to maintain your R:R ratio."
              />
            </div>
          </TabsContent>

          <TabsContent value="mt4" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">MQL4</Badge>
              <Badge variant="secondary">Tested ✓</Badge>
            </div>
            
            <div className="space-y-4">
              <Step
                number={1}
                title="Open MetaEditor"
                description="In MT4, press F4 or go to Tools → MetaQuotes Language Editor. This opens the IDE for editing EA files."
                image={mt4Metaeditor}
                imageAlt="MetaTrader 4 MetaEditor IDE interface"
              />
              
              <Step
                number={2}
                title="Create New Expert Advisor"
                description="Click File → New → Expert Advisor (template). Name it to match your pattern. Click Next through the wizard."
              />
              
              <Step
                number={3}
                title="Replace with Exported Code"
                description="Select all default code (Ctrl+A) and paste your exported MQL4 script. Save the file (Ctrl+S)."
                warning="Ensure the file is saved in the 'MQL4/Experts' folder."
              />
              
              <Step
                number={4}
                title="Compile the EA"
                description="Press F7 to compile. Check the 'Errors' tab at the bottom - it should show '0 errors'. Warnings are usually okay."
              />
              
              <Step
                number={5}
                title="Attach to Chart"
                description="In MT4, refresh the Navigator (Ctrl+N), find your EA under 'Expert Advisors', and drag it onto the correct chart."
                tip="Enable 'Allow live trading' in the EA settings dialog and ensure AutoTrading is on (button in toolbar)."
              />
              
              <Step
                number={6}
                title="Verify Execution"
                description="Check the 'Experts' tab for entry confirmation logs. The EA will show SL breach warnings if applicable."
                image={chartSlTpLevels}
                imageAlt="Chart with SL/TP levels visible"
                warning="Test on a demo account first. Verify the instrument and timeframe match your pattern."
              />
            </div>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">MQL5</Badge>
              <Badge variant="secondary">Tested ✓</Badge>
            </div>
            
            <div className="space-y-4">
              <Step
                number={1}
                title="Open MetaEditor"
                description="In MT5, press F4 or go to Tools → MetaQuotes Language Editor. MT5's editor has enhanced debugging features."
              />
              
              <Step
                number={2}
                title="Create New Expert Advisor"
                description="Click File → New → Expert Advisor (template). The MQL5 wizard offers more options - defaults are fine for our scripts."
              />
              
              <Step
                number={3}
                title="Replace with Exported Code"
                description="Select all and paste your exported MQL5 script. The CTrade include is handled automatically."
                tip="MQL5 scripts use the CTrade class for cleaner order handling."
              />
              
              <Step
                number={4}
                title="Compile the EA"
                description="Press F7 to compile. MQL5 has stricter type checking - ensure 0 errors before proceeding."
                warning="If you see 'Trade.mqh not found', ensure your MT5 installation has the standard library."
              />
              
              <Step
                number={5}
                title="Attach to Chart"
                description="In MT5 Navigator, find your EA and drag to chart. MT5 supports both netting and hedging modes - the script handles both."
                image={mt5Navigator}
                imageAlt="MetaTrader 5 Navigator with EA and Algo Trading button"
              />
              
              <Step
                number={6}
                title="Enable Algo Trading"
                description="Click the 'Algo Trading' button in the toolbar (must be green). Also enable in EA settings: 'Allow Algo Trading'."
                tip="MT5 requires explicit algo trading permission at both platform and EA level."
              />
              
              <Step
                number={7}
                title="Monitor Execution"
                description="Check the 'Experts' and 'Journal' tabs for execution logs. Positions will appear in the 'Trade' tab."
                image={chartSlTpLevels}
                imageAlt="Chart showing trade execution levels"
                warning="Always verify on demo first. Symbol naming may differ between brokers (e.g., EURUSD vs EURUSD.pro)."
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
