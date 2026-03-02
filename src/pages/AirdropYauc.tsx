import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const AirdropYauc = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user.id).eq('project_slug', 'auction').eq('currency', 'YAUC').single(),
      supabase.from('ledger_events').select('*').eq('user_id', user.id).eq('currency', 'YAUC').eq('source_project', 'auction').order('created_at', { ascending: false }).limit(50),
    ]).then(([walletRes, txRes]) => {
      if (walletRes.data) setBalance(Number(walletRes.data.balance));
      setTransactions(txRes.data ?? []);
      setLoading(false);
    });
  }, [user]);

  const features = [
    { icon: '🎁', title: 'Free Auctions', desc: 'Use YAUC to enter free auctions with real crypto prizes' },
    { icon: '📋', title: 'Task Rewards', desc: 'Complete airdrop tasks to earn YAUC tokens' },
    { icon: '🐧', title: 'Referral Bonus', desc: 'Earn YAUC when your circle members are active' },
    { icon: '🎰', title: 'Jackpot Entry', desc: 'YAUC-denominated jackpot auctions with massive pools' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎟</div>
          <h1 className="font-display text-3xl font-bold">YAUC Token</h1>
          <p className="text-sm text-muted-foreground mt-2">YouAuction Coin — The native utility token for Arctic Auction</p>
        </div>

        {/* Balance */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-pngwin-purple/30 rounded-2xl p-8 text-center mb-8">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Your YAUC Balance</div>
            <div className="font-mono text-4xl font-bold text-pngwin-purple mb-1">🎟 {balance.toLocaleString()}</div>
          </motion.div>
        )}

        {/* What is YAUC */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-4">What is YAUC?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            YAUC (YouAuction Coin) is the native utility token of the Arctic Auction platform. 
            It can be earned for free through tasks, referrals, and playing in free auctions. 
            YAUC can be used to enter free auctions where you compete for real cryptocurrency prizes at zero cost.
          </p>
        </div>

        {/* How to earn */}
        <h2 className="font-display font-bold text-lg mb-4">How to Earn YAUC</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-card border border-border rounded-xl p-5 hover:border-pngwin-purple/30 transition-colors">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-display font-bold text-sm mb-1">{f.title}</div>
              <div className="text-xs text-muted-foreground">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        {/* Transaction History */}
        {user && (
          <div>
            <h2 className="font-display font-bold text-lg mb-4">YAUC Transactions</h2>
            {loading ? (
              <div className="text-center py-6 text-muted-foreground text-sm">Loading...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 bg-card border border-border rounded-xl text-muted-foreground text-sm">No YAUC transactions yet</div>
            ) : (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-0">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{tx.description || tx.event_type}</div>
                      <div className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</div>
                    </div>
                    <div className={`font-mono text-sm font-bold ${tx.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                      {tx.direction === 'IN' ? '+' : '-'}{Number(tx.gross_amount).toLocaleString()} 🎟
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropYauc;
