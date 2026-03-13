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

interface UseMediaCaptureOptions {
  maxVideoDuration?: number; // seconds, default 30
}

// Determine best supported video MIME type
const getVideoMimeType = (): string => {
  if (typeof MediaRecorder !== 'undefined') {
    if (MediaRecorder.isTypeSupported('video/mp4')) return 'video/mp4';
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) return 'video/webm;codecs=vp9';
  }
  return 'video/webm';
};

const getVideoExtension = (mimeType: string): string => {
  return mimeType.startsWith('video/mp4') ? 'mp4' : 'webm';
};

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
  const animFrameRef = useRef<number | null>(null);

  const generateFileName = (type: CaptureType, ext?: string): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const page = window.location.pathname.replace(/\//g, '-') || 'home';
    const extension = ext || (type === 'screenshot' ? 'png' : getVideoExtension(getVideoMimeType()));
    return `capture${page}-${timestamp}.${extension}`;
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
        scale: 2,
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

  // Element-scoped video recording using html2canvas + canvas.captureStream
  const startElementRecording = useCallback(async (
    element: HTMLElement
  ): Promise<boolean> => {
    try {
      const mimeType = getVideoMimeType();
      const ext = getVideoExtension(mimeType);

      // Create an offscreen canvas matching element dimensions
      const rect = element.getBoundingClientRect();
      const scale = 2;
      const offscreen = document.createElement('canvas');
      offscreen.width = rect.width * scale;
      offscreen.height = rect.height * scale;

      // Capture stream from the canvas
      const canvasStream = offscreen.captureStream(30);
      streamRef.current = canvasStream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(canvasStream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop the render loop
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const fileName = generateFileName('video', ext);
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;
        const result: CaptureResult = { blob, type: 'video', fileName, url, duration };
        setLastCapture(result);
        setIsRecording(false);
        setRecordingTime(0);

        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      // Render loop: continuously paint element to canvas via html2canvas
      const renderFrame = async () => {
        if (mediaRecorderRef.current?.state !== 'recording') return;
        try {
          const frameCanvas = await html2canvas(element, {
            useCORS: true,
            allowTaint: true,
            backgroundColor: null,
            logging: false,
            scale,
          });
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, offscreen.width, offscreen.height);
            ctx.drawImage(frameCanvas, 0, 0, offscreen.width, offscreen.height);
          }
        } catch {
          // Skip frame on error
        }
        if (mediaRecorderRef.current?.state === 'recording') {
          animFrameRef.current = requestAnimationFrame(renderFrame);
        }
      };
      animFrameRef.current = requestAnimationFrame(renderFrame);

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          if (next >= maxVideoDuration) {
            stopRecording();
          }
          return next;
        });
      }, 1000);

      return true;
    } catch (error) {
      console.error('Element recording error:', error);
      toast.error('Failed to start recording');
      return false;
    }
  }, [maxVideoDuration]);

  // Start full-screen video recording (kept for backward compat)
  const startRecording = useCallback(async (
    includeAudio: boolean = false
  ): Promise<boolean> => {
    try {
      const mimeType = getVideoMimeType();

      const displayMediaOptions: DisplayMediaStreamOptions = {
        video: { frameRate: 30 },
        audio: includeAudio,
        // @ts-ignore - preferCurrentTab is supported in modern browsers
        preferCurrentTab: true,
      };

      const displayStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
      
      let combinedStream = displayStream;
      if (includeAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const tracks = [...displayStream.getTracks(), ...audioStream.getTracks()];
          combinedStream = new MediaStream(tracks);
        } catch {
          console.warn('Microphone access denied, recording without audio');
        }
      }

      streamRef.current = combinedStream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext = getVideoExtension(mimeType);
        const fileName = generateFileName('video', ext);
        const url = URL.createObjectURL(blob);
        const duration = recordingTime;
        const result: CaptureResult = { blob, type: 'video', fileName, url, duration };
        setLastCapture(result);
        setIsRecording(false);
        setRecordingTime(0);
        
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
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
      
      if (navigator.canShare && !navigator.canShare(shareData)) {
        downloadCapture(capture);
        toast.info('Sharing not supported for this file type — downloaded instead');
        return false;
      }
      
      await navigator.share(shareData);
      return true;
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        downloadCapture(capture);
        toast.info('Share failed — downloaded instead');
      }
      return false;
    }
  }, [downloadCapture]);

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
    startElementRecording,
    stopRecording,
    downloadCapture,
    copyToClipboard,
    shareCapture,
    clearCapture,
  };
};
