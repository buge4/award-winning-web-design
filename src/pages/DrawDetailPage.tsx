import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { DRAW_HISTORY } from '@/data/drawHistory';
import SocialCircleBonusTable from '@/components/SocialCircleBonusTable';
import { DRAW_SOCIAL_BONUSES } from '@/data/socialCircleMock';

const DrawDetailPage = () => {
  const { weekNumber } = useParams();
  const draw = DRAW_HISTORY.find(d => d.week === Number(weekNumber));

  if (!draw || draw.status !== 'completed') {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎲</div>
          <h1 className="font-display text-2xl font-bold mb-2">Draw Not Found</h1>
          <p className="text-muted-foreground mb-4">This draw doesn't exist or hasn't happened yet.</p>
          <Link to="/draws" className="text-ice hover:text-ice/80 text-sm font-semibold">← Back to Draw History</Link>
        </div>
      </div>
    );
  }

  const winnersCount = draw.draws.filter(d => d.winner).length;
  const heatmapLabels = ['00-09', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99'];
  const maxHeat = Math.max(...draw.burnHeatmap);

  // Rollover chain from all completed draws
  const allDraws = DRAW_HISTORY.filter(d => d.week <= draw.week).sort((a, b) => a.week - b.week);
  const maxPoolInChain = Math.max(...allDraws.map(d => d.prizePool));

  const stats = [
    { label: 'Total Prize Pool', value: `${draw.prizePool.toLocaleString()} PNGWIN`, color: 'text-primary' },
    { label: 'Total Participants', value: draw.participants.toLocaleString(), color: 'text-ice' },
    { label: 'Total Bids Placed', value: draw.totalBids.toLocaleString(), color: 'text-foreground' },
    { label: 'Unique Bids (alive)', value: draw.uniqueBids.toLocaleString(), color: 'text-pngwin-green' },
    { label: 'Burned Values', value: `${draw.burnedValues} / ${draw.totalValues.toLocaleString()}`, color: 'text-pngwin-red' },
    { label: 'Distributed to Winners', value: `${draw.totalDistributed.toLocaleString()} PNGWIN`, color: 'text-pngwin-green' },
    { label: 'Rolled to Next Week', value: `${draw.totalRolled.toLocaleString()} PNGWIN`, color: 'text-pngwin-red' },
    { label: 'Tokens Burned (15%)', value: `${draw.tokensBurned.toLocaleString()} PNGWIN`, color: 'text-pngwin-orange' },
    { label: 'Social Circle Bonuses', value: `${draw.socialBonuses.toLocaleString()} PNGWIN`, color: 'text-ice' },
    { label: 'Jackpot Feed', value: `${draw.jackpotFeed.toLocaleString()} PNGWIN`, color: 'text-pngwin-purple' },
    { label: 'Platform Revenue', value: `${draw.platformRevenue.toLocaleString()} PNGWIN`, color: 'text-muted-foreground' },
  ];

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-4xl">
        <Link to="/draws" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          ← Back to Draw History
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="text-xs text-ice uppercase tracking-[4px] mb-2 font-semibold">🎲 JACKPOT RNG DRAW</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Week {draw.week} — {draw.date}</h1>
          <div className="font-mono text-3xl font-bold text-primary">{draw.prizePool.toLocaleString()} PNGWIN</div>
          <div className="text-sm text-muted-foreground mt-2">{winnersCount} of 5 prizes claimed</div>
        </motion.div>

        {/* The 5 Draws — Big digit boxes */}
        <div className="space-y-4 mb-10">
          {draw.draws.map((d, i) => (
            <motion.div
              key={d.prizeNumber}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`bg-card border rounded-xl p-5 ${d.winner ? 'border-pngwin-green/20' : 'border-pngwin-red/20'}`}
            >
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="text-xs text-muted-foreground uppercase tracking-wider shrink-0 w-20 text-center">
                  Prize #{d.prizeNumber}<br/>
                  <span className="text-primary font-mono text-[10px]">{d.prizePercent}%</span>
                </div>

                {/* Digit boxes */}
                <div className="flex items-center gap-2">
                  {d.targetValue.replace('.', '').split('').map((digit, j) => (
                    <div key={j} className="flex items-center">
                      {j === 2 && <span className="font-mono text-2xl font-bold text-muted-foreground mx-1">.</span>}
                      <div className={`w-12 h-14 rounded-lg flex items-center justify-center font-mono text-2xl font-bold border-2 ${
                        d.winner
                          ? 'border-primary bg-gold-subtle text-primary'
                          : 'border-pngwin-red/30 bg-red-subtle text-pngwin-red'
                      }`}>
                        {digit}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex-1 text-center sm:text-right">
                  {d.winner ? (
                    <>
                      <div className="text-sm font-bold text-ice">{d.winner}</div>
                      <div className="font-mono text-lg font-bold text-pngwin-green">+{d.winAmount.toLocaleString()} PNGWIN</div>
                      <div className="text-[10px] text-muted-foreground">{d.distance}</div>
                    </>
                  ) : (
                    <div className="text-sm text-pngwin-red font-semibold">No winner — Rolled over</div>
                  )}
                </div>
              </div>

              {/* Social Circle Bonus — collapsible per winner */}
              {d.winner && DRAW_SOCIAL_BONUSES[d.winner] && (
                <div className="mt-2 ml-20 mr-4">
                  <SocialCircleBonusTable
                    winnerName={d.winner}
                    prizeAmount={d.winAmount}
                    entries={DRAW_SOCIAL_BONUSES[d.winner]}
                    compact
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Winners List */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h3 className="font-display font-bold text-base mb-4">Winners</h3>
          <div className="space-y-2">
            {draw.draws.map((d) => (
              <div key={d.prizeNumber} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{medals[d.prizeNumber - 1]}</span>
                <span className="text-muted-foreground">Prize #{d.prizeNumber}:</span>
                {d.winner ? (
                  <>
                    <span className="font-bold text-ice">{d.winner}</span>
                    <span className="text-muted-foreground">— bid</span>
                    <span className="font-mono font-bold">{d.targetValue}</span>
                    <span className="text-muted-foreground">— won</span>
                    <span className="font-mono font-bold text-pngwin-green">{d.winAmount.toLocaleString()} PNGWIN</span>
                    {d.distance && <span className="text-[10px] text-muted-foreground">({d.distance})</span>}
                  </>
                ) : (
                  <span className="text-pngwin-red font-semibold">NO WINNER — rolled over</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h3 className="font-display font-bold text-base mb-4">Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.map((stat, i) => (
              <div key={i} className="flex justify-between py-2 px-3 bg-background rounded-md">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className={`font-mono text-xs font-bold ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rollover Chain */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h3 className="font-display font-bold text-base mb-4">Rollover Chain</h3>
          <div className="flex items-end gap-3 overflow-x-auto pb-2">
            {allDraws.map((d, i) => (
              <div key={d.week} className="flex flex-col items-center min-w-[60px]">
                <div
                  className={`w-12 rounded-t-md ${d.week === draw.week ? 'bg-primary' : 'bg-muted'}`}
                  style={{ height: `${Math.max(20, (d.prizePool / maxPoolInChain) * 120)}px` }}
                />
                <div className="w-12 bg-card border border-border rounded-b-md p-1 text-center">
                  <div className="text-[9px] text-muted-foreground">W{d.week}</div>
                  <div className={`font-mono text-[10px] font-bold ${d.week === draw.week ? 'text-primary' : 'text-foreground'}`}>
                    {(d.prizePool / 1000).toFixed(0)}k
                  </div>
                </div>
                {i < allDraws.length - 1 && (
                  <div className="text-muted-foreground text-[8px] mt-0.5">
                    {d.draws.filter(x => x.winner).length}W / {d.draws.filter(x => !x.winner).length}R
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Burn Heatmap */}
        <div className="bg-card border border-border rounded-xl p-5 mb-8">
          <h3 className="font-display font-bold text-base mb-4">🔥 Burn Heatmap</h3>
          <div className="space-y-2">
            {heatmapLabels.map((label, i) => {
              const pct = draw.burnHeatmap[i];
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground w-12">{label}</span>
                  <div className="flex-1 h-5 bg-background rounded-sm overflow-hidden">
                    <motion.div
                      className="h-full rounded-sm bg-gradient-to-r from-pngwin-red/40 to-pngwin-red"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(pct / maxHeat) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: i * 0.04 }}
                    />
                  </div>
                  <span className="font-mono text-xs text-pngwin-red w-10 text-right">{pct}%</span>
                  {pct === maxHeat && <span className="text-[9px] text-pngwin-red">🔥 HOT</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link to={`/draws/${draw.week}/replay`} className="px-5 py-2.5 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors">
            🎬 Replay This Draw
          </Link>
          <Link to="/auction/rng-1" className="px-5 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold">
            Enter This Week's Jackpot →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DrawDetailPage;
