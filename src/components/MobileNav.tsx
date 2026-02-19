import { Link, useLocation } from 'react-router-dom';

const tabs = [
  { path: '/', label: 'Lobby', icon: '🏠' },
  { path: '/auctions', label: 'Auctions', icon: '🎯' },
  { path: '/pvp', label: 'PvP', icon: '⚔️' },
  { path: '/leaderboard', label: 'Leaders', icon: '🏆' },
  { path: '/wallet', label: 'Wallet', icon: '💎' },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/95 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around py-2">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] ${
              location.pathname === tab.path
                ? 'text-primary'
                : 'text-muted-foreground'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;
