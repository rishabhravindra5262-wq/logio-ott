import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Phone, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface ProfileSetupModalProps {
  email: string;
  onComplete: () => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ email, onComplete }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Please provide both name and phone number');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone })
      });

      if (response.ok) {
        onComplete();
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/85 backdrop-blur-2xl"
      />
      
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative bg-surface-raised border border-white/[0.06] p-8 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
      >
        {/* Subtle glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 blur-[100px] rounded-full" />

        <div className="relative text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-5 border border-primary/15">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-xl font-display font-semibold tracking-wide text-white/90 mb-1">Welcome to Logio</h2>
          <p className="text-white/30 text-xs font-normal">Let's personalize your experience</p>
        </div>

        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-white/25 pl-1">Full Name</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15 group-focus-within:text-primary/70 transition-colors" />
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                placeholder="How should we call you?"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-white/25 pl-1">Phone Number</label>
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/15 group-focus-within:text-primary/70 transition-colors" />
              <input 
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/10 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 outline-none transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-[10px] font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 hover:bg-accent hover:shadow-lg hover:shadow-primary/15 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>

          <p className="text-white/10 text-[9px] font-normal text-center pt-2">
            Protected by Logio Security
          </p>
        </form>
      </motion.div>
    </div>
  );
};
