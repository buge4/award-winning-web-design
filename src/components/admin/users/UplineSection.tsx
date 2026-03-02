import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UplineUser {
  level: number;
  userId: string | null;
  username: string | null;
  isActive: boolean;
  pct: string;
}

const LEVEL_PCTS = ['40%', '25%', '15%', '12%', '8%'];

const UplineSection = ({ user }: { user: any }) => {
  const [upline, setUpline] = useState<UplineUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUpline = async () => {
      const ids: (string | null)[] = [
        user.upline_1 ?? null,
        user.upline_2 ?? null,
        user.upline_3 ?? null,
        user.upline_4 ?? null,
        user.upline_5 ?? null,
      ];

      const validIds = ids.filter(Boolean) as string[];
      let userMap: Record<string, any> = {};

      if (validIds.length > 0) {
        const { data } = await supabase
          .from('users')
          .select('id, username, is_banned')
          .in('id', validIds);
        (data ?? []).forEach((u: any) => { userMap[u.id] = u; });
      }

      const result: UplineUser[] = ids.map((id, i) => ({
        level: i + 1,
        userId: id,
        username: id ? (userMap[id]?.username ?? '—') : null,
        isActive: id ? !(userMap[id]?.is_banned ?? false) : false,
        pct: LEVEL_PCTS[i],
      }));

      setUpline(result);
      setLoading(false);
    };

    loadUpline();
  }, [user]);

  const hasUpline = upline.some(u => u.userId);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-4">
      <h3 className="font-display font-bold text-sm mb-1">👆 My Upline</h3>
      <p className="text-[10px] text-muted-foreground mb-3">These people earn bonuses when this user wins</p>

      {loading ? (
        <div className="text-xs text-muted-foreground">Loading upline...</div>
      ) : !hasUpline ? (
        <div className="text-xs text-muted-foreground italic px-3 py-2 bg-secondary rounded-lg">
          No upline — this user has no referrer
        </div>
      ) : (
        <div className="space-y-1.5">
          {upline.map((u) => (
            <div key={u.level} className="flex items-center gap-3 px-3 py-2 bg-secondary rounded-lg">
              <span className="text-[10px] font-mono text-muted-foreground w-6">L{u.level}</span>
              {u.userId ? (
                <>
                  <span className="text-sm font-semibold text-ice">@{u.username}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    u.isActive ? 'bg-pngwin-green/15 text-pngwin-green' : 'bg-pngwin-red/15 text-pngwin-red'
                  }`}>
                    {u.isActive ? '✅ Active' : '❌ Inactive'}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">→ Gets {u.pct} of social pool</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground/40 italic">(empty)</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UplineSection;
