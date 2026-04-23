import React from 'react';
import { User as UserIcon, Wallet, ShieldCheck, Settings, LogOut, ChevronRight, Bell, Ticket, LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import { User as FirebaseUser } from 'firebase/auth';

interface ProfilePageProps {
  user: FirebaseUser | null;
  onLoginClick: () => void;
  onAdminClick: () => void;
  onWalletClick: () => void;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLoginClick, onAdminClick, onWalletClick, onLogout }) => {
  const [stats, setStats] = React.useState({ watching: 12, hours: 0, likes: 0 });

  React.useEffect(() => {
    const fetchProfileStats = async () => {
      try {
        const [sysStats, resSeries, resVideos] = await Promise.all([
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/series').then(r => r.json()),
          fetch('/api/videos').then(r => r.json())
        ]);

        const totalLikes = (resVideos || []).reduce((acc: number, v: any) => acc + (v.likes || 0), 0);
        const hoursSpent = ((sysStats?.totalWatchTime || 0) / 3600).toFixed(1);
        
        setStats({
          watching: (resSeries || []).length,
          hours: Number(hoursSpent),
          likes: totalLikes
        });
      } catch (e) {
        console.warn('Failed to fetch profile stats');
      }
    };
    fetchProfileStats();
  }, []);

  return (
    <div className="h-full bg-surface text-white p-6 pt-20 overflow-y-auto no-scrollbar pb-28">
      {/* Profile Identity */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-full bg-surface-raised border border-white/[0.06] flex items-center justify-center mb-4">
          {user?.photoURL ? (
            <img src={user.photoURL} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon className="w-7 h-7 text-white/20" />
          )}
        </div>
        <h2 className="text-lg font-display font-semibold tracking-wide text-white/85">
          {user?.displayName || 'Guest'}
        </h2>
        <p className="text-white/20 text-[10px] font-normal mt-1">
          {user ? 'Premium Member' : 'Not signed in'}
        </p>
      </div>

      {user ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatItem label="Watching" value={stats.watching.toString()} />
            <StatItem label="Hours" value={`${stats.hours}h`} />
            <StatItem label="Likes" value={stats.likes.toLocaleString()} />
          </div>

          {/* Menu */}
          <div className="space-y-2">
             <h3 className="text-[10px] font-medium text-white/15 ml-1 mb-3">Account</h3>
             
             <MenuButton 
              icon={<ShieldCheck className="text-primary/70" />} 
              label="Console" 
              description="Admin controls"
              onClick={onAdminClick}
             />

             <MenuButton 
              icon={<Wallet className="text-accent/70" />} 
              label="Balance" 
              description="Digital assets"
              onClick={onWalletClick}
             />

             <MenuButton 
              icon={<Ticket className="text-blue-400/70" />} 
              label="Subscription" 
              description="Manage your plan"
             />

             <MenuButton 
              icon={<Bell className="text-emerald-400/70" />} 
              label="Notifications" 
              description="Alerts & messages"
             />
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.04]">
            <button 
              onClick={onLogout}
              className="w-full bg-white/[0.03] hover:bg-red-500/8 text-white/30 hover:text-red-400 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group border border-white/[0.04]"
            >
               <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
               <span className="text-[10px] font-medium">Sign Out</span>
            </button>
          </div>
        </>
      ) : (
        <div className="mt-10 flex flex-col items-center">
          <button 
            onClick={onLoginClick}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 hover:bg-accent hover:shadow-lg hover:shadow-primary/15 active:scale-[0.97] transition-all"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <p className="text-white/15 text-[10px] mt-4 text-center px-8 leading-relaxed">
            Unlock premium content & sync your library
          </p>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white/[0.03] border border-white/[0.04] rounded-xl p-3.5 text-center">
    <p className="text-base font-display font-semibold text-white/75 leading-none">{value}</p>
    <p className="text-[9px] font-normal text-white/20 mt-1">{label}</p>
  </div>
);

const MenuButton = ({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl flex items-center justify-between group active:scale-[0.99] transition-all hover:bg-white/[0.04] hover:border-white/[0.06]"
  >
    <div className="flex items-center gap-3">
      <div className="p-2.5 bg-surface rounded-lg border border-white/[0.04]">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-4 h-4' })}
      </div>
      <div className="text-left">
        <p className="text-[11px] font-medium text-white/60 leading-none mb-1">{label}</p>
        <p className="text-[9px] font-normal text-white/15">{description}</p>
      </div>
    </div>
    <ChevronRight className="w-3.5 h-3.5 text-white/10 group-hover:text-primary/60 group-hover:translate-x-0.5 transition-all" />
  </button>
);
