import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface CircleLevel {
  level: number;
  members: number;
  playing: number;
}

interface TierUnlock {
  tier: number;
  label: string;
  requirement: string;
  unlocked: boolean;
  current?: string;
}

interface SocialCircleWidgetProps {
  auctionTitle?: string;
  context?: 'auction' | 'round';
  instanceId?: string;
}

const DEFAULT_LEVELS: CircleLevel[] = [
  { level: 1, members: 0, playing: 0 },
  { level: 2, members: 0, playing: 0 },
  { level: 3, members: 0, playing: 0 },
  { level: 4, members: 0, playing: 0 },
  { level: 5, members: 0, playing: 0 },
];

const SocialCircleWidget = ({
  context = 'auction',
  instanceId,
}: SocialCircleWidgetProps) => {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(true);
  const [circleLevels, setCircleLevels] = useState<CircleLevel[]>(DEFAULT_LEVELS);
  const [tiers, setTiers] = useState<TierUnlock[]>([]);
  const [userBids, setUserBids] = useState(0);
  const [potentialBonus, setPotentialBonus] = useState({ unlocked: 0, full: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchCircleData = async () => {
      // Get user's referral tree counts per level
      const { data: userData } = await supabase
        .from('users')
        .select('id, upline_1, upline_2, upline_3, upline_4, upline_5')
        .eq('id', user.id)
        .single();

      // Count referrals at each level
      const levels: CircleLevel[] = [];
      for (let lvl = 1; lvl <= 5; lvl++) {
        const { count: memberCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq(`upline_${lvl}`, user.id);

        let playingCount = 0;
        if (instanceId && (memberCount ?? 0) > 0) {
          // Check how many of these referrals have bids in this instance
          const { data: referrals } = await supabase
            .from('users')
            .select('id')
            .eq(`upline_${lvl}`, user.id);

          if (referrals && referrals.length > 0) {
            const refIds = referrals.map((r: any) => r.id);
            const { count: activeCount } = await supabase
              .from('auction_bids')
              .select('user_id', { count: 'exact', head: true })
              .eq('instance_id', instanceId)
              .in('user_id', refIds);
            playingCount = activeCount ?? 0;
          }
        }

        levels.push({ level: lvl, members: memberCount ?? 0, playing: playingCount });
      }
      setCircleLevels(levels);

      // Get user's bid count in this instance
      if (instanceId) {
        const { count: bidCount } = await supabase
          .from('auction_bids')
          .select('id', { count: 'exact', head: true })
          .eq('instance_id', instanceId)
          .eq('user_id', user.id);
        setUserBids(bidCount ?? 0);
      }

      // Build tier unlocks
      const totalActive = levels.reduce((a, c) => a + c.playing, 0);
      const bidCount = userBids;
      const tierDefs: TierUnlock[] = [
        { tier: 1, label: 'Tier 1', requirement: '1+ bid placed', unlocked: (bidCount ?? 0) >= 1 || true },
        { tier: 2, label: 'Tier 2', requirement: '5+ bids placed', unlocked: (bidCount ?? 0) >= 5, current: `${bidCount ?? 0} bids` },
        { tier: 3, label: 'Tier 3', requirement: '3+ active circle members', unlocked: totalActive >= 3, current: `${totalActive} active` },
        { tier: 4, label: 'Tier 4', requirement: '10+ active circle members', unlocked: totalActive >= 10, current: `${totalActive} active` },
      ];
      setTiers(tierDefs);

      // Estimate potential bonus (2% per level per tier unlocked, based on hypothetical 1000 prize)
      const unlockedCount = tierDefs.filter(t => t.unlocked).length;
      const fullBonus = levels.reduce((sum, l) => sum + l.playing * 2, 0) * 10; // rough estimate
      setPotentialBonus({ unlocked: Math.floor(fullBonus * unlockedCount / 4), full: fullBonus });

      setLoading(false);
    };

    fetchCircleData();
  }, [user, instanceId]);

  const totalPlaying = circleLevels.reduce((a, c) => a + c.playing, 0);
  const totalMembers = circleLevels.reduce((a, c) => a + c.members, 0);
  const unlockedTiers = tiers.filter(t => t.unlocked).length;
  const showWarning = userBids === 0 && totalPlaying > 0;

  const statusIcon = (c: CircleLevel) => {
    if (c.members === 0) return <span className="text-muted-foreground">⚪</span>;
    return c.playing > 0
      ? <span className="text-pngwin-green">🟢</span>
      : <span className="text-pngwin-red">🔴</span>;
  };

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-lg p-5 text-center">
        <span className="text-sm text-muted-foreground">Sign in to see your Social Circle</span>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-3 flex items-center justify-between border-b border-border hover:bg-card-hover transition-colors"
      >
        <span className="font-display font-bold text-sm">🔗 Your Circle in This {context === 'auction' ? 'Auction' : 'Round'}</span>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-[10px] text-muted-foreground">Loading...</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">{totalPlaying}/{totalMembers} playing</span>
          )}
          <span className="text-muted-foreground text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {/* Warning Banner */}
            {showWarning && (
              <div className="mx-4 mt-4 p-3 bg-red-subtle border border-pngwin-red/20 rounded-lg">
                <div className="text-xs font-bold text-pngwin-red mb-1">
                  ⚠️ WARNING: {totalPlaying} people in your circle are playing!
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">
                  If any of them win, you'll MISS your 2% bonus because you haven't placed a bid yet.
                </div>
                <Link to="#bid" className="inline-block px-3 py-1.5 gradient-gold text-primary-foreground font-display font-bold text-[10px] rounded-md shadow-gold">
                  Place a Bid Now →
                </Link>
              </div>
            )}

            {/* Circle Activity Table */}
            <div className="p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Circle Activity</div>
              <div className="space-y-1">
                <div className="grid grid-cols-4 gap-2 text-[9px] text-muted-foreground uppercase tracking-wider px-2 pb-1">
                  <span>Level</span><span>Members</span><span>Playing</span><span>Status</span>
                </div>
                {circleLevels.map(c => (
                  <div key={c.level} className={`grid grid-cols-4 gap-2 items-center px-2 py-1.5 rounded text-xs ${
                    c.playing > 0 ? 'bg-green-subtle' : c.members > 0 ? 'bg-red-subtle' : 'bg-muted/20 opacity-50'
                  }`}>
                    <span className="font-mono font-bold">L{c.level}</span>
                    <span className="font-mono">{c.members}</span>
                    <span className="font-mono">{c.members > 0 ? `${c.playing}/${c.members}` : '—'}</span>
                    <span className="flex items-center gap-1">
                      {statusIcon(c)}
                      <span className="text-[9px] text-muted-foreground">
                        {c.members === 0 ? 'Empty' : c.playing > 0 ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tier Unlock */}
            {tiers.length > 0 && (
              <div className="px-4 pb-4">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Your Tier Unlock</div>
                <div className="space-y-1.5">
                  {tiers.map(t => (
                    <div key={t.tier} className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${
                      t.unlocked ? 'bg-green-subtle' : 'bg-muted/20'
                    }`}>
                      <span className="text-sm">{t.unlocked ? '✅' : '⬜'}</span>
                      <span className={`font-semibold ${t.unlocked ? 'text-pngwin-green' : 'text-muted-foreground'}`}>{t.label}:</span>
                      <span className="text-muted-foreground flex-1">{t.requirement}</span>
                      {t.unlocked ? (
                        <span className="text-[9px] text-pngwin-green font-semibold">
                          Circle 1{t.tier > 1 ? `-${t.tier}` : ''} ({t.tier * 2}%)
                        </span>
                      ) : (
                        <span className="text-[9px] text-pngwin-red">🔒 {t.current && `(${t.current})`}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Potential Bonus Preview */}
            <div className="px-4 pb-4">
              <div className="bg-gold-subtle border border-gold rounded-lg p-3">
                <div className="text-[10px] text-muted-foreground mb-1">If someone in your circle wins:</div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-foreground">Circle 1-{unlockedTiers || 1} unlocked → </span>
                    <span className="font-mono text-sm font-bold text-primary">~{potentialBonus.unlocked} PNGWIN</span>
                  </div>
                </div>
                {unlockedTiers < 4 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Unlock Tier {unlockedTiers + 1} for all 5 levels → <span className="text-primary font-bold">~{potentialBonus.full} PNGWIN</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialCircleWidget;
