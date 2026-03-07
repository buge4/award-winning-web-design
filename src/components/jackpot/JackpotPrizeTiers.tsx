import { motion } from 'framer-motion';

interface JackpotPrizeTiersProps {
  prizePool: number;
}

const TIERS = [
  { draw: 1, label: 'Draw 1 — Jackpot', icon: '🏆', pct: 0.80, color: 'text-primary' },
  { draw: 2, label: 'Draw 2 — 1st Prize', icon: '🥇', pct: 0.10, color: 'text-pngwin-green' },
  { draw: 3, label: 'Draw 3 — 2nd Prize', icon: '🥈', pct: 0.06, color: 'text-ice' },
  { draw: 4, label: 'Draw 4 — 3rd Prize', icon: '🥉', pct: 0.028, color: 'text-pngwin-orange' },
  { draw: 5, label: 'Draw 5 — 4th Prize', icon: '4️⃣', pct: 0.012, color: 'text-muted-foreground' },
];

const JackpotPrizeTiers = ({ prizePool }: JackpotPrizeTiersProps) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <h4 className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-3">
      Prize Tiers (5 RNG Draws)
    </h4>
    <div className="space-y-2">
      {TIERS.map((tier, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="flex justify-between items-center text-[12px]"
        >
          <span className={tier.color}>
            {tier.icon} {tier.label}
          </span>
          <span className={`font-mono font-bold text-[12px] ${tier.color}`}>
            {Math.floor(prizePool * tier.pct).toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
    <div className="text-[9px] text-pngwin-orange mt-3">
      Each draw: exact match wins. No match → rolls to next week.
    </div>
  </div>
);

export default JackpotPrizeTiers;
