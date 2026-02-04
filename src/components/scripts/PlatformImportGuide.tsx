import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MonitorPlay, 
  Download, 
  Copy, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Settings,
  Play
} from "lucide-react";

interface StepProps {
  number: number;
  title: string;
  description: string;
  imagePlaceholder?: string;
  warning?: string;
  tip?: string;
}

function Step({ number, title, description, imagePlaceholder, warning, tip }: StepProps) {
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
        
        {imagePlaceholder && (
          <div className="bg-background border border-dashed border-border rounded-lg p-8 text-center">
            <MonitorPlay className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-xs text-muted-foreground">{imagePlaceholder}</p>
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
                imagePlaceholder="Screenshot: TradingView interface with Pine Editor tab highlighted"
              />
              
              <Step
                number={2}
                title="Create New Script"
                description="Click 'Open' → 'New blank indicator' or 'New blank strategy' depending on your export type. Clear any default code."
                imagePlaceholder="Screenshot: Pine Editor 'Open' menu with options visible"
              />
              
              <Step
                number={3}
                title="Paste Your Script"
                description="Copy the entire exported script and paste it into the editor. Make sure to replace all default content."
                imagePlaceholder="Screenshot: Script pasted in Pine Editor"
                tip="Use Ctrl+A to select all existing code before pasting to ensure clean replacement."
              />
              
              <Step
                number={4}
                title="Add to Chart"
                description="Click 'Add to Chart' button. For strategies, this will also add it to the Strategy Tester."
                imagePlaceholder="Screenshot: 'Add to Chart' button highlighted"
                warning="Check the chart timeframe matches your pattern's timeframe before adding."
              />
              
              <Step
                number={5}
                title="Verify Entry Levels"
                description="Confirm the dynamic SL/TP lines appear on the chart. Check if the SL breach warning is displayed (orange background)."
                imagePlaceholder="Screenshot: Chart with SL/TP levels and info table visible"
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
                imagePlaceholder="Screenshot: MT4 menu showing MetaEditor option"
              />
              
              <Step
                number={2}
                title="Create New Expert Advisor"
                description="Click File → New → Expert Advisor (template). Name it to match your pattern. Click Next through the wizard."
                imagePlaceholder="Screenshot: MetaEditor new file wizard"
              />
              
              <Step
                number={3}
                title="Replace with Exported Code"
                description="Select all default code (Ctrl+A) and paste your exported MQL4 script. Save the file (Ctrl+S)."
                imagePlaceholder="Screenshot: Exported code in MetaEditor"
                warning="Ensure the file is saved in the 'MQL4/Experts' folder."
              />
              
              <Step
                number={4}
                title="Compile the EA"
                description="Press F7 to compile. Check the 'Errors' tab at the bottom - it should show '0 errors'. Warnings are usually okay."
                imagePlaceholder="Screenshot: Successful compilation with 0 errors"
              />
              
              <Step
                number={5}
                title="Attach to Chart"
                description="In MT4, refresh the Navigator (Ctrl+N), find your EA under 'Expert Advisors', and drag it onto the correct chart."
                imagePlaceholder="Screenshot: Navigator panel with EA listed"
                tip="Enable 'Allow live trading' in the EA settings dialog and ensure AutoTrading is on (button in toolbar)."
              />
              
              <Step
                number={6}
                title="Verify Execution"
                description="Check the 'Experts' tab for entry confirmation logs. The EA will show SL breach warnings if applicable."
                imagePlaceholder="Screenshot: Experts tab showing EA logs"
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
                imagePlaceholder="Screenshot: MT5 menu showing MetaEditor option"
              />
              
              <Step
                number={2}
                title="Create New Expert Advisor"
                description="Click File → New → Expert Advisor (template). The MQL5 wizard offers more options - defaults are fine for our scripts."
                imagePlaceholder="Screenshot: MQL5 new EA wizard"
              />
              
              <Step
                number={3}
                title="Replace with Exported Code"
                description="Select all and paste your exported MQL5 script. The CTrade include is handled automatically."
                imagePlaceholder="Screenshot: MQL5 code in MetaEditor"
                tip="MQL5 scripts use the CTrade class for cleaner order handling."
              />
              
              <Step
                number={4}
                title="Compile the EA"
                description="Press F7 to compile. MQL5 has stricter type checking - ensure 0 errors before proceeding."
                imagePlaceholder="Screenshot: Successful MQL5 compilation"
                warning="If you see 'Trade.mqh not found', ensure your MT5 installation has the standard library."
              />
              
              <Step
                number={5}
                title="Attach to Chart"
                description="In MT5 Navigator, find your EA and drag to chart. MT5 supports both netting and hedging modes - the script handles both."
                imagePlaceholder="Screenshot: MT5 Navigator with EA"
              />
              
              <Step
                number={6}
                title="Enable Algo Trading"
                description="Click the 'Algo Trading' button in the toolbar (must be green). Also enable in EA settings: 'Allow Algo Trading'."
                imagePlaceholder="Screenshot: Algo Trading button enabled"
                tip="MT5 requires explicit algo trading permission at both platform and EA level."
              />
              
              <Step
                number={7}
                title="Monitor Execution"
                description="Check the 'Experts' and 'Journal' tabs for execution logs. Positions will appear in the 'Trade' tab."
                imagePlaceholder="Screenshot: MT5 tabs showing EA activity"
                warning="Always verify on demo first. Symbol naming may differ between brokers (e.g., EURUSD vs EURUSD.pro)."
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
