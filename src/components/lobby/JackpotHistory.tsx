import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useJackpotDrawHistory } from '@/hooks/useAuctionResults';

const MOCK_HISTORY = [
  { week: 4, date: 'Feb 22, 2026', prizePool: 110000, winner: null, winnerAmount: 0, instanceId: '' },
  { week: 3, date: 'Feb 15, 2026', prizePool: 75000, winner: '@DiamondHands', winnerAmount: 42500, instanceId: '' },
  { week: 2, date: 'Feb 8, 2026', prizePool: 50000, winner: null, winnerAmount: 0, instanceId: '' },
  { week: 1, date: 'Feb 1, 2026', prizePool: 25000, winner: '@WhaleAlert', winnerAmount: 13750, instanceId: '' },
];

const JackpotHistory = () => {
  const { history: dbHistory, loading } = useJackpotDrawHistory();
  const history = dbHistory.length > 0 ? dbHistory : MOCK_HISTORY;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-10"
    >
      <h3 className="font-display font-bold text-base uppercase tracking-wider text-muted-foreground mb-4 text-center">
        📜 Previous Draws
      </h3>
      <div className="max-w-2xl mx-auto space-y-2">
        {loading ? (
          <div className="text-center text-muted-foreground text-sm py-4">Loading history...</div>
        ) : (
          history.map((h) => (
            <div
              key={h.week}
              className="bg-card border border-border rounded-lg px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-muted-foreground w-10">W{h.week}</span>
                <span className="text-xs text-muted-foreground">{h.date}</span>
                <span className="font-mono text-sm font-bold text-primary">
                  {h.prizePool.toLocaleString()} PNGWIN
                </span>
              </div>
              <div className="flex items-center gap-2">
                {h.winner ? (
                  <>
                    <span className="text-xs">🏆</span>
                    <span className="text-sm font-semibold text-pngwin-green">{h.winner}</span>
                    <span className="text-xs text-muted-foreground">(+{h.winnerAmount.toLocaleString()})</span>
                  </>
                ) : (
                  <span className="text-xs text-pngwin-orange font-semibold">❌ No Winner → Rolled Over</span>
                )}
                {h.instanceId && (
                  <Link
                    to={`/auction/${h.instanceId}`}
                    className="text-[10px] text-ice hover:text-ice/80 ml-2"
                  >
                    View →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default JackpotHistory;
