import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MonitorPlay, 
  CheckCircle2, 
  AlertTriangle,
  FileCode,
  Settings,
  Play,
  Sparkles,
  ArrowRight
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tradingview");
  const g = (key: string) => t(`scripts.importGuide.${key}`);
  const tv = (key: string) => t(`scripts.importGuide.tv.${key}`);
  const mt4 = (key: string) => t(`scripts.importGuide.mt4.${key}`);
  const mt5 = (key: string) => t(`scripts.importGuide.mt5.${key}`);

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-primary" />
          {g('title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {g('subtitle')}
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full mb-6">
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
            <TabsTrigger value="copilot" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Copilot Strategy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tradingview" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Pine Script v5</Badge>
              <Badge variant="secondary">{g('tested')}</Badge>
            </div>
            
            <div className="space-y-4">
              <Step number={1} title={tv('step1Title')} description={tv('step1Desc')}
                image={tradingviewPineEditor} imageAlt="TradingView interface with Pine Editor tab highlighted" />
              <Step number={2} title={tv('step2Title')} description={tv('step2Desc')} />
              <Step number={3} title={tv('step3Title')} description={tv('step3Desc')}
                image={tradingviewAddToChart} imageAlt="Pine Script code in editor with Add to Chart button"
                tip={tv('step3Tip')} />
              <Step number={4} title={tv('step4Title')} description={tv('step4Desc')}
                warning={tv('step4Warning')} />
              <Step number={5} title={tv('step5Title')} description={tv('step5Desc')}
                image={chartSlTpLevels} imageAlt="Chart showing Stop Loss and Take Profit levels"
                tip={tv('step5Tip')} />
            </div>
          </TabsContent>

          <TabsContent value="mt4" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">MQL4</Badge>
              <Badge variant="secondary">{g('tested')}</Badge>
            </div>
            
            <div className="space-y-4">
              <Step number={1} title={mt4('step1Title')} description={mt4('step1Desc')}
                image={mt4Metaeditor} imageAlt="MetaTrader 4 MetaEditor IDE interface" />
              <Step number={2} title={mt4('step2Title')} description={mt4('step2Desc')} />
              <Step number={3} title={mt4('step3Title')} description={mt4('step3Desc')}
                warning={mt4('step3Warning')} />
              <Step number={4} title={mt4('step4Title')} description={mt4('step4Desc')} />
              <Step number={5} title={mt4('step5Title')} description={mt4('step5Desc')}
                tip={mt4('step5Tip')} />
              <Step number={6} title={mt4('step6Title')} description={mt4('step6Desc')}
                image={chartSlTpLevels} imageAlt="Chart with SL/TP levels visible"
                warning={mt4('step6Warning')} />
            </div>
          </TabsContent>

          <TabsContent value="mt5" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">MQL5</Badge>
              <Badge variant="secondary">{g('tested')}</Badge>
            </div>
            
            <div className="space-y-4">
              <Step number={1} title={mt5('step1Title')} description={mt5('step1Desc')} />
              <Step number={2} title={mt5('step2Title')} description={mt5('step2Desc')} />
              <Step number={3} title={mt5('step3Title')} description={mt5('step3Desc')}
                tip={mt5('step3Tip')} />
              <Step number={4} title={mt5('step4Title')} description={mt5('step4Desc')}
                warning={mt5('step4Warning')} />
              <Step number={5} title={mt5('step5Title')} description={mt5('step5Desc')}
                image={mt5Navigator} imageAlt="MetaTrader 5 Navigator with EA and Algo Trading button" />
              <Step number={6} title={mt5('step6Title')} description={mt5('step6Desc')}
                tip={mt5('step6Tip')} />
              <Step number={7} title={mt5('step7Title')} description={mt5('step7Desc')}
                image={chartSlTpLevels} imageAlt="Chart showing trade execution levels"
                warning={mt5('step7Warning')} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
