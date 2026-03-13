import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { CaptureShareDialog } from './CaptureShareDialog';
import type { CaptureResult } from '@/hooks/useMediaCapture';

interface CardCaptureButtonProps {
  targetRef?: React.RefObject<HTMLElement>;
  label?: string;
  className?: string;
}

export const CardCaptureButton = ({
  targetRef,
  label,
  className,
}: CardCaptureButtonProps) => {
  const { t } = useTranslation();
  const { isCapturing, captureScreenshot } = useMediaCapture();
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const resolveTarget = useCallback((): HTMLElement | null => {
    let target: HTMLElement | null = targetRef?.current || null;
    if (!target && buttonRef.current) {
      target = buttonRef.current.closest('[data-capture-target]') as HTMLElement | null;
    }
    return target;
  }, [targetRef]);

  const handleScreenshot = useCallback(async () => {
    const target = resolveTarget();
    const result = await captureScreenshot(target, 'area');
    if (result) {
      setCaptureResult(result);
      setShareDialogOpen(true);
    }
  }, [resolveTarget, captureScreenshot]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={buttonRef}
            onClick={handleScreenshot}
            disabled={isCapturing}
            className={`h-6 w-6 flex items-center justify-center rounded hover:bg-muted/60 transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50 ${className || ''}`}
          >
            {isCapturing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Camera className="h-3 w-3" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{label ? t('capture.captureArea', { area: label }) : t('capture.captureChart')}</p>
        </TooltipContent>
      </Tooltip>

      <CaptureShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        capture={captureResult}
        contextType="area"
        contextMetadata={{ label }}
      />
    </>
  );
};
