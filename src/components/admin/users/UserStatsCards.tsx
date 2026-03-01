import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const UserStatsCards = ({ userId, userDetail }: { userId: string; userDetail: any }) => {
  const [extraStats, setExtraStats] = useState({ totalEarned: 0, socialBonuses: 0, socialMissed: 0 });

  useEffect(() => {
    const load = async () => {
      const [earnedRes, socialRes] = await Promise.all([
        supabase.from('ledger_events')
          .select('gross_amount')
          .eq('user_id', userId)
          .eq('direction', 'IN')
          .eq('source_project', 'auction')
          .in('event_type', ['PRIZE', 'SOCIAL_BONUS']),
        supabase.from('ledger_events')
          .select('gross_amount')
          .eq('user_id', userId)
          .eq('direction', 'IN')
          .eq('event_type', 'SOCIAL_BONUS')
          .eq('source_project', 'auction'),
      ]);

      const totalEarned = (earnedRes.data ?? []).reduce((a: number, e: any) => a + Number(e.gross_amount), 0);
      const socialBonuses = (socialRes.data ?? []).reduce((a: number, e: any) => a + Number(e.gross_amount), 0);

      setExtraStats({ totalEarned, socialBonuses, socialMissed: 0 });
    };
    load();
  }, [userId]);

  const stats = [
    { label: 'Total Bids', value: userDetail?.bids?.length ?? 0, icon: '🎯' },
    { label: 'Wins', value: userDetail?.bids?.filter((b: any) => b.is_winning)?.length ?? 0, icon: '🏆' },
    { label: 'Referrals', value: userDetail?.referrals?.length ?? 0, icon: '👥' },
    { label: 'Transactions', value: userDetail?.ledger?.length ?? 0, icon: '📋' },
    { label: 'Total Earned', value: extraStats.totalEarned.toLocaleString(), icon: '💰', suffix: ' PNGWIN' },
    { label: 'Social Bonuses', value: extraStats.socialBonuses.toLocaleString(), icon: '🤝', suffix: ' PNGWIN' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {stats.map(s => (
        <div key={s.label} className="bg-card border border-border rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm">{s.icon}</span>
            <span className="text-[10px] text-muted-foreground">{s.label}</span>
          </div>
          <div className="font-mono text-lg font-bold">
            {s.value}{s.suffix && <span className="text-[10px] text-muted-foreground">{s.suffix}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserStatsCards;
