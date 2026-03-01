import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroJackpot from '@/components/lobby/HeroJackpot';
import FeaturedAuctionCard from '@/components/lobby/FeaturedAuctionCard';
import MyRecentBids from '@/components/lobby/MyRecentBids';
import LobbyLeaderboard from '@/components/lobby/LobbyLeaderboard';
import BurnCounters from '@/components/lobby/BurnCounters';
import LiveTicker from '@/components/LiveTicker';
import { useHeroJackpot, useFeaturedAuction } from '@/hooks/useLobbyData';
import { Skeleton } from '@/components/ui/skeleton';

const FALLBACK_ROLLOVER = [
  { week: 1, amount: 25000, isCurrent: false },
  { week: 2, amount: 50000, isCurrent: false },
  { week: 3, amount: 75000, isCurrent: false },
  { week: 4, amount: 110000, isCurrent: false },
  { week: 5, amount: 150000, isCurrent: true },
];

const getNextFriday = () => {
  const now = new Date();
  const d = new Date(now);
  d.setUTCHours(20, 0, 0, 0);
  const day = d.getUTCDay();
  const daysUntilFri = (5 - day + 7) % 7 || 7;
  d.setUTCDate(d.getUTCDate() + daysUntilFri);
  if (d <= now) d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString();
};

const Index = () => {
  const { data: jackpot, loading: jackpotLoading } = useHeroJackpot();
  const { data: daily, loading: dailyLoading } = useFeaturedAuction('Daily');
  const { data: shadow, loading: shadowLoading } = useFeaturedAuction('Shadow');
  const { data: hourly, loading: hourlyLoading } = useFeaturedAuction('Hourly');

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* ═══════ HERO — WEEKLY JACKPOT ═══════ */}
      <HeroJackpot
        prizePool={jackpot?.prizePool ?? 150000}
        week={5}
        status={jackpot?.status === 'hot_mode' ? 'LIVE' : jackpot ? 'LIVE' : 'UPCOMING'}
        bidFee={jackpot?.bidFee ?? 25}
        endsAt={jackpot?.scheduledEnd ?? getNextFriday()}
        rolloverHistory={FALLBACK_ROLLOVER}
      />

      {/* Live Ticker */}
      <LiveTicker />

      {/* ═══════ BURN COUNTERS ═══════ */}
      <div className="container py-5">
        <BurnCounters />
      </div>

      {/* ═══════ 3 FEATURED AUCTIONS ═══════ */}
      <div className="container py-10">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
          <span className="w-1 h-6 bg-primary rounded-sm" />
          🔥 Active Auctions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Daily Auction */}
          {dailyLoading ? (
            <Skeleton className="h-[400px] rounded-2xl" />
          ) : daily ? (
            <FeaturedAuctionCard
              id={daily.id}
              title={daily.title}
              badges={[
                { label: 'DAILY', variant: 'daily' },
                { label: daily.status === 'hot_mode' ? 'HOT' : 'OPEN', variant: daily.status === 'hot_mode' ? 'hot' : 'open' },
              ]}
              history={daily.history}
              closeInfo="⏰ Closes in"
              closeTimer={daily.scheduledEnd ? formatCountdownShort(daily.scheduledEnd) : '—'}
              bids={daily.totalBids}
              unique={daily.uniqueBidders}
              burned={daily.burnedAmount}
              typeDesc="⏱️ Timed auction. Runs daily. Highest unique bid when timer hits zero wins the prize pool."
              pool={`${daily.prizePool.toLocaleString()} PNGWIN`}
              fee={`${daily.bidFee} PNGWIN/bid`}
              delay={0}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">No active Daily auction</div>
          )}

          {/* Weekly Shadow Bid */}
          {shadowLoading ? (
            <Skeleton className="h-[400px] rounded-2xl" />
          ) : shadow ? (
            <FeaturedAuctionCard
              id={shadow.id}
              title={shadow.title}
              badges={[
                { label: 'BLIND', variant: 'blind' },
                { label: 'WEEKLY', variant: 'open' },
              ]}
              history={shadow.history}
              closeInfo="⏰ Closes in"
              closeTimer={shadow.scheduledEnd ? formatCountdownShort(shadow.scheduledEnd) : '—'}
              bids={shadow.visibility === 'blind' ? '???' : shadow.totalBids}
              unique={shadow.visibility === 'blind' ? '???' : shadow.uniqueBidders}
              burned={shadow.visibility === 'blind' ? '???' : shadow.burnedAmount}
              typeDesc="🫣 Blind auction. You only see YOUR bids. No leaderboard until reveal. Pure strategy."
              pool={shadow.visibility === 'blind' ? 'Hidden' : `${shadow.prizePool.toLocaleString()} PNGWIN`}
              fee={`${shadow.bidFee} PNGWIN/bid`}
              delay={0.1}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">No active Shadow auction</div>
          )}

          {/* Hourly Rush */}
          {hourlyLoading ? (
            <Skeleton className="h-[400px] rounded-2xl" />
          ) : hourly ? (
            <FeaturedAuctionCard
              id={hourly.id}
              title={hourly.title}
              badges={[
                { label: hourly.status === 'hot_mode' ? 'HOT 🔥' : 'LIVE', variant: hourly.status === 'hot_mode' ? 'hot' : 'live' },
                { label: 'HOURLY', variant: 'accumulating' },
              ]}
              history={hourly.history}
              closeInfo="⏰ Closes in"
              closeTimer={hourly.scheduledEnd ? formatCountdownShort(hourly.scheduledEnd) : '—'}
              bids={hourly.totalBids}
              unique={hourly.uniqueBidders}
              burned={hourly.burnedAmount}
              typeDesc="⚡ Fast-paced hourly auction. Quick rounds, lower entry. Perfect for active players."
              pool={`${hourly.prizePool.toLocaleString()} PNGWIN`}
              fee={`${hourly.bidFee} PNGWIN/bid`}
              delay={0.2}
            />
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 text-center text-muted-foreground">No active Hourly auction</div>
          )}
        </div>
      </div>

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
