import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface LevelCount {
  level: number;
  count: number;
}

const ReferralSummary = ({ userId, totalReferrals }: { userId: string; totalReferrals: number }) => {
  const [levels, setLevels] = useState<LevelCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Count L1-L5 referrals by checking upline fields
      const counts: LevelCount[] = [];
      
      for (let l = 1; l <= 5; l++) {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq(`upline_${l}`, userId);
        counts.push({ level: l, count: count ?? 0 });
      }
      
      setLevels(counts);
      setLoading(false);
    };
    load();
  }, [userId]);

  const directCount = levels[0]?.count ?? 0;
  const deeperCount = totalReferrals - levels.reduce((a, c) => a + c.count, 0);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm">👥 Referrals</h3>
        <span className="font-mono text-lg font-bold text-primary">{totalReferrals}</span>
      </div>

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading breakdown...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {levels.map((l) => (
              <div key={l.level} className="px-3 py-1.5 bg-secondary rounded-lg text-center min-w-[60px]">
                <div className="text-[9px] text-muted-foreground">L{l.level}</div>
                <div className="font-mono text-sm font-bold">{l.count}</div>
              </div>
            ))}
            {deeperCount > 0 && (
              <div className="px-3 py-1.5 bg-secondary rounded-lg text-center min-w-[60px]">
                <div className="text-[9px] text-muted-foreground">Deeper</div>
                <div className="font-mono text-sm font-bold">{deeperCount}</div>
              </div>
            )}
          </div>

          <Link
            to={`/social`}
            className="block w-full text-center py-2 bg-primary/10 text-primary rounded-lg text-xs font-display font-bold hover:bg-primary/20 transition-colors"
          >
            View Full Referral Tree →
          </Link>
        </>
      )}
    </div>
  );
};

export default ReferralSummary;
