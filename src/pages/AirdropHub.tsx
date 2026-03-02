import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface Campaign {
  id: string;
  name: string;
  partner: string;
  token_symbol: string;
  total_pool: number;
  distributed: number;
  status: string;
}

const AirdropHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [yaucBalance, setYaucBalance] = useState(0);

  useEffect(() => {
    supabase.from('airdrop_campaigns').select('*').eq('status', 'active')
      .then(({ data }) => { setCampaigns((data ?? []) as Campaign[]); setLoading(false); });
    if (user) {
      supabase.from('wallets').select('balance').eq('user_id', user.id).eq('project_slug', 'auction').eq('currency', 'YAUC').single()
        .then(({ data }) => { if (data) setYaucBalance(Number(data.balance)); });
    }
  }, [user]);

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🎟</div>
          <h1 className="font-display text-3xl font-bold">Airdrop Hub</h1>
          <p className="text-sm text-muted-foreground mt-2">Earn free tokens by completing tasks and playing auctions</p>
        </div>

        {/* YAUC Balance Card */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-pngwin-purple/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Your YAUC Balance</div>
                <div className="font-mono text-3xl font-bold text-pngwin-purple">🎟 {yaucBalance.toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => navigate('/airdrop/tasks')}
                  className="px-4 py-2 bg-pngwin-purple/10 text-pngwin-purple border border-pngwin-purple/30 rounded-lg text-xs font-bold hover:bg-pngwin-purple/20 transition-colors">
                  📋 View Tasks
                </button>
                <button onClick={() => navigate('/airdrop/yauc')}
                  className="px-4 py-2 bg-pngwin-purple/10 text-pngwin-purple border border-pngwin-purple/30 rounded-lg text-xs font-bold hover:bg-pngwin-purple/20 transition-colors">
                  ℹ️ About YAUC
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Campaigns */}
        <h2 className="font-display font-bold text-lg mb-4">🔥 Active Campaigns</h2>
        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading campaigns...</div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🪂</div>
            <div className="text-muted-foreground text-sm">No active campaigns right now. Check back soon!</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((c, i) => {
              const pct = c.total_pool > 0 ? (c.distributed / c.total_pool) * 100 : 0;
              return (
                <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-card border border-border rounded-xl p-5 hover:border-pngwin-purple/40 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-bold">{c.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-pngwin-green/20 text-pngwin-green">ACTIVE</span>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">{c.partner} • 🎟 {c.token_symbol}</div>
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-muted-foreground">Pool</span>
                    <span className="font-mono font-semibold">{c.total_pool.toLocaleString()} {c.token_symbol}</span>
                  </div>
                  <div className="w-full bg-background rounded-full h-2.5 overflow-hidden mb-1">
                    <div className="h-full bg-gradient-to-r from-pngwin-purple to-pngwin-purple/50 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{pct.toFixed(1)}% distributed</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropHub;
