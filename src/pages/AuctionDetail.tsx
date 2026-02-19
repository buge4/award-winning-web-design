import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { AUCTIONS, MY_BIDS } from '@/data/mockData';
import BidInput from '@/components/BidInput';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

const AuctionDetail = () => {
  const { id } = useParams();
  const auction = AUCTIONS.find((a) => a.id === id) || AUCTIONS[0];
  const [bids, setBids] = useState(MY_BIDS);

  const handleBid = (value: string) => {
    const isUnique = Math.random() > 0.4;
    const newBid = {
      id: String(bids.length + 1),
      value,
      status: isUnique ? ('unique' as const) : ('burned' as const),
      position: isUnique ? Math.floor(Math.random() * 20) + 1 : undefined,
      timestamp: 'just now',
    };
    setBids([newBid, ...bids.slice(0, 9)]);
    toast(
      isUnique
        ? `✅ Bid ${value} is UNIQUE! Position #${newBid.position}`
        : `❌ Bid ${value} was BURNED — someone else picked it!`,
    );
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-6">
        {/* Back button */}
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          ← Back to Auctions
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{auction.icon}</span>
              <h1 className="font-display text-3xl font-bold">{auction.title}</h1>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gold-subtle text-primary border border-gold">
                {auction.type.toUpperCase()}
              </span>
              {auction.status === 'hot' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-red-subtle text-pngwin-red border border-pngwin-red/20 animate-pulse-glow">
                  🔥 HOT MODE
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Prize Pool + Bid Input */}
          <div className="lg:col-span-1 space-y-5">
            {/* Prize Pool */}
            <div className={`bg-card border rounded-lg p-6 text-center ${auction.status === 'hot' ? 'border-pngwin-red/30 animate-hot' : 'border-border'}`}>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Prize Pool</div>
              <div className="font-mono text-4xl font-bold text-primary mb-1">
                {auction.prizePool.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">PNGWIN</div>

              {/* Type-specific display */}
              {auction.type === 'live' && auction.status === 'accumulating' && auction.bidTarget && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    {auction.bidCount}/{auction.bidTarget} bids to Hot Mode
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${(auction.bidCount / auction.bidTarget) * 100}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              )}

              {auction.status === 'hot' && auction.timeRemaining && (
                <div className="mt-4">
                  <div className="font-mono text-5xl font-bold text-pngwin-red animate-pulse-glow">
                    {auction.timeRemaining}
                  </div>
                  <div className="text-xs text-pngwin-red mt-1">Every bid extends +30s</div>
                </div>
              )}

              {auction.type === 'timed' && auction.timeRemaining && (
                <div className="mt-4">
                  <div className="font-mono text-4xl font-bold text-ice">{auction.timeRemaining}</div>
                  <div className="text-xs text-muted-foreground">remaining</div>
                </div>
              )}

              {auction.type === 'blind' && (
                <div className="mt-4 font-mono text-3xl font-bold text-pngwin-purple">???</div>
              )}
            </div>

            {/* Bid Input */}
            <div className="bg-card border border-border rounded-lg p-6">
              <BidInput onSubmit={handleBid} bidCost={auction.bidCost} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <KpiCard label="Total Bids" value={auction.bidCount} color="ice" />
              <KpiCard label="Unique" value={auction.uniqueBids} color="green" />
              <KpiCard label="Burned" value={auction.burnedBids} color="red" />
            </div>
          </div>

          {/* Right: My Bids + Leaderboard */}
          <div className="lg:col-span-2 space-y-5">
            {/* My Last 10 Bids */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border font-display font-bold text-sm">
                My Last 10 Bids
              </div>
              <div className="divide-y divide-border/50">
                {bids.map((bid) => (
                  <div key={bid.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          bid.status === 'unique'
                            ? 'bg-pngwin-green'
                            : bid.status === 'burned'
                            ? 'bg-pngwin-red'
                            : 'bg-primary'
                        }`}
                      />
                      <span className="font-mono text-lg font-bold">{bid.value}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {bid.status === 'unique' && bid.position && (
                        <span className="text-xs text-pngwin-green font-semibold">#{bid.position}</span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          bid.status === 'unique'
                            ? 'bg-green-subtle text-pngwin-green'
                            : bid.status === 'burned'
                            ? 'bg-red-subtle text-pngwin-red'
                            : 'bg-gold-subtle text-primary'
                        }`}
                      >
                        {bid.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{bid.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Preview */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border flex justify-between items-center">
                <span className="font-display font-bold text-sm">Leaderboard</span>
                <span className="text-[10px] text-muted-foreground">Masked during active auction</span>
              </div>
              <div className="divide-y divide-border/50">
                {[1, 2, 3, 4, 5].map((rank) => (
                  <div key={rank} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-sm font-bold ${rank === 1 ? 'text-primary' : rank <= 3 ? 'text-ice' : 'text-muted-foreground'}`}>
                        #{rank}
                      </span>
                      <span className="font-mono text-sm text-muted-foreground">##.##</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${rank === 1 ? 'bg-gold-subtle text-primary' : 'bg-green-subtle text-pngwin-green'}`}>
                      UNIQUE
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Split */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="font-display font-bold text-sm mb-3">Revenue Split</div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { pct: '55%', label: 'Prize Pool', color: 'text-pngwin-green' },
                  { pct: '15%', label: 'Burn', color: 'text-pngwin-red' },
                  { pct: '15%', label: 'Platform', color: 'text-muted-foreground' },
                  { pct: '5%', label: 'Social', color: 'text-ice' },
                  { pct: '10%', label: 'Jackpot', color: 'text-primary' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 min-w-[70px] text-center p-2.5 bg-background rounded-md">
                    <div className={`font-mono text-sm font-bold ${item.color}`}>{item.pct}</div>
                    <div className="text-[9px] text-muted-foreground">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetail;
