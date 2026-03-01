import { motion } from 'framer-motion';

interface BurnCardProps {
  token: string;
  icon: string;
  amount: number;
  maxAmount?: number;
  delay?: number;
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const BurnCard = ({ token, icon, amount, maxAmount = 1, delay = 0 }: BurnCardProps) => {
  const pct = maxAmount > 0 ? Math.min((amount / maxAmount) * 100, 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="bg-card border border-border rounded-[14px] p-5 text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-[11px] text-muted-foreground uppercase tracking-[1.5px] font-medium">{token}</div>
      <div className="font-mono text-xl font-bold text-pngwin-red my-1.5">{fmt(amount)}</div>

      {/* Progress bar */}
      <div className="h-1 bg-secondary rounded-full mt-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.3, duration: 0.6 }}
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, hsl(var(--pngwin-red)), hsl(var(--pngwin-orange)))' }}
        />
      </div>
    </motion.div>
  );
};

export default BurnCard;
