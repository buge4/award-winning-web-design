import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Auction } from '@/data/mockData';

const typeStyles: Record<string, { border: string; badge: string; badgeBg: string }> = {
  live: { border: 'border-gold', badge: 'text-primary', badgeBg: 'bg-gold-subtle' },
  timed: { border: 'border-ice', badge: 'text-ice', badgeBg: 'bg-ice-subtle' },
  blind: { border: 'border-border-active', badge: 'text-pngwin-purple', badgeBg: 'bg-purple-subtle' },
  free: { border: 'border-border', badge: 'text-pngwin-green', badgeBg: 'bg-green-subtle' },
  jackpot: { border: 'border-gold glow-gold', badge: 'text-primary', badgeBg: 'bg-gold-subtle' },
  rng: { border: 'border-ice glow-ice', badge: 'text-ice', badgeBg: 'bg-ice-subtle' },
};

const typeLabels: Record<string, string> = {
  live: 'LIVE',
  timed: 'TIMED',
  blind: 'BLIND',
  free: 'FREE',
  jackpot: 'JACKPOT',
  rng: 'RNG',
};

const AuctionCard = ({ auction }: { auction: Auction }) => {
  const style = typeStyles[auction.type];

  return (
    <Link to={`/auction/${auction.id}`}>
      <motion.div
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className={`bg-card border ${style.border} rounded-lg p-5 cursor-pointer transition-colors hover:bg-card-hover relative overflow-hidden`}
      >
        {/* Hot mode glow */}
        {auction.status === 'hot' && (
          <div className="absolute inset-0 animate-hot rounded-lg pointer-events-none" />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{auction.icon}</span>
            <h3 className="font-display font-bold text-sm">{auction.title}</h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase ${style.badge} ${style.badgeBg} border ${style.border}`}>
            {auction.status === 'hot' ? '🔥 HOT MODE' : typeLabels[auction.type]}
          </span>
        </div>

        {/* Prize pool */}
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
          <div className="font-mono text-2xl font-bold text-primary">
            {auction.prizePool.toLocaleString()}
            <span className="text-xs text-muted-foreground ml-1">PNGWIN</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex justify-between text-xs text-muted-foreground mb-3">
          <span>Bids: <span className="text-foreground font-semibold">{auction.bidCount}</span></span>
          <span>Unique: <span className="text-pngwin-green font-semibold">{auction.uniqueBids}</span></span>
          <span>Burned: <span className="text-pngwin-red font-semibold">{auction.burnedBids}</span></span>
        </div>

        {/* Type-specific bottom */}
        {auction.type === 'live' && auction.status === 'accumulating' && auction.bidTarget && (
          <div>
            <div className="flex justify-between text-[11px] mb-1.5">
              <span className="text-muted-foreground">Bids to Hot Mode</span>
              <span className="text-primary font-semibold">{auction.bidCount}/{auction.bidTarget}</span>
            </div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all"
                style={{ width: `${(auction.bidCount / auction.bidTarget) * 100}%` }}
              />
            </div>
          </div>
        )}

        {auction.status === 'hot' && auction.timeRemaining && (
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-pngwin-red animate-pulse-glow">{auction.timeRemaining}</div>
            <div className="text-[10px] text-pngwin-red">Every bid extends +30s</div>
          </div>
        )}

        {auction.type === 'timed' && auction.timeRemaining && (
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-ice">{auction.timeRemaining}</div>
            <div className="text-[10px] text-muted-foreground">remaining</div>
          </div>
        )}

        {auction.type === 'blind' && (
          <div className="text-center">
            <div className="font-mono text-xl font-bold text-pngwin-purple">???</div>
            <div className="text-[10px] text-muted-foreground">End condition hidden</div>
          </div>
        )}

        {auction.type === 'free' && (
          <div className="text-center">
            <div className="text-pngwin-green font-semibold text-sm">🎁 FREE ENTRY</div>
            <div className="text-[10px] text-muted-foreground">Max 5 bids per player</div>
          </div>
        )}

        {auction.type === 'jackpot' && auction.rolloverWeek && (
          <div>
            <div className="text-[10px] text-muted-foreground mb-1">Rollover Timeline — Week {auction.rolloverWeek}</div>
            <div className="flex gap-1 items-end">
              {auction.rolloverHistory?.map((amount, i) => (
                <div key={i} className="flex-1 text-center">
                  <div
                    className={`rounded-sm ${i === auction.rolloverHistory!.length - 1 ? 'bg-primary' : 'bg-muted'}`}
                    style={{ height: `${(amount / Math.max(...auction.rolloverHistory!)) * 40}px` }}
                  />
                  <div className="text-[8px] text-muted-foreground mt-1">W{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {auction.type === 'rng' && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] text-muted-foreground">Draw in</div>
              <div className="font-mono text-sm font-bold text-ice">{auction.timeRemaining}</div>
            </div>
            <div className="text-[10px] text-pngwin-orange font-semibold">5 prizes to win!</div>
          </div>
        )}

        {/* Bid cost */}
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs">
          <span className="text-muted-foreground">Bid Cost</span>
          <span className="font-mono font-bold text-primary">
            {auction.bidCost === 0 ? 'FREE' : `${auction.bidCost} PNGWIN`}
          </span>
        </div>
      </motion.div>
    </Link>
  );
};

export default AuctionCard;
