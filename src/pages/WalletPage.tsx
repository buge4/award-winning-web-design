import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import KpiCard from '@/components/KpiCard';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CURRENCIES, getCurrencyConfig, formatCurrencyAmount } from '@/lib/currencies';

interface LedgerEvent {
  id: string;
  event_type: string;
  description: string;
  amount: number;
  currency: string;
  created_at: string;
}

interface WalletBalance {
  currency: string;
  balance: number;
}

const typeStyles: Record<string, { icon: string; color: string }> = {
  deposit: { icon: '💰', color: 'text-pngwin-green' },
  withdraw: { icon: '📤', color: 'text-pngwin-red' },
  withdrawal: { icon: '📤', color: 'text-pngwin-red' },
  bid: { icon: '🎯', color: 'text-pngwin-red' },
  bid_placed: { icon: '🎯', color: 'text-pngwin-red' },
  win: { icon: '🏆', color: 'text-pngwin-green' },
  prize_payout: { icon: '🏆', color: 'text-pngwin-green' },
  referral: { icon: '🐧', color: 'text-ice' },
  social_bonus: { icon: '🐧', color: 'text-ice' },
  burn: { icon: '🔥', color: 'text-pngwin-orange' },
};

const getStyle = (type: string) =>
  typeStyles[type] ?? { icon: '📋', color: 'text-muted-foreground' };

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const WalletPage = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<LedgerEvent[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch all wallet balances
    supabase
      .from('wallets')
      .select('balance, currency')
      .eq('user_id', user.id)
      .eq('project_slug', 'auction')
      .then(({ data }) => {
        const balanceMap: Record<string, number> = {};
        (data ?? []).forEach((w: any) => {
          balanceMap[w.currency ?? 'PNGWIN'] = Number(w.balance);
        });
        // Ensure all currencies are shown
        const allWallets: WalletBalance[] = CURRENCIES.map(c => ({
          currency: c,
          balance: balanceMap[c] ?? 0,
        }));
        setWallets(allWallets);
        setLoadingBalance(false);
      });

    // Fetch transaction history
    supabase
      .from('ledger_events')
      .select('*')
      .eq('user_id', user.id)
      .eq('source_project', 'auction')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setTransactions(data.map((d: any) => ({ ...d, currency: d.currency ?? 'PNGWIN' })) as LedgerEvent[]);
        setLoadingTx(false);
      });
  }, [user]);

  const primaryBalance = wallets.find(w => w.currency === 'PNGWIN')?.balance ?? 0;

  const totalDeposited = transactions
    .filter(t => t.event_type === 'deposit')
    .reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0);
  const totalWon = transactions
    .filter(t => ['win', 'prize_payout'].includes(t.event_type))
    .reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0);
  const totalSpent = transactions
    .filter(t => ['bid', 'bid_placed'].includes(t.event_type))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const netPL = primaryBalance - totalSpent;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">💎 Wallet</h1>

        {/* Multi-Currency Wallets */}
        <div className="bg-card border border-gold/20 rounded-xl p-6 mb-8 glow-gold">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">💰 My Wallets</div>

          <div className="space-y-3">
            {loadingBalance ? (
              <div className="text-center text-muted-foreground py-4">Loading...</div>
            ) : (
              wallets.map(w => {
                const cfg = getCurrencyConfig(w.currency);
                const isPrimary = w.currency === 'PNGWIN';
                return (
                  <motion.div
                    key={w.currency}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      isPrimary
                        ? 'bg-primary/5 border-gold/30'
                        : 'bg-secondary/30 border-border hover:border-border-active'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cfg.icon}</span>
                      <div>
                        <div className={`font-display font-bold text-sm ${cfg.color}`}>{w.currency}</div>
                        {isPrimary && <div className="text-[10px] text-muted-foreground">Primary</div>}
                      </div>
                    </div>
                    <div className={`font-mono text-xl font-bold ${isPrimary ? 'text-primary' : 'text-foreground'}`}>
                      {formatCurrencyAmount(w.balance, w.currency)}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          <div className="flex gap-3 justify-center mt-6">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold"
            >
              Deposit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 bg-secondary border border-border-active text-muted-foreground font-display font-bold text-sm tracking-wider rounded-lg hover:text-foreground transition-colors"
            >
              Withdraw
            </motion.button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Total Deposited" value={totalDeposited.toLocaleString()} color="gold" />
          <KpiCard label="Total Won" value={totalWon.toLocaleString()} color="green" />
          <KpiCard label="Total Spent" value={totalSpent.toLocaleString()} color="red" />
          <KpiCard label="Net P/L" value={(netPL >= 0 ? '+' : '') + netPL.toLocaleString()} color={netPL >= 0 ? 'green' : 'red'} />
        </div>

        {/* Transactions */}
        <h2 className="font-display font-bold text-lg mb-4">Transaction History</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {!user && (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">Sign in to view your transactions.</div>
          )}
          {user && loadingTx && (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">Loading...</div>
          )}
          {user && !loadingTx && transactions.length === 0 && (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">No transactions yet.</div>
          )}
          {transactions.map(tx => {
            const style = getStyle(tx.event_type);
            const cfg = getCurrencyConfig(tx.currency);
            return (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{style.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{tx.description || tx.event_type}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDate(tx.created_at)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono text-sm font-bold ${tx.amount >= 0 ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                    {tx.amount >= 0 ? '+' : ''}{formatCurrencyAmount(Math.abs(tx.amount), tx.currency)}
                  </div>
                  <div className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.icon} {tx.currency}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
