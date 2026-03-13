import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Video, Square, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useMediaCapture } from '@/hooks/useMediaCapture';
import { CaptureShareDialog } from './CaptureShareDialog';
import type { CaptureResult } from '@/hooks/useMediaCapture';

interface CardCaptureButtonProps {
  /** Ref to the element to capture. If omitted, captures closest parent with [data-capture-target] */
  targetRef?: React.RefObject<HTMLElement>;
  /** Descriptive label for the capture (e.g. "Watchlist", "Market Overview") */
  label?: string;
  className?: string;
}

/**
 * Small camera icon button for capturing any dashboard card/panel.
 * Click for screenshot, long-press or secondary button for video recording.
 */
export const CardCaptureButton = ({
  targetRef,
  label,
  className,
}: CardCaptureButtonProps) => {
  const { t } = useTranslation();
  const {
    isCapturing,
    isRecording,
    recordingTime,
    captureScreenshot,
    startElementRecording,
    stopRecording,
  } = useMediaCapture();
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

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
      // The onstop handler in useMediaCapture sets lastCapture,
      // but we need to listen for it — use a small delay
      setTimeout(() => {
        // We'll rely on the share dialog opening via the effect below
      }, 500);
      return;
    }
    const target = resolveTarget();
    if (!target) {
      return;
    }
    await startElementRecording(target);
  }, [isRecording, resolveTarget, startElementRecording, stopRecording]);

  // Watch for recording completion to open dialog
  const { lastCapture } = useMediaCapture();
  // We need to detect when recording stops and a new video capture appears
  const prevRecordingRef = useRef(false);
  if (prevRecordingRef.current && !isRecording && lastCapture?.type === 'video' && !shareDialogOpen) {
    setCaptureResult(lastCapture);
    setShareDialogOpen(true);
  }
  prevRecordingRef.current = isRecording;

  return (
    <>
      <div className="flex items-center gap-0.5">
        {/* Screenshot button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={buttonRef}
              onClick={handleScreenshot}
              disabled={isCapturing || isRecording}
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

        {/* Video recording toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleToggleRecording}
              disabled={isCapturing}
              className={`h-6 w-6 flex items-center justify-center rounded hover:bg-muted/60 transition-colors disabled:opacity-50 ${
                isRecording
                  ? 'text-destructive animate-pulse'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isRecording ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Video className="h-3 w-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {isRecording
                ? `${t('capture.stopRecording', 'Stop recording')} (${recordingTime}s)`
                : t('capture.recordVideo', 'Record video')}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

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
