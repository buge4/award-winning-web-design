import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface JackpotTopBannerProps {
  prizePool: number;
  weekNumber: number;
  scheduledEnd?: string;
  bidCount: number;
  playerCount?: number;
  minBid: number;
  maxBid: number;
}

const PRIZES = [
  { icon: '🏆', name: 'Jackpot · Draw 1', pct: 0.80, highlight: true, rolls: true },
  { icon: '🥇', name: '1st · Draw 2', pct: 0.10 },
  { icon: '🥈', name: '2nd · Draw 3', pct: 0.06 },
  { icon: '🥉', name: '3rd · Draw 4', pct: 0.028 },
  { icon: '4️⃣', name: '4th · Draw 5', pct: 0.012 },
];

const JackpotTopBanner = ({ prizePool, weekNumber, scheduledEnd, bidCount, playerCount, minBid, maxBid }: JackpotTopBannerProps) => {
  const [remaining, setRemaining] = useState({ d: '00', h: '00', m: '00', s: '00' });

  useEffect(() => {
    if (!scheduledEnd) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(scheduledEnd).getTime() - Date.now()) / 1000));
      setRemaining({
        d: String(Math.floor(diff / 86400)).padStart(2, '0'),
        h: String(Math.floor((diff % 86400) / 3600)).padStart(2, '0'),
        m: String(Math.floor((diff % 3600) / 60)).padStart(2, '0'),
        s: String(diff % 60).padStart(2, '0'),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [scheduledEnd]);

  const endDate = scheduledEnd ? new Date(scheduledEnd) : null;
  const endLabel = endDate
    ? `Ends ${endDate.toLocaleDateString('en-US', { weekday: 'long' })} ${endDate.getUTCHours()}:00 UTC`
    : 'Ends Saturday 20:00 UTC';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-primary/6 via-pngwin-purple/4 to-primary/6 border border-gold/12 rounded-lg p-3 md:p-4 mb-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_140px] gap-4 items-center">
        {/* Left: Jackpot amount + timer */}
        <div className="text-center">
          <div className="text-[9px] text-pngwin-purple uppercase tracking-widest font-semibold">
            🏆 Weekly Jackpot W{weekNumber}
          </div>
          <div className="font-mono text-3xl font-bold text-primary leading-tight">
            {prizePool.toLocaleString()} <span className="text-sm text-muted-foreground font-medium">PNGWIN</span>
          </div>
          <div className="flex gap-1 justify-center mt-1.5">
            {[remaining.d, remaining.h, remaining.m, remaining.s].map((v, i) => (
              <span key={i} className="flex items-center gap-0.5">
                <span className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-sm font-bold text-pngwin-purple min-w-[24px] text-center">
                  {v}
                </span>
                {i < 3 && <span className="font-mono text-xs text-muted-foreground">:</span>}
              </span>
            ))}
          </div>
          <div className="text-[8px] text-muted-foreground mt-1">{endLabel}</div>
        </div>

        {/* Center: 5 prize tier cards */}
        <div className="flex gap-1.5 items-center justify-center flex-wrap">
          {PRIZES.map((p, i) => (
            <div
              key={i}
              className={`bg-background border rounded-md px-2.5 py-1.5 text-center min-w-[90px] ${
                p.highlight ? 'border-gold/20 bg-primary/4' : 'border-border'
              }`}
            >
              <div className="text-sm">{p.icon}</div>
              <div className="text-[9px] text-muted-foreground">{p.name}</div>
              <div className={`font-mono text-sm font-bold ${p.highlight ? 'text-primary' : 'text-primary'}`}>
                {Math.floor(prizePool * p.pct).toLocaleString()}
              </div>
              {p.rolls && (
                <div className="text-[7px] text-pngwin-orange font-medium">↻ rolls if no match</div>
              )}
            </div>
          ))}
        </div>

        {/* Right: Stats + badges */}
        <div className="text-center">
          <div className="text-[9px] text-muted-foreground space-y-0.5">
            <div><span className="font-bold text-foreground">{bidCount}</span> bids · <span className="font-bold text-foreground">{playerCount ?? '—'}</span> players</div>
            <div>Range: <span className="font-bold text-foreground">{minBid.toFixed(3)} — {maxBid.toFixed(3)}</span></div>
            <div>Blind · RNG Exact · 5 Draws</div>
          </div>
          <div className="flex gap-1 justify-center mt-1.5 flex-wrap">
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-pngwin-purple/10 text-pngwin-purple">Blind</span>
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-pngwin-orange/10 text-pngwin-orange">Timed</span>
            <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase bg-ice/10 text-ice">RNG × 5</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default JackpotTopBanner;
