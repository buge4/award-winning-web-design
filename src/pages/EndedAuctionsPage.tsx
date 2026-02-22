import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuctions, useAuctionHistory } from '@/hooks/useAuctions';
import { COMPLETED_AUCTIONS } from '@/data/drawHistory';
import type { Auction } from '@/data/mockData';

const TYPE_ICONS: Record<string, string> = {
  live_before_hot: '🎯', timed: '⏱️', blind_count: '🙈', blind_timed: '🙈', free: '🎁', jackpot: '🎰',
};

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  resolved: { bg: 'bg-pngwin-green/10', text: 'text-pngwin-green', border: 'border-pngwin-green/20' },
  cancelled: { bg: 'bg-pngwin-red/10', text: 'text-pngwin-red', border: 'border-pngwin-red/20' },
};

const tabs = [
  { label: 'All Ended', value: 'all' },
  { label: '✅ Resolved', value: 'resolved' },
  { label: '🔒 Closed', value: 'closed' },
  { label: '📜 History', value: 'history' },
];

const EndedCard = ({ auction }: { auction: Auction }) => {
  const style = STATUS_STYLES[auction.status] ?? STATUS_STYLES.closed;
  return (
    <Link to={`/auction/${auction.id}`}>
      <motion.div whileHover={{ y: -3 }}
        className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:bg-card-hover transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{TYPE_ICONS[auction.type] || '🎯'}</span>
            <h3 className="font-display font-bold text-sm">{auction.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${style.bg} ${style.text} border ${style.border}`}>
            {auction.status === 'resolved' ? '✅ Resolved' : auction.status === 'cancelled' ? '❌ Cancelled' : '🔒 Closed'}
          </span>
        </div>
        <div className="mb-3">
          <div className="font-mono text-2xl font-bold text-primary">
            {auction.prizePool.toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">PNGWIN</span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Bids: <span className="text-foreground font-semibold">{auction.bidCount}</span></span>
          <span>Unique: <span className="text-pngwin-green font-semibold">{auction.uniqueBids}</span></span>
          <span>Burned: <span className="text-pngwin-red font-semibold">{Number(auction.burnedBids).toFixed(0)}</span></span>
        </div>
      </motion.div>
    </Link>
  );
};

const EndedAuctionsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { auctions: dbAuctions, loading } = useAuctions();
  const { auctions: dbHistory, loading: loadingHistory } = useAuctionHistory();

  const endedAuctions = dbAuctions.filter(a => ['closed', 'resolved', 'cancelled'].includes(a.status));
  const historyData = dbHistory.length > 0 ? dbHistory : COMPLETED_AUCTIONS;

  const filtered = (() => {
    if (activeTab === 'all') return endedAuctions;
    if (activeTab === 'history') return [];
    return endedAuctions.filter(a => a.status === activeTab);
  })();

  const showHistory = activeTab === 'history';

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/auctions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Lobby</Link>
        </div>
        <h1 className="font-display text-3xl font-bold mb-6">📜 Ended Auctions</h1>

        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.value
                  ? 'text-primary bg-gold-subtle border-gold'
                  : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground hover:bg-secondary'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {!showHistory && (
          <>
            {loading ? (
              <div className="text-center py-20 text-muted-foreground text-sm">Loading...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((auction) => (
                  <EndedCard key={auction.id} auction={auction} />
                ))}
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">No ended auctions yet.</div>
            )}
          </>
        )}

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

export default EndedAuctionsPage;
