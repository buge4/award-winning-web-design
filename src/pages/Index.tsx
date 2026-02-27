import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import HeroJackpot from '@/components/lobby/HeroJackpot';
import FeaturedAuctionCard from '@/components/lobby/FeaturedAuctionCard';
import MyRecentBids from '@/components/lobby/MyRecentBids';
import LobbyLeaderboard from '@/components/lobby/LobbyLeaderboard';
import LiveTicker from '@/components/LiveTicker';

const ROLLOVER_HISTORY = [
  { week: 1, amount: 25000, isCurrent: false },
  { week: 2, amount: 50000, isCurrent: false },
  { week: 3, amount: 75000, isCurrent: false },
  { week: 4, amount: 110000, isCurrent: false },
  { week: 5, amount: 150000, isCurrent: true },
];

// Friday 20:00 UTC — next draw
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
  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* ═══════ HERO — WEEKLY JACKPOT ═══════ */}
      <HeroJackpot
        prizePool={150000}
        week={5}
        status="LIVE"
        bidFee={25}
        endsAt={getNextFriday()}
        rolloverHistory={ROLLOVER_HISTORY}
      />

      {/* Live Ticker */}
      <LiveTicker />

      {/* ═══════ 3 FEATURED AUCTIONS ═══════ */}
      <div className="container py-10">
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
          <span className="w-1 h-6 bg-primary rounded-sm" />
          🔥 Active Auctions
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card A: Daily Auction */}
          <FeaturedAuctionCard
            id="daily-1"
            title="Daily Auction #12"
            badges={[
              { label: 'DAILY', variant: 'daily' },
              { label: 'OPEN', variant: 'open' },
            ]}
            history={[
              { id: '12', label: 'Daily #12', isSelected: true, isResolved: false },
              { id: '11', label: 'Daily #11', isSelected: false, isResolved: true },
              { id: '10', label: 'Daily #10', isSelected: false, isResolved: true },
              { id: '9', label: 'Daily #9', isSelected: false, isResolved: true },
            ]}
            closeInfo="⏰ Closes in"
            closeTimer="7h 23m"
            bids={67}
            unique={42}
            burned={25}
            typeDesc="⏱️ Timed auction. Runs daily. Highest unique bid when timer hits zero wins the prize pool."
            pool="670 PNGWIN"
            fee="10 PNGWIN/bid"
            delay={0}
          />

          {/* Card B: Arctic Rush */}
          <FeaturedAuctionCard
            id="rush-1"
            title="Arctic Rush #48"
            badges={[
              { label: 'LIVE', variant: 'live' },
              { label: 'ACCUMULATING', variant: 'accumulating' },
            ]}
            history={[
              { id: '48', label: 'Rush #48', isSelected: true, isResolved: false },
              { id: '47', label: 'Rush #47', isSelected: false, isResolved: true },
              { id: '46', label: 'Rush #46', isSelected: false, isResolved: true },
              { id: '45', label: 'Rush #45', isSelected: false, isResolved: true },
            ]}
            closeInfo="🔥"
            closeTimer="73 / 100 bids until HOT MODE"
            bids={73}
            unique={51}
            burned={22}
            typeDesc="🚀 Live auction. Accumulates 100 bids → enters 5-min HOT MODE. Frantic last-minute bidding. Anti-snipe protection."
            pool="730 PNGWIN"
            fee="10 PNGWIN/bid"
            hotProgress={{ current: 73, target: 100 }}
            delay={0.1}
          />

          {/* Card C: Shadow Bid */}
          <FeaturedAuctionCard
            id="shadow-1"
            title="Shadow Bid #4"
            badges={[
              { label: 'BLIND', variant: 'blind' },
              { label: 'OPEN', variant: 'open' },
            ]}
            history={[
              { id: '4', label: 'Shadow #4', isSelected: true, isResolved: false },
              { id: '3', label: 'Shadow #3', isSelected: false, isResolved: true },
              { id: '2', label: 'Shadow #2', isSelected: false, isResolved: true },
              { id: '1', label: 'Shadow #1', isSelected: false, isResolved: true },
            ]}
            closeInfo="⏰ Closes in"
            closeTimer="4d 18h"
            bids="???"
            unique="???"
            burned="???"
            typeDesc="🫣 Blind auction. You only see YOUR bids. No leaderboard until reveal. Pure strategy. Highest unique bid wins when the week ends."
            pool="Hidden"
            fee="15 PNGWIN/bid"
            delay={0.2}
          />
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

export default Index;
