import { motion } from 'framer-motion';

interface CompactDraw {
  number: number;
  winner?: string;
  rolledOver: boolean;
}

interface CompactDrawResultsProps {
  week: number;
  date?: string;
  pool: number;
  draws: CompactDraw[];
  totalBids?: number;
  distributed?: number;
  rolled?: number;
}

const MOCK: CompactDrawResultsProps = {
  week: 1,
  date: 'Saturday Feb 22',
  pool: 62000,
  draws: [
    { number: 33.88, winner: '@AlphaWolf', rolledOver: false },
    { number: 71.02, rolledOver: true },
    { number: 55.67, rolledOver: true },
    { number: 8.44, winner: '@NordicBid', rolledOver: false },
    { number: 91.23, winner: '@WhaleAlert', rolledOver: false },
  ],
  totalBids: 278,
  distributed: 39060,
  rolled: 22940,
};

const CompactDrawResults = (props?: Partial<CompactDrawResultsProps>) => {
  const data = { ...MOCK, ...props };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-card border border-border rounded-lg overflow-hidden"
    >
      <div className="px-3 py-2 border-b border-border">
        <h4 className="font-display font-bold text-xs">
          📋 W{data.week} · {data.date} · {data.pool.toLocaleString()} PNGWIN
        </h4>
      </div>

      <div className="px-3 py-2 flex gap-1.5 flex-wrap">
        {data.draws.map((d, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded text-[10px] font-mono font-medium ${
              d.rolledOver
                ? 'bg-pngwin-orange/6 text-pngwin-orange'
                : 'bg-pngwin-green/6 text-pngwin-green'
            }`}
          >
            {d.number.toFixed(2)} → {d.rolledOver ? 'Rolled' : d.winner}
          </span>
        ))}
      </div>

      <div className="px-3 py-1.5 flex gap-3 text-[9px] font-medium bg-background border-t border-border">
        <span className="text-pngwin-green">{data.distributed?.toLocaleString()} distributed</span>
        <span className="text-pngwin-orange">{data.rolled?.toLocaleString()} rolled</span>
        {data.totalBids && (
          <span className="text-muted-foreground">{data.totalBids} bids</span>
        )}
      </div>
    </motion.div>
  );
};

export default CompactDrawResults;
