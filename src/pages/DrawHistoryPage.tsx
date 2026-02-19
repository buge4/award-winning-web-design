import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DRAW_HISTORY } from '@/data/drawHistory';

const DrawHistoryPage = () => {
  const completedDraws = DRAW_HISTORY.filter(d => d.status === 'completed');
  const latestDraw = completedDraws[0];
  const upcomingDraw = DRAW_HISTORY.find(d => d.status === 'upcoming');

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="text-xs text-ice uppercase tracking-[4px] mb-3 font-semibold">🎲 Every Saturday at 20:00 UTC</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-3">Lucky Number Draw History</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">5 prizes, 1 lucky number per draw. If your unique bid matches — you win.</p>
        </div>

        {/* Next Draw Banner */}
        {upcomingDraw && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-gold/20 rounded-xl p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 glow-gold"
          >
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Next Draw — Week {upcomingDraw.week}</div>
              <div className="font-display font-bold text-lg">{upcomingDraw.date}</div>
              <div className="font-mono text-2xl font-bold text-primary">{upcomingDraw.prizePool.toLocaleString()} PNGWIN</div>
            </div>
            <div className="flex gap-2">
              <Link to="/auction/demo/draw" className="px-4 py-2 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors">
                🎬 Watch Demo
              </Link>
              <Link to="/auction/rng-1" className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold">
                Enter Jackpot →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Latest Draw (Featured) */}
        {latestDraw && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-ice/20 rounded-xl overflow-hidden mb-8"
          >
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <div className="text-xs text-ice font-semibold uppercase tracking-wider">Latest Draw</div>
                <div className="font-display font-bold text-lg">Week {latestDraw.week} — {latestDraw.date}</div>
              </div>
              <div className="font-mono text-xl font-bold text-primary">{latestDraw.prizePool.toLocaleString()} PNGWIN</div>
            </div>

            {/* Draw Results */}
            <div className="divide-y divide-border/50">
              {latestDraw.draws.map((draw) => (
                <div key={draw.prizeNumber} className={`px-6 py-3 flex items-center justify-between ${draw.winner ? 'bg-green-subtle' : 'bg-red-subtle'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{draw.winner ? '✅' : '❌'}</span>
                    <div>
                      <span className="text-xs text-muted-foreground">Draw #{draw.prizeNumber}</span>
                      <div className="font-mono text-lg font-bold">{draw.targetValue}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {draw.winner ? (
                      <>
                        <div className="text-sm font-bold text-ice">{draw.winner}</div>
                        <div className="font-mono text-sm text-pngwin-green font-bold">+{draw.winAmount.toLocaleString()} PNGWIN</div>
                      </>
                    ) : (
                      <span className="text-sm text-pngwin-red font-semibold">Rolled Over</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Row */}
            <div className="px-6 py-4 border-t border-border flex flex-wrap gap-4 justify-between text-sm">
              <div><span className="text-muted-foreground">Distributed:</span> <span className="font-mono font-bold text-pngwin-green">{latestDraw.totalDistributed.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Rolled:</span> <span className="font-mono font-bold text-pngwin-red">{latestDraw.totalRolled.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Burned:</span> <span className="font-mono font-bold text-pngwin-orange">{latestDraw.tokensBurned.toLocaleString()}</span></div>
            </div>

            <div className="px-6 py-3 border-t border-border flex justify-between items-center">
              <Link to={`/draws/${latestDraw.week}`} className="text-sm text-ice hover:text-ice/80 font-semibold transition-colors">
                View Full Results →
              </Link>
              <Link to={`/draws/${latestDraw.week}/replay`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                🎬 Replay This Draw
              </Link>
            </div>
          </motion.div>
        )}

        {/* Past Draws */}
        <h2 className="font-display text-xl font-bold mb-4">Past Draws</h2>
        <div className="space-y-3">
          {completedDraws.slice(1).map((draw, i) => (
            <motion.div
              key={draw.week}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
              className="bg-card border border-border rounded-lg overflow-hidden"
            >
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-display font-bold text-base">Week {draw.week} — {draw.date}</div>
                    <div className="font-mono text-sm font-bold text-primary">{draw.prizePool.toLocaleString()} PNGWIN</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {draw.draws.filter(d => d.winner).length}/5 prizes claimed
                  </div>
                </div>

                {/* Mini draw results */}
                <div className="flex gap-2 flex-wrap mb-3">
                  {draw.draws.map((d) => (
                    <div key={d.prizeNumber} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${d.winner ? 'bg-green-subtle' : 'bg-red-subtle'}`}>
                      <span className="font-mono font-bold">{d.targetValue}</span>
                      <span>{d.winner ? `→ ${d.winner}` : '→ Rolled'}</span>
                    </div>
                  ))}
                </div>

                {/* Quick stats */}
                <div className="flex gap-3 flex-wrap text-[10px] text-muted-foreground">
                  <span>{draw.participants} participants</span>
                  <span>•</span>
                  <span>{draw.totalBids.toLocaleString()} bids</span>
                  <span>•</span>
                  <span>{draw.uniqueBids.toLocaleString()} unique</span>
                  <span>•</span>
                  <span>{draw.burnedValues} burned</span>
                  <span>•</span>
                  <span className="text-pngwin-green">{draw.totalDistributed.toLocaleString()} distributed</span>
                  <span>•</span>
                  <span className="text-pngwin-red">{draw.totalRolled.toLocaleString()} rolled</span>
                </div>
              </div>

              <div className="px-5 py-2 border-t border-border/50 flex justify-between">
                <Link to={`/draws/${draw.week}`} className="text-xs text-ice hover:text-ice/80 font-semibold transition-colors">
                  Full Results →
                </Link>
                <Link to={`/draws/${draw.week}/replay`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  🎬 Replay
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DrawHistoryPage;
