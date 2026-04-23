import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  isActive: boolean;
  onEnded?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, isActive, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const reportedViewRef = useRef<boolean>(false);

  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(url);
      hls.attachMedia(video);
      hlsRef.current = hls;
      return () => hls.destroy();
    }
  }, [url]);

  const reportStats = async (view: boolean, duration: number) => {
    if (!view && duration <= 0) return;
    try {
      await fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ view, duration })
      });
    } catch (e) {
      console.error('Stats report failed', e);
    }
  };

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().then(() => {
        if (!reportedViewRef.current) {
          reportStats(true, 0);
          reportedViewRef.current = true;
        }
        playStartTimeRef.current = Date.now();
      }).catch(() => {
        console.log('Autoplay blocked');
      });
    } else if (videoRef.current) {
      if (playStartTimeRef.current) {
        const duration = (Date.now() - playStartTimeRef.current) / 1000;
        reportStats(false, duration);
        playStartTimeRef.current = null;
      }
      reportedViewRef.current = false; // Reset for next time it becomes active
      videoRef.current.pause();
      videoRef.current.currentTime = 0; 
    }
    
    return () => {
      if (playStartTimeRef.current) {
        const duration = (Date.now() - playStartTimeRef.current) / 1000;
        reportStats(false, duration);
      }
    };
  }, [isActive]);

  const handleEnded = () => {
    if (playStartTimeRef.current) {
      const duration = (Date.now() - playStartTimeRef.current) / 1000;
      reportStats(false, duration);
      playStartTimeRef.current = null;
    }
    if (onEnded) onEnded();
  };

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        onEnded={handleEnded}
        playsInline
        muted={!isActive}
      />
      {!isActive && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
           <div className="animate-spin rounded-full h-8 w-8 border-t border-b border-white/30"></div>
        </div>
      )}
    </div>
  );
};
