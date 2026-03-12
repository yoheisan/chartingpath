import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Video, Square, Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { useMediaCapture, CaptureResult } from '@/hooks/useMediaCapture';
import { CaptureShareDialog } from './CaptureShareDialog';
import { useAuth } from '@/contexts/AuthContext';

export const CaptureButton = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const {
    isCapturing,
    isRecording,
    recordingTime,
    lastCapture,
    captureScreenshot,
    startRecording,
    stopRecording,
    maxVideoDuration,
  } = useMediaCapture();

  const [popoverOpen, setPopoverOpen] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [captureResult, setCaptureResult] = useState<CaptureResult | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleScreenshot = useCallback(async () => {
    setPopoverOpen(false);
    await new Promise(r => setTimeout(r, 200));
    const result = await captureScreenshot(null, 'screen');
    if (result) {
      setCaptureResult(result);
      setShareDialogOpen(true);
    }
  }, [captureScreenshot]);

  const handleStartRecording = useCallback(async () => {
    setPopoverOpen(false);
    await startRecording(includeAudio);
  }, [startRecording, includeAudio]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    // The share dialog will open via the useEffect watching lastCapture
  }, [stopRecording]);

  // Open share dialog when a video recording completes
  useEffect(() => {
    if (lastCapture && lastCapture.type === 'video') {
      setCaptureResult(lastCapture);
      setShareDialogOpen(true);
    }
  }, [lastCapture]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Don't show for unauthenticated users
  if (!isAuthenticated) return null;


  // Recording mode UI
  if (isRecording) {
    return (
      <>
        <div className="fixed bottom-4 right-4 z-[99998] flex items-center gap-2 bg-destructive text-destructive-foreground rounded-full px-4 py-2 shadow-lg animate-pulse print:hidden">
          <div className="h-2 w-2 rounded-full bg-destructive-foreground animate-pulse" />
          <span className="text-sm font-mono">{formatTime(recordingTime)} / {formatTime(maxVideoDuration)}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleStopRecording}
            className="h-7 gap-1.5 ml-2"
          >
            <Square className="h-3 w-3" />
            {t('capture.stop')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="fixed bottom-4 right-14 z-[99998] bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 shadow-lg print:hidden"
                  disabled={isCapturing}
                >
                  {isCapturing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>{t('capture.captureAndShare')}</p>
            </TooltipContent>
          </Tooltip>

          <PopoverContent side="top" align="end" className="w-56 p-2">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleScreenshot}
                disabled={isCapturing}
              >
                <Camera className="h-4 w-4" />
                {t('capture.screenshot')}
              </Button>

              <div className="border-t my-1" />

              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleStartRecording}
              >
                <Video className="h-4 w-4 text-destructive" />
                {t('capture.recordScreen')}
              </Button>

              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  {includeAudio ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                  {t('capture.microphone')}
                </span>
                <Switch
                  checked={includeAudio}
                  onCheckedChange={setIncludeAudio}
                  className="scale-75"
                />
              </div>

              <p className="text-[10px] text-muted-foreground px-2">
                {t('capture.maxDuration', { seconds: maxVideoDuration })}
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </TooltipProvider>

      <CaptureShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        capture={captureResult}
        contextType="screen"
      />
    </>
  );
};
