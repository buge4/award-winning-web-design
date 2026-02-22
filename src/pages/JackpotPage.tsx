import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KpiCard from '@/components/KpiCard';
import JackpotCounter from '@/components/JackpotCounter';
import { useJackpotHistory } from '@/hooks/useAuctions';

const MOCK_JACKPOT = {
  current: 125000,
  week: 4,
  history: [
    { week: 1, pool: 5000, winner: null, rolled: 5000 },
    { week: 2, pool: 15000, winner: null, rolled: 15000 },
    { week: 3, pool: 45000, winner: null, rolled: 45000 },
    { week: 4, pool: 125000, winner: null, rolled: 0 },
  ],
  prizes: [
    { pos: 1, pct: 50 },
    { pos: 2, pct: 25 },
    { pos: 3, pct: 12 },
    { pos: 4, pct: 8 },
    { pos: 5, pct: 5 },
  ],
};

const JackpotPage = () => {
  const { history: dbHistory, loading } = useJackpotHistory();
  const history = Array.isArray(dbHistory) && dbHistory.length > 0 ? dbHistory : MOCK_JACKPOT.history;
  const currentPool = MOCK_JACKPOT.current;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-bold mb-6">🎰 Jackpot HUBA</h1>

        {/* Main Jackpot Counter */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-gold/30 rounded-xl p-10 text-center mb-8 glow-gold"
        >
          <div className="text-xs text-muted-foreground uppercase tracking-[3px] mb-4">Current Jackpot Pool</div>
          <JackpotCounter amount={currentPool} />
          <div className="text-sm text-muted-foreground mt-4">
            Week {MOCK_JACKPOT.week} — {MOCK_JACKPOT.week - 1} consecutive rollovers
          </div>
          <Link
            to="/auctions"
            className="inline-block mt-6 px-8 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold"
          >
            Enter Jackpot Auction →
          </Link>
        </motion.div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Current Pool" value={currentPool.toLocaleString()} color="gold" />
          <KpiCard label="Week" value={MOCK_JACKPOT.week} color="ice" />
          <KpiCard label="Rollovers" value={MOCK_JACKPOT.week - 1} color="red" />
          <KpiCard label="Prize Positions" value={5} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prize Distribution */}
          <div className="bg-card border border-ice/20 rounded-lg p-6 glow-ice">
            <h2 className="font-display font-bold text-lg mb-4">🎲 5 Prizes to Win</h2>
            <div className="space-y-2">
              {MOCK_JACKPOT.prizes.map(p => (
                <div key={p.pos} className="flex items-center justify-between py-3 px-4 bg-background rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-ice">#{p.pos}</span>
                    <span className="text-xs text-muted-foreground">({p.pct}%)</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-primary">
                    {Math.floor(currentPool * p.pct / 100).toLocaleString()} PNGWIN
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rollover History */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-display font-bold text-lg mb-4">📈 Rollover History</h2>
            {loading ? (
              <div className="text-muted-foreground text-sm">Loading...</div>
            ) : (
              <>
                <div className="flex items-end gap-2 mb-4 justify-center h-32">
                  {history.map((h: any, i: number) => {
                    const maxPool = Math.max(...history.map((x: any) => x.pool ?? x.amount ?? 0));
                    const pool = h.pool ?? h.amount ?? 0;
                    const height = maxPool > 0 ? (pool / maxPool) * 100 : 10;
                    const isLatest = i === history.length - 1;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-full max-w-10 rounded-t-md ${isLatest ? 'bg-primary' : 'bg-muted'}`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                        />
                        <div className="text-[9px] text-muted-foreground mt-1">W{h.week ?? i + 1}</div>
                        <div className="text-[8px] text-muted-foreground">{((pool) / 1000).toFixed(0)}k</div>
                        {h.winner ? (
                          <span className="text-[8px] text-pngwin-green font-semibold">WON</span>
                        ) : (
                          <span className="text-[8px] text-pngwin-red">Rolled</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* How Jackpot Works */}
        <div className="bg-card border border-border rounded-lg p-6 mt-6">
          <h2 className="font-display font-bold text-lg mb-4">How the Jackpot Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: '🎰', title: 'Sealed Bids', desc: 'All bids are hidden until the draw.' },
              { icon: '🎲', title: 'RNG Draw', desc: '5 random target values are generated.' },
              { icon: '📏', title: 'Closest Wins', desc: 'The closest unique bid to each target wins.' },
              { icon: '🔄', title: 'Rollover', desc: "If no exact match, the prize rolls to next week." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-4"
              >
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-display font-bold text-sm mb-1">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JackpotPage;
