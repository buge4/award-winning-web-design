import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KpiCard from '@/components/KpiCard';
import JackpotCounter from '@/components/JackpotCounter';
import { supabase } from '@/lib/supabase';

const PRIZES = [
  { pos: 1, pct: 50 },
  { pos: 2, pct: 25 },
  { pos: 3, pct: 12 },
  { pos: 4, pct: 8 },
  { pos: 5, pct: 5 },
];

const JackpotPage = () => {
  const [activeInstance, setActiveInstance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJackpot = async () => {
      // Find the active jackpot instance by joining config where auction_type = 'jackpot'
      const { data: active } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .eq('auction_configs.auction_type', 'jackpot')
        .in('status', ['accumulating', 'hot_mode', 'grace_period'])
        .order('created_at', { ascending: false })
        .limit(1);

      // Fallback: query all instances and filter client-side
      let jackpotInstance = active?.find((r: any) => r.auction_configs?.auction_type === 'jackpot');

      if (!jackpotInstance) {
        // Try broader query
        const { data: allInstances } = await supabase
          .from('auction_instances')
          .select('*, auction_configs(*)')
          .in('status', ['accumulating', 'hot_mode', 'grace_period'])
          .order('created_at', { ascending: false })
          .limit(50);
        jackpotInstance = allInstances?.find((r: any) => r.auction_configs?.auction_type === 'jackpot');
      }

      if (jackpotInstance) {
        setActiveInstance(jackpotInstance);

        // Fetch history for this config
        const configId = jackpotInstance.auction_configs?.id ?? jackpotInstance.config_id;
        if (configId) {
          const { data: hist } = await supabase
            .from('auction_instances')
            .select('id, status, prize_pool, created_at, winner_id, actual_end')
            .eq('config_id', configId)
            .order('created_at', { ascending: true })
            .limit(20);

          if (hist) {
            setHistory(hist.map((r: any, i: number) => ({
              week: i + 1,
              pool: Number(r.prize_pool ?? 0),
              winner: r.winner_id ? true : null,
              instanceId: r.id,
            })));
          }
        }
      }
      setLoading(false);
    };
    fetchJackpot();
  }, []);

  const config = activeInstance?.auction_configs ?? {};
  const currentPool = Number(activeInstance?.prize_pool ?? 0);
  const totalBids = Number(activeInstance?.total_bids ?? 0);
  const instanceId = activeInstance?.id;

  // Count consecutive rollovers (no winner) from end of history
  const rollovers = history.reduce((count, h) => (!h.winner ? count + 1 : 0), 0);
  const currentWeek = history.length || 1;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-4xl">
        <h1 className="font-display text-3xl font-bold mb-6">🎰 Jackpot HUBA</h1>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading jackpot data...</div>
        ) : !activeInstance ? (
          <div className="text-center py-20">
            <div className="text-2xl mb-4">🎰</div>
            <div className="text-muted-foreground text-sm mb-4">No active jackpot auction found.</div>
            <Link to="/auctions" className="text-ice text-sm font-semibold hover:text-ice/80">
              Browse all auctions →
            </Link>
          </div>
        ) : (
          <>
            {/* Main Jackpot Counter */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-gold/30 rounded-xl p-10 text-center mb-8 glow-gold"
            >
              <div className="text-xs text-muted-foreground uppercase tracking-[3px] mb-4">Current Jackpot Pool</div>
              <JackpotCounter amount={currentPool} />
              <div className="text-sm text-muted-foreground mt-4">
                Week {currentWeek} — {rollovers > 0 ? `${rollovers} consecutive rollover${rollovers > 1 ? 's' : ''}` : 'First week'}
              </div>
              <Link
                to={`/auction/${instanceId}`}
                className="inline-block mt-6 px-8 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold"
              >
                Enter Jackpot Auction →
              </Link>
            </motion.div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              <KpiCard label="Current Pool" value={currentPool.toLocaleString()} color="gold" />
              <KpiCard label="Week" value={currentWeek} color="ice" />
              <KpiCard label="Total Bids" value={totalBids} color="green" />
              <KpiCard label="Rollovers" value={rollovers} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Prize Distribution */}
              <div className="bg-card border border-ice/20 rounded-lg p-6 glow-ice">
                <h2 className="font-display font-bold text-lg mb-4">🎲 5 Prizes to Win</h2>
                <div className="space-y-2">
                  {PRIZES.map(p => (
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
                {history.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No history yet.</div>
                ) : (
                  <div className="flex items-end gap-2 mb-4 justify-center h-32">
                    {history.map((h, i) => {
                      const maxPool = Math.max(...history.map(x => x.pool));
                      const height = maxPool > 0 ? (h.pool / maxPool) * 100 : 10;
                      const isLatest = i === history.length - 1;
                      return (
                        <Link key={i} to={`/auction/${h.instanceId}`} className="flex flex-col items-center flex-1 hover:opacity-80 transition-opacity">
                          <div
                            className={`w-full max-w-10 rounded-t-md ${isLatest ? 'bg-primary' : 'bg-muted'}`}
                            style={{ height: `${Math.max(height, 5)}%` }}
                          />
                          <div className="text-[9px] text-muted-foreground mt-1">W{h.week}</div>
                          <div className="text-[8px] text-muted-foreground">{(h.pool / 1000).toFixed(0)}k</div>
                          {h.winner ? (
                            <span className="text-[8px] text-pngwin-green font-semibold">WON</span>
                          ) : (
                            <span className="text-[8px] text-pngwin-red">Rolled</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default JackpotPage;
