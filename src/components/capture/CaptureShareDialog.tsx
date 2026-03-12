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

  const ensureShareLink = useCallback(async (): Promise<string | null> => {
    if (!capture) return null;
    if (shareUrl) return shareUrl;

    setIsUploading(true);
    try {
      const result = await uploadCapture(capture, isElite, contextType, contextMetadata);
      if (!result) return null;
      setShareUrl(result.publicUrl);
      setExpiresAt(result.expiresAt || null);
      return result.publicUrl;
    } finally {
      setIsUploading(false);
    }
  }, [capture, shareUrl, uploadCapture, isElite, contextType, contextMetadata]);

  const handleNativeShare = useCallback(async () => {
    if (!capture) return;

    const file = new File([capture.blob], capture.fileName, { type: capture.blob.type });
    const supportsFileShare = typeof navigator.share === 'function' &&
      (!navigator.canShare || navigator.canShare({ files: [file] }));

    // Prefer native file sharing when supported
    if (supportsFileShare) {
      await shareCapture(capture);
      return;
    }

    // Fallback: create share link and share/copy link
    const link = await ensureShareLink();
    if (!link) {
      toast.error('Unable to create share link');
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: 'ChartingPath Capture', url: link, text: link });
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Share link copied to clipboard');
    } catch {
      toast.error('Could not copy share link');
    }
  }, [capture, shareCapture, ensureShareLink]);

  const handleShareToX = useCallback(async () => {
    const link = await ensureShareLink();
    if (!link) {
      toast.error('Unable to create share link');
      return;
    }

    const shareText = capture?.type === 'video'
      ? 'Check out this video capture from ChartingPath'
      : 'Check out this capture from ChartingPath';

    const xIntentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`;
    const popup = window.open(xIntentUrl, '_blank', 'noopener,noreferrer,width=550,height=420');

    if (!popup) {
      try {
        await navigator.clipboard.writeText(`${shareText} ${link}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('X share text copied to clipboard');
      } catch {
        toast.error('Could not open X or copy share text');
      }
    }
  }, [ensureShareLink, capture?.type]);

  const handleCreateLink = useCallback(async () => {
    await ensureShareLink();
  }, [ensureShareLink]);

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

          {capture.type === 'video' && (
            <Button variant="outline" onClick={handleShareToX} disabled={isUploading} className="gap-2">
              <span aria-hidden="true">𝕏</span>
              Share to X
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
