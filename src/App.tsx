import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { HomePage } from './components/HomePage';
import { Feed } from './components/Feed';
import { AdminPanel } from './components/AdminPanel';
import { EpisodePage } from './components/EpisodePage';
import { ProfilePage } from './components/ProfilePage';
import { Header } from './components/Header';
import { SeriesGrid } from './components/SeriesGrid';
import { SearchPanel } from './components/SearchPanel';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { MOCK_VIDEOS, MOCK_SERIES } from './mockData';
import { Home, Sparkles, TrendingUp, User, ShieldAlert, Key, X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Video, Series } from './types';

type View = 'home' | 'new' | 'trending' | 'profile' | 'admin' | 'episode';

export default function App() {
  const [view, setView] = useState<View>('home');
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Video | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [allSeries, setAllSeries] = useState<Series[]>(MOCK_SERIES);
  const [allVideos, setAllVideos] = useState<Video[]>(MOCK_VIDEOS);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        fetchProfile(firebaseUser.email!);
      } else {
        setProfile(null);
        setShowProfileSetup(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/user/${email}`);
      const data = await res.json();
      setProfile(data);
      if (data && (!data.name || !data.phone)) {
        setShowProfileSetup(true);
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, vRes] = await Promise.all([
          fetch('/api/series'),
          fetch('/api/videos')
        ]);
        const sData = await sRes.json();
        const vData = await vRes.json();
        
        if (Array.isArray(sData) && sData.length > 0) setAllSeries(sData);
        if (Array.isArray(vData) && vData.length > 0) setAllVideos(vData);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };
    fetchData();
  }, [view]);

  // Restrict Admin Panel to your specific email for security
  const ADMIN_EMAIL = 'rishabhravindra5262@gmail.com';

  const handleAdminAccess = () => {
    if (user) {
      if (user.email === ADMIN_EMAIL) {
        setView('admin');
      } else {
        alert(`Access Denied: The Admin Panel is restricted to the project owner (${ADMIN_EMAIL}).`);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const login = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Popup blocked by browser. Please allow popups or open in a new tab.');
      } else {
        setAuthError('Failed to sign in. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setView('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSelectSeries = async (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    
    // Increment view count for the chart system
    try {
      fetch(`/api/series/${seriesId}/view`, { method: 'POST' });
    } catch (e) {
      console.warn('Failed to increment view count');
    }

    const seriesEpisodes = allVideos.filter(v => v.seriesId === seriesId);
    if (seriesEpisodes.length > 0) {
      setSelectedEpisode(seriesEpisodes[0]);
      setView('episode');
    }
  };

  const handleSelectEpisode = (video: Video) => {
    setSelectedEpisode(video);
    setSelectedSeriesId(video.seriesId);
    setView('episode');
  };

  const trendingSeriesIds = allSeries.filter(s => s.trending).map(s => s.id);
  const trendingVideos = allVideos.filter(v => trendingSeriesIds.includes(v.seriesId));
  const newVideos = [...allVideos].sort((a, b) => b.id.localeCompare(a.id));

  return (
    <div className="relative h-screen bg-surface overflow-hidden font-sans">
      {/* Header */}
      {view !== 'new' && view !== 'trending' && view !== 'admin' && view !== 'episode' && (
        <Header onHomeClick={() => setView('home')} onSearchClick={() => setShowSearch(true)} />
      )}

      {/* Search */}
      <SearchPanel 
        isOpen={showSearch} 
        onClose={() => setShowSearch(false)}
        allSeries={allSeries}
        onSelectSeries={(id) => {
          handleSelectSeries(id);
          setShowSearch(false);
        }}
      />

      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full overflow-y-auto"
          >
            <HomePage onSelectSeries={handleSelectSeries} />
          </motion.div>
        )}

        {view === 'new' && (
          <motion.div 
            key="new"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <SeriesGrid type="new" onSelectSeries={handleSelectSeries} />
          </motion.div>
        )}

        {view === 'episode' && selectedEpisode && (
          <motion.div 
            key="episode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            <EpisodePage 
              series={allSeries.find(s => s.id === selectedEpisode.seriesId)!}
              episodes={allVideos.filter(v => v.seriesId === selectedEpisode.seriesId)}
              currentEpisode={selectedEpisode}
              onSelectEpisode={setSelectedEpisode}
              onBack={() => setView('home')}
            />
          </motion.div>
        )}

        {view === 'trending' && (
          <motion.div 
            key="trending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <SeriesGrid type="trending" onSelectSeries={handleSelectSeries} />
          </motion.div>
        )}

        {view === 'profile' && (
           <motion.div 
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full"
           >
              <ProfilePage 
                user={user}
                onLoginClick={() => setShowAuthModal(true)}
                onAdminClick={handleAdminAccess} 
                onWalletClick={() => {}} 
                onLogout={logout}
              />
           </motion.div>
        )}

        {view === 'admin' && (
          <motion.div 
            key="admin" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="h-full"
          >
            <AdminPanel />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Profile Setup Modal */}
      <AnimatePresence>
        {showProfileSetup && user && (
          <ProfileSetupModal 
            email={user.email!} 
            onComplete={() => {
              setShowProfileSetup(false);
              fetchProfile(user.email!);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.3 }}
              className="relative bg-surface-raised border border-white/[0.06] p-8 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col items-center text-center"
            >
              <button 
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 text-white/20 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5 border border-primary/15">
                 <LogIn className="w-7 h-7 text-primary" />
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-display font-semibold text-white/90 mb-1">Welcome Back</h3>
                <p className="text-white/25 text-xs font-normal">Sign in to your premium account</p>
              </div>

              <div className="w-full space-y-4">
                <button 
                  onClick={login}
                  className="w-full bg-primary text-white py-3.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 hover:bg-accent hover:shadow-lg hover:shadow-primary/15 active:scale-[0.97] transition-all"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 brightness-200 grayscale" />
                  Sign In with Google
                </button>

                {authError && (
                  <p className="text-red-400 text-[10px] font-medium">{authError}</p>
                )}

                <p className="text-white/10 text-[9px] leading-relaxed px-4 font-normal">
                  Track what you've watched, save your favorites...
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      {view !== 'episode' && (
        <div className="fixed bottom-0 inset-x-0 h-16 bg-surface/80 backdrop-blur-2xl border-t border-white/[0.04] flex items-center justify-around px-4 z-[100]">
          <NavButton active={view === 'home'} onClick={() => setView('home')} icon={<Home />} label="Home" />
          <NavButton active={view === 'new'} onClick={() => setView('new')} icon={<Sparkles />} label="New" />
          <NavButton active={view === 'trending'} onClick={() => setView('trending')} icon={<TrendingUp />} label="Trending" />
          <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<User />} label="Me" />
        </div>
      )}
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 transition-all flex-1 py-2 ${active ? 'text-primary' : 'text-white/20'}`}
  >
    <div className={`transition-all duration-300 ${active ? 'scale-105 -translate-y-0.5' : 'scale-100 hover:text-white/35'}`}>
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
    </div>
    <span className={`text-[9px] font-normal tracking-wide transition-all ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-indicator" 
        className="absolute -bottom-0.5 w-8 h-0.5 bg-primary rounded-full" 
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    )}
  </button>
);

const StarIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-8 h-8 fill-current"} viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
  </svg>
);
