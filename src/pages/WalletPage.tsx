import { motion } from 'framer-motion';
import KpiCard from '@/components/KpiCard';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'bid' | 'win' | 'referral' | 'burn';
  description: string;
  amount: number;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'win', description: 'Won Arctic Rush #46', amount: 2450, date: '2h ago' },
  { id: '2', type: 'bid', description: 'Bid in Penguin Showdown #12', amount: -10, date: '3h ago' },
  { id: '3', type: 'referral', description: 'Social Circle bonus from @MoonShot', amount: 196, date: '5h ago' },
  { id: '4', type: 'bid', description: 'Bid in Quick Freeze 15m', amount: -5, date: '6h ago' },
  { id: '5', type: 'deposit', description: 'Deposit from wallet', amount: 5000, date: '1d ago' },
  { id: '6', type: 'bid', description: 'PvP Duel entry (100 PNGWIN room)', amount: -100, date: '1d ago' },
  { id: '7', type: 'win', description: 'PvP Duel vs @NordicBid', amount: 130, date: '1d ago' },
  { id: '8', type: 'withdraw', description: 'Withdrawal to wallet', amount: -2000, date: '3d ago' },
];

const typeStyles: Record<string, { icon: string; color: string }> = {
  deposit: { icon: '💰', color: 'text-pngwin-green' },
  withdraw: { icon: '📤', color: 'text-pngwin-red' },
  bid: { icon: '🎯', color: 'text-pngwin-red' },
  win: { icon: '🏆', color: 'text-pngwin-green' },
  referral: { icon: '🐧', color: 'text-ice' },
  burn: { icon: '🔥', color: 'text-pngwin-orange' },
};

const WalletPage = () => {
  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">💎 Wallet</h1>

        {/* Balance Card */}
        <div className="bg-card border border-gold/20 rounded-xl p-8 text-center mb-8 glow-gold">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Available Balance</div>
          <div className="font-mono text-5xl md:text-6xl font-bold text-primary mb-2">9,021</div>
          <div className="text-sm text-muted-foreground mb-6">PNGWIN</div>
          <div className="flex gap-3 justify-center">
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
          <KpiCard label="Total Deposited" value="15,000" color="gold" />
          <KpiCard label="Total Won" value="8,430" color="green" />
          <KpiCard label="Total Spent" value="12,409" color="red" />
          <KpiCard label="Net P/L" value="+2,021" color="green" />
        </div>

        {/* Transactions */}
        <h2 className="font-display font-bold text-lg mb-4">Transaction History</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {TRANSACTIONS.map(tx => {
            const style = typeStyles[tx.type];
            return (
              <div key={tx.id} className="px-5 py-3.5 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{style.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{tx.description}</div>
                    <div className="text-[11px] text-muted-foreground">{tx.date}</div>
                  </div>
                </div>
                <div className={`font-mono text-sm font-bold ${tx.amount >= 0 ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
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
