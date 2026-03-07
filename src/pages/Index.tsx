import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroJackpot from '@/components/lobby/HeroJackpot';
import FeaturedAuctionCard from '@/components/lobby/FeaturedAuctionCard';
import MyRecentBids from '@/components/lobby/MyRecentBids';
import LobbyLeaderboard from '@/components/lobby/LobbyLeaderboard';
import BurnCounters from '@/components/lobby/BurnCounters';
import LiveTicker from '@/components/LiveTicker';
import RecentWinnersTicker from '@/components/lobby/RecentWinnersTicker';
import CryptoAuctionCards from '@/components/lobby/CryptoAuctionCards';
import { useHeroJackpot, useFeaturedAuction } from '@/hooks/useLobbyData';
import { Skeleton } from '@/components/ui/skeleton';

const FALLBACK_ROLLOVER = [
  { week: 1, amount: 25000, isCurrent: false },
  { week: 2, amount: 50000, isCurrent: false },
  { week: 3, amount: 75000, isCurrent: false },
  { week: 4, amount: 110000, isCurrent: false },
  { week: 5, amount: 150000, isCurrent: true },
];

const getNextSaturday = () => {
  const now = new Date();
  const d = new Date(now);
  d.setUTCHours(20, 0, 0, 0);
  const day = d.getUTCDay();
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilSat);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
};

/* ═══════ AUCTION TYPE CONFIG ═══════ */
const AUCTION_CONFIGS = [
  {
    searchName: 'Daily Battle',
    fallbackTitle: '🔥 Daily Battle Auction',
    badges: [
      { label: 'DAILY', variant: 'daily' as const },
      { label: 'OPEN', variant: 'open' as const },
    ],
    typeDesc: '⏱️ 24h timed auction. Live leaderboard. Highest unique bid wins the prize pool when timer hits zero.',
    icon: '🔥',
  },
  {
    searchName: 'Free Daily',
    fallbackTitle: '🎁 Free Daily Auction',
    badges: [
      { label: 'FREE', variant: 'daily' as const },
      { label: 'OPEN', variant: 'open' as const },
    ],
    typeDesc: '🎁 FREE entry — 1 bid per person. Pick your best number. Highest unique bid wins 1,000 PNGWIN!',
    icon: '🎁',
  },
  {
    searchName: 'Rush',
    fallbackTitle: '⚡ Weekly Rush Auction',
    badges: [
      { label: 'WEEKLY', variant: 'accumulating' as const },
      { label: 'OPEN', variant: 'open' as const },
    ],
    typeDesc: '⚡ Accumulate→Hot. 100 bids triggers 5min hot mode. Highest unique bid wins. Grace period: 30s anti-snipe.',
    icon: '⚡',
  },
  {
    searchName: 'Shadow',
    fallbackTitle: '🌑 Shadow Auction',
    badges: [
      { label: 'BLIND', variant: 'blind' as const },
      { label: '48H', variant: 'live' as const },
    ],
    typeDesc: '🫣 Blind auction — 48 hours. Nobody knows if their bid is unique or burned until the big reveal!',
    icon: '🌑',
  },
];

