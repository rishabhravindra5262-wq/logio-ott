import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Video } from '../types';
import { Heart, MessageCircle, Share2, Grid, Home } from 'lucide-react';
import { MOCK_SERIES } from '../mockData';
import { motion, AnimatePresence } from 'motion/react';

interface FeedProps {
  videos: Video[];
}

export const Feed: React.FC<FeedProps> = ({ videos }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowUI(false);
    }, 2000);
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetHideTimer, activeIndex]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== activeIndex && index >= 0 && index < videos.length) {
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-scroll snap-y snap-mandatory bg-black no-scrollbar"
      onScroll={handleScroll}
      onClick={resetHideTimer}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {videos.map((video, index) => {
        const series = MOCK_SERIES.find(s => s.id === video.seriesId);
        
        return (
          <div key={video.id} className="h-full w-full snap-start relative flex flex-col items-center justify-center overflow-hidden" onClick={resetHideTimer}>
            <div className="absolute inset-0">
               <VideoPlayer 
                url={video.videoUrl} 
                isActive={index === activeIndex} 
                onEnded={() => {
                  if (index < videos.length - 1 && containerRef.current) {
                    const height = containerRef.current.clientHeight;
                    containerRef.current.scrollTo({
                      top: (index + 1) * height,
                      behavior: 'smooth'
                    });
                  }
                }}
              />
            </div>
            
            <AnimatePresence>
              {showUI && (
                <>
                  {/* Top Bar */}
                  <motion.div 
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="absolute top-0 inset-x-0 p-5 flex justify-between items-start z-20 pt-8 px-6 pointer-events-none"
                  >
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-primary/80 rounded-lg flex items-center justify-center font-display text-xs font-bold text-white shadow-md">L</div>
                        <div className="flex flex-col text-white">
                          <span className="text-xs font-display font-semibold tracking-wide">Logio</span>
                          <span className="text-[9px] font-normal text-white/35">Episodes</span>
                        </div>
                    </div>
                  </motion.div>

                  {/* Bottom Overlay */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.25 }}
                    className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none pb-24"
                  >
                    <div className="flex justify-between items-end">
                      <div className="flex-1 text-white pr-16 pointer-events-auto">
                        <div className="flex items-center gap-2 mb-2">
                           <span className="text-[9px] font-medium bg-primary/15 text-primary px-2 py-0.5 rounded-md">Episode {video.episodeNumber}</span>
                           <span className="text-[9px] font-normal text-white/30">{series?.title}</span>
                        </div>
                        <h3 className="font-display font-semibold text-lg mb-1.5 leading-snug tracking-wide">{video.title}</h3>
                        <p className="text-xs text-white/35 line-clamp-2 pr-4 font-normal leading-relaxed">{video.description}</p>
                      </div>
                      
                      <div className="flex flex-col gap-6 items-center pointer-events-auto">
                        <button className="flex flex-col items-center gap-1 group" onClick={(e) => { e.stopPropagation(); resetHideTimer(); }}>
                          <div className="p-2.5 bg-white/[0.05] rounded-xl group-active:scale-90 transition-all border border-white/[0.05] backdrop-blur-md">
                            <Heart className="w-5 h-5 text-white/80 fill-none group-hover:fill-red-400 group-hover:text-red-400 transition-colors" />
                          </div>
                          <span className="text-[8px] text-white/30 font-normal">{(video.likes || 0).toLocaleString()}</span>
                        </button>
                        
                        <button className="flex flex-col items-center gap-1 group" onClick={(e) => { e.stopPropagation(); resetHideTimer(); }}>
                           <div className="p-2.5 bg-white/[0.05] rounded-xl group-active:scale-90 transition-all border border-white/[0.05] backdrop-blur-md">
                            <MessageCircle className="w-5 h-5 text-white/80" />
                          </div>
                          <span className="text-[8px] text-white/30 font-normal">{video.comments || 0}</span>
                        </button>
                        
                        <button className="flex flex-col items-center gap-1 group" onClick={(e) => { e.stopPropagation(); resetHideTimer(); }}>
                           <div className="p-2.5 bg-primary/10 rounded-xl group-active:scale-90 transition-all border border-primary/15 backdrop-blur-md">
                            <Grid className="w-5 h-5 text-primary/80" />
                          </div>
                          <span className="text-[8px] text-white/30 font-normal">List</span>
                        </button>

                        <div className="w-10 h-10 rounded-full border border-white/15 p-0.5 animate-[spin_6s_linear_infinite]">
                           <img 
                              src={series?.verticalThumbnail || video.thumbnailUrl} 
                              className="w-full h-full rounded-full object-cover"
                              referrerPolicy="no-referrer"
                           />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};
