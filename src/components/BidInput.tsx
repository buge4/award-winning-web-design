import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface BidInputProps {
  onSubmit: (value: string) => void;
  bidCost: number;
  maxValue?: number;
}

const BidInput = ({ onSubmit, bidCost, maxValue = 99.99 }: BidInputProps) => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const rightRef = useRef<HTMLInputElement>(null);

  const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setLeft(val);
    if (val.length === 2) rightRef.current?.focus();
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setRight(val);
  };

  const handleSubmit = () => {
    const l = left.padStart(2, '0');
    const r = right.padEnd(2, '0');
    const value = `${l}.${r}`;
    if (parseFloat(value) > 0 && parseFloat(value) <= maxValue) {
      onSubmit(value);
      setLeft('');
      setRight('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Place Your Bid</div>
        <div className="flex items-center justify-center gap-2">
          <input
            type="text"
            value={left}
            onChange={handleLeftChange}
            placeholder="00"
            maxLength={2}
            className="w-20 h-16 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
          />
          <span className="font-mono text-3xl font-bold text-muted-foreground">.</span>
          <input
            ref={rightRef}
            type="text"
            value={right}
            onChange={handleRightChange}
            placeholder="00"
            maxLength={2}
            className="w-20 h-16 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">Range: 00.01 — {maxValue}</div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="w-full py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold hover:shadow-lg transition-shadow"
      >
        {bidCost === 0 ? 'PLACE FREE BID' : `PLACE BID — ${bidCost} PNGWIN`}
      </motion.button>
    </div>
  );
};

export default BidInput;
