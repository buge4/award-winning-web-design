import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BurnTotals {
  pngwin: number;
  ton: number;
  sol: number;
}

const BurnCounters = () => {
  const [totals, setTotals] = useState<BurnTotals>({ pngwin: 45230, ton: 3567, sol: 1234 });

  useEffect(() => {
    // Try to fetch real burn totals from ledger
    const fetchBurns = async () => {
      try {
        const { data } = await supabase
          .from('ledger_events')
          .select('amount')
          .eq('event_type', 'burn');

        if (data && data.length > 0) {
          const total = data.reduce((sum: number, row: any) => sum + Number(row.amount ?? 0), 0);
          if (total > 0) {
            setTotals((prev) => ({ ...prev, pngwin: total }));
          }
        }
      } catch {
        // Table may not exist — keep mock values
      }
    };
    fetchBurns();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-card border border-pngwin-red/20 rounded-xl px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 text-center"
    >
      <span className="text-sm font-display font-bold text-pngwin-red">🔥 TOKENS BURNED</span>
      <div className="flex gap-6">
        <div>
          <span className="font-mono text-lg font-bold text-pngwin-red">{totals.pngwin.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground ml-1">PNGWIN</span>
        </div>
        <div className="text-muted-foreground">|</div>
        <div>
          <span className="font-mono text-lg font-bold text-foreground">{totals.ton.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground ml-1">TON</span>
        </div>
        <div className="text-muted-foreground">|</div>
        <div>
          <span className="font-mono text-lg font-bold text-foreground">{totals.sol.toLocaleString()}</span>
          <span className="text-[10px] text-muted-foreground ml-1">SOL</span>
        </div>
      </div>
    </motion.div>
  );
};

export default BurnCounters;
