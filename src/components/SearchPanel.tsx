import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, X, TrendingUp, Clock, ChevronRight, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Series } from '../types';

interface SearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  allSeries: Series[];
  onSelectSeries: (id: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ isOpen, onClose, allSeries, onSelectSeries }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Series[]>([]);

  useEffect(() => {
    if (query.trim()) {
      const filtered = allSeries.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.tags?.some(t => t.toLowerCase().includes(query.toLowerCase()))
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [query, allSeries]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-surface/97 backdrop-blur-3xl"
          />

          <div className="relative h-full flex flex-col pt-20 px-6 md:px-16 max-w-[1100px] mx-auto">
            {/* Search Input */}
            <motion.div 
              initial={{ y: -15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
              className="relative mb-10"
            >
              <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4 group focus-within:border-primary/40 transition-colors">
                <SearchIcon className="w-6 h-6 text-white/15 group-focus-within:text-primary/70 transition-colors flex-shrink-0" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search series, actors, or themes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1 text-xl md:text-2xl font-display tracking-wide placeholder:text-white/10 text-white"
                />
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-white/[0.04] rounded-lg text-white/25 hover:text-white/60 transition-all flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
              {query.trim() === '' ? (
                <div className="grid md:grid-cols-2 gap-10">
                  {/* Trending Keywords */}
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <TrendingUp className="w-4 h-4 text-primary/60" />
                      <h3 className="text-[11px] font-medium text-white/30">Trending Searches</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['Urban Romance', 'Executive Boss', 'Revenge Saga', 'New Arrival', 'Top Chart'].map(tag => (
                        <button 
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="px-3.5 py-1.5 bg-white/[0.03] hover:bg-primary/10 hover:text-primary/80 border border-white/[0.04] rounded-lg text-[10px] font-medium text-white/35 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Recent Series */}
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15, duration: 0.25 }}
                  >
                    <div className="flex items-center gap-2.5 mb-5">
                      <Clock className="w-4 h-4 text-primary/60" />
                      <h3 className="text-[11px] font-medium text-white/30">Recent Series</h3>
                    </div>
                    <div className="space-y-2">
                      {allSeries.slice(0, 3).map(s => (
                        <div 
                          key={s.id}
                          onClick={() => onSelectSeries(s.id)}
                          className="flex items-center gap-3 group cursor-pointer p-2 hover:bg-white/[0.03] rounded-xl transition-all"
                        >
                          <div className="w-12 h-16 rounded-lg overflow-hidden border border-white/[0.04] flex-shrink-0">
                            <img src={s.verticalThumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-medium text-white/60 group-hover:text-white/90 mb-0.5 truncate">{s.title}</p>
                            <p className="text-[9px] text-white/15 font-normal">{s.category}</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-primary/50 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="space-y-8">
                  {results.length > 0 ? (
                    <div>
                      <h3 className="text-[10px] font-medium text-white/20 mb-6 border-l-2 border-primary/50 pl-3">{results.length} results</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {results.map((s, idx) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.25 }}
                            onClick={() => onSelectSeries(s.id)}
                            className="group cursor-pointer"
                          >
                            <div className="relative aspect-[9/14] rounded-xl overflow-hidden mb-2.5 border border-white/[0.04] group-hover:border-primary/30 transition-all duration-300">
                              <img src={s.verticalThumbnail} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="p-3 bg-primary/90 rounded-full shadow-lg shadow-primary/30">
                                  <Play className="w-5 h-5 fill-current" />
                                </div>
                              </div>
                            </div>
                            <h4 className="text-[11px] font-medium group-hover:text-white/90 transition-colors text-center truncate text-white/60">{s.title}</h4>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center pt-20 text-center"
                    >
                      <div className="p-6 bg-white/[0.03] rounded-full mb-5 border border-white/[0.04]">
                        <SearchIcon className="w-10 h-10 text-white/10" />
                      </div>
                      <h3 className="text-base font-display font-semibold text-white/30 mb-1">No Results</h3>
                      <p className="text-[10px] font-normal text-white/15">Try different keywords</p>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
