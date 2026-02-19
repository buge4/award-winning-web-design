import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

// ── Badge Types ──
type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
type BadgeRarity = 'rare' | 'epic' | 'legendary';
type BadgeStatus = 'earned' | 'progress' | 'locked';

interface Badge {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  tier?: BadgeTier;
  rarity?: BadgeRarity;
  status: BadgeStatus;
  earnedDate?: string;
  progress?: number;
  maxProgress?: number;
  xp: number;
  pngwin: number;
  prevTier?: string;
}

// ── Tier Colors ──
const TIER_STYLES: Record<BadgeTier, { border: string; glow: string; label: string; bg: string }> = {
  bronze:   { border: 'border-pngwin-orange/50', glow: 'shadow-[0_0_12px_hsla(36,100%,50%,0.2)]', label: '🥉', bg: 'bg-pngwin-orange/10' },
  silver:   { border: 'border-muted-foreground/40', glow: 'shadow-[0_0_12px_hsla(0,0%,75%,0.2)]', label: '🥈', bg: 'bg-muted/20' },
  gold:     { border: 'border-gold/50', glow: 'shadow-gold', label: '🥇', bg: 'bg-gold-subtle' },
  platinum: { border: 'border-ice/50', glow: 'shadow-ice', label: '💎', bg: 'bg-ice-subtle' },
  diamond:  { border: 'border-pngwin-purple/50', glow: 'shadow-[0_0_20px_hsla(270,91%,65%,0.25)]', label: '💠', bg: 'bg-purple-subtle' },
};

const RARITY_STYLES: Record<BadgeRarity, { border: string; glow: string; label: string }> = {
  rare:      { border: 'border-ice/40', glow: 'shadow-ice', label: '⭐ Rare' },
  epic:      { border: 'border-pngwin-purple/50', glow: 'shadow-[0_0_16px_hsla(270,91%,65%,0.25)]', label: '⭐ Epic' },
  legendary: { border: 'border-primary/50', glow: 'shadow-gold', label: '⭐ Legendary' },
};

// ── XP/Reward Tables ──
const TIER_REWARDS: Record<BadgeTier, { xp: number; pngwin: number }> = {
  bronze: { xp: 50, pngwin: 10 }, silver: { xp: 150, pngwin: 25 }, gold: { xp: 500, pngwin: 100 },
  platinum: { xp: 1500, pngwin: 500 }, diamond: { xp: 5000, pngwin: 2500 },
};
const RARITY_REWARDS: Record<BadgeRarity, { xp: number; pngwin: number }> = {
  rare: { xp: 300, pngwin: 50 }, epic: { xp: 1000, pngwin: 250 }, legendary: { xp: 3000, pngwin: 1000 },
};

// ── Categories ──
const CATEGORIES = [
  { key: 'All', icon: '🏆' },
  { key: 'Prediction', icon: '🎮' },
  { key: 'Winner', icon: '🏆' },
  { key: 'Sharpshooter', icon: '🎯' },
  { key: 'Social', icon: '👥' },
  { key: 'PvP', icon: '⚔️' },
  { key: 'Streak', icon: '🔥' },
  { key: 'Ambassador', icon: '📢' },
  { key: 'High Roller', icon: '💰' },
  { key: 'Special', icon: '⭐' },
];

