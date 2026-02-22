import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { AUCTIONS } from '@/data/mockData';
import BidInput from '@/components/BidInput';
import KpiCard from '@/components/KpiCard';
import SocialCircleWidget from '@/components/SocialCircleWidget';
import { toast } from 'sonner';
import { useMyBids, usePlaceBid, useAuctionDetail, useAuctionLeaderboard } from '@/hooks/useAuctions';
import { useAuth } from '@/context/AuthContext';

const AuctionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { auction: dbAuction, refetch: refetchAuction } = useAuctionDetail(id);
  const auction = dbAuction ?? AUCTIONS.find((a) => a.id === id) ?? AUCTIONS[0];
  const { bids, refetch: refetchBids } = useMyBids(id);
  const { placeBid } = usePlaceBid();
  const { entries: leaderboardEntries } = useAuctionLeaderboard(id);

  // Live countdown timer
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (!auction.hotModeEndsAt && !auction.timeRemaining) return;

    const tick = () => {
      if (auction.hotModeEndsAt) {
        const diff = Math.max(0, Math.floor((new Date(auction.hotModeEndsAt).getTime() - Date.now()) / 1000));
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setCountdown(`${m}:${String(s).padStart(2, '0')}`);
      } else if (auction.timeRemaining) {
        setCountdown(auction.timeRemaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [auction.hotModeEndsAt, auction.timeRemaining]);

  const isJackpot = auction.type === 'jackpot';
  const minBid = auction.minBidValue ?? 0.01;
  const maxBid = auction.maxBidValue ?? 99.99;

  const handleBid = async (value: string) => {
    if (!user) {
      toast.error('Sign in to place a bid');
      return;
    }
    const result = await placeBid(auction.id, value);
    if (result.success) {
      if (result.is_burned) {
        toast(`🔥 Bid ${value} burned — duplicate value!`);
      } else if (isJackpot) {
        toast(`✅ Bid ${value} sealed — pending resolution.`);
      } else {
        toast(`✅ Bid ${value} placed! ${result.position ? `Position #${result.position}` : ''}`);
      }
      refetchBids();
      refetchAuction();
    } else {
      toast.error(result.message);
    }
  };

  const statusLabel = auction.status === 'hot_mode' ? '🔥 HOT MODE'
    : auction.status === 'grace_period' ? '⏳ GRACE PERIOD'
    : auction.status === 'resolved' ? '✅ RESOLVED'
    : auction.status === 'closed' ? '🔒 CLOSED'
    : auction.status === 'accumulating' ? '📈 ACCUMULATING'
    : auction.status.toUpperCase();

  const isActive = ['accumulating', 'hot_mode', 'grace_period'].includes(auction.status);

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-6">
        <Link to="/auctions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          ← Back to Auctions
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{auction.icon}</span>
              <h1 className="font-display text-3xl font-bold">{auction.title}</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gold-subtle text-primary border border-gold">
                {auction.type.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                auction.status === 'hot_mode' ? 'bg-pngwin-red/20 text-pngwin-red border border-pngwin-red/30 animate-pulse' :
                auction.status === 'grace_period' ? 'bg-pngwin-orange/20 text-pngwin-orange border border-pngwin-orange/30' :
                auction.status === 'resolved' ? 'bg-ice/20 text-ice border border-ice/30' :
                'bg-secondary text-muted-foreground border border-border'
              }`}>
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Prize Pool */}
            <div className={`bg-card border rounded-lg p-6 text-center ${
              auction.status === 'hot_mode' ? 'border-pngwin-red/30 animate-hot' : 'border-border'
            }`}>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Prize Pool</div>
              <div className="font-mono text-4xl font-bold text-primary mb-1">
                {auction.prizePool.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">PNGWIN</div>

              {/* Accumulation progress for live_before_hot */}
              {auction.type === 'live_before_hot' && auction.status === 'accumulating' && auction.bidTarget && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    {auction.bidCount}/{auction.bidTarget} bids to Hot Mode
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (auction.bidCount / auction.bidTarget) * 100)}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              )}

              {/* Hot Mode Countdown */}
              {(auction.status === 'hot_mode' || auction.status === 'grace_period') && countdown && (
                <div className="mt-4">
                  <div className="font-mono text-5xl font-bold text-pngwin-red animate-pulse">
                    {countdown}
                  </div>
                  <div className="text-xs text-pngwin-red mt-1">
                    {auction.status === 'grace_period' ? 'Grace period — bid to extend!' : 'Every bid extends +30s'}
                  </div>
                </div>
              )}

              {/* Timed countdown */}
              {auction.type === 'timed' && countdown && auction.status === 'accumulating' && (
                <div className="mt-4">
                  <div className="font-mono text-4xl font-bold text-ice">{countdown}</div>
                  <div className="text-xs text-muted-foreground">remaining</div>
                </div>
              )}

              {/* Blind */}
              {(auction.type === 'blind_count' || auction.type === 'blind_timed') && auction.status === 'accumulating' && (
                <div className="mt-4">
                  <div className="font-mono text-3xl font-bold text-pngwin-purple animate-pulse">???</div>
                  <div className="text-xs text-muted-foreground mt-1 italic">This auction could end at any moment...</div>
                </div>
              )}
            </div>

            {/* Bid Range */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Bid Range</div>
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-pngwin-green">{minBid.toFixed(2)}</div>
                  <div className="text-[9px] text-muted-foreground">MIN</div>
                </div>
                <div className="text-muted-foreground">—</div>
                <div className="text-center">
                  <div className="font-mono text-lg font-bold text-primary">{maxBid.toFixed(2)}</div>
                  <div className="text-[9px] text-muted-foreground">MAX</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-center mt-2">
                Highest unique bid wins 🏆
              </div>
            </div>

            {/* Bid Input */}
            {isActive && (
              <div className="bg-card border border-border rounded-lg p-6">
                <BidInput onSubmit={handleBid} bidCost={auction.bidCost} maxValue={maxBid} />
              </div>
            )}

            {/* Resolved state */}
            {auction.status === 'resolved' && (
              <div className="bg-gold-subtle border border-gold rounded-lg p-5 text-center">
                <div className="text-2xl mb-2">🏆</div>
                <div className="font-display font-bold text-primary">Auction Resolved</div>
                <div className="text-xs text-muted-foreground mt-1">Check leaderboard for final results</div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <KpiCard label="Total Bids" value={auction.bidCount} color="ice" />
              <KpiCard label="Unique" value={auction.uniqueBids} color="green" />
              <KpiCard label="Burned" value={Number(auction.burnedBids.toFixed(0))} color="red" />
            </div>

            {/* Social Circle Widget */}
            <SocialCircleWidget context="auction" />
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">
            {/* My Last 10 Bids */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border font-display font-bold text-sm">
                My Bids {bids.length > 0 && `(${bids.length})`}
              </div>
              {bids.length === 0 ? (
                <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                  {user ? 'No bids placed yet. Be the first!' : 'Sign in to place bids'}
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {bids.map((bid) => (
                    <div key={bid.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${
                          bid.status === 'unique' ? 'bg-pngwin-green' : 'bg-pngwin-red'
                        }`} />
                        <span className="font-mono text-lg font-bold">{bid.value}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {bid.status === 'unique' && bid.position && !isJackpot && (
                          <span className="text-xs text-pngwin-green font-semibold">#{bid.position}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          bid.status === 'unique'
                            ? 'bg-pngwin-green/10 text-pngwin-green'
                            : 'bg-pngwin-red/10 text-pngwin-red'
                        }`}>
                          {bid.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{bid.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            {!isJackpot && (
              <div className="bg-card border border-border rounded-lg">
                <div className="px-5 py-3 border-b border-border flex justify-between items-center">
                  <span className="font-display font-bold text-sm">🏆 Leaderboard</span>
                  <span className="text-[10px] text-muted-foreground">
                    {leaderboardEntries.length > 0 ? `${leaderboardEntries.length} unique bids` : 'No bids yet'}
                  </span>
                </div>
                <div className="divide-y divide-border/50">
                  {leaderboardEntries.length > 0 ? (
                    leaderboardEntries.slice(0, 20).map((entry, i) => (
                      <div key={i} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`font-mono text-sm font-bold w-8 ${
                            entry.rank === 1 ? 'text-primary' : entry.rank <= 3 ? 'text-ice' : 'text-muted-foreground'
                          }`}>
                            #{entry.rank}
                          </span>
                          <span className="text-sm text-muted-foreground">{entry.username}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-bold">
                            {Number(entry.bid_amount).toFixed(2)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            entry.rank === 1 ? 'bg-gold-subtle text-primary' : 'bg-pngwin-green/10 text-pngwin-green'
                          }`}>
                            {entry.rank === 1 ? '👑 LEADER' : 'UNIQUE'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center text-muted-foreground text-sm">
                      Leaderboard updates after bids are placed
                    </div>
                  )}
                </div>
              </div>
            )}

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
