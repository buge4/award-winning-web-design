import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CircleBonusEntry {
  level: number;
  upline: string | null;
  qualified: boolean;
  tier?: string;
  amount: number;
  destination: 'paid' | 'jackpot' | 'empty';
}

interface SocialCircleBonusTableProps {
  winnerName: string;
  prizeAmount: number;
  entries: CircleBonusEntry[];
  defaultExpanded?: boolean;
  compact?: boolean;
}

const DEFAULT_ENTRIES: CircleBonusEntry[] = [
  { level: 1, upline: '@MoonShot', qualified: true, tier: 'Tier 4', amount: 1250, destination: 'paid' },
  { level: 2, upline: '@StarGazer', qualified: true, tier: 'Tier 3', amount: 1250, destination: 'paid' },
  { level: 3, upline: '@CryptoKing', qualified: false, amount: 1250, destination: 'jackpot' },
  { level: 4, upline: '@WhaleAlert', qualified: true, tier: 'Tier 2', amount: 1250, destination: 'paid' },
  { level: 5, upline: '@DeFiDegen', qualified: false, amount: 1250, destination: 'jackpot' },
];

const SocialCircleBonusTable = ({
  winnerName,
  prizeAmount,
  entries = DEFAULT_ENTRIES,
  defaultExpanded = false,
  compact = false,
}: SocialCircleBonusTableProps) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const totalBonus = Math.floor(prizeAmount * 0.1);
  const totalPaid = entries.filter(e => e.destination === 'paid').reduce((a, e) => a + e.amount, 0);
  const totalJackpot = entries.filter(e => e.destination !== 'paid').reduce((a, e) => a + e.amount, 0);

  return (
    <div className={`border rounded-lg overflow-hidden ${compact ? 'border-border/50' : 'border-border'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-card-hover transition-colors text-left"
      >
        <span className="text-xs font-semibold">
          🔗 Social Circle Bonus <span className="text-muted-foreground font-normal">— 10% = {totalBonus.toLocaleString()} PNGWIN</span>
        </span>
        <span className="text-muted-foreground text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-1">
              {entries.map(e => (
                <div
                  key={e.level}
                  className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                    e.destination === 'paid'
                      ? 'bg-green-subtle'
                      : e.destination === 'jackpot'
                      ? 'bg-red-subtle'
                      : 'bg-muted/20 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-mono font-bold w-6">L{e.level}</span>
                    <span className={`font-semibold truncate ${
                      e.destination === 'paid' ? 'text-ice' : e.upline ? 'text-muted-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {e.upline || '(no upline)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {e.destination === 'paid' ? (
                      <>
                        <span className="text-[9px] text-pngwin-green">✅ {e.tier}</span>
                        <span className="font-mono font-bold text-pngwin-green">+{e.amount.toLocaleString()}</span>
                      </>
                    ) : e.destination === 'jackpot' ? (
                      <>
                        <span className="text-[9px] text-pngwin-red">
                          {e.upline ? '❌ Inactive' : '⚪ Empty'}
                        </span>
                        <span className="font-mono font-bold text-pngwin-red">→ Jackpot {e.amount.toLocaleString()}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                <span className="text-muted-foreground">Circle Paid:</span>
                <span className="font-mono font-bold text-pngwin-green">{totalPaid.toLocaleString()} PNGWIN</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">To Jackpot (forfeited):</span>
                <span className="font-mono font-bold text-pngwin-red">{totalJackpot.toLocaleString()} PNGWIN</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SocialCircleBonusTable;
