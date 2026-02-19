import { motion } from 'framer-motion';

interface Badge {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
}

const BADGES: Badge[] = [
  // Bidder
  { id: 'b1', name: 'First Bid', icon: '🎯', category: 'Bidder', description: 'Place your first bid', earned: true },
  { id: 'b2', name: 'Century', icon: '💯', category: 'Bidder', description: 'Place 100 bids', earned: true },
  { id: 'b3', name: 'Thousand Club', icon: '🏅', category: 'Bidder', description: 'Place 1,000 bids', earned: false, progress: 342, maxProgress: 1000 },
  // Streak
  { id: 's1', name: '3-Day Streak', icon: '🔥', category: 'Streak', description: 'Bid 3 days in a row', earned: true },
  { id: 's2', name: '7-Day Streak', icon: '💪', category: 'Streak', description: 'Bid 7 days in a row', earned: false, progress: 5, maxProgress: 7 },
  { id: 's3', name: '30-Day Streak', icon: '⚡', category: 'Streak', description: 'Bid 30 days in a row', earned: false, progress: 5, maxProgress: 30 },
  // Social
  { id: 'r1', name: 'First Referral', icon: '🤝', category: 'Social', description: 'Invite your first friend', earned: true },
  { id: 'r2', name: 'Colony Builder', icon: '🐧', category: 'Social', description: 'Invite 10 friends', earned: false, progress: 6, maxProgress: 10 },
  // Winner
  { id: 'w1', name: 'First Win', icon: '🏆', category: 'Winner', description: 'Win your first auction', earned: true },
  { id: 'w2', name: 'Veteran', icon: '👑', category: 'Winner', description: 'Win 10 auctions', earned: false, progress: 4, maxProgress: 10 },
  // Special
  { id: 'x1', name: 'Jackpot Winner', icon: '🎰', category: 'Special', description: 'Win a Jackpot auction', earned: false },
  { id: 'x2', name: 'Tournament Champ', icon: '🏟️', category: 'Special', description: 'Win a tournament', earned: false },
];

const CATEGORIES = ['All', 'Bidder', 'Streak', 'Social', 'Winner', 'Special'];

const BadgesPage = () => {
  const earnedCount = BADGES.filter(b => b.earned).length;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">🏅 Badges</h1>
          <div className="text-sm text-muted-foreground">
            <span className="font-mono font-bold text-primary">{earnedCount}</span> / {BADGES.length} earned
          </div>
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`bg-card border rounded-lg p-4 text-center relative ${
                badge.earned
                  ? 'border-gold/30 glow-gold'
                  : 'border-border opacity-50 grayscale'
              }`}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <div className="font-display font-bold text-xs mb-1">{badge.name}</div>
              <div className="text-[10px] text-muted-foreground mb-2">{badge.description}</div>
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{badge.category}</div>

              {badge.progress !== undefined && badge.maxProgress && !badge.earned && (
                <div className="mt-2">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                      style={{ width: `${(badge.progress / badge.maxProgress) * 100}%` }}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">
                    {badge.progress}/{badge.maxProgress}
                  </div>
                </div>
              )}

              {badge.earned && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-pngwin-green flex items-center justify-center text-[8px] text-background font-bold">✓</div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgesPage;
