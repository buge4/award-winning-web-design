import { motion } from 'framer-motion';

type StatColor = 'green' | 'red' | 'gold' | 'cyan' | 'purple' | 'blue';

interface StatCardProps {
  label: string;
  value: string | number;
  color: StatColor;
  icon?: string;
  delay?: number;
}

const colorMap: Record<StatColor, { text: string; accent: string; glow: string }> = {
  green:  { text: 'text-pngwin-green', accent: 'bg-pngwin-green', glow: 'shadow-[0_0_30px_hsla(152,100%,45%,0.06)]' },
  red:    { text: 'text-pngwin-red', accent: 'bg-pngwin-red', glow: 'shadow-[0_0_30px_hsla(350,100%,63%,0.06)]' },
  gold:   { text: 'text-primary', accent: 'bg-primary', glow: 'shadow-[0_0_30px_hsla(43,90%,60%,0.06)]' },
  cyan:   { text: 'text-ice', accent: 'bg-ice', glow: 'shadow-[0_0_30px_hsla(192,100%,50%,0.06)]' },
  purple: { text: 'text-pngwin-purple', accent: 'bg-pngwin-purple', glow: 'shadow-[0_0_30px_hsla(270,91%,65%,0.06)]' },
  blue:   { text: 'text-ice', accent: 'bg-ice', glow: 'shadow-[0_0_30px_hsla(210,100%,64%,0.06)]' },
};

const StatCard = ({ label, value, color, icon, delay = 0 }: StatCardProps) => {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`relative overflow-hidden bg-card border border-border rounded-[14px] p-5 ${c.glow}`}
    >
      {/* Accent corner blob */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${c.accent} opacity-[0.07] blur-sm`} />
      
      <div className="text-[11px] text-muted-foreground uppercase tracking-[1.5px] mb-2 font-medium">
        {icon && <span className="mr-1">{icon}</span>}
        {label}
      </div>
      <div className={`font-mono text-2xl font-bold ${c.text}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
    </motion.div>
  );
};

export default StatCard;
