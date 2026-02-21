import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AUCTIONS as MOCK_AUCTIONS, PLATFORM_STATS } from '@/data/mockData';
import { DRAW_HISTORY } from '@/data/drawHistory';
import AuctionCard from '@/components/AuctionCard';
import LiveTicker from '@/components/LiveTicker';
import JackpotCounter from '@/components/JackpotCounter';
import KpiCard from '@/components/KpiCard';
import heroBg from '@/assets/hero-bg.jpg';
import { useAuctions } from '@/hooks/useAuctions';

const Index = () => {
  const { auctions: dbAuctions, loading } = useAuctions(true);
  const auctions = dbAuctions.length > 0 ? dbAuctions : MOCK_AUCTIONS;

  const latestDraw = DRAW_HISTORY.find(d => d.status === 'completed');
  const winnersCount = latestDraw ? latestDraw.draws.filter(d => d.winner).length : 0;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* HERO */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center top' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />

        <div className="relative py-20 md:py-28 px-6 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-xs text-ice uppercase tracking-[4px] mb-4 font-semibold">
              🐧 Unique Bid Auction Platform
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[0.95] mb-5">
              BID. <span className="text-primary">OUTTHINK.</span> WIN.
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
              The highest <span className="text-foreground font-semibold">unique</span> bid wins.
              If two players bid the same value, both are eliminated.
              Strategy meets adrenaline.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <motion.a
                href="/auctions"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold"
              >
                Enter Auction →
              </motion.a>
              <motion.a
                href="#how-it-works"
                whileHover={{ scale: 1.03 }}
                className="px-8 py-3.5 bg-secondary border border-border-active text-muted-foreground font-display font-bold text-base tracking-wider rounded-lg hover:text-foreground transition-colors"
              >
                How It Works ↓
              </motion.a>
            </div>
          </motion.div>

          {/* Jackpot Counter */}
          <div className="mt-16">
            <JackpotCounter amount={125000} />
            <Link
              to="/auction/demo/draw"
              className="inline-block mt-4 px-5 py-2 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors"
            >
              🎲 Watch a Demo Draw
            </Link>
          </div>
        </div>
      </div>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Latest Draw Result Mini-Card */}
      {latestDraw && (
        <div className="container py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-card border border-ice/20 rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">🎲</span>
              <div>
                <div className="text-xs text-ice font-semibold uppercase tracking-wider">Latest Draw — Week {latestDraw.week}</div>
                <div className="text-sm text-muted-foreground">
                  {winnersCount} of 5 prizes claimed • <span className="font-mono text-pngwin-green font-bold">{latestDraw.totalDistributed.toLocaleString()}</span> distributed • <span className="font-mono text-pngwin-red">{latestDraw.totalRolled.toLocaleString()}</span> rolled
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/draws/${latestDraw.week}`} className="px-3 py-1.5 text-xs text-ice hover:text-ice/80 font-semibold border border-ice/20 rounded-md transition-colors">
                View Results →
              </Link>
              <Link to={`/draws/${latestDraw.week}/replay`} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-md transition-colors">
                🎬 Replay
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {/* Platform KPIs */}
      <div className="container py-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Total Paid Out" value={PLATFORM_STATS.totalPrizesPaid} color="gold" delay={0} />
          <KpiCard label="Tokens Burned" value={PLATFORM_STATS.totalBurned} color="red" delay={0.05} />
          <KpiCard label="Total Players" value={PLATFORM_STATS.totalPlayers} color="ice" delay={0.1} />
          <KpiCard label="Online Now" value={PLATFORM_STATS.activePlayers} color="green" delay={0.15} />
          <KpiCard label="Active Auctions" value={auctions.length} color="purple" delay={0.2} />
          <KpiCard label="Biggest Win" value={PLATFORM_STATS.biggestWin} color="gold" delay={0.25} />
        </div>
      </div>

      {/* Active Auctions Grid */}
      <div className="container pb-10">
        <h2 className="font-display text-2xl font-bold mb-6 flex items-center gap-3">
          🔥 Live Auctions
          <span className="text-xs bg-pngwin-green/20 text-pngwin-green px-2.5 py-0.5 rounded-full font-semibold">
            {auctions.length} ACTIVE
          </span>
        </h2>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading auctions...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </div>

      {/* How It Works */}
      <div id="how-it-works" className="container py-16">
        <h2 className="font-display text-2xl font-bold text-center mb-10">How PNGWIN Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 max-w-4xl mx-auto">
          {[
            { icon: '🎯', title: 'Place a Bid', desc: 'Choose a value from 00.01 to 99.99. Each bid costs a small fee that goes into the prize pool.' },
            { icon: '🔥', title: 'Unique = Alive', desc: "If your bid value is unique (nobody else picked it), it's alive. If someone matches you — both bids are burned!" },
            { icon: '🏆', title: 'Highest Unique Wins', desc: 'When the auction ends, the highest bid value that is still unique wins the entire prize pool.' },
            { icon: '💎', title: 'Earn & Grow', desc: 'Build your Social Circle. When your referrals win, you earn bonuses up to 5 levels deep.' },
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-lg p-6 text-center"
            >
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="font-display font-bold text-base mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Revenue Split */}
      <div className="container pb-16">
        <div className="bg-card border border-border rounded-lg p-6 max-w-3xl mx-auto">
          <h3 className="font-display font-bold text-lg mb-4 text-center">Where Every Bid Goes</h3>
          <div className="flex gap-3 flex-wrap justify-center">
            {[
              { pct: '55%', label: 'Prize Pool', color: 'text-pngwin-green' },
              { pct: '15%', label: 'Token Burn', color: 'text-pngwin-red' },
              { pct: '15%', label: 'Platform', color: 'text-muted-foreground' },
              { pct: '5%', label: 'Social Circle', color: 'text-ice' },
              { pct: '10%', label: 'Jackpot Feed', color: 'text-primary' },
            ].map((item, i) => (
              <div key={i} className="flex-1 min-w-[80px] text-center p-3 bg-background rounded-md">
                <div className={`font-mono text-lg font-bold ${item.color}`}>{item.pct}</div>
                <div className="text-[10px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Circle CTA */}
      <div className="container pb-16">
        <div className="gradient-aurora border border-border rounded-lg p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <h3 className="font-display font-bold text-xl mb-2">🐧 Social Circle Bonuses</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Earn up to <span className="text-primary font-semibold">20% bonus</span> when people in your circle win prizes.
              Build your colony — every win in your network earns you passive rewards.
            </p>
            <div className="flex gap-5 mb-4">
              {[
                { level: 'L1', pct: '8%', color: 'text-pngwin-green' },
                { level: 'L2', pct: '5%', color: 'text-ice' },
                { level: 'L3', pct: '3%', color: 'text-ice' },
                { level: 'L4', pct: '2%', color: 'text-pngwin-purple' },
                { level: 'L5', pct: '2%', color: 'text-pngwin-purple' },
              ].map((l, i) => (
                <div key={i}>
                  <div className="text-[10px] text-muted-foreground">{l.level}</div>
                  <div className={`font-semibold ${l.color}`}>{l.pct}</div>
                </div>
              ))}
            </div>
            <Link to="/social" className="px-5 py-2 bg-ice-subtle border border-ice text-ice rounded-md font-display font-semibold text-sm hover:bg-ice/20 transition-colors">
              View My Circle →
            </Link>
          </div>
          <div className="w-48 h-48 relative shrink-0">
            <div className="absolute inset-0 rounded-full border border-pngwin-purple/20" />
            <div className="absolute inset-[15%] rounded-full border border-ice/25" />
            <div className="absolute inset-[30%] rounded-full border border-ice/35" />
            <div className="absolute inset-[42%] rounded-full border border-pngwin-green/40" />
            <div className="absolute inset-[42%] rounded-full flex items-center justify-center text-3xl">🐧</div>
            <div className="absolute top-[20%] left-[60%] text-sm">👤</div>
            <div className="absolute top-[55%] left-[10%] text-sm">👤</div>
            <div className="absolute top-[70%] left-[70%] text-sm">👤</div>
            <div className="absolute top-[10%] left-[30%] text-xs opacity-60">👤</div>
            <div className="absolute top-[80%] left-[40%] text-xs opacity-60">👤</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
