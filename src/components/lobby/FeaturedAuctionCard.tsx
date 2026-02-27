import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface HistoryItem {
  id: string;
  label: string;
  isSelected: boolean;
  isResolved: boolean;
}

interface FeaturedAuctionCardProps {
  id: string;
  title: string;
  badges: Array<{ label: string; variant: 'daily' | 'live' | 'blind' | 'open' | 'accumulating' | 'hot' }>;
  history: HistoryItem[];
  closeInfo: string;
  closeTimer?: string;
  bids: number | '???';
  unique: number | '???';
  burned: number | '???';
  typeDesc: string;
  pool: string;
  fee: string;
  hotProgress?: { current: number; target: number };
  delay?: number;
}

const badgeColors: Record<string, string> = {
  daily: 'bg-ice text-primary-foreground',
  live: 'bg-pngwin-red text-foreground',
  blind: 'bg-pngwin-purple text-primary-foreground',
  open: 'bg-pngwin-green text-primary-foreground',
  accumulating: 'bg-pngwin-orange text-primary-foreground',
  hot: 'bg-[hsl(25_100%_50%)] text-primary-foreground',
};

const FeaturedAuctionCard = ({
  id, title, badges, history, closeInfo, closeTimer,
  bids, unique, burned, typeDesc, pool, fee, hotProgress, delay = 0,
}: FeaturedAuctionCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-card border border-border rounded-2xl p-6 hover:border-border-active hover:-translate-y-0.5 transition-all relative overflow-hidden"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-display font-bold text-lg">{title}</h3>
        <div className="flex gap-1.5">
          {badges.map((b, i) => (
            <span key={i} className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${badgeColors[b.variant]}`}>
              {b.label}
            </span>
          ))}
        </div>
      </div>

      {/* History selector */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto">
        {history.map((h) => (
          <button
            key={h.id}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap border transition-all ${
              h.isSelected
                ? 'border-primary text-primary bg-[hsl(43_30%_8%)]'
                : 'border-border text-muted-foreground bg-background hover:border-border-active'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${h.isResolved ? 'bg-muted-foreground' : 'bg-pngwin-green'}`} />
            {h.label}
          </button>
        ))}
      </div>

      {/* Close info */}
      <div className="text-xs text-muted-foreground mb-3">
        {closeInfo} {closeTimer && <span className="text-pngwin-green font-semibold">{closeTimer}</span>}
      </div>

      {/* Hot progress bar */}
      {hotProgress && (
        <div className="mb-3">
          <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
            <span>Bids collected</span>
            <span>{hotProgress.current}/{hotProgress.target}</span>
          </div>
          <div className="h-1.5 bg-background rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-pngwin-orange to-[hsl(25_100%_50%)] transition-all"
              style={{ width: `${(hotProgress.current / hotProgress.target) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-3 mb-4">
        {[
          { val: bids, label: 'Bids', color: 'text-pngwin-green' },
          { val: unique, label: 'Unique', color: 'text-pngwin-orange' },
          { val: burned, label: 'Burned', color: 'text-pngwin-red' },
        ].map((s, i) => (
          <div key={i} className="flex-1 bg-background border border-border rounded-lg p-2.5 text-center">
            <div className={`font-mono text-lg font-bold ${s.color}`}>{s.val}</div>
            <div className="text-[10px] text-muted-foreground uppercase mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Type description */}
      <div className="text-xs text-muted-foreground leading-relaxed p-2.5 bg-background rounded-lg border-l-[3px] border-pngwin-orange mb-4">
        {typeDesc}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <div>
          <div className="font-mono text-sm">
            <span className="text-pngwin-green font-bold">Pool: {pool}</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Entry: {fee}</div>
        </div>
        <Link
          to={`/auction/${id}`}
          className="px-5 py-2.5 bg-pngwin-green text-primary-foreground font-bold text-[13px] rounded-lg hover:shadow-[0_4px_15px_hsla(152,100%,45%,0.3)] hover:-translate-y-0.5 transition-all"
        >
          ▶ Enter Auction
        </Link>
      </div>
    </motion.div>
  );
};

export default FeaturedAuctionCard;
