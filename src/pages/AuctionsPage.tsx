import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AUCTIONS as MOCK_AUCTIONS } from '@/data/mockData';
import { COMPLETED_AUCTIONS } from '@/data/drawHistory';
import type { Auction, AuctionType, AuctionStatus } from '@/data/mockData';
import { useAuctions, useAuctionHistory } from '@/hooks/useAuctions';

const statusTabs: { label: string; value: string }[] = [
  { label: 'All Active', value: 'active' },
  { label: '🔥 Hot Mode', value: 'hot_mode' },
  { label: '📈 Accumulating', value: 'accumulating' },
  { label: '⏳ Grace Period', value: 'grace_period' },
  { label: '📜 History', value: 'history' },
];

const TYPE_ICONS: Record<string, string> = {
  live_before_hot: '🎯',
  timed: '⏱️',
  blind_count: '🙈',
  blind_timed: '🙈',
  free: '🎁',
  jackpot: '🎰',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  accumulating: { bg: 'bg-pngwin-orange/10', text: 'text-pngwin-orange', border: 'border-pngwin-orange/20' },
  hot_mode: { bg: 'bg-pngwin-red/10', text: 'text-pngwin-red', border: 'border-pngwin-red/30' },
  grace_period: { bg: 'bg-pngwin-green/10', text: 'text-pngwin-green', border: 'border-pngwin-green/20' },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  resolved: { bg: 'bg-ice/10', text: 'text-ice', border: 'border-ice/20' },
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
          isHot ? 'border-pngwin-red/40' : isGrace ? 'border-pngwin-green/40' : 'border-border'
        }`}
      >
        {/* Hot mode glow */}
        {isHot && <div className="absolute inset-0 animate-hot rounded-lg pointer-events-none" />}

        {/* Header */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TYPE_ICONS[auction.type] || '🎯'}</span>
            <h3 className="font-display font-bold text-sm">{auction.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${style.bg} ${style.text} border ${style.border}`}>
            {isHot ? '🔥 HOT MODE' : isGrace ? '⏳ GRACE' : auction.status.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Prize pool */}
        <div className="mb-3 relative z-10">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
          <div className="font-mono text-2xl font-bold text-primary">
            {auction.prizePool.toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">PNGWIN</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-xs text-muted-foreground mb-3 relative z-10">
          <span>Bids: <span className="text-foreground font-semibold">{auction.bidCount}</span></span>
          <span>Unique: <span className="text-pngwin-green font-semibold">{auction.uniqueBids}</span></span>
          <span>Burned: <span className="text-pngwin-red font-semibold">{Number(auction.burnedBids).toFixed(0)}</span></span>
        </div>

        {/* Bid range */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 relative z-10">
          <span>Range:</span>
          <span className="font-mono font-semibold text-foreground">
            {(auction.minBidValue ?? 0.01).toFixed(2)} — {(auction.maxBidValue ?? 99.99).toFixed(2)}
          </span>
        </div>

        {/* Progress / countdown */}
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

        {/* Bid cost */}
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

  const filtered = activeTab === 'active'
    ? allAuctions.filter(a => ['accumulating', 'hot_mode', 'grace_period'].includes(a.status))
    : activeTab === 'history'
    ? []
    : allAuctions.filter(a => a.status === activeTab);

  const showHistory = activeTab === 'history';
  const historyData = dbHistory.length > 0 ? dbHistory : COMPLETED_AUCTIONS;

  // Sort: hot_mode first, then grace_period, then accumulating
  const statusOrder: Record<string, number> = { hot_mode: 0, grace_period: 1, accumulating: 2 };
  const sorted = [...filtered].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🎯 Auction Lobby</h1>

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

        {/* Active auctions */}
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
                No auctions with this status.
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
