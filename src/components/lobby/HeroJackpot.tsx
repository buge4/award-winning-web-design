import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import JackpotHistory from './JackpotHistory';

interface RolloverWeek {
  week: number;
  amount: number;
  isCurrent: boolean;
}

interface HeroJackpotProps {
  prizePool: number;
  week: number;
  status: 'LIVE' | 'UPCOMING';
  bidFee: number;
  endsAt?: string;
  rolloverHistory: RolloverWeek[];
}

const HeroJackpot = ({ prizePool, week, status, bidFee, endsAt, rolloverHistory }: HeroJackpotProps) => {
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section className="relative text-center py-16 md:py-20 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, hsl(152 40% 12%) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(270 30% 15%) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, hsl(210 40% 8%) 0%, hsl(var(--background)) 100%)'
      }} />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='%23ffffff10'/%3E%3C/svg%3E\")"
      }} />

      <div className="relative max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block gradient-gold text-primary-foreground font-display font-bold text-sm tracking-[2px] uppercase px-7 py-2 rounded-full mb-3">
            🏆 WEEKLY JACKPOT AUCTION — WEEK {week}
          </span>
        </motion.div>

        {/* Status */}
        <div className="mb-4">
          <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full ${status === 'LIVE' ? 'bg-pngwin-green text-primary-foreground' : 'bg-ice text-primary-foreground'}`}>
            ● {status}
          </span>
        </div>

        {/* Subtitle */}
        <div className="text-primary font-display font-semibold text-base tracking-[4px] uppercase mb-2">
          WEEKLY JACKPOT
        </div>

        {/* Prize */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-6xl md:text-[80px] font-bold text-primary leading-none mb-1"
          style={{ textShadow: '0 0 60px hsla(43, 90%, 60%, 0.25)' }}
        >
          {prizePool.toLocaleString()}
          <span className="text-2xl text-foreground font-medium ml-3">PNGWIN</span>
        </motion.div>

        {/* Description */}
        <p className="text-muted-foreground text-[15px] mb-5 mt-3">
          Highest unique bid wins. Duplicate bids are burned. No winner = jackpot rolls over!
        </p>

        {/* Entry info */}
        <div className="font-mono font-semibold text-pngwin-green text-base mb-6">
          Entry: {bidFee} PNGWIN/bid · Range: 00.01 — 99.99
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-2.5 mb-7">
          {[
            { val: pad(countdown.days), label: 'Days' },
            { val: pad(countdown.hours), label: 'Hours' },
            { val: pad(countdown.mins), label: 'Min' },
            { val: pad(countdown.secs), label: 'Sec' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="bg-secondary border border-border-active rounded-[10px] px-4 py-3 min-w-[72px] text-center">
                <div className="font-mono text-3xl font-bold text-pngwin-green">{item.val}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{item.label}</div>
              </div>
              {i < 3 && <span className="text-2xl text-muted-foreground">:</span>}
            </div>
          ))}
        </div>

        {/* Rollover bar */}
        <div className="flex justify-center gap-2 mb-7">
          {rolloverHistory.map((w) => (
            <div
              key={w.week}
              className={`bg-card border rounded-lg px-4 py-2 text-center min-w-[60px] ${
                w.isCurrent
                  ? 'border-primary bg-gradient-to-b from-[hsl(43_30%_10%)] to-card shadow-gold'
                  : 'border-border'
              }`}
            >
              <div className="text-xs font-semibold text-muted-foreground">W{w.week}</div>
              <div className={`font-mono text-[11px] ${w.isCurrent ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                {w.amount >= 1000 ? `${Math.round(w.amount / 1000)}k` : w.amount}
              </div>
            </div>
          ))}
        </div>

        {/* Prize tiers */}
        <div className="flex justify-center gap-3 mb-7">
          {[
            { name: 'JACKPOT', sub: 'Exact match', color: 'text-primary' },
            { name: '1st Prize', sub: 'Highest unique', color: 'text-pngwin-green' },
            { name: '2nd Prize', sub: '2nd unique', color: 'text-ice' },
            { name: '3rd Prize', sub: '3rd unique', color: 'text-pngwin-orange' },
          ].map((tier, i) => (
            <div key={i} className="bg-card border border-border rounded-[10px] px-5 py-2.5 text-center">
              <div className={`font-display font-bold text-sm uppercase ${tier.color}`}>{tier.name}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{tier.sub}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex justify-center gap-4">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/auction/jackpot-1"
              className="inline-block px-12 py-4 bg-gradient-to-r from-pngwin-green to-[hsl(152_100%_35%)] text-primary-foreground font-display font-bold text-lg tracking-wider rounded-xl uppercase"
              style={{ boxShadow: '0 4px 20px hsla(152, 100%, 45%, 0.3)' }}
            >
              Enter Jackpot →
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }}>
            <Link
              to="/auction/demo/draw"
              className="inline-block px-9 py-4 border-2 border-primary text-primary font-display font-bold text-base tracking-wider rounded-xl uppercase hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              🎬 Watch Demo Draw
            </Link>
          </motion.div>
        </div>

        {/* Previous Draws */}
        <JackpotHistory />
      </div>
    </section>
  );
};

export default HeroJackpot;
