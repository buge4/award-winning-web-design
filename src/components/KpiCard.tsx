import { motion } from 'framer-motion';

interface KpiCardProps {
  label: string;
  value: string | number;
  color?: 'gold' | 'ice' | 'green' | 'red' | 'purple';
  delay?: number;
}

const colorClasses = {
  gold: 'text-primary',
  ice: 'text-ice',
  green: 'text-pngwin-green',
  red: 'text-pngwin-red',
  purple: 'text-pngwin-purple',
};

const borderClasses = {
  gold: 'border-gold',
  ice: 'border-ice',
  green: 'border-l-2 border-l-pngwin-green',
  red: 'border-l-2 border-l-pngwin-red',
  purple: 'border-l-2 border-l-pngwin-purple',
};

const KpiCard = ({ label, value, color = 'gold', delay = 0 }: KpiCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className={`bg-card border border-border ${borderClasses[color]} rounded-lg p-4 text-center`}
  >
    <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
    <div className={`font-mono text-xl font-bold ${colorClasses[color]}`}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </div>
  </motion.div>
);

export default KpiCard;
