import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface WinnerEntry {
  username: string;
  prizeWon: number;
  auctionName: string;
  auctionId: string;
}

const RecentWinnersTicker = () => {
  const [winners, setWinners] = useState<WinnerEntry[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('auction_bids')
        .select('bid_amount, user_id, instance_id, users(username), auction_instances(id, prize_pool, auction_configs(name))')
        .eq('is_winning', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setWinners(data.map((r: any) => ({
          username: r.users?.username ?? `user_${String(r.user_id).slice(0, 6)}`,
          prizeWon: Math.floor(Number(r.auction_instances?.prize_pool ?? 0) * 0.55),
          auctionName: r.auction_instances?.auction_configs?.name ?? 'Auction',
          auctionId: r.instance_id,
        })));
      }
    };
    fetch();
  }, []);

  if (winners.length === 0) return null;

  // Double the array for seamless loop
  const doubled = [...winners, ...winners];

  return (
    <div className="bg-card/50 border-y border-border overflow-hidden py-2.5">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: winners.length * 4, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((w, i) => (
          <span key={i} className="text-xs font-medium inline-flex items-center gap-1.5">
            <span>🏆</span>
            <span className="text-pngwin-green font-semibold">@{w.username}</span>
            <span className="text-muted-foreground">won</span>
            <span className="font-mono font-bold text-primary">{w.prizeWon.toLocaleString()}</span>
            <span className="text-muted-foreground">PNGWIN in {w.auctionName}</span>
            <span className="text-muted-foreground mx-2">·</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
};

export default RecentWinnersTicker;
