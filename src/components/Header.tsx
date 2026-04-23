import React from 'react';
import { Search, History, ChevronDown } from 'lucide-react';

interface HeaderProps {
    onHomeClick: () => void;
    onSearchClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onHomeClick, onSearchClick }) => {
  const categories = [
    { name: 'Actors' },
    { name: 'Actresses' },
    { name: 'Identities' },
    { name: 'Story Beats' }
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-[110] bg-surface/80 backdrop-blur-2xl border-b border-white/[0.04] px-6 h-14 transition-all duration-300">
        <div className="max-w-[1600px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-8 md:gap-14">
            {/* Logo */}
            <div onClick={onHomeClick} className="flex items-center gap-2.5 cursor-pointer group">
              <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-white text-xs font-display font-bold shadow-lg shadow-primary/20 group-hover:shadow-primary/40 transition-shadow">
                L
              </div>
              <span className="text-sm font-display font-semibold tracking-wide text-white/90 hidden sm:block">
                Logio
              </span>
            </div>

            {/* Nav Links - Desktop only */}
            <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium text-white/35">
              <button 
                onClick={onHomeClick} 
                className="text-white/80 hover:text-white transition-colors relative py-1"
              >
                Home
              </button>
              <div className="relative group">
                <button className="flex items-center gap-1 hover:text-white/70 transition-colors py-1">
                  Series <ChevronDown className="w-3 h-3 opacity-40" />
                </button>
                <div className="absolute top-[calc(100%+12px)] left-0 w-44 bg-surface-overlay/95 backdrop-blur-2xl rounded-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-2xl shadow-black/40 border border-white/[0.06]">
                  {categories.map(cat => (
                    <div key={cat.name} className="px-4 py-2.5 hover:bg-white/[0.04] cursor-pointer text-[11px] font-medium text-white/40 hover:text-white/80 transition-colors border-b border-white/[0.03] last:border-0">{cat.name}</div>
                  ))}
                </div>
              </div>
              <a href="#" className="hover:text-white/70 transition-colors">Originals</a>
            </nav>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onSearchClick}
              className="p-2 text-white/30 hover:text-white/70 hover:bg-white/[0.04] rounded-lg transition-all"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <button className="hidden sm:flex p-2 text-white/30 hover:text-white/70 hover:bg-white/[0.04] rounded-lg transition-all">
              <History className="w-[18px] h-[18px]" />
            </button>
            
            <div className="hidden lg:flex items-center gap-1.5 text-white/25 cursor-pointer hover:text-white/50 transition-colors bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.04] ml-2">
              <span className="text-[10px] font-medium">EN</span>
              <ChevronDown className="w-3 h-3 opacity-40" />
            </div>
          </div>
        </div>
      </header>
  );
};
