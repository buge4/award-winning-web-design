import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface HeroJackpotProps {
  prizePool: number;
  week: number;
  status: 'LIVE' | 'UPCOMING';
  bidFee: number;
  endsAt?: string;
  jackpotInstanceId?: string;
}

const HeroJackpot = ({ prizePool, week, status, bidFee, endsAt, jackpotInstanceId }: HeroJackpotProps) => {
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
  const enterLink = jackpotInstanceId ? `/auction/${jackpotInstanceId}` : '/auction/jackpot-1';

  return (
    <section className="relative text-center py-14 md:py-20 px-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 30% 20%, hsl(152 40% 12%) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, hsl(270 30% 15%) 0%, transparent 60%), radial-gradient(ellipse at 50% 50%, hsl(210 40% 8%) 0%, hsl(var(--background)) 100%)'
      }} />
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='0.6' fill='%23ffffff10'/%3E%3C/svg%3E\")"
      }} />

      <div className="relative max-w-2xl mx-auto">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-block text-pngwin-green font-semibold text-[11px] tracking-[2px] uppercase mb-2">
            🏆 Weekly Jackpot Auction
          </span>
        </motion.div>

        {/* Big Prize Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-mono text-[52px] md:text-[72px] font-bold text-primary leading-none mb-1"
          style={{ textShadow: '0 0 60px hsla(43, 90%, 60%, 0.2)' }}
        >
          {prizePool.toLocaleString()}
          <span className="text-lg md:text-xl text-muted-foreground font-medium ml-2">PNGWIN</span>
        </motion.div>

        {/* Description */}
        <p className="text-muted-foreground text-[13px] mb-4 mt-2 max-w-md mx-auto">
          Highest unique bid wins. Duplicate bids are burned. No winner → jackpot rolls over!
        </p>

        {/* Entry info */}
        <div className="font-mono font-semibold text-pngwin-green text-[12px] mb-5">
          Entry: {bidFee} PNGWIN/bid · Range: 00.001 — 99.999
        </div>

        {/* Countdown */}
        <div className="flex justify-center gap-2 mb-6">
          {[
            { val: pad(countdown.days), label: 'Days' },
            { val: pad(countdown.hours), label: 'Hrs' },
            { val: pad(countdown.mins), label: 'Min' },
            { val: pad(countdown.secs), label: 'Sec' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="bg-secondary border border-border rounded-lg px-3 py-2 min-w-[52px] text-center">
                <div className="font-mono text-xl font-bold text-primary">{item.val}</div>
                <div className="text-[8px] text-muted-foreground uppercase tracking-wider">{item.label}</div>
              </div>
              {i < 3 && <span className="text-lg text-muted-foreground">:</span>}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex justify-center gap-3">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
            <Link
              to={enterLink}
              className="inline-block px-10 py-3.5 bg-gradient-to-r from-pngwin-green to-[hsl(152_100%_35%)] text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg uppercase"
              style={{ boxShadow: '0 4px 20px hsla(152, 100%, 45%, 0.3)' }}
            >
              Enter Jackpot →
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }}>
            <Link
              to="/auction/demo/draw"
              className="inline-block px-7 py-3.5 border border-border text-muted-foreground font-display font-bold text-xs tracking-wider rounded-lg uppercase hover:bg-secondary transition-colors"
            >
              🎬 Watch Demo Draw
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroJackpot;
