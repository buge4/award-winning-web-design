import { AUCTIONS } from '@/data/mockData';
import AuctionCard from '@/components/AuctionCard';
import { useState } from 'react';
import type { AuctionType } from '@/data/mockData';

const tabs: { label: string; type: AuctionType | 'all' }[] = [
  { label: 'All', type: 'all' },
  { label: '🎯 Live', type: 'live' },
  { label: '⏱️ Timed', type: 'timed' },
  { label: '🙈 Blind', type: 'blind' },
  { label: '🎁 Free', type: 'free' },
  { label: '🎰 Jackpot', type: 'jackpot' },
  { label: '🎲 RNG', type: 'rng' },
];

const AuctionsPage = () => {
  const [activeTab, setActiveTab] = useState<AuctionType | 'all'>('all');

  const filtered = activeTab === 'all' ? AUCTIONS : AUCTIONS.filter((a) => a.type === activeTab);

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
      </div>
    </div>
  );
};

export default AuctionsPage;