// ── Badge Data ──
const BADGES: Badge[] = [
  // 🎮 Prediction Master
  { id: 'p1', name: 'First Prediction', icon: '🎮', category: 'Prediction', description: 'Place 1 bid', tier: 'bronze', status: 'earned', earnedDate: 'Jan 28, 2026', xp: 50, pngwin: 10 },
  { id: 'p2', name: 'Getting Warmer', icon: '🎮', category: 'Prediction', description: 'Place 5 bids', tier: 'silver', status: 'earned', earnedDate: 'Jan 30, 2026', xp: 150, pngwin: 25 },
  { id: 'p3', name: 'Crypto Oracle', icon: '🎮', category: 'Prediction', description: 'Place 25 bids', tier: 'gold', status: 'earned', earnedDate: 'Feb 4, 2026', xp: 500, pngwin: 100 },
  { id: 'p4', name: 'Market Prophet', icon: '🎮', category: 'Prediction', description: 'Place 100 bids', tier: 'platinum', status: 'progress', progress: 72, maxProgress: 100, xp: 1500, pngwin: 500 },
  { id: 'p5', name: 'Legendary Seer', icon: '🎮', category: 'Prediction', description: 'Place 500 bids', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Market Prophet' },

  // 🏆 Winner's Circle
  { id: 'w1', name: 'Lucky Break', icon: '🏆', category: 'Winner', description: 'Win 1 prize', tier: 'bronze', status: 'earned', earnedDate: 'Feb 1, 2026', xp: 50, pngwin: 10 },
  { id: 'w2', name: 'On a Roll', icon: '🏆', category: 'Winner', description: 'Win 5 prizes', tier: 'silver', status: 'earned', earnedDate: 'Feb 6, 2026', xp: 150, pngwin: 25 },
  { id: 'w3', name: 'Golden Touch', icon: '🏆', category: 'Winner', description: 'Win 25 prizes', tier: 'gold', status: 'progress', progress: 18, maxProgress: 25, xp: 500, pngwin: 100 },
  { id: 'w4', name: 'Prize Machine', icon: '🏆', category: 'Winner', description: 'Win 100 prizes', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Golden Touch' },
  { id: 'w5', name: 'The Midas', icon: '🏆', category: 'Winner', description: 'Win 500 prizes', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Prize Machine' },

  // 🎯 Sharpshooter
  { id: 's1', name: 'Bullseye', icon: '🎯', category: 'Sharpshooter', description: '1 unique bid stayed unique', tier: 'bronze', status: 'earned', earnedDate: 'Jan 29, 2026', xp: 50, pngwin: 10 },
  { id: 's2', name: 'Eagle Eye', icon: '🎯', category: 'Sharpshooter', description: '3 unique bids', tier: 'silver', status: 'earned', earnedDate: 'Feb 2, 2026', xp: 150, pngwin: 25 },
  { id: 's3', name: 'Psychic Penguin', icon: '🎯', category: 'Sharpshooter', description: '10 unique bids', tier: 'gold', status: 'progress', progress: 7, maxProgress: 10, xp: 500, pngwin: 100 },
  { id: 's4', name: 'The Oracle', icon: '🎯', category: 'Sharpshooter', description: '25 unique bids', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Psychic Penguin' },
  { id: 's5', name: 'Omniscient', icon: '🎯', category: 'Sharpshooter', description: '50 unique bids', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'The Oracle' },

  // 👥 Social
  { id: 'so1', name: 'Networker', icon: '👥', category: 'Social', description: '3 direct referrals', tier: 'bronze', status: 'earned', earnedDate: 'Feb 3, 2026', xp: 50, pngwin: 10 },
  { id: 'so2', name: 'Community Starter', icon: '👥', category: 'Social', description: '10 total circle', tier: 'silver', status: 'earned', earnedDate: 'Feb 8, 2026', xp: 150, pngwin: 25 },
  { id: 'so3', name: 'Colony Leader', icon: '👥', category: 'Social', description: '50 total circle', tier: 'gold', status: 'progress', progress: 33, maxProgress: 50, xp: 500, pngwin: 100 },
  { id: 'so4', name: 'Empire Builder', icon: '👥', category: 'Social', description: '200 total circle', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Colony Leader' },
  { id: 'so5', name: 'The Emperor', icon: '👥', category: 'Social', description: '1000 total circle', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Empire Builder' },

  // ⚔️ PvP
  { id: 'pv1', name: 'Challenger', icon: '⚔️', category: 'PvP', description: '1 PvP created', tier: 'bronze', status: 'earned', earnedDate: 'Feb 5, 2026', xp: 50, pngwin: 10 },
  { id: 'pv2', name: 'Arena Builder', icon: '⚔️', category: 'PvP', description: '5 PvP + 10 participants', tier: 'silver', status: 'earned', earnedDate: 'Feb 10, 2026', xp: 150, pngwin: 25 },
  { id: 'pv3', name: 'Tournament Master', icon: '⚔️', category: 'PvP', description: '25 PvP + 100 participants', tier: 'gold', status: 'progress', progress: 18, maxProgress: 25, xp: 500, pngwin: 100 },
  { id: 'pv4', name: 'Warlord', icon: '⚔️', category: 'PvP', description: '100 PvP + 500 participants', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Tournament Master' },
  { id: 'pv5', name: 'The Legend', icon: '⚔️', category: 'PvP', description: '500 PvP + 2000 participants', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Warlord' },

  // 🔥 Streak
  { id: 'st1', name: 'Week Warrior', icon: '🔥', category: 'Streak', description: '7 consecutive days', tier: 'bronze', status: 'earned', earnedDate: 'Feb 4, 2026', xp: 50, pngwin: 10 },
  { id: 'st2', name: 'Fortnight Fighter', icon: '🔥', category: 'Streak', description: '14 consecutive days', tier: 'silver', status: 'earned', earnedDate: 'Feb 11, 2026', xp: 150, pngwin: 25 },
  { id: 'st3', name: 'Monthly Maniac', icon: '🔥', category: 'Streak', description: '30 consecutive days', tier: 'gold', status: 'progress', progress: 24, maxProgress: 30, xp: 500, pngwin: 100 },
  { id: 'st4', name: 'Seasonal Soldier', icon: '🔥', category: 'Streak', description: '90 consecutive days', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Monthly Maniac' },
  { id: 'st5', name: 'Year of the Penguin', icon: '🔥', category: 'Streak', description: '365 consecutive days', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Seasonal Soldier' },

  // 📢 Ambassador
  { id: 'a1', name: 'Connected', icon: '📢', category: 'Ambassador', description: 'Link 1 social account', tier: 'bronze', status: 'earned', earnedDate: 'Jan 28, 2026', xp: 50, pngwin: 10 },
  { id: 'a2', name: 'Fully Linked', icon: '📢', category: 'Ambassador', description: 'Link all + join Telegram', tier: 'silver', status: 'progress', progress: 3, maxProgress: 4, xp: 150, pngwin: 25 },
  { id: 'a3', name: 'Megaphone', icon: '📢', category: 'Ambassador', description: '10 verified shares', tier: 'gold', status: 'locked', xp: 500, pngwin: 100, prevTier: 'Fully Linked' },
  { id: 'a4', name: 'Influencer', icon: '📢', category: 'Ambassador', description: '50 verified shares', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Megaphone' },
  { id: 'a5', name: 'Brand Ambassador', icon: '📢', category: 'Ambassador', description: '200 shares + 50 referrals', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'Influencer' },

  // 💰 High Roller
  { id: 'h1', name: 'Dabbler', icon: '💰', category: 'High Roller', description: '500 PNGWIN spent', tier: 'bronze', status: 'earned', earnedDate: 'Feb 1, 2026', xp: 50, pngwin: 10 },
  { id: 'h2', name: 'Investor', icon: '💰', category: 'High Roller', description: '2,500 spent', tier: 'silver', status: 'earned', earnedDate: 'Feb 8, 2026', xp: 150, pngwin: 25 },
  { id: 'h3', name: 'Whale Watcher', icon: '💰', category: 'High Roller', description: '10,000 spent', tier: 'gold', status: 'progress', progress: 7200, maxProgress: 10000, xp: 500, pngwin: 100 },
  { id: 'h4', name: 'High Roller', icon: '💰', category: 'High Roller', description: '50,000 spent', tier: 'platinum', status: 'locked', xp: 1500, pngwin: 500, prevTier: 'Whale Watcher' },
  { id: 'h5', name: 'The Whale', icon: '💰', category: 'High Roller', description: '250,000 spent', tier: 'diamond', status: 'locked', xp: 5000, pngwin: 2500, prevTier: 'High Roller' },

  // ⭐ Special
  { id: 'x1', name: 'OG Penguin', icon: '🐧', category: 'Special', description: 'Played first month', rarity: 'legendary', status: 'earned', earnedDate: 'Feb 1, 2026', xp: 3000, pngwin: 1000 },
  { id: 'x2', name: 'Jackpot Hunter', icon: '🎰', category: 'Special', description: 'Won a Jackpot prize', rarity: 'epic', status: 'earned', earnedDate: 'Feb 12, 2026', xp: 1000, pngwin: 250 },
  { id: 'x3', name: 'Mega Winner', icon: '🏅', category: 'Special', description: 'Won Monthly Mega round', rarity: 'epic', status: 'locked', xp: 1000, pngwin: 250 },
  { id: 'x4', name: 'Leaderboard King', icon: '👑', category: 'Special', description: 'Finished #1 weekly', rarity: 'epic', status: 'locked', xp: 1000, pngwin: 250 },
  { id: 'x5', name: 'Perfect Week', icon: '🔑', category: 'Special', description: 'Won 7 consecutive days', rarity: 'rare', status: 'locked', xp: 300, pngwin: 50 },
  { id: 'x6', name: 'Social Butterfly', icon: '🤝', category: 'Special', description: 'Circle bonus from all 5 levels', rarity: 'rare', status: 'locked', xp: 300, pngwin: 50 },
  { id: 'x7', name: 'PvP Pioneer', icon: '🎪', category: 'Special', description: 'PvP with 10+ players', rarity: 'rare', status: 'locked', xp: 300, pngwin: 50 },
  { id: 'x8', name: 'Early Adopter', icon: '📱', category: 'Special', description: 'Joined via Telegram first week', rarity: 'legendary', status: 'earned', earnedDate: 'Jan 28, 2026', xp: 3000, pngwin: 1000 },
];

const earnedBadges = BADGES.filter(b => b.status === 'earned');
const totalXP = earnedBadges.reduce((a, b) => a + b.xp, 0);
const rarestBadge = earnedBadges.find(b => b.rarity === 'legendary') || earnedBadges.find(b => b.rarity === 'epic') || earnedBadges[0];

const BadgesPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [showRewards, setShowRewards] = useState(false);

  const filtered = activeCategory === 'All' ? BADGES : BADGES.filter(b => b.category === activeCategory);

  const getBadgeStyle = (badge: Badge) => {
    if (badge.tier) return TIER_STYLES[badge.tier];
    if (badge.rarity) return { ...RARITY_STYLES[badge.rarity], bg: 'bg-purple-subtle' };
    return { border: 'border-border', glow: '', label: '', bg: '' };
  };

  const getProgressPct = (b: Badge) => b.progress && b.maxProgress ? Math.round((b.progress / b.maxProgress) * 100) : 0;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">🏆 Your Badge Collection</h1>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="font-mono text-xl font-bold text-primary">{earnedBadges.length}/{BADGES.length}</div>
              <div className="text-[10px] text-muted-foreground">Badges Earned</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="font-mono text-xl font-bold text-ice">{totalXP.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Total XP</div>
            </div>
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-lg">{rarestBadge?.icon}</div>
              <div className="text-[10px] text-muted-foreground">Rarest: {rarestBadge?.name}</div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-2.5 bg-border rounded-full overflow-hidden mb-1">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
              initial={{ width: 0 }}
              animate={{ width: `${(earnedBadges.length / BADGES.length) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="text-xs text-muted-foreground">{earnedBadges.length} of {BADGES.length} badges earned — {Math.round((earnedBadges.length / BADGES.length) * 100)}% complete</div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeCategory === cat.key
                  ? 'bg-gold-subtle text-primary border border-gold'
                  : 'bg-secondary text-muted-foreground border border-border hover:text-foreground'
              }`}
            >
              {cat.icon} {cat.key}
            </button>
          ))}
        </div>

        {/* Badge Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
          {filtered.map((badge, i) => {
            const style = getBadgeStyle(badge);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedBadge(badge)}
                className={`relative cursor-pointer rounded-xl p-4 text-center border-2 transition-all hover:scale-[1.03] ${
                  badge.status === 'earned'
                    ? `${style.border} ${style.glow} ${style.bg}`
                    : badge.status === 'progress'
                    ? 'border-border bg-card opacity-80'
                    : 'border-border/30 bg-muted/10 opacity-40 grayscale'
                }`}
              >
                {/* Tier/Rarity Label */}
                <div className="absolute top-1.5 left-1.5 text-xs">
                  {badge.tier ? TIER_STYLES[badge.tier].label : ''}
                  {badge.rarity ? RARITY_STYLES[badge.rarity].label : ''}
                </div>

                {/* Earned check */}
                {badge.status === 'earned' && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-pngwin-green flex items-center justify-center text-[9px] text-background font-bold">✓</div>
                )}

                {/* Lock icon */}
                {badge.status === 'locked' && (
                  <div className="absolute top-1.5 right-1.5 text-sm">🔒</div>
                )}

                <div className="text-4xl mb-2 mt-1">{badge.icon}</div>
                <div className="font-display font-bold text-xs mb-0.5">{badge.name}</div>
                <div className="text-[10px] text-muted-foreground mb-1">{badge.description}</div>

                {/* Category tag */}
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{badge.category}</div>

                {/* Progress bar for in-progress */}
                {badge.status === 'progress' && badge.progress !== undefined && badge.maxProgress && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                        style={{ width: `${getProgressPct(badge)}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-1">
                      {badge.progress.toLocaleString()}/{badge.maxProgress.toLocaleString()} ({getProgressPct(badge)}%)
                    </div>
                    <div className="text-[8px] text-pngwin-orange mt-0.5 animate-pulse">Almost there!</div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Rewards Table - Collapsible */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowRewards(!showRewards)}
            className="w-full px-5 py-3 flex items-center justify-between hover:bg-card-hover transition-colors"
          >
            <span className="font-display font-bold text-sm">🎁 XP & Rewards Table</span>
            <span className="text-muted-foreground text-xs">{showRewards ? '▲' : '▼'}</span>
          </button>
          <AnimatePresence>
            {showRewards && (
              <motion.div
                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-1">
                  <div className="grid grid-cols-3 text-[9px] text-muted-foreground uppercase tracking-wider px-2 pb-1">
                    <span>Tier</span><span>XP</span><span>PNGWIN</span>
                  </div>
                  {(Object.entries(TIER_REWARDS) as [BadgeTier, { xp: number; pngwin: number }][]).map(([tier, r]) => (
                    <div key={tier} className={`grid grid-cols-3 text-xs px-2 py-1.5 rounded ${TIER_STYLES[tier].bg}`}>
                      <span className="font-semibold">{TIER_STYLES[tier].label} {tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                      <span className="font-mono text-ice">{r.xp} XP</span>
                      <span className="font-mono text-primary">{r.pngwin} PNGWIN</span>
                    </div>
                  ))}
                  <div className="border-t border-border/50 pt-1 mt-1" />
                  {(Object.entries(RARITY_REWARDS) as [BadgeRarity, { xp: number; pngwin: number }][]).map(([rarity, r]) => (
                    <div key={rarity} className="grid grid-cols-3 text-xs px-2 py-1.5 rounded bg-purple-subtle">
                      <span className="font-semibold">⭐ {rarity.charAt(0).toUpperCase() + rarity.slice(1)}</span>
                      <span className="font-mono text-ice">{r.xp} XP</span>
                      <span className="font-mono text-primary">{r.pngwin} PNGWIN</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Badge Detail Modal */}
      <AnimatePresence>
        {selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedBadge(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <BadgeDetailContent badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Badge Detail Modal Content ──
const BadgeDetailContent = ({ badge, onClose }: { badge: Badge; onClose: () => void }) => {
  const style = badge.tier ? TIER_STYLES[badge.tier] : badge.rarity ? { ...RARITY_STYLES[badge.rarity], bg: 'bg-purple-subtle' } : { border: '', glow: '', label: '', bg: '' };
  const pct = badge.progress && badge.maxProgress ? Math.round((badge.progress / badge.maxProgress) * 100) : 0;

  // Find next tier badge in same category
  const sameCat = BADGES.filter(b => b.category === badge.category);
  const idx = sameCat.findIndex(b => b.id === badge.id);
  const nextBadge = idx >= 0 && idx < sameCat.length - 1 ? sameCat[idx + 1] : null;

  // Full tier path for locked
  const tierPath = sameCat.filter(b => b.tier);

  return (
    <div className="text-center">
      {/* Close */}
      <div className="flex justify-end">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">✕</button>
      </div>

      {/* Icon */}
      <div className={`text-6xl mb-3 ${badge.status === 'earned' ? '' : badge.status === 'progress' ? 'opacity-70' : 'grayscale opacity-30'}`}>
        {badge.icon}
      </div>

      {/* Name + Tier */}
      <h3 className="font-display text-xl font-bold mb-1">{badge.name}</h3>
      <div className="text-xs text-muted-foreground mb-1">
        {badge.category} — {badge.tier ? `${style.label} ${badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}` : badge.rarity ? RARITY_STYLES[badge.rarity].label : ''}
      </div>
      <div className="text-sm text-muted-foreground mb-4">{badge.description}</div>

      {badge.status === 'earned' && (
        <>
          <div className="text-xs text-pngwin-green font-semibold mb-2">✅ Earned {badge.earnedDate}</div>
          <div className="text-xs text-muted-foreground mb-4">Rewards: +{badge.xp} XP, +{badge.pngwin} PNGWIN</div>
          {nextBadge && (
            <div className="bg-gold-subtle border border-gold rounded-lg p-3 mb-4">
              <div className="text-[10px] text-muted-foreground mb-1">NEXT:</div>
              <div className="font-display font-bold text-sm">{nextBadge.tier ? TIER_STYLES[nextBadge.tier].label : ''} {nextBadge.name}</div>
              <div className="text-xs text-muted-foreground">{nextBadge.description}</div>
              {nextBadge.progress !== undefined && nextBadge.maxProgress && (
                <div className="mt-2">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                      style={{ width: `${(nextBadge.progress / nextBadge.maxProgress) * 100}%` }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{nextBadge.progress}/{nextBadge.maxProgress}</div>
                </div>
              )}
            </div>
          )}
          <button className="px-4 py-2 bg-secondary border border-border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            📤 Share Badge
          </button>
        </>
      )}

      {badge.status === 'progress' && badge.progress !== undefined && badge.maxProgress && (
        <>
          <div className="mb-4">
            <div className="h-2.5 bg-border rounded-full overflow-hidden mb-1">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
            </div>
            <div className="text-sm font-mono font-bold">{badge.progress.toLocaleString()}/{badge.maxProgress.toLocaleString()} — {badge.maxProgress - badge.progress} more to go!</div>
          </div>
          <div className="text-xs text-muted-foreground mb-2">Reward: +{badge.xp} XP, +{badge.pngwin} PNGWIN when earned</div>
        </>
      )}

      {badge.status === 'locked' && (
        <>
          <div className="text-xs text-pngwin-red mb-3">🔒 Unlock by earning {badge.prevTier || 'previous tier'} first</div>
          {tierPath.length > 0 && (
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {tierPath.map((b, i) => (
                <span key={b.id} className={`text-xs ${b.status === 'earned' ? 'text-pngwin-green' : b.status === 'progress' ? 'text-pngwin-orange' : 'text-muted-foreground'}`}>
                  {b.tier ? TIER_STYLES[b.tier].label : ''}{b.status === 'earned' ? '✅' : b.status === 'progress' ? '🔄' : '🔒'}
                  {i < tierPath.length - 1 && <span className="text-muted-foreground mx-0.5">→</span>}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BadgesPage;
