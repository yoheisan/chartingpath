import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const isDev = import.meta.env.DEV;

export const PageCaptureButton = () => {
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isDev) return null;

  const captureFullPage = async () => {
    setIsCapturing(true);
    toast.info('Capturing full page...');

    try {
      // Get the full document height
      const body = document.body;
      const html = document.documentElement;
      
      const fullHeight = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );

      const fullWidth = Math.max(
        body.scrollWidth,
        body.offsetWidth,
        html.clientWidth,
        html.scrollWidth,
        html.offsetWidth
      );

      // Capture the entire page
      const canvas = await html2canvas(document.body, {
        height: fullHeight,
        width: fullWidth,
        windowHeight: fullHeight,
        windowWidth: fullWidth,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to create image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const pageName = window.location.pathname.replace(/\//g, '-') || 'home';
        
        link.href = url;
        link.download = `page-capture${pageName}-${timestamp}.png`;
        link.click();
        
        URL.revokeObjectURL(url);
        toast.success('Page captured and downloaded!');
      }, 'image/png');
    } catch (error) {
      console.error('Capture error:', error);
      toast.error('Failed to capture page');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <Button
      onClick={captureFullPage}
      disabled={isCapturing}
      variant="outline"
      size="icon"
      className="fixed bottom-4 right-4 z-[9999] bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 shadow-lg"
      title="Capture Full Page (Dev Only)"
    >
      {isCapturing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Camera className="h-4 w-4" />
      )}
    </Button>
  );
};
