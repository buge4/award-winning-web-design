import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const JackpotCounter = ({ amount }: { amount: number }) => {
  const [displayed, setDisplayed] = useState(Math.max(0, amount - 500));

  useEffect(() => {
    // Reset displayed when amount changes significantly
    setDisplayed(Math.max(0, amount - 500));
  }, [amount]);

  useEffect(() => {
    if (displayed >= amount) return;
    const interval = setInterval(() => {
      setDisplayed((prev) => {
        if (prev >= amount) return amount;
        return prev + Math.floor(Math.random() * 50) + 10;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [amount, displayed]);

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
    </motion.div>
  );
};

export default JackpotCounter;
