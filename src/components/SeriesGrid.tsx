import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, TrendingUp, Sparkles, Play } from 'lucide-react';
import { Series } from '../types';

interface SeriesGridProps {
  type: 'new' | 'trending';
  onSelectSeries: (seriesId: string) => void;
}

export const SeriesGrid: React.FC<SeriesGridProps> = ({ type, onSelectSeries }) => {
  const [series, setSeries] = useState<Series[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/series?sort=${type === 'trending' ? 'trending' : 'new'}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setSeries(data);
        }
      } catch (error) {
        console.error('Failed to fetch filtered series:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [type]);

  if (isLoading) {
    return (
      <div className="h-full bg-surface flex items-center justify-center">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-surface text-white pt-20 pb-28 overflow-y-auto no-scrollbar scroll-smooth">
      <div className="px-6 md:px-10 mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/8 rounded-lg border border-primary/10">
            {type === 'trending' ? (
              <TrendingUp className="w-4 h-4 text-primary/70" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary/70" />
            )}
          </div>
          <h1 className="text-lg md:text-xl font-display font-semibold tracking-wide text-white/85">
            {type === 'trending' ? 'Popular Charts' : 'New Arrivals'}
          </h1>
        </div>
        <p className="text-white/20 text-[11px] font-normal ml-0.5">
          {type === 'trending' ? 'Most watched shows this week' : 'Fresh content just for you'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5 px-6 md:px-10">
        <AnimatePresence mode="popLayout">
          {series.map((s, index) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.04, duration: 0.3 }}
              onClick={() => onSelectSeries(s.id)}
              className="group cursor-pointer flex flex-col h-full"
            >
              <div className="relative aspect-[9/14] rounded-xl overflow-hidden mb-2.5 bg-surface-raised border border-white/[0.04] transition-all duration-400 group-hover:border-primary/25 group-hover:shadow-lg group-hover:shadow-primary/5 flex-shrink-0">
                <img 
                  src={s.verticalThumbnail} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ease-out" 
                  referrerPolicy="no-referrer"
                  alt={s.title}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Ranking Badge for Trending */}
                {type === 'trending' && index < 3 && (
                   <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-primary/90 flex items-center justify-center font-display text-sm font-bold text-white shadow-md">
                      {index + 1}
                   </div>
                )}

                <div className="absolute bottom-3 inset-x-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                   <div className="w-full h-0.5 bg-white/15 rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full w-2/3" />
                   </div>
                </div>
              </div>
              
              <div className="px-0.5 pt-1">
                <h3 className="font-medium text-[11px] md:text-xs tracking-wide leading-snug group-hover:text-white transition-colors line-clamp-1 mb-0.5 text-white/70">
                  {s.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[9px] text-white/20 font-normal">
                  <span className="text-primary/50">{s.views || 0} views</span>
                  <span className="w-0.5 h-0.5 bg-white/10 rounded-full" />
                  <span>{s.category || 'Series'}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {series.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 px-10 text-center">
            <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center mb-5 border border-white/[0.04]">
               <Loader2 className="w-8 h-8 text-white/10" />
            </div>
            <h3 className="text-base font-display font-semibold text-white/40 mb-1">Nothing found</h3>
            <p className="text-white/15 text-xs max-w-[220px]">We haven't uploaded any series to this chart yet. Check back soon!</p>
         </div>
      )}
    </div>
  );
};
