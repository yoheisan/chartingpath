import { useState, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

export const PageCaptureButton = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }

        const { data: adminCheck } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        setIsAdmin(!!adminCheck);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't render anything for non-admins (fully hidden, not disabled)
  if (isLoading || !isAdmin) {
    return null;
  }

  const captureFullPage = async () => {
    setIsCapturing(true);
    toast.info('Capturing full page...');

    try {
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
      className="fixed bottom-4 right-4 max-md:bottom-20 z-[99999] bg-background/80 backdrop-blur-sm border-primary/20 hover:border-primary/50 shadow-lg print:hidden"
      title="Capture Full Page (Admin)"
    >
      {isCapturing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Camera className="h-4 w-4" />
      )}
    </Button>
  );
};
