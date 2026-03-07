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
        // Try fast API first
        const res = await fetch('http://89.167.102.46:3000/api/dashboard/burns');
        if (res.ok) {
          const json = await res.json();
          if (json) {
            setTotals({
              pngwin: Number(json.PNGWIN ?? json.pngwin ?? 0),
              ton: Number(json.TON ?? json.ton ?? 0),
              sol: Number(json.SOL ?? json.sol ?? 0),
            });
            return;
          }
        }
      } catch { /* fallback below */ }

      // Fallback — query from auction_instances burned_amount
      try {
        const { data: instances } = await supabase
          .from('auction_instances')
          .select('burned_amount, burn_total')
          .gt('burned_amount', 0);
        
        if (instances && instances.length > 0) {
          const total = instances.reduce((s: number, r: any) => s + Number(r.burn_total ?? r.burned_amount ?? 0), 0);
          setTotals({ pngwin: total, ton: 0, sol: 0 });
        }
      } catch { /* keep zeros */ }
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
