import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navLinks = [
  { path: '/', label: 'Lobby' },
  { path: '/auctions', label: 'Auctions' },
  { path: '/pvp', label: 'PvP' },
  { path: '/tournaments', label: 'Tournaments' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/admin', label: '🛡️' },
];

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="flex items-center gap-2 bg-gold-subtle border border-gold rounded-full px-3.5 py-1.5 cursor-pointer">
          <span className="text-primary font-mono text-xs">◆ 9,021</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full gradient-ice flex items-center justify-center text-xs font-bold text-background">
            BJ
          </div>
          <span className="hidden sm:block text-sm text-muted-foreground">@cryptoking</span>
        </div>
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
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
