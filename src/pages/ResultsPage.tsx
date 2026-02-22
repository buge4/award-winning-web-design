import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuctionHistory } from '@/hooks/useAuctions';
import { COMPLETED_AUCTIONS } from '@/data/drawHistory';

const TYPE_ICONS: Record<string, string> = {
  live_before_hot: '🎯',
  timed: '⏱️',
  blind_count: '🙈',
  blind_timed: '🙈',
  free: '🎁',
  jackpot: '🎰',
};

const ResultsPage = () => {
  const { auctions: dbResults, loading } = useAuctionHistory();
  const results = dbResults.length > 0 ? dbResults : COMPLETED_AUCTIONS;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🏆 Auction Results</h1>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading results...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No resolved auctions yet.</div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-lg p-5 hover:border-border-active transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{TYPE_ICONS[r.type] || '🎯'}</span>
                      <span className="font-display font-bold text-base">{r.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase bg-pngwin-green/15 text-pngwin-green border border-pngwin-green/20">
                        RESOLVED
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.date}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-ice">{r.winner}</div>
                    <div className="font-mono text-xs text-muted-foreground">winning bid: {r.winningBid}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  <span>🏆 <span className="font-mono font-bold text-pngwin-green">{r.prizeWon.toLocaleString()} PNGWIN</span></span>
                  <span>•</span>
                  <span>{r.players} players</span>
                  <span>•</span>
                  <span>{r.totalBids} bids</span>
                  <span>•</span>
                  <span className="text-pngwin-green">{r.uniqueBids} unique</span>
                  <span>•</span>
                  <span className="text-pngwin-red">{r.burnedBids} burned</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="text-center py-6">
          <Link to="/draws" className="text-sm text-ice hover:text-ice/80 font-semibold transition-colors">
            🎲 View RNG Draw History →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
