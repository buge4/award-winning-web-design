import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface PastInstance {
  id: string;
  status: string;
  totalBids: number;
  uniqueBidders: number;
  prizePool: number;
  burnedAmount: number;
  winnerId: string | null;
  winnerUsername: string | null;
  winningAmount: number | null;
  actualEnd: string | null;
  index: number;
}

interface PastAuctionHistoryProps {
  configId: string;
  configName: string;
  currentInstanceId: string;
}

const PastAuctionHistory = ({ configId, configName, currentInstanceId }: PastAuctionHistoryProps) => {
  const [history, setHistory] = useState<PastInstance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('auction_instances')
        .select('id, status, total_bids, unique_bidders, prize_pool, burned_amount, winner_id, winning_amount, actual_end')
        .eq('config_id', configId)
        .in('status', ['resolved', 'closed'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (data && data.length > 0) {
        // Try to get winner usernames
        const winnerIds = data.filter((r: any) => r.winner_id).map((r: any) => r.winner_id);
        let usernameMap: Record<string, string> = {};
        if (winnerIds.length > 0) {
          const { data: users } = await supabase
            .from('users')
            .select('id, username')
            .in('id', winnerIds);
          if (users) {
            users.forEach((u: any) => { usernameMap[u.id] = u.username; });
          }
        }

        setHistory(data.map((r: any, i: number) => ({
          id: r.id,
          status: r.status,
          totalBids: r.total_bids ?? 0,
          uniqueBidders: r.unique_bidders ?? 0,
          prizePool: Number(r.prize_pool ?? 0),
          burnedAmount: Number(r.burned_amount ?? 0),
          winnerId: r.winner_id,
          winnerUsername: r.winner_id ? usernameMap[r.winner_id] ?? `user_${r.winner_id.slice(0, 6)}` : null,
          winningAmount: r.winning_amount ? Number(r.winning_amount) : null,
          actualEnd: r.actual_end,
          index: data.length - i,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [configId]);

  if (loading || history.length === 0) return null;

  const isJackpot = configName.toLowerCase().includes('jackpot');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-8"
    >
      <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-sm" />
        📜 Past Results — {configName}
      </h3>
      <div className="space-y-2">
        {history.map((h) => (
          <Link
            key={h.id}
            to={`/auction/${h.id}`}
            className="block bg-card border border-border rounded-lg px-5 py-3.5 hover:border-border-active transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {isJackpot ? `Week ${h.index}` : `#${h.index}`}
                </span>
                {h.actualEnd && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.actualEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
                <span className="font-mono text-sm font-bold text-primary">
                  {h.prizePool.toLocaleString()} PNGWIN
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {h.totalBids} bids · {h.uniqueBidders} players
                </span>
              </div>
              <div className="flex items-center gap-2">
                {h.winnerUsername ? (
                  <>
                    <span className="text-xs">🏆</span>
                    <span className="text-sm font-semibold text-pngwin-green">@{h.winnerUsername}</span>
                    {h.winningAmount && (
                      <span className="text-xs text-muted-foreground">bid {h.winningAmount.toFixed(2)}</span>
                    )}
                  </>
                ) : (
                  <span className="text-xs text-pngwin-orange font-semibold">
                    {isJackpot ? '❌ No Winner → Rolled Over' : '❌ No Winner'}
                  </span>
                )}
                {h.burnedAmount > 0 && (
                  <span className="text-[10px] text-pngwin-red">🔥 {h.burnedAmount.toLocaleString()}</span>
                )}
                <span className="text-[10px] text-ice ml-1">View →</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
};

export default PastAuctionHistory;
