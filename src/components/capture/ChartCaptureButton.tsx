import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMediaCapture, CaptureResult } from '@/hooks/useMediaCapture';
import { CaptureShareDialog } from './CaptureShareDialog';

interface ChartCaptureButtonProps {
  chartContainerRef?: React.RefObject<HTMLElement>;
  symbol?: string;
  timeframe?: string;
  pattern?: string;
  className?: string;
}

export const ChartCaptureButton = ({
  chartContainerRef,
  symbol,
  timeframe,
  pattern,
  className,
}: ChartCaptureButtonProps) => {
  const { t } = useTranslation();
  const { isCapturing, captureScreenshot } = useMediaCapture();
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleCapture = useCallback(async () => {
    const target = chartContainerRef?.current || null;
    const result = await captureScreenshot(target, 'chart');
    if (result) {
      setCaptureResult(result);
      setShareDialogOpen(true);
    }
  }, [chartContainerRef, captureScreenshot]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCapture}
            disabled={isCapturing}
            className={className}
          >
            <Camera className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{t('capture.captureChart')}</p>
        </TooltipContent>
      </Tooltip>

      <CaptureShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        capture={captureResult}
        contextType="chart"
        contextMetadata={{ symbol, timeframe, pattern }}
      />
    </>
  );
};
