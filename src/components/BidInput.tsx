import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface BidInputProps {
  onSubmit: (value: string) => void;
  bidCost: number;
  minValue?: number;
  maxValue?: number;
}

const BidInput = ({ onSubmit, bidCost, minValue = 0.01, maxValue = 99.99 }: BidInputProps) => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rightRef = useRef<HTMLInputElement>(null);

  const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setLeft(val);
    setError(null);
    if (val.length === 2) rightRef.current?.focus();
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setRight(val);
    setError(null);
  };

  const handleSubmit = () => {
    const l = left.padStart(2, '0');
    const r = right.padEnd(2, '0');
    const value = `${l}.${r}`;
    const num = parseFloat(value);
    if (num < minValue) {
      setError(`Minimum bid is ${minValue.toFixed(2)}`);
      return;
    }
    if (num > maxValue) {
      setError(`Maximum bid is ${maxValue.toFixed(2)}`);
      return;
    }
    if (num <= 0) {
      setError('Bid must be greater than 0');
      return;
    }
    onSubmit(value);
    setLeft('');
    setRight('');
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Place Your Bid</div>
        <div className="text-[11px] text-ice font-semibold mb-3">
          Pick a number between {minValue.toFixed(2)} and {maxValue.toFixed(2)}
        </div>
        <div className="flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
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
            inputMode="numeric"
            value={right}
            onChange={handleRightChange}
            placeholder="00"
            maxLength={2}
            className="w-20 h-16 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-pngwin-red mt-2 font-semibold"
          >
            {error}
          </motion.div>
        )}
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
