import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface BidInputProps {
  onSubmit: (value: string) => void;
  bidCost: number;
  minValue?: number;
  maxValue?: number;
  decimals?: number;
  hasFreeBid?: boolean;
  freeBidLabel?: string;
}

const BidInput = ({ onSubmit, bidCost, minValue = 0.01, maxValue = 99.99, decimals = 2, hasFreeBid = false, freeBidLabel }: BidInputProps) => {
  const [left, setLeft] = useState('');
  const [right, setRight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const rightRef = useRef<HTMLInputElement>(null);

  const maxLeftDigits = maxValue >= 100 ? 3 : 2;
  const maxRightDigits = decimals;

  const handleLeftChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxLeftDigits);
    setLeft(val);
    setError(null);
    if (val.length === maxLeftDigits) rightRef.current?.focus();
  };

  const handleRightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, maxRightDigits);
    setRight(val);
    setError(null);
  };

  const handleSubmit = () => {
    const l = left.padStart(maxLeftDigits, '0');
    const r = right.padEnd(maxRightDigits, '0');
    const value = `${l}.${r}`;
    const num = parseFloat(value);
    if (num < minValue) {
      setError(`Minimum bid is ${minValue.toFixed(decimals)}`);
      return;
    }
    if (num > maxValue) {
      setError(`Maximum bid is ${maxValue.toFixed(decimals)}`);
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

  const placeholderLeft = '0'.repeat(maxLeftDigits);
  const placeholderRight = '0'.repeat(maxRightDigits);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Place Your Bid</div>
        <div className="text-[11px] text-ice font-semibold mb-3">
          Pick a number between {minValue.toFixed(decimals)} and {maxValue.toFixed(decimals)}
        </div>
        <div className="flex items-center justify-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={left}
            onChange={handleLeftChange}
            placeholder={placeholderLeft}
            maxLength={maxLeftDigits}
            className="w-20 h-16 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
          />
          <span className="font-mono text-3xl font-bold text-muted-foreground">.</span>
          <input
            ref={rightRef}
            type="text"
            inputMode="numeric"
            value={right}
            onChange={handleRightChange}
            placeholder={placeholderRight}
            maxLength={maxRightDigits}
            className={`${decimals === 3 ? 'w-24' : 'w-20'} h-16 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors`}
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
        className={`w-full py-3.5 font-display font-bold text-base tracking-wider rounded-lg hover:shadow-lg transition-all ${
          hasFreeBid
            ? 'bg-pngwin-green text-primary-foreground shadow-[0_4px_20px_hsla(152,100%,45%,0.3)]'
            : bidCost === 0
              ? 'bg-pngwin-green text-primary-foreground shadow-[0_4px_20px_hsla(152,100%,45%,0.3)]'
              : 'gradient-gold text-primary-foreground shadow-gold'
        }`}
      >
        {hasFreeBid ? (
          <>🟢 PLACE BID — FREE</>
        ) : bidCost === 0 ? (
          'PLACE FREE BID'
        ) : (
          `🟡 PLACE BID — ${bidCost} PNGWIN`
        )}
      </motion.button>

      {hasFreeBid && freeBidLabel && (
        <div className="text-center text-[10px] text-pngwin-green font-semibold">
          {freeBidLabel}
        </div>
      )}
    </div>
  );
};

export default BidInput;
