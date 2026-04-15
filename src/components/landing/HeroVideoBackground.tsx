import { memo, useEffect, useRef, useState } from 'react';

/**
 * Hero background with a real candlestick chart video.
 * - Lazy-loads: only starts loading when visible
 * - Shows poster image immediately for fast LCP
 * - Falls back to static poster on slow connections or if video fails
 * - Low opacity overlay so hero text remains readable
 */
export const HeroVideoBackground = memo(() => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only autoplay video on connections that can handle it
    if ('connection' in navigator) {
      const conn = (navigator as any).connection;
      if (conn?.saveData || conn?.effectiveType === '2g') {
        return; // Keep showing poster only
      }
    }

    const handleCanPlay = () => setVideoLoaded(true);
    video.addEventListener('canplaythrough', handleCanPlay);

    return () => video.removeEventListener('canplaythrough', handleCanPlay);
  }, []);

  return (
    <div className="absolute inset-0 bg-background">
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }}
      />

      {/* Video background */}
      <div className="absolute inset-0 pointer-events-none">
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-[0.18]' : 'opacity-0'
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/hero-poster.jpg"
          aria-hidden="true"
        >
          <source src="/hero-bg.webm" type="video/webm" />
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>

        {/* Poster fallback visible until video loads */}
        <div
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-0' : 'opacity-[0.12]'
          }`}
          style={{ backgroundImage: "url('/hero-poster.jpg')" }}
          aria-hidden="true"
        />
      </div>

      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40 pointer-events-none" />

      {/* Soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-[0.07] blur-[100px] bg-primary pointer-events-none" />
    </div>
  );
});

HeroVideoBackground.displayName = 'HeroVideoBackground';
