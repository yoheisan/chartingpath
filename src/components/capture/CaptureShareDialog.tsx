import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Download,
  Copy,
  Check,
} from 'lucide-react';
import { CaptureResult, CaptureContextType, useMediaCapture } from '@/hooks/useMediaCapture';
import { track } from '@/services/analytics';
import { toast } from 'sonner';

interface CaptureShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capture: CaptureResult | null;
  contextType?: CaptureContextType;
  contextMetadata?: Record<string, unknown>;
}

export const CaptureShareDialog = ({
  open,
  onOpenChange,
  capture,
  contextType = 'screen',
  contextMetadata = {},
}: CaptureShareDialogProps) => {
  const { t } = useTranslation();
  const { downloadCapture, copyToClipboard } = useMediaCapture();
  
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(() => {
    if (!capture) return;
    downloadCapture(capture);
    track('share_created', { symbol: '', pattern: '', timeframe: '' });
  }, [capture, downloadCapture]);

  const handleCopy = useCallback(async () => {
    if (!capture) return;
    const success = await copyToClipboard(capture);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [capture, copyToClipboard]);

  const handleNativeShare = useCallback(async () => {
    if (!capture) return;
    await shareCapture(capture);
  }, [capture, shareCapture]);

  const handleDownloadForX = useCallback(() => {
    if (!capture) return;
    // Download the video file
    downloadCapture(capture);
    
    // Open X composer with pre-filled text (no URL)
    const shareText = 'Check out this video capture from ChartingPath';
    const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(xIntentUrl, '_blank', 'noopener,noreferrer,width=550,height=420');
    
    toast.info('Video downloaded — attach it to your X post for inline playback');
  }, [capture, downloadCapture]);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setCopied(false);
    }
    onOpenChange(open);
  }, [onOpenChange]);

  if (!capture) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('capture.shareCapture')}</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="relative rounded-lg overflow-hidden border bg-muted/30 max-h-48 flex items-center justify-center">
          {capture.type === 'screenshot' ? (
            <img
              src={capture.url}
              alt="Capture preview"
              className="max-h-48 w-auto object-contain"
            />
          ) : (
            <video
              src={capture.url}
              controls
              className="max-h-48 w-full"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleDownload} className="gap-2">
            <Download className="h-4 w-4" />
            {t('capture.download')}
          </Button>

          {capture.type === 'screenshot' && (
            <Button variant="outline" onClick={handleCopy} className="gap-2">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? t('capture.copied') : t('capture.copyClipboard')}
            </Button>
          )}

          {capture.type === 'video' && (
            <Button variant="outline" onClick={handleDownloadForX} className="gap-2">
              <span aria-hidden="true">𝕏</span>
              Download for X
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {t('capture.copyPasteHint', 'Copy and paste to share with others')}
        </p>
      </DialogContent>
    </Dialog>
  );
};
