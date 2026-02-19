import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AUCTIONS } from '@/data/mockData';
import BidInput from '@/components/BidInput';
import KpiCard from '@/components/KpiCard';
import SocialCircleWidget from '@/components/SocialCircleWidget';
import { toast } from 'sonner';
import { useMyBids, usePlaceBid } from '@/hooks/useAuctions';
import { useAuth } from '@/context/AuthContext';

const AuctionDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const auction = AUCTIONS.find((a) => a.id === id) || AUCTIONS[0];
  const { bids, refetch: refetchBids } = useMyBids(id);
  const { placeBid } = usePlaceBid();

  const isJackpotRng = auction.type === 'rng';
  const isJackpotHuba = auction.type === 'jackpot';

  const handleBid = async (value: string) => {
    if (!user) {
      toast.error('Sign in to place a bid');
      return;
    }
    const { success, message } = await placeBid(auction.id, value);
    if (success) {
      if (isJackpotRng) {
        toast(`✅ Bid ${value} sealed — pending draw result.`);
      } else {
        toast(`✅ Bid ${value} placed!`);
      }
      refetchBids();
    } else {
      toast.error(message);
    }
  };

  // Burn counter for RNG
  const totalValues = 9999;
  const burnedValues = 427;
  const burnPercentage = (burnedValues / totalValues) * 100;

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
                {auction.type.toUpperCase()}
              </span>
              {auction.status === 'hot' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-red-subtle text-pngwin-red border border-pngwin-red/20 animate-pulse-glow">
                  🔥 HOT MODE
                </span>
              )}
              {isJackpotRng && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-purple-subtle text-pngwin-purple border border-pngwin-purple/20">
                  🎲 SEALED BIDS
                </span>
              )}
              {auction.type === 'free' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-green-subtle text-pngwin-green border border-pngwin-green/20">
                  🎁 FREE ENTRY
                </span>
              )}
            </div>
          </div>
          {isJackpotRng && auction.timeRemaining && (
            <div className="flex gap-2">
              <Link
                to="/auction/demo/draw"
                className="px-4 py-2 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors"
              >
                👀 Preview Draw
              </Link>
              <Link
                to={`/auction/${id}/draw`}
                className="px-5 py-2.5 gradient-ice text-background font-display font-bold text-sm tracking-wider rounded-lg shadow-ice hover:opacity-90 transition-opacity"
              >
                🎲 Watch Draw →
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-5">
            {/* Prize Pool */}
            <div className={`bg-card border rounded-lg p-6 text-center ${
              auction.status === 'hot' ? 'border-pngwin-red/30 animate-hot' : 'border-border'
            }`}>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Prize Pool</div>
              <div className="font-mono text-4xl font-bold text-primary mb-1">
                {auction.prizePool.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">PNGWIN</div>

              {/* Live: accumulation progress */}
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

              {/* Live Hot Mode */}
              {auction.status === 'hot' && auction.timeRemaining && (
                <div className="mt-4">
                  <div className="font-mono text-5xl font-bold text-pngwin-red animate-pulse-glow">
                    {auction.timeRemaining}
                  </div>
                  <div className="text-xs text-pngwin-red mt-1">Every bid extends +30s</div>
                </div>
              )}

              {/* Timed */}
              {auction.type === 'timed' && auction.timeRemaining && (
                <div className="mt-4">
                  <div className="font-mono text-4xl font-bold text-ice">{auction.timeRemaining}</div>
                  <div className="text-xs text-muted-foreground">remaining</div>
                </div>
              )}

              {/* Blind */}
              {auction.type === 'blind' && (
                <div className="mt-4">
                  <div className="font-mono text-3xl font-bold text-pngwin-purple animate-pulse-glow">???</div>
                  <div className="text-xs text-muted-foreground mt-1 italic">This auction could end at any moment...</div>
                </div>
              )}

              {/* Free */}
              {auction.type === 'free' && (
                <div className="mt-4 text-center">
                  <div className="text-pngwin-green font-semibold text-sm mb-1">🎁 FREE ENTRY</div>
                  <div className="text-xs text-muted-foreground">You've used 3/5 free bids</div>
                </div>
              )}

              {/* RNG countdown */}
              {isJackpotRng && auction.timeRemaining && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-1">Draw in</div>
                  <div className="font-mono text-3xl font-bold text-ice">{auction.timeRemaining}</div>
                  <div className="text-pngwin-orange font-semibold text-xs mt-2">5 prizes to win!</div>
                </div>
              )}

              {/* Jackpot HUBA */}
              {isJackpotHuba && auction.rolloverHistory && (
                <div className="mt-4">
                  <div className="text-xs text-muted-foreground mb-2">Rollover — Week {auction.rolloverWeek}</div>
                  <div className="flex gap-1 items-end justify-center">
                    {auction.rolloverHistory.map((amount, i) => (
                      <div key={i} className="text-center">
                        <div
                          className={`w-8 rounded-sm mx-auto ${i === auction.rolloverHistory!.length - 1 ? 'bg-primary' : 'bg-muted'}`}
                          style={{ height: `${(amount / Math.max(...auction.rolloverHistory!)) * 50}px` }}
                        />
                        <div className="text-[8px] text-muted-foreground mt-1">W{i + 1}</div>
                        <div className="text-[7px] text-muted-foreground">{(amount / 1000).toFixed(0)}k</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Burn Counter (RNG only) */}
            {isJackpotRng && (
              <div className="bg-card border border-pngwin-red/20 rounded-lg p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">🔥 Values Burned</div>
                  <div className="font-mono text-sm font-bold text-pngwin-red">{burnedValues} / {totalValues.toLocaleString()}</div>
                </div>
                <div className="h-3 bg-border rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-pngwin-red to-pngwin-orange"
                    initial={{ width: 0 }}
                    animate={{ width: `${burnPercentage}%` }}
                    transition={{ duration: 1.5 }}
                  />
                </div>
                <div className="text-[10px] text-muted-foreground">{(100 - burnPercentage).toFixed(1)}% of values still alive</div>

                {/* Burn heatmap */}
                <div className="mt-3 grid grid-cols-10 gap-0.5">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const density = Math.random();
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-sm"
                        style={{
                          backgroundColor: density > 0.7
                            ? 'hsla(350, 100%, 63%, 0.6)'
                            : density > 0.4
                            ? 'hsla(350, 100%, 63%, 0.25)'
                            : 'hsla(350, 100%, 63%, 0.08)',
                        }}
                        title={`Zone ${(i * 1).toString().padStart(2, '0')}.xx`}
                      />
                    );
                  })}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1 text-center">Burn density heatmap (00.xx — 99.xx)</div>
              </div>
            )}

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

            {/* Social Circle Widget */}
            <SocialCircleWidget context="auction" />
          </div>

          {/* Right column */}
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
                      <span className={`w-2 h-2 rounded-full ${
                        bid.status === 'unique' ? 'bg-pngwin-green' : 'bg-pngwin-red'
                      }`} />
                      <span className="font-mono text-lg font-bold">{bid.value}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {bid.status === 'unique' && bid.position && !isJackpotRng && (
                        <span className="text-xs text-pngwin-green font-semibold">#{bid.position}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        bid.status === 'unique'
                          ? 'bg-green-subtle text-pngwin-green'
                          : 'bg-red-subtle text-pngwin-red'
                      }`}>
                        {isJackpotRng
                          ? bid.status === 'unique' ? '🟢 ALIVE' : '🔴 BURNED'
                          : bid.status}
                      </span>
                      <span className="text-xs text-muted-foreground">{bid.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard (NOT for RNG/Jackpot) */}
            {!isJackpotRng && (
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
            )}

            {/* RNG: Prize positions instead of leaderboard */}
            {isJackpotRng && (
              <div className="bg-card border border-ice/20 rounded-lg p-5 glow-ice">
                <div className="font-display font-bold text-sm mb-4">🎲 5 Prizes to Win!</div>
                <div className="space-y-2">
                  {[
                    { pos: 1, pct: 50, amount: Math.floor(auction.prizePool * 0.5) },
                    { pos: 2, pct: 25, amount: Math.floor(auction.prizePool * 0.25) },
                    { pos: 3, pct: 12, amount: Math.floor(auction.prizePool * 0.12) },
                    { pos: 4, pct: 8, amount: Math.floor(auction.prizePool * 0.08) },
                    { pos: 5, pct: 5, amount: Math.floor(auction.prizePool * 0.05) },
                  ].map(p => (
                    <div key={p.pos} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ice">#{p.pos}</span>
                        <span className="text-xs text-muted-foreground">({p.pct}%)</span>
                      </div>
                      <span className="font-mono text-sm font-bold text-primary">{p.amount.toLocaleString()} PNGWIN</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rollover History (RNG) */}
            {isJackpotRng && auction.type === 'rng' && (
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="font-display font-bold text-sm mb-3">Rollover History</div>
                <div className="flex items-center gap-2 text-xs">
                  {[
                    { week: 1, amount: '5,000' },
                    { week: 2, amount: '15,000' },
                    { week: 3, amount: '45,000' },
                    { week: 4, amount: '62,500' },
                  ].map((w, i) => (
                    <div key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="text-muted-foreground">→</span>}
                      <div className={`px-2 py-1 rounded text-center ${
                        i === 3 ? 'bg-gold-subtle border border-gold text-primary font-bold' : 'bg-muted text-muted-foreground'
                      }`}>
                        <div className="text-[9px]">W{w.week}</div>
                        <div className="font-mono">{w.amount}</div>
                      </div>
                    </div>
                  ))}
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
