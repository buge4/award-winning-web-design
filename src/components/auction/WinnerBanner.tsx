import { motion } from 'framer-motion';

interface WinnerBannerProps {
  username: string;
  bidAmount: number;
  prizeWon: number;
  socialTotal?: number;
  burnedAmount?: number;
}

const WinnerBanner = ({ username, bidAmount, prizeWon, socialTotal = 0, burnedAmount = 0 }: WinnerBannerProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-gradient-to-r from-[hsl(43_30%_10%)] via-[hsl(152_20%_10%)] to-[hsl(43_30%_10%)] border border-gold rounded-xl p-6 text-center mb-6"
  >
    <div className="text-3xl mb-2">🏆</div>
    <div className="font-display text-xl font-bold text-primary mb-1">
      WINNER: @{username}
    </div>
    <div className="font-mono text-sm text-muted-foreground">
      Bid: {bidAmount.toFixed(2)} — Won: <span className="text-pngwin-green font-bold">{prizeWon.toLocaleString()} PNGWIN</span>
    </div>
    <div className="flex justify-center gap-4 mt-3 text-xs text-muted-foreground">
      {socialTotal > 0 && (
        <span>+ <span className="text-ice font-semibold">{socialTotal.toLocaleString()}</span> PNGWIN in social bonuses</span>
      )}
      {burnedAmount > 0 && (
        <span>🔥 <span className="text-pngwin-red font-semibold">{burnedAmount.toLocaleString()}</span> PNGWIN burned</span>
      )}
    </div>
  </motion.div>
);

export default WinnerBanner;
