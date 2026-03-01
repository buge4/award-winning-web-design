import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BurnTotals {
  pngwin: number;
  ton: number;
  sol: number;
}

const BurnCounters = () => {
  const [totals, setTotals] = useState<BurnTotals>({ pngwin: 0, ton: 0, sol: 0 });

  useEffect(() => {
    const fetchBurns = async () => {
      try {
        // Query burn allocations from ledger_allocations (not ledger_events.amount which doesn't exist)
        const { data } = await supabase
          .from('ledger_allocations')
          .select('amount, currency')
          .eq('recipient_type', 'burn');

        if (data && data.length > 0) {
          const byType: Record<string, number> = { PNGWIN: 0, TON: 0, SOL: 0 };
          data.forEach((row: any) => {
            const cur = row.currency ?? 'PNGWIN';
            byType[cur] = (byType[cur] ?? 0) + Number(row.amount ?? 0);
          });
          setTotals({ pngwin: byType.PNGWIN, ton: byType.TON ?? 0, sol: byType.SOL ?? 0 });
        }
      } catch {
        // Fallback — query from auction_instances burned_amount
        try {
          const { data: instances } = await supabase
            .from('auction_instances')
            .select('burned_amount')
            .gt('burned_amount', 0);
          
          if (instances && instances.length > 0) {
            const total = instances.reduce((s: number, r: any) => s + Number(r.burned_amount ?? 0), 0);
            setTotals({ pngwin: total, ton: 0, sol: 0 });
          }
        } catch { /* keep zeros */ }
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
        {totals.ton > 0 && (
          <>
            <div className="text-muted-foreground">|</div>
            <div>
              <span className="font-mono text-lg font-bold text-foreground">{totals.ton.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground ml-1">TON</span>
            </div>
          </>
        )}
        {totals.sol > 0 && (
          <>
            <div className="text-muted-foreground">|</div>
            <div>
              <span className="font-mono text-lg font-bold text-foreground">{totals.sol.toLocaleString()}</span>
              <span className="text-[10px] text-muted-foreground ml-1">SOL</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default BurnCounters;
