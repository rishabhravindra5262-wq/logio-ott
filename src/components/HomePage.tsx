import React, { useState, useEffect } from 'react';
import { MOCK_SERIES } from '../mockData';
import { Play, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Series } from '../types';

interface HomePageProps {
  onSelectSeries: (seriesId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onSelectSeries }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [series, setSeries] = useState<Series[]>([]);
  const [featuredSeries, setFeaturedSeries] = useState<Series | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sRes, fRes] = await Promise.all([
          fetch('/api/series'),
          fetch('/api/featured')
        ]);
        const sData = await sRes.json();
        const fData = await fRes.json();
        
        const validSeries = Array.isArray(sData) ? sData : [];
        setSeries(validSeries.length > 0 ? validSeries : MOCK_SERIES);
        setFeaturedSeries(
          (fData && !fData.error) ? fData : (validSeries[0] || MOCK_SERIES[0])
        );
      } catch (error) {
        console.error('Failed to fetch home page data:', error);
        setSeries(MOCK_SERIES);
        setFeaturedSeries(MOCK_SERIES[0]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (isLoading || !featuredSeries) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-white pb-28 pt-14">
      {/* Hero Banner */}
      <div className="relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden group">
        <img 
          src={featuredSeries.horizontalThumbnail} 
          className="w-full h-full object-cover scale-[1.02] group-hover:scale-100 transition-transform duration-[4s] ease-out" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/60 via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 py-10 px-6 md:px-16 text-left">
          <div className="flex items-center gap-2 mb-4">
             <span className="bg-primary/10 text-primary/90 px-2.5 py-0.5 rounded-md text-[10px] font-medium tracking-wide">Trending</span>
             <span className="text-[10px] font-medium text-white/25 tracking-wide">Series • 2024</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6 leading-[1.05] tracking-tight max-w-xl">{featuredSeries.title}</h2>
          <p className="text-sm text-white/35 max-w-md mb-6 leading-relaxed hidden md:block">{featuredSeries.description}</p>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => onSelectSeries(featuredSeries.id)}
              className="bg-primary text-white px-7 py-2.5 rounded-lg font-medium text-xs tracking-wide flex items-center gap-2 transition-all hover:bg-accent hover:shadow-lg hover:shadow-primary/20 active:scale-[0.97]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Watching
            </button>
            <button className="glass px-7 py-2.5 rounded-lg font-medium text-xs tracking-wide flex items-center gap-2 hover:bg-white/[0.06] transition-all text-white/60">
              More Info
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto pt-10">
        <Section title="New Release">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-5 px-6 md:px-10 pb-10">
            {series.map((s) => (
              <VerticalPoster key={s.id} series={s} onClick={() => onSelectSeries(s.id)} />
            ))}
          </div>
        </Section>

        <Section title="Trending Dramas">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-5 px-6 md:px-10 pb-10">
            {[...series].reverse().map((s) => (
              <VerticalPoster key={s.id + '-trend'} series={s} onClick={() => onSelectSeries(s.id)} />
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
};

const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="flex items-center justify-between mb-5 px-6 md:px-10">
      <h2 className="text-sm md:text-base font-display font-semibold tracking-wide text-white/70">{title}</h2>
      <a href="#" className="flex items-center gap-1 text-[10px] font-medium text-white/20 hover:text-primary/80 transition-colors">
        See More <ChevronRight className="w-3 h-3" />
      </a>
    </div>
    {children}
  </section>
);

interface VerticalPosterProps {
  series: Series;
  onClick: () => void;
}

const VerticalPoster: React.FC<VerticalPosterProps> = ({ series, onClick }) => (
  <motion.div 
    whileHover={{ y: -6 }}
    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    onClick={onClick}
    className="group cursor-pointer flex flex-col h-full"
  >
    <div className="relative aspect-[9/14] rounded-xl overflow-hidden mb-2.5 bg-surface-raised border border-white/[0.04] transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/5 flex-shrink-0">
      <img 
        src={series.verticalThumbnail} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-3 h-3 fill-current text-white" />
          </div>
          <span className="text-[9px] font-medium text-white/80">{series.totalEpisodes} Episodes</span>
        </div>
      </div>
    </div>
    <div className="px-0.5 flex-1 flex flex-col">
      <h3 className="font-medium text-[11px] md:text-xs tracking-wide leading-snug group-hover:text-white transition-colors line-clamp-1 mb-0.5 text-white/70">{series.title}</h3>
      <p className="text-[9px] text-white/20 font-normal tracking-wide">
        {series.tags?.[0] || 'Drama'}
      </p>
    </div>
  </motion.div>
);
