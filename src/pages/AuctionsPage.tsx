import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AUCTIONS as MOCK_AUCTIONS } from '@/data/mockData';
import { COMPLETED_AUCTIONS } from '@/data/drawHistory';
import type { Auction } from '@/data/mockData';
import { useAuctions, useAuctionHistory } from '@/hooks/useAuctions';
import JackpotCounter from '@/components/JackpotCounter';

// Jackpot Featured Card with countdown to Friday 20:00 UTC
const JackpotFeaturedCard = ({ auction }: { auction: Auction }) => {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    const getNextFriday = () => {
      const now = new Date();
      const utcDay = now.getUTCDay();
      const daysUntilFriday = (5 - utcDay + 7) % 7 || 7;
      const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilFriday, 20, 0, 0));
      if (utcDay === 5 && now.getUTCHours() < 20) {
        next.setUTCDate(now.getUTCDate());
      }
      return next;
    };

    const tick = () => {
      const diff = Math.max(0, Math.floor((getNextFriday().getTime() - Date.now()) / 1000));
      const d = Math.floor(diff / 86400);
      const h = Math.floor((diff % 86400) / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setCountdown(`${d}d ${h}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link to={`/auction/${auction.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-gold/30 rounded-xl p-6 mb-8 glow-gold cursor-pointer hover:border-gold/50 transition-colors"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <div className="text-[10px] text-muted-foreground uppercase tracking-[3px] mb-1">Weekly Jackpot</div>
            <JackpotCounter amount={auction.prizePool} />
          </div>
          <div className="text-center md:text-right space-y-2">
            <div className="text-xs text-muted-foreground">
              {auction.bidCount} bids • {auction.uniqueBids} unique
            </div>
            {auction.rngPickCount && (
              <div className="px-3 py-1 rounded-full text-[10px] font-semibold bg-pngwin-red/10 text-pngwin-red border border-pngwin-red/20 inline-block">
                🎲 {auction.rngPickCount} numbers will be drawn
              </div>
            )}
            <div className="text-xs text-muted-foreground font-mono">{countdown}</div>
            <div className="text-[10px] text-muted-foreground">until Friday 20:00 UTC draw</div>
            <div className="px-6 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold inline-block">
              Enter Jackpot →
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

const statusTabs = [
  { label: 'All Active', value: 'active' },
  { label: '🔥 Hot', value: 'hot_mode' },
  { label: '📈 Live', value: 'accumulating' },
  { label: '🙈 Blind', value: 'blind' },
  { label: '⏳ Ending Soon', value: 'ending' },
  { label: '✅ Resolved', value: 'resolved' },
  { label: '📜 History', value: 'history' },
];

const TYPE_ICONS: Record<string, string> = {
  live_before_hot: '🎯', timed: '⏱️', blind_count: '🙈', blind_timed: '🙈', free: '🎁', jackpot: '🎰',
};

const RESOLUTION_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  highest_unique_bid: { label: '🏆 Unique Bid', bg: 'bg-gold-subtle', text: 'text-primary', border: 'border-gold' },
  rng_closest: { label: '🎯 RNG Closest', bg: 'bg-purple-subtle', text: 'text-pngwin-purple', border: 'border-border-active' },
  rng_exact: { label: '🎰 Jackpot Draw', bg: 'bg-pngwin-red/10', text: 'text-pngwin-red', border: 'border-pngwin-red/30' },
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  accumulating: { bg: 'bg-gold-subtle', text: 'text-primary', border: 'border-gold' },
  hot_mode: { bg: 'bg-pngwin-red/10', text: 'text-pngwin-red', border: 'border-pngwin-red/30' },
  grace_period: { bg: 'bg-pngwin-orange/10', text: 'text-pngwin-orange', border: 'border-pngwin-orange/20' },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  resolved: { bg: 'bg-pngwin-green/10', text: 'text-pngwin-green', border: 'border-pngwin-green/20' },
};

const AuctionLobbyCard = ({ auction }: { auction: Auction }) => {
  const style = STATUS_STYLES[auction.status] ?? STATUS_STYLES.accumulating;
  const isHot = auction.status === 'hot_mode';
  const isGrace = auction.status === 'grace_period';

  return (
    <Link to={`/auction/${auction.id}`}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`bg-card border rounded-lg p-5 cursor-pointer transition-colors hover:bg-card-hover relative overflow-hidden ${
          isHot ? 'border-pngwin-red/40' : isGrace ? 'border-pngwin-orange/40' : 'border-border'
        }`}
      >
        {isHot && <div className="absolute inset-0 animate-hot rounded-lg pointer-events-none" />}

        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TYPE_ICONS[auction.type] || '🎯'}</span>
            <h3 className="font-display font-bold text-sm">{auction.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${style.bg} ${style.text} border ${style.border}`}>
            {isHot ? '🔥 HOT' : isGrace ? '⏳ GRACE' : auction.status === 'resolved' ? '✅ DONE' : auction.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Resolution method badge */}
        {auction.resolutionMethod && (
          <div className="mb-3 relative z-10">
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${RESOLUTION_BADGE[auction.resolutionMethod]?.bg ?? ''} ${RESOLUTION_BADGE[auction.resolutionMethod]?.text ?? ''} border ${RESOLUTION_BADGE[auction.resolutionMethod]?.border ?? ''}`}>
              {RESOLUTION_BADGE[auction.resolutionMethod]?.label ?? auction.resolutionMethod}
            </span>
            {auction.resolutionMethod === 'rng_exact' && auction.rngPickCount && (
              <span className="ml-2 text-[10px] text-muted-foreground">{auction.rngPickCount} numbers drawn</span>
            )}
          </div>
        )}

        <div className="mb-3 relative z-10">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
          <div className="font-mono text-2xl font-bold text-primary">
            {auction.prizePool.toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">PNGWIN</span>
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mb-3 relative z-10">
          <span>Bids: <span className="text-foreground font-semibold">{auction.bidCount}</span></span>
          <span>Unique: <span className="text-pngwin-green font-semibold">{auction.uniqueBids}</span></span>
          <span>Burned: <span className="text-pngwin-red font-semibold">{Number(auction.burnedBids).toFixed(0)}</span></span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 relative z-10">
          <span>Range:</span>
          <span className="font-mono font-semibold text-foreground">
            {(auction.minBidValue ?? 0.01).toFixed(2)} — {(auction.maxBidValue ?? 99.99).toFixed(2)}
          </span>
        </div>

        {auction.type === 'live_before_hot' && auction.status === 'accumulating' && auction.bidTarget && (
          <div className="relative z-10">
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Bids to Hot Mode</span>
              <span className="text-primary font-semibold">{auction.bidCount}/{auction.bidTarget}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all"
                style={{ width: `${Math.min(100, (auction.bidCount / auction.bidTarget) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {(isHot || isGrace) && auction.timeRemaining && (
          <div className="text-center relative z-10">
            <div className={`font-mono text-3xl font-bold ${isHot ? 'text-pngwin-red animate-pulse' : 'text-pngwin-orange'}`}>
              {auction.timeRemaining}
            </div>
            <div className="text-[10px] text-pngwin-red">
              {isGrace ? 'Grace period — bid to extend!' : 'Every bid extends +30s'}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs relative z-10">
          <span className="text-muted-foreground">Bid Cost</span>
          <span className="font-mono font-bold text-primary">
            {auction.bidCost === 0 ? 'FREE' : `${auction.bidCost} PNGWIN`}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

const AuctionsPage = () => {
  const [activeTab, setActiveTab] = useState('active');
  const { auctions: dbAuctions, loading } = useAuctions();
  const { auctions: dbHistory, loading: loadingHistory } = useAuctionHistory();

  const allAuctions = dbAuctions.length > 0 ? dbAuctions : MOCK_AUCTIONS;

  // Find jackpot auction for featured card
  const jackpotAuction = allAuctions.find(a => a.type === 'jackpot');

  const filtered = (() => {
    switch (activeTab) {
      case 'active':
        return allAuctions.filter(a => ['accumulating', 'hot_mode', 'grace_period'].includes(a.status));
      case 'hot_mode':
        return allAuctions.filter(a => a.status === 'hot_mode' || a.status === 'grace_period');
      case 'blind':
        return allAuctions.filter(a => (a.type === 'blind_count' || a.type === 'blind_timed') && ['accumulating', 'hot_mode', 'grace_period'].includes(a.status));
      case 'ending':
        return allAuctions.filter(a => a.status === 'grace_period' || (a.type === 'timed' && a.status === 'accumulating'));
      case 'resolved':
        return allAuctions.filter(a => a.status === 'resolved');
      case 'history':
        return [];
      default:
        return allAuctions.filter(a => a.status === activeTab);
    }
  })();

  const showHistory = activeTab === 'history';
  const historyData = dbHistory.length > 0 ? dbHistory : COMPLETED_AUCTIONS;

  const statusOrder: Record<string, number> = { hot_mode: 0, grace_period: 1, accumulating: 2 };
  const sorted = [...filtered].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🎯 Auction Lobby</h1>

        {/* Jackpot Featured Card */}
        {jackpotAuction && activeTab !== 'history' && (
          <JackpotFeaturedCard auction={jackpotAuction} />
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.value
                  ? 'text-primary bg-gold-subtle border-gold'
                  : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active auctions grid */}
        {!showHistory && (
          <>
            {loading ? (
              <div className="text-center py-20 text-muted-foreground text-sm">Loading auctions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map((auction) => (
                  <AuctionLobbyCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
            {!loading && sorted.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                No auctions with this filter.
              </div>
            )}
          </>
        )}

        {/* History */}
        {showHistory && (
          <div className="space-y-3">
            {loadingHistory ? (
              <div className="text-center py-20 text-muted-foreground text-sm">Loading history...</div>
            ) : (
              historyData.map((auction) => (
                <div key={auction.id} className="bg-card border border-border rounded-lg p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{TYPE_ICONS[auction.type] || '🎯'}</span>
                        <span className="font-display font-bold text-base">{auction.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{auction.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-ice">{auction.winner}</div>
                      <div className="font-mono text-xs text-muted-foreground">bid {auction.winningBid}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>🏆 <span className="font-mono font-bold text-pngwin-green">{auction.prizeWon.toLocaleString()} PNGWIN</span></span>
                    <span>•</span>
                    <span>{auction.players} players</span>
                    <span>•</span>
                    <span>{auction.totalBids} bids</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;
