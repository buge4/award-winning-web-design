import { motion } from 'framer-motion';
import { useState } from 'react';

interface BulkBuyBundle {
  buyCount: number;
  getCount: number;
  freeCount: number;
  label: string;
  popular?: boolean;
}

interface BulkBuySelectorProps {
  bidCost: number;
  onSelect: (totalBids: number, paidBids: number) => void;
}

const BUNDLES: BulkBuyBundle[] = [
  { buyCount: 1, getCount: 1, freeCount: 0, label: 'Single' },
  { buyCount: 5, getCount: 6, freeCount: 1, label: 'Value' },
  { buyCount: 10, getCount: 13, freeCount: 3, label: 'Best Deal', popular: true },
];

const BulkBuySelector = ({ bidCost, onSelect }: BulkBuySelectorProps) => {
  const [selected, setSelected] = useState(0);

  if (bidCost <= 0) return null; // No bulk buy for free auctions

  const handleSelect = (idx: number) => {
    setSelected(idx);
    const bundle = BUNDLES[idx];
    onSelect(bundle.getCount, bundle.buyCount);
  };

  return (
    <div className="space-y-3">
      <div className="text-[11px] text-muted-foreground uppercase tracking-wider text-center font-semibold">
        Bid Bundles
      </div>

      <div className="grid grid-cols-3 gap-2">
        {BUNDLES.map((bundle, i) => {
          const isSelected = selected === i;
          const totalCost = bundle.buyCount * bidCost;
          const savings = bundle.freeCount * bidCost;

          return (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(i)}
              className={`
                relative rounded-xl border-2 p-3 transition-all duration-200 text-center
                ${isSelected
                  ? 'border-primary bg-gold-subtle shadow-gold'
                  : 'border-border bg-card hover:border-border-active'
                }
              `}
            >
              {/* Popular badge */}
              {bundle.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.5 bg-pngwin-green text-primary-foreground text-[8px] font-bold uppercase tracking-wider rounded-full">
                    Best Deal
                  </span>
                </div>
              )}

              <div className="font-display font-bold text-lg text-foreground">
                {bundle.getCount}
              </div>
              <div className="text-[10px] text-muted-foreground">
                bids
              </div>

              {bundle.freeCount > 0 && (
                <div className="mt-1">
                  <span className="text-[10px] font-bold text-pngwin-green">
                    +{bundle.freeCount} FREE
                  </span>
                </div>
              )}

              <div className="mt-2 pt-2 border-t border-border">
                <div className="font-mono text-xs font-bold text-primary">
                  {totalCost} PNGWIN
                </div>
                {savings > 0 && (
                  <div className="text-[9px] text-pngwin-green font-semibold">
                    Save {savings} PNGWIN
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default BulkBuySelector;
