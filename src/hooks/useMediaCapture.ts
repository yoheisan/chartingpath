import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CaptureType = 'screenshot' | 'video';
export type CaptureContextType = 'chart' | 'screen' | 'area';

export interface CaptureResult {
  blob: Blob;
  type: CaptureType;
  fileName: string;
  url: string; // object URL
  duration?: number; // seconds for video
}

interface UploadResult {
  publicUrl: string;
  captureId: string;
  expiresAt?: string;
}

interface UseMediaCaptureOptions {
  maxVideoDuration?: number; // seconds, default 30
}

export const useMediaCapture = (options: UseMediaCaptureOptions = {}) => {
  const { maxVideoDuration = 30 } = options;
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastCapture, setLastCapture] = useState<CaptureResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateFileName = (type: CaptureType): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const page = window.location.pathname.replace(/\//g, '-') || 'home';
    const ext = type === 'screenshot' ? 'png' : 'webm';
    return `capture${page}-${timestamp}.${ext}`;
  };

  // Screenshot capture
  const captureScreenshot = useCallback(async (
    target?: HTMLElement | null,
    contextType: CaptureContextType = 'screen'
  ): Promise<CaptureResult | null> => {
    setIsCapturing(true);
    try {
      const element = target || document.body;
      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        scale: 2, // Higher quality
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            toast.error('Failed to create screenshot');
            resolve(null);
            return;
          }
          const fileName = generateFileName('screenshot');
          const url = URL.createObjectURL(blob);
          const result: CaptureResult = { blob, type: 'screenshot', fileName, url };
          setLastCapture(result);
          resolve(result);
        }, 'image/png');
      });
    } catch (error) {
      console.error('Screenshot capture error:', error);
      toast.error('Failed to capture screenshot');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  // Start video recording
  const startRecording = useCallback(async (
    includeAudio: boolean = false
  ): Promise<boolean> => {
    try {
      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: { frameRate: 30 },
        audio: includeAudio,
        // @ts-ignore - preferCurrentTab is supported in modern browsers
        preferCurrentTab: true,
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      // If user wants microphone audio
      let combinedStream = displayStream;
      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const tracks = [...displayStream.getTracks(), ...audioStream.getTracks()];
          combinedStream = new MediaStream(tracks);
        } catch {
          // Continue without mic audio if permission denied
          console.warn('Microphone access denied, recording without audio');
        }
      }

      streamRef.current = combinedStream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const fileName = generateFileName('video');
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;
        const result: CaptureResult = { blob, type: 'video', fileName, url, duration };
        setLastCapture(result);
        setIsRecording(false);
        setRecordingTime(0);
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      // Auto-stop at max duration
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          if (next >= maxVideoDuration) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

      // Handle user stopping share via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      };

      return true;
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast.error('Screen recording permission denied');
      } else {
        console.error('Recording error:', error);
        toast.error('Failed to start recording');
      }
      return false;
    }
  }, [maxVideoDuration]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // Download capture to device
  const downloadCapture = useCallback((capture: CaptureResult) => {
    const link = document.createElement('a');
    link.href = capture.url;
    link.download = capture.fileName;
    link.click();
    toast.success('Downloaded!');
  }, []);

  // Copy screenshot to clipboard
  const copyToClipboard = useCallback(async (capture: CaptureResult): Promise<boolean> => {
    if (capture.type !== 'screenshot') {
      toast.error('Only screenshots can be copied to clipboard');
      return false;
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': capture.blob }),
      ]);
      toast.success('Copied to clipboard!');
      return true;
    } catch {
      toast.error('Failed to copy to clipboard');
      return false;
    }
  }, []);

  // Native Web Share
  const shareCapture = useCallback(async (capture: CaptureResult): Promise<boolean> => {
    if (!navigator.share) {
      toast.error('Sharing not supported on this browser');
      return false;
    }
    try {
      const file = new File([capture.blob], capture.fileName, { type: capture.blob.type });
      const shareData = { title: 'ChartingPath Capture', files: [file] };
      
      // Check if the browser can actually share this file type
      if (navigator.canShare && !navigator.canShare(shareData)) {
        // Fallback: download the file instead
        downloadCapture(capture);
        toast.info('Sharing not supported for this file type — downloaded instead');
        return false;
      }
      
      await navigator.share(shareData);
      return true;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        // Fallback: download
        downloadCapture(capture);
        toast.info('Share failed — downloaded instead');
      }
      return false;
    }
  }, [downloadCapture]);

  // Upload to Supabase (temp 24h or permanent for Elite)
  const uploadCapture = useCallback(async (
    capture: CaptureResult,
    isElite: boolean,
    contextType: CaptureContextType = 'screen',
    contextMetadata: Record<string, unknown> = {}
  ): Promise<UploadResult | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to create shareable links');
        return null;
      }

      const filePath = `${user.id}/${capture.fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-captures')
        .upload(filePath, capture.blob, {
          contentType: capture.blob.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const isTemporary = !isElite;
      const expiresAt = isTemporary
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const { data: captureRecord, error: insertError } = await supabase
        .from('user_captures' as any)
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: capture.fileName,
          capture_type: capture.type,
          file_size_bytes: capture.blob.size,
          duration_seconds: capture.duration || null,
          context_type: contextType,
          context_metadata: contextMetadata,
          is_temporary: isTemporary,
          expires_at: expiresAt || null,
        } as any)
        .select('id')
        .single();

      if (insertError) throw insertError;

      const { data: urlData } = supabase.storage
        .from('user-captures')
        .getPublicUrl(filePath);

      const result: UploadResult = {
        publicUrl: urlData.publicUrl,
        captureId: (captureRecord as any).id,
        expiresAt,
      };

      toast.success(isTemporary ? 'Link created (expires in 24h)' : 'Saved to your library!');
      return result;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload capture');
      return null;
    }
  }, []);

  // Cleanup
  const clearCapture = useCallback(() => {
    if (lastCapture?.url) {
      URL.revokeObjectURL(lastCapture.url);
    }
    setLastCapture(null);
  }, [lastCapture]);

  return {
    isCapturing,
    isRecording,
    recordingTime,
    lastCapture,
    maxVideoDuration,
    captureScreenshot,
    startRecording,
    stopRecording,
    downloadCapture,
    copyToClipboard,
    shareCapture,
    uploadCapture,
    clearCapture,
  };
};
