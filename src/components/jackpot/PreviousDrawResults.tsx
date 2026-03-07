import { motion } from 'framer-motion';

interface DrawResult {
  draw: number;
  number: number;
  winner?: string;
  amount?: number;
  rolledOver: boolean;
}

interface PreviousDrawResultsProps {
  week: number;
  date?: string;
  pool: number;
  draws: DrawResult[];
  distributed?: number;
  rolled?: number;
  burned?: number;
}

const MOCK_RESULTS: PreviousDrawResultsProps = {
  week: 2,
  date: 'Saturday Feb 15, 2026',
  pool: 85000,
  draws: [
    { draw: 1, number: 47.23, winner: '@DiamondHands', amount: 42500, rolledOver: false },
    { draw: 2, number: 82.91, rolledOver: true },
    { draw: 3, number: 15.44, winner: '@MoonShot', amount: 10200, rolledOver: false },
    { draw: 4, number: 63.17, winner: '@CryptoKing', amount: 6800, rolledOver: false },
    { draw: 5, number: 29.55, rolledOver: true },
  ],
  distributed: 59500,
  rolled: 25500,
  burned: 12750,
};

const PreviousDrawResults = (props?: Partial<PreviousDrawResultsProps>) => {
  const data = { ...MOCK_RESULTS, ...props };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h4 className="font-display font-bold text-sm">📋 Previous Draw Results — W{data.week}</h4>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {data.date} · {data.pool.toLocaleString()} PNGWIN · 5 draws
        </div>
      </div>

      <div className="divide-y divide-border/50">
        {data.draws.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.08 }}
            className="px-4 py-2.5 flex items-center gap-3 text-[12px]"
          >
            <span className="font-mono font-bold text-primary w-6">D{d.draw}</span>
            <span className="font-mono font-bold flex-1">{d.number.toFixed(2)}</span>
            {d.rolledOver ? (
              <>
                <span className="text-pngwin-orange">No match</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-pngwin-orange/10 text-pngwin-orange">
                  ↻ Rolled
                </span>
              </>
            ) : (
              <>
                <span className="text-pngwin-green">
                  {d.winner} +{d.amount?.toLocaleString()}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-pngwin-green/10 text-pngwin-green">
                  ✓ Won
                </span>
              </>
            )}
          </motion.div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-border flex gap-4 text-[10px] font-semibold">
        <span className="text-pngwin-green">Distributed: {data.distributed?.toLocaleString()}</span>
        <span className="text-pngwin-orange">Rolled: {data.rolled?.toLocaleString()}</span>
        <span className="text-pngwin-red">Burned: {data.burned?.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default PreviousDrawResults;
