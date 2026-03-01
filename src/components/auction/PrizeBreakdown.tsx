import { motion } from 'framer-motion';

interface PrizeBreakdownProps {
  prizePool: number;
  totalCollected: number;
}

const PrizeBreakdown = ({ prizePool, totalCollected }: PrizeBreakdownProps) => {
  const burned = Math.floor(totalCollected * 0.15);
  const jackpot = Math.floor(totalCollected * 0.10);
  const social = Math.floor(totalCollected * 0.05);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-lg p-5"
    >
      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">🏆 Prizes</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-pngwin-green font-semibold">1st Prize (55%)</span>
          <span className="font-mono font-bold text-pngwin-green">~{prizePool.toLocaleString()} PNGWIN</span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>🔥 15% burned</span>
          <span className="font-mono text-pngwin-red">{burned.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>🎰 10% to jackpot</span>
          <span className="font-mono text-primary">{jackpot.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>🤝 5% social bonuses</span>
          <span className="font-mono text-ice">{social.toLocaleString()}</span>
        </div>
      </div>
      <div className="text-[10px] text-muted-foreground text-center mt-3 italic">
        Prize pool grows with every bid!
      </div>
    </motion.div>
  );
};

export default PrizeBreakdown;
