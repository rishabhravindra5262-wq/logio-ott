import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VideoPlayer } from './VideoPlayer';
import { Video, Series } from '../types';
import { Heart, Star, Share2, ChevronDown, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EpisodePageProps {
  series: Series;
  episodes: Video[];
  currentEpisode: Video;
  onSelectEpisode: (video: Video) => void;
  onBack: () => void;
}

export const EpisodePage: React.FC<EpisodePageProps> = ({ 
  series, 
  episodes, 
  currentEpisode, 
  onSelectEpisode,
  onBack 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFullPlot, setShowFullPlot] = useState(false);
  const [showEpisodesList, setShowEpisodesList] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = useCallback(() => {
    setShowUI(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      setShowUI(false);
    }, 2000); // 2 seconds sleep
  }, []);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [resetHideTimer, activeIndex]);

  // Initialize scroll position to the current episode
  useEffect(() => {
    const initialIndex = episodes.findIndex(e => e.id === currentEpisode.id);
    if (initialIndex !== -1 && containerRef.current) {
      setActiveIndex(initialIndex);
      const height = window.innerHeight;
      containerRef.current.scrollTop = initialIndex * height;
    }
  }, [episodes, currentEpisode]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollPos = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollPos / height);
    if (index !== activeIndex && index >= 0 && index < episodes.length) {
      setActiveIndex(index);
    }
  };

  const handleNextEpisode = (index: number) => {
    if (index < episodes.length - 1 && containerRef.current) {
      const height = containerRef.current.clientHeight;
      containerRef.current.scrollTo({
        top: (index + 1) * height,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black text-white z-[200] overflow-y-scroll snap-y snap-mandatory no-scrollbar"
      onScroll={handleScroll}
      onClick={resetHideTimer}
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {episodes.map((ep, index) => (
        <div key={ep.id} className="h-full w-full snap-start relative flex flex-col items-center justify-center overflow-hidden">
          {/* Video Layer */}
          <div className="absolute inset-0 z-0">
            <div className="h-full w-full flex items-center justify-center bg-black">
              <div className="h-full aspect-[9/16] relative bg-surface-raised">
                <VideoPlayer 
                  url={ep.videoUrl} 
                  isActive={index === activeIndex} 
                  onEnded={() => {
                    if (index < episodes.length - 1) {
                      handleNextEpisode(index);
                    } else {
                      onBack();
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showUI && (
              <>
                {/* Top Controls */}
                <motion.div 
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="absolute top-0 inset-x-0 p-5 flex justify-between items-start z-50 pt-8 px-6 pointer-events-none"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onBack();
                    }}
                    className="p-2.5 bg-black/30 backdrop-blur-xl rounded-lg hover:bg-primary/80 transition-all border border-white/[0.06] pointer-events-auto"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 opacity-30">
                    <div className="w-6 h-6 bg-primary/80 rounded-md flex items-center justify-center text-[8px] font-display font-bold">L</div>
                  </div>
                </motion.div>

                {/* Bottom Info */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none pb-20 z-10"
                >
                  <div className="flex justify-between items-end">
                    <div className="flex-1 text-white pr-16 pointer-events-auto">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-[9px] font-medium bg-primary/15 text-primary border border-primary/15 px-2 py-0.5 rounded-md">Ep {ep.episodeNumber}/{episodes.length}</span>
                         <span className="text-[9px] font-normal text-white/25 truncate max-w-[140px]">{series.title}</span>
                      </div>
                      <h1 className="text-lg md:text-xl font-display font-semibold tracking-wide mb-2 line-clamp-1 text-white/90">
                         {ep.title}
                      </h1>
                      
                      <p className={`text-xs font-normal text-white/30 leading-relaxed transition-all ${showFullPlot ? 'line-clamp-none max-h-40 overflow-y-auto' : 'line-clamp-2'}`}>
                         {ep.description || series.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-1.5 pointer-events-auto">
                         {(series.tags || ['Drama']).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-white/[0.04] hover:bg-primary/10 hover:text-primary/80 transition-all rounded-md text-[8px] font-normal text-white/30 border border-white/[0.04] cursor-default">
                               {tag}
                            </span>
                         ))}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFullPlot(!showFullPlot);
                          resetHideTimer();
                        }}
                        className="mt-3 flex items-center gap-1.5 text-white/25 hover:text-primary/80 transition-colors pointer-events-auto"
                      >
                        <span className="text-[9px] font-medium">{showFullPlot ? 'Collapse' : 'Details'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showFullPlot ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-5 items-center pointer-events-auto">
                       <button 
                         onClick={async (e) => { 
                           e.stopPropagation(); 
                           resetHideTimer();
                           try {
                             await fetch(`/api/videos/${ep.id}/like`, { method: 'POST' });
                           } catch (err) {
                             console.error('Failed to like:', err);
                           }
                         }}
                         className="flex flex-col items-center gap-1 group cursor-pointer"
                       >
                          <div className="p-2.5 bg-white/[0.05] backdrop-blur-xl rounded-xl group-hover:bg-primary/80 transition-all border border-white/[0.06]">
                             <Heart className="w-5 h-5 text-white/80 group-hover:fill-current" />
                          </div>
                          <span className="text-[8px] font-normal text-white/30">{ep.likes?.toLocaleString() || '0'}</span>
                       </button>
                       
                       <button 
                         onClick={(e) => {
                           e.stopPropagation();
                           setShowEpisodesList(true);
                           resetHideTimer();
                         }}
                         className="flex flex-col items-center gap-1 group cursor-pointer"
                       >
                          <div className="p-2.5 bg-white/[0.05] backdrop-blur-xl rounded-xl group-hover:bg-primary/80 transition-all border border-white/[0.06]">
                             <Star className="w-5 h-5 text-white/80" />
                          </div>
                          <span className="text-[8px] font-normal text-white/30">List</span>
                       </button>

                       <div className="flex flex-col items-center gap-1 group cursor-pointer" onClick={(e) => { e.stopPropagation(); resetHideTimer(); }}>
                          <div className="p-2.5 bg-white/[0.05] backdrop-blur-xl rounded-xl group-hover:bg-primary/80 transition-all border border-white/[0.06]">
                             <Share2 className="w-5 h-5 text-white/80" />
                          </div>
                          <span className="text-[8px] font-normal text-white/30">Share</span>
                       </div>

                       <div className="mt-2">
                          <div className="w-10 h-10 rounded-full border border-white/15 p-0.5 animate-[spin_8s_linear_infinite]">
                             <img src={series.verticalThumbnail} className="w-full h-full rounded-full object-cover" />
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Episodes Selection Bottom Sheet */}
      <AnimatePresence>
        {showEpisodesList && (
           <div className="fixed inset-0 z-[300]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowEpisodesList(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-x-0 bottom-0 bg-surface-raised rounded-t-2xl pt-6 pb-10 px-5 border-t border-white/[0.06] flex flex-col max-h-[85vh]"
            >
              <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowEpisodesList(false)} />
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-base font-display font-semibold text-white/80">Episode Guide</h3>
                 <button onClick={() => setShowEpisodesList(false)} className="text-white/30 hover:text-white"><XIcon className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2 pb-16">
                  {episodes.map((epItem, i) => {
                    const epNum = i + 1;
                    const isSelected = activeIndex === i;
                    
                    return (
                      <button 
                        key={epItem.id}
                        onClick={() => {
                          if (containerRef.current) {
                            containerRef.current.scrollTop = i * containerRef.current.clientHeight;
                            setShowEpisodesList(false);
                          }
                        }}
                        className={`relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all border ${
                          isSelected 
                            ? 'bg-primary text-white shadow-md shadow-primary/25 border-primary' 
                            : 'bg-white/[0.03] text-white/35 hover:text-white/70 hover:border-primary/30 border-white/[0.04]'
                        }`}
                      >
                        {epNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
