import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

const navLinks = [
  { path: '/', label: 'Lobby' },
  { path: '/auctions', label: 'Auctions' },
  { path: '/draws', label: 'Draws' },
  { path: '/pvp', label: 'PvP' },
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/badges', label: 'Badges' },
  { path: '/admin', label: '🛡️' },
];

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { setBalance(null); return; }
    supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .eq('project_slug', 'auction')
      .single()
      .then(({ data }) => { if (data) setBalance(data.balance); });
  }, [user]);

  const username = user?.email?.split('@')[0] ?? null;
  const initials = username ? username.slice(0, 2).toUpperCase() : '??';

  const handleSignOut = async () => {
    await signOut();
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 bg-background/92 backdrop-blur-xl border-b border-border">
      <Link to="/" className="font-display font-bold text-2xl tracking-widest text-primary">
        PNGWIN <span className="text-xs text-ice ml-1.5 opacity-60">BETA</span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              location.pathname === link.path
                ? 'text-primary bg-gold-subtle'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link to="/wallet" className="flex items-center gap-2 bg-gold-subtle border border-gold rounded-full px-3.5 py-1.5 cursor-pointer hover:bg-gold/10 transition-colors">
              <span className="text-primary font-mono text-xs">◆ {balance !== null ? balance.toLocaleString() : '—'}</span>
            </Link>
            <div className="flex items-center gap-2 cursor-pointer group" onClick={handleSignOut}>
              <div className="w-8 h-8 rounded-full gradient-ice flex items-center justify-center text-xs font-bold text-background">
                {initials}
              </div>
              <span className="hidden sm:block text-sm text-muted-foreground group-hover:text-foreground transition-colors">@{username}</span>
            </div>
          </>
        ) : (
          <Link
            to="/signin"
            className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs tracking-wider rounded-lg shadow-gold"
          >
            Sign In
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden ml-2 p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <div className="w-5 h-0.5 bg-foreground mb-1" />
        <div className="w-5 h-0.5 bg-foreground mb-1" />
        <div className="w-5 h-0.5 bg-foreground" />
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-0 right-0 bg-background border-b border-border p-4 md:hidden"
        >
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-3 rounded-md text-sm font-medium ${
                location.pathname === link.path
                  ? 'text-primary bg-gold-subtle'
                  : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium text-pngwin-red"
            >
              Sign Out
            </button>
          ) : (
            <Link to="/signin" onClick={() => setMobileOpen(false)} className="block px-4 py-3 rounded-md text-sm font-medium text-primary">
              Sign In
            </Link>
          )}
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
