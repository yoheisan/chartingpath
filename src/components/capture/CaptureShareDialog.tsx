import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Download,
  Copy,
  Share2,
  Link2,
  Loader2,
  Check,
  Clock,
  Crown,
} from 'lucide-react';
import { CaptureResult, CaptureContextType, useMediaCapture } from '@/hooks/useMediaCapture';
import { useUserProfile } from '@/hooks/useUserProfile';
import { track } from '@/services/analytics';

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
  const { subscriptionPlan } = useUserProfile();
  const { downloadCapture, copyToClipboard, shareCapture, uploadCapture } = useMediaCapture();
  
  const [isUploading, setIsUploading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const isElite = subscriptionPlan === 'elite';
  const canShare = typeof navigator.share === 'function';

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

  const handleCreateLink = useCallback(async () => {
    if (!capture) return;
    setIsUploading(true);
    try {
      const result = await uploadCapture(capture, isElite, contextType, contextMetadata);
      if (result) {
        setShareUrl(result.publicUrl);
        setExpiresAt(result.expiresAt || null);
      }
    } finally {
      setIsUploading(false);
    }
  }, [capture, isElite, contextType, contextMetadata, uploadCapture]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleClose = useCallback((open: boolean) => {
    if (!open) {
      setShareUrl(null);
      setExpiresAt(null);
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

          {canShare && (
            <Button variant="outline" onClick={handleNativeShare} className="gap-2">
              <Share2 className="h-4 w-4" />
              {t('capture.share')}
            </Button>
          )}

          <Button
            variant="default"
            onClick={handleCreateLink}
            disabled={isUploading || !!shareUrl}
            className="gap-2"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            {t('capture.createLink')}
          </Button>
        </div>

        {/* Share URL result */}
        {shareUrl && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly className="text-xs" />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {expiresAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t('capture.expiresIn24h')}
              </p>
            )}
            {!isElite && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Crown className="h-3 w-3 text-yellow-500" />
                {t('capture.elitePermanentStorage')}
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
