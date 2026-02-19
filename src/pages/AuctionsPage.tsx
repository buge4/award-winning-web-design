import { AUCTIONS } from '@/data/mockData';
import { COMPLETED_AUCTIONS } from '@/data/drawHistory';
import AuctionCard from '@/components/AuctionCard';
import { useState } from 'react';
import type { AuctionType } from '@/data/mockData';

const tabs: { label: string; type: AuctionType | 'all' | 'history' }[] = [
  { label: 'All', type: 'all' },
  { label: '🎯 Live', type: 'live' },
  { label: '⏱️ Timed', type: 'timed' },
  { label: '🙈 Blind', type: 'blind' },
  { label: '🎁 Free', type: 'free' },
  { label: '🎰 Jackpot', type: 'jackpot' },
  { label: '🎲 RNG', type: 'rng' },
  { label: '📜 History', type: 'history' },
];

const TYPE_ICONS: Record<string, string> = {
  live: '🎯',
  timed: '⏱️',
  blind: '🙈',
  free: '🎁',
  jackpot: '🎰',
};

const AuctionsPage = () => {
  const [activeTab, setActiveTab] = useState<AuctionType | 'all' | 'history'>('all');

  const filtered = activeTab === 'all' ? AUCTIONS : activeTab === 'history' ? [] : AUCTIONS.filter((a) => a.type === activeTab);
  const showHistory = activeTab === 'history';

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🎯 All Auctions</h1>

        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => setActiveTab(tab.type)}
              className={`px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.type
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                No auctions of this type currently active.
              </div>
            )}
          </>
        )}

        {/* History */}
        {showHistory && (
          <div className="space-y-3">
            {COMPLETED_AUCTIONS.map((auction) => (
              <div key={auction.id} className="bg-card border border-border rounded-lg p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{TYPE_ICONS[auction.type] || '🎯'}</span>
                      <span className="font-display font-bold text-base">{auction.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-gold-subtle text-primary border border-gold">
                        {auction.type}
                      </span>
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
                  <span>•</span>
                  <span className="text-pngwin-green">{auction.uniqueBids} unique</span>
                  <span>•</span>
                  <span className="text-pngwin-red">{auction.burnedBids} burned</span>
                </div>
              </div>
            ))}

            <div className="text-center py-4">
              <a href="/draws" className="text-sm text-ice hover:text-ice/80 font-semibold transition-colors">
                🎲 View RNG Draw History →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionsPage;
