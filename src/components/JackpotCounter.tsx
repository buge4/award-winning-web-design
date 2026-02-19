import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const JackpotCounter = ({ amount }: { amount: number }) => {
  const [displayed, setDisplayed] = useState(amount - 500);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= amount) return amount;
        return prev + Math.floor(Math.random() * 50) + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [amount]);

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-xs text-ice uppercase tracking-[4px] mb-2 font-semibold">
        🎰 Weekly Jackpot
      </div>
      <div className="font-mono text-5xl md:text-7xl font-bold text-primary drop-shadow-lg">
        {Math.min(displayed, amount).toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-1">PNGWIN</div>
      <div className="text-xs text-pngwin-orange mt-2 font-semibold">
        Week 4 Rollover — No winners for 3 weeks! 🔥
      </div>
    </motion.div>
  );
};

export default JackpotCounter;