const Index = () => {
  const { data: jackpot, loading: jackpotLoading } = useHeroJackpot();

  // Query all 4 auction types
  const auctionQueries = AUCTION_CONFIGS.map(cfg => useFeaturedAuction(cfg.searchName));

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* ═══════ HERO — WEEKLY JACKPOT ═══════ */}
      <HeroJackpot
        prizePool={jackpot?.prizePool ?? 150000}
        week={5}
        status={jackpot?.status === 'hot_mode' ? 'LIVE' : jackpot ? 'LIVE' : 'UPCOMING'}
        bidFee={jackpot?.bidFee ?? 0}
        endsAt={jackpot?.scheduledEnd ?? getNextSaturday()}
        jackpotInstanceId={jackpot?.id}
      />

      {/* Live Ticker */}
      <LiveTicker />

      {/* ═══════ RECENT WINNERS TICKER ═══════ */}
      <RecentWinnersTicker />

      {/* ═══════ BURN COUNTERS ═══════ */}
      <div className="container py-5">
        <BurnCounters />
      </div>

      {/* ═══════ ACTIVE AUCTIONS — 4 TYPES ═══════ */}
      <div className="container py-10">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
          <span className="w-1 h-6 bg-primary rounded-sm" />
          🔥 Active Auctions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {AUCTION_CONFIGS.map((cfg, i) => {
            const { data, loading } = auctionQueries[i];

            if (loading) {
              return <Skeleton key={i} className="h-[420px] rounded-2xl" />;
            }

            if (data) {
              const dynamicBadges: Array<{ label: string; variant: 'daily' | 'live' | 'blind' | 'open' | 'accumulating' | 'hot' }> = [...cfg.badges];
              if (data.status === 'hot_mode') {
                dynamicBadges.push({ label: 'HOT 🔥', variant: 'hot' });
              }

              return (
                <FeaturedAuctionCard
                  key={data.id}
                  id={data.id}
                  title={data.title}
                  badges={dynamicBadges}
                  history={data.history}
                  closeInfo="⏰ Closes in"
                  closeTimer={data.scheduledEnd ? formatCountdownShort(data.scheduledEnd) : '—'}
                  bids={data.visibility === 'blind' ? '???' : data.totalBids}
                  unique={data.visibility === 'blind' ? '???' : data.uniqueBidders}
                  burned={data.visibility === 'blind' ? '???' : data.burnedAmount}
                  typeDesc={cfg.typeDesc}
                  pool={data.visibility === 'blind' ? 'Hidden' : `${data.prizePool.toLocaleString()} PNGWIN`}
                  fee={data.bidFee === 0 ? 'FREE' : `${data.bidFee} PNGWIN/bid`}
                  hotProgress={data.totalBidsToHot ? { current: data.totalBids, target: data.totalBidsToHot } : undefined}
                  delay={i * 0.08}
                />
              );
            }

            // Empty state — still show the card shape
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px] text-center"
              >
                <div className="text-4xl mb-3 opacity-30">{cfg.icon}</div>
                <div className="font-display font-bold text-sm text-muted-foreground mb-1">{cfg.fallbackTitle}</div>
                <div className="text-xs text-muted-foreground mb-4">Coming soon</div>
                <div className="flex gap-1.5">
                  {cfg.badges.map((b, j) => (
                    <span key={j} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wide">
                      {b.label}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ═══════ CRYPTO PRIZE AUCTIONS ═══════ */}
      <CryptoAuctionCards />

      {/* ═══════ MY RECENT BIDS ═══════ */}
      <div className="container pb-10">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
          <span className="w-1 h-6 bg-primary rounded-sm" />
          🎯 My Recent Bids
        </h2>
        <MyRecentBids />
      </div>

      {/* ═══════ LEADERBOARD ═══════ */}
      <div className="container pb-10">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
          <span className="w-1 h-6 bg-primary rounded-sm" />
          🏆 Leaderboard
        </h2>
        <LobbyLeaderboard />
      </div>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <div className="container pb-10">
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <h2 className="font-display text-2xl font-bold uppercase tracking-[2px] mb-8">
            How Arctic Auction Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: '🎯', title: '1. Place a Bid', desc: 'Choose a value from 00.01 to 99.99. Each bid costs a small fee that goes to the prize pool.' },
              { icon: '❄️', title: '2. Unique = Alive', desc: 'If your bid is unique (no one else picked it), it stays alive. If duplicated → both are BURNED.' },
              { icon: '🏔️', title: '3. Highest Unique Wins', desc: 'When the auction ends, the highest bid value that is still unique wins the prize pool.' },
              { icon: '💰', title: '4. Earn & Grow', desc: 'Build your Social Circle. When people in your network win, you earn bonuses on every level.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl mb-3">{step.icon}</div>
                <h3 className="font-display font-bold text-[15px] mb-1.5">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ REVENUE SPLIT ═══════ */}
      <div className="container pb-10">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-sm" />
            Where Every Bid Goes
          </h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { pct: '55%', label: 'Prize Pool', color: 'text-pngwin-green' },
              { pct: '15%', label: 'Burn 🔥', color: 'text-pngwin-red' },
              { pct: '15%', label: 'Platform', color: 'text-foreground' },
              { pct: '5%', label: 'Social Circle', color: 'text-ice' },
              { pct: '10%', label: 'Jackpot Feed', color: 'text-pngwin-orange' },
            ].map((item, i) => (
              <div key={i} className="flex-1 min-w-[80px] bg-background border border-border rounded-[10px] p-3.5 text-center">
                <div className={`font-mono text-xl font-bold ${item.color}`}>{item.pct}</div>
                <div className="text-[10px] text-muted-foreground uppercase mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════ SOCIAL CIRCLE ═══════ */}
      <div className="container pb-16">
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <h3 className="font-display font-bold text-lg mb-2">🐧 My Social Circle</h3>
          <p className="text-muted-foreground text-sm mb-4">No referrals yet</p>
          <Link to="/social" className="text-primary underline text-sm font-semibold hover:text-primary/80 transition-colors">
            Invite friends
          </Link>{' '}
          <span className="text-muted-foreground text-sm">to earn from their wins!</span>
        </div>
      </div>
    </div>
  );
};

function formatCountdownShort(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default Index;
