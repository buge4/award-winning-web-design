import { motion } from 'framer-motion';

interface AuctionBreakdownProps {
  name: string;
  auctionType: string;
  status: string;
  bids: number;
  users: number;
  collected: number;
  prizePool: number;
  burned: number;
  jackpotFeed: number;
  socialPool: number;
  onClick?: () => void;
  delay?: number;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const typeColors: Record<string, string> = {
  timed: 'bg-ice/10 text-ice border-ice/20',
  live: 'bg-pngwin-red/10 text-pngwin-red border-pngwin-red/20',
  blind: 'bg-pngwin-purple/10 text-pngwin-purple border-pngwin-purple/20',
  jackpot: 'bg-primary/10 text-primary border-gold',
};

const statusColors: Record<string, string> = {
  accumulating: 'bg-primary/10 text-primary',
  hot_mode: 'bg-pngwin-red/10 text-pngwin-red',
  resolved: 'bg-pngwin-green/10 text-pngwin-green',
  closed: 'bg-pngwin-purple/10 text-pngwin-purple',
  cancelled: 'bg-secondary text-muted-foreground',
};

const AuctionBreakdownCard = ({
  name, auctionType, status, bids, users, collected,
  prizePool, burned, jackpotFeed, socialPool, onClick, delay = 0,
}: AuctionBreakdownProps) => {
  const total = prizePool + burned + jackpotFeed + socialPool || 1;
  const pctPrize = (prizePool / total) * 100;
  const pctBurn = (burned / total) * 100;
  const pctJackpot = (jackpotFeed / total) * 100;
  const pctSocial = (socialPool / total) * 100;
  const pctPlatform = Math.max(0, 100 - pctPrize - pctBurn - pctJackpot - pctSocial);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      onClick={onClick}
      className="bg-card border border-border rounded-[14px] p-5 cursor-pointer hover:border-border-active transition-all hover:shadow-card"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="font-bold text-sm truncate max-w-[160px]">{name}</div>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${typeColors[auctionType] ?? 'bg-secondary text-muted-foreground border-transparent'}`}>
          {auctionType}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-background rounded-lg p-2.5 text-center">
          <div className="font-mono text-base font-bold text-pngwin-green">{bids}</div>
          <div className="text-[10px] text-muted-foreground">Bids</div>
        </div>
        <div className="bg-background rounded-lg p-2.5 text-center">
          <div className="font-mono text-base font-bold text-ice">{users}</div>
          <div className="text-[10px] text-muted-foreground">Users</div>
        </div>
        <div className="bg-background rounded-lg p-2.5 text-center">
          <div className="font-mono text-base font-bold text-primary">{bids > 0 ? (bids / Math.max(users, 1)).toFixed(1) : '—'}</div>
          <div className="text-[10px] text-muted-foreground">Avg</div>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="flex items-center justify-between bg-background rounded-lg px-3 py-2 mb-3">
        <span className="text-xs text-muted-foreground">Collected</span>
        <span className="font-mono text-sm font-bold text-pngwin-green">{fmt(collected)} PNGWIN</span>
      </div>

      {/* Split breakdown bar */}
      <div className="flex gap-0.5 mb-3 h-1.5 rounded-full overflow-hidden">
        <div className="bg-pngwin-green rounded-l-full" style={{ width: `${pctPrize}%` }} />
        <div className="bg-pngwin-red" style={{ width: `${pctBurn}%` }} />
        <div className="bg-ice" style={{ width: `${pctPlatform}%` }} />
        <div className="bg-pngwin-purple" style={{ width: `${pctSocial}%` }} />
        <div className="bg-primary rounded-r-full" style={{ width: `${pctJackpot}%` }} />
      </div>

      {/* Footer stats */}
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">🔥 <span className="text-pngwin-red font-mono font-semibold">{fmt(burned)}</span></span>
        <span className="text-muted-foreground">🎰 <span className="text-primary font-mono font-semibold">{fmt(jackpotFeed)}</span></span>
        <span className="text-muted-foreground">🔗 <span className="text-pngwin-purple font-mono font-semibold">{fmt(socialPool)}</span></span>
      </div>

      {/* Status pill */}
      <div className="mt-3 flex justify-end">
        <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${statusColors[status] ?? 'bg-secondary text-muted-foreground'}`}>
          {status}
        </span>
      </div>
    </motion.div>
  );
};

export default AuctionBreakdownCard;
