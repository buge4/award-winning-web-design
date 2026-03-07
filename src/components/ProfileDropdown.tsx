import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
  { icon: '🏠', label: 'Dashboard', path: '/profile' },
  { icon: '👥', label: 'Social Circle', path: '/social' },
  { icon: '💰', label: 'Wallets', path: '/wallet' },
  { icon: '📋', label: 'Transactions', path: '/profile/transactions' },
  { icon: '🏆', label: 'Badges', path: '/badges' },
  { icon: '⚙️', label: 'Settings', path: '/settings' },
];

const ProfileDropdown = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const username = user.email?.split('@')[0] ?? 'User';
  const initials = username.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/signin');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full gradient-ice flex items-center justify-center text-xs font-bold text-background">
          {initials}
        </div>
        <span className="hidden sm:block text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          @{username}
        </span>
        <svg className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-[240px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-border">
              <div className="font-display font-bold text-sm">👤 {username}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/70 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-border py-1">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-pngwin-red hover:bg-secondary/70 transition-colors w-full"
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileDropdown;
