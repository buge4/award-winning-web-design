import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TOTAL_SLIDES = 10;

/* ── Slide wrapper ── */
const Slide = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative w-full h-full flex flex-col items-center justify-center px-8 md:px-20 ${className}`}>
    {children}
  </div>
);

/* ── Animated counter ── */
const Counter = ({ value, suffix = '' }: { value: string; suffix?: string }) => (
  <motion.span initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
    className="font-mono text-4xl md:text-6xl font-bold text-[hsl(43,90%,60%)]">
    {value}<span className="text-xl md:text-2xl text-[hsla(210,40%,96%,0.5)]">{suffix}</span>
  </motion.span>
);

/* ── Pain point card ── */
const PainPoint = ({ icon, text, delay }: { icon: string; text: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-4 bg-[hsla(215,25%,17%,0.4)] rounded-xl p-5 border border-[hsla(350,100%,63%,0.15)]">
    <span className="text-3xl shrink-0">{icon}</span>
    <span className="text-base md:text-lg text-[hsl(210,40%,96%)]">{text}</span>
  </motion.div>
);

/* ── Step card ── */
const Step = ({ icon, text, delay }: { icon: string; text: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}
    className="flex flex-col items-center gap-2 text-center">
    <span className="text-4xl">{icon}</span>
    <span className="text-sm md:text-base text-[hsl(210,40%,96%)]">{text}</span>
  </motion.div>
);

/* ── Task card ── */
const TaskCard = ({ icon, task, reward, delay }: { icon: string; task: string; reward: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay, duration: 0.4 }}
    className="bg-[hsla(215,25%,17%,0.5)] rounded-xl p-4 border border-[hsla(192,100%,50%,0.15)] flex items-center gap-3">
    <span className="text-2xl shrink-0">{icon}</span>
    <div className="flex-1 text-left">
      <div className="text-sm font-semibold text-[hsl(210,40%,96%)]">{task}</div>
      <div className="text-xs text-[hsl(43,90%,60%)]">{reward}</div>
    </div>
  </motion.div>
);

/* ── Comparison row ── */
const CompRow = ({ label, old, arctico, delay }: { label: string; old: string; arctico: string; delay: number }) => (
  <motion.tr initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.3 }}
    className="border-b border-[hsla(215,25%,17%,0.6)]">
    <td className="py-3 pr-4 text-sm font-medium text-[hsl(215,20%,55%)]">{label}</td>
    <td className="py-3 px-4 text-sm text-[hsl(350,100%,63%)]">❌ {old}</td>
    <td className="py-3 pl-4 text-sm text-[hsl(152,100%,45%)]">✅ {arctico}</td>
  </motion.tr>
);

/* ── Stat block ── */
const StatBlock = ({ value, label, delay }: { value: string; label: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
    className="text-center">
    <div className="font-mono text-3xl md:text-5xl font-bold text-[hsl(192,100%,50%)]">{value}</div>
    <div className="text-sm text-[hsl(215,20%,55%)] mt-2">{label}</div>
  </motion.div>
);

/* ── Column card ── */
const ColumnCard = ({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) => (
  <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.5 }}
    className="bg-[hsla(215,25%,17%,0.4)] rounded-2xl p-6 border border-[hsla(192,100%,50%,0.12)] text-center space-y-3">
    <span className="text-4xl">{icon}</span>
    <h3 className="font-display text-xl font-bold text-[hsl(210,40%,96%)]">{title}</h3>
    <p className="text-sm text-[hsl(215,20%,55%)] leading-relaxed">{desc}</p>
  </motion.div>
);

/* ── Floating particles ── */
const Particles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 30 }).map((_, i) => (
      <motion.div key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          background: i % 3 === 0 ? 'hsla(192,100%,50%,0.3)' : i % 3 === 1 ? 'hsla(43,90%,60%,0.2)' : 'hsla(270,91%,65%,0.2)',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{ y: [0, -40, 0], opacity: [0.2, 0.8, 0.2] }}
        transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
      />
    ))}
  </div>
);

const slideVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};

const AirdropPresentation = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const transitioning = useRef(false);

  const goTo = useCallback((idx: number) => {
    if (transitioning.current || idx === current || idx < 0 || idx >= TOTAL_SLIDES) return;
    transitioning.current = true;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
    setTimeout(() => { transitioning.current = false; }, 600);
  }, [current]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  // Touch swipe
  const touchY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
  };

  // Wheel
  const wheelTimeout = useRef<ReturnType<typeof setTimeout>>();
  const onWheel = useCallback((e: React.WheelEvent) => {
    if (wheelTimeout.current) return;
    wheelTimeout.current = setTimeout(() => { wheelTimeout.current = undefined; }, 800);
    if (e.deltaY > 30) next();
    else if (e.deltaY < -30) prev();
  }, [next, prev]);

  const slides = [
    // Slide 0 — Hero
    <Slide key={0}>
      <Particles />
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
        className="text-center z-10 max-w-4xl">
        <h1 className="font-display text-5xl md:text-8xl font-bold leading-none mb-6">
          <span className="text-[hsl(210,40%,96%)]">Airdrops Are </span>
          <span className="text-[hsl(350,100%,63%)]">Broken.</span>
          <br />
          <span className="text-[hsl(43,90%,60%)]">We Fixed Them.</span>
        </h1>
        <p className="text-lg md:text-2xl text-[hsl(215,20%,55%)] mb-10">
          Turn passive token giveaways into viral gaming experiences
        </p>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={next}
          className="px-8 py-4 rounded-xl font-display font-bold text-lg bg-gradient-to-r from-[hsl(43,90%,60%)] to-[hsl(36,100%,50%)] text-[hsl(222,47%,5%)] shadow-[0_4px_30px_hsla(43,90%,60%,0.4)]">
          See How →
        </motion.button>
      </motion.div>
      {/* Aurora glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[radial-gradient(ellipse,hsla(192,100%,50%,0.08),transparent_70%)] pointer-events-none" />
    </Slide>,

    // Slide 1 — Problem
    <Slide key={1}>
      <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-10 text-center">
        Traditional Airdrops <span className="text-[hsl(350,100%,63%)]">Fail</span>
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full">
        <PainPoint icon="💸" text="80% of tokens dumped within 48 hours" delay={0.1} />
        <PainPoint icon="🤖" text="Bots and fake wallets farm your tokens" delay={0.2} />
        <PainPoint icon="😴" text="Zero engagement — users forget you exist" delay={0.3} />
        <PainPoint icon="📉" text="No ROI — millions spent, nothing measured" delay={0.4} />
      </div>
    </Slide>,

    // Slide 2 — Solution
    <Slide key={2}>
      <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-6 text-center">
        What if your airdrop was a <span className="text-[hsl(43,90%,60%)]">GAME?</span>
      </motion.h2>
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 mt-8">
        <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="bg-[hsla(215,25%,17%,0.5)] rounded-2xl p-6 border border-[hsla(192,100%,50%,0.15)] text-center">
          <span className="text-4xl">🪙</span>
          <div className="text-sm font-semibold mt-2 text-[hsl(210,40%,96%)]">Token Project</div>
        </motion.div>
        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.4, type: 'spring' }}
          className="text-3xl">→</motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-[hsla(192,100%,50%,0.1)] to-[hsla(43,90%,60%,0.1)] rounded-2xl p-6 border border-[hsla(43,90%,60%,0.2)] text-center">
          <span className="text-4xl">🎮</span>
          <div className="text-sm font-semibold mt-2 text-[hsl(43,90%,60%)]">Arctico Auction</div>
        </motion.div>
        <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
          className="text-3xl">→</motion.div>
        <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
          className="bg-[hsla(215,25%,17%,0.5)] rounded-2xl p-6 border border-[hsla(152,100%,45%,0.15)] text-center">
          <span className="text-4xl">🎉</span>
          <div className="text-sm font-semibold mt-2 text-[hsl(152,100%,45%)]">Happy Players</div>
        </motion.div>
      </div>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.9 }}
        className="text-center mt-10 text-lg text-[hsl(215,20%,55%)]">
        Players earn your tokens by <b className="text-[hsl(43,90%,60%)]">PLAYING</b>, not just showing up
      </motion.p>
    </Slide>,

    // Slide 3 — Piggyback
    <Slide key={3}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-8">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[hsla(192,100%,50%,0.1)] text-[hsl(192,100%,50%)] border border-[hsla(192,100%,50%,0.2)]">MODEL A</span>
      </motion.div>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-3 text-center">Piggyback Airdrop</h2>
      <p className="text-[hsl(215,20%,55%)] text-lg mb-10 text-center">Attach your tokens to existing paid auctions</p>
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl">
        <Step icon="🤝" text="Partner provides token pool" delay={0.1} />
        <Step icon="🎮" text="Players bid in normal auctions" delay={0.2} />
        <Step icon="🎁" text="Every bidder earns bonus tokens" delay={0.3} />
        <Step icon="🏆" text="Auction resolves → tokens distributed" delay={0.4} />
      </div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-10 px-6 py-3 rounded-xl bg-[hsla(43,90%,60%,0.08)] border border-[hsla(43,90%,60%,0.15)] text-sm text-[hsl(43,90%,60%)]">
        Players pay to play. Your tokens are the bonus.
      </motion.div>
    </Slide>,

    // Slide 4 — Gamified
    <Slide key={4}>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mb-8">
        <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-[hsla(43,90%,60%,0.1)] text-[hsl(43,90%,60%)] border border-[hsla(43,90%,60%,0.2)]">MODEL B</span>
      </motion.div>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-3 text-center">Gamified Airdrop</h2>
      <p className="text-[hsl(215,20%,55%)] text-lg mb-10 text-center">Your token launch IS the game</p>
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 max-w-4xl">
        <Step icon="🆓" text="Players get 3 free bids" delay={0.1} />
        <Step icon="✅" text="Complete tasks for more bids" delay={0.2} />
        <Step icon="🎯" text="Every bid earns tokens instantly" delay={0.3} />
        <Step icon="🚀" text="Viral referral loop multiplies reach" delay={0.4} />
      </div>
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-10 px-6 py-3 rounded-xl bg-[hsla(192,100%,50%,0.08)] border border-[hsla(192,100%,50%,0.15)] text-sm text-[hsl(192,100%,50%)]">
        You fund the fun. We deliver the users.
      </motion.div>
    </Slide>,

    // Slide 5 — Comparison
    <Slide key={5}>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-10 text-center">
        Old Way vs. <span className="text-[hsl(192,100%,50%)]">Arctico Way</span>
      </h2>
      <div className="w-full max-w-3xl overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[hsla(215,25%,17%,0.8)]">
              <th className="text-left py-3 text-sm text-[hsl(215,20%,55%)]"></th>
              <th className="text-left py-3 text-sm text-[hsl(350,100%,63%)]">Traditional</th>
              <th className="text-left py-3 text-sm text-[hsl(152,100%,45%)]">Arctico</th>
            </tr>
          </thead>
          <tbody>
            <CompRow label="User effort" old="None (just hold wallet)" arctico="Active gameplay" delay={0.1} />
            <CompRow label="Engagement" old="Zero" arctico="Minutes per session" delay={0.15} />
            <CompRow label="Dump risk" old="~80% sell immediately" arctico="Low — tokens feel earned" delay={0.2} />
            <CompRow label="Bot protection" old="Minimal" arctico="Built-in (real players)" delay={0.25} />
            <CompRow label="Viral mechanics" old="None" arctico="Referral + social tasks" delay={0.3} />
            <CompRow label="ROI tracking" old="None" arctico="Full analytics dashboard" delay={0.35} />
          </tbody>
        </table>
      </div>
    </Slide>,

    // Slide 6 — Numbers
    <Slide key={6}>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-14 text-center">
        Built for <span className="text-[hsl(192,100%,50%)]">Scale</span>
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-4xl">
        <StatBlock value="1B+" label="Telegram users" delay={0.1} />
        <StatBlock value="5-level" label="Referral system" delay={0.2} />
        <StatBlock value="100%" label="Transparent" delay={0.3} />
        <StatBlock value="Zero" label="Blockchain needed to start" delay={0.4} />
      </div>
    </Slide>,

    // Slide 7 — Tasks
    <Slide key={7}>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-10 text-center">
        Gamified Tasks = <span className="text-[hsl(43,90%,60%)]">Viral Growth</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        <TaskCard icon="🐦" task="Follow on Twitter" reward="+2 free bids, +50 tokens" delay={0.1} />
        <TaskCard icon="💬" task="Join Telegram" reward="+1 free bid, +25 tokens" delay={0.2} />
        <TaskCard icon="👥" task="Refer a friend" reward="+3 free bids, +200 tokens" delay={0.3} />
        <TaskCard icon="📱" task="Share on social" reward="+1 free bid, +25 tokens" delay={0.4} />
      </div>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-center mt-8 text-lg text-[hsl(43,90%,60%)]">Every task grows YOUR community</motion.p>
    </Slide>,

    // Slide 8 — For Projects
    <Slide key={8}>
      <h2 className="font-display text-4xl md:text-6xl font-bold text-[hsl(210,40%,96%)] mb-12 text-center">
        What <span className="text-[hsl(43,90%,60%)]">You</span> Get
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        <ColumnCard icon="📊" title="Full Analytics" desc="Bids, unique users, tokens distributed, engagement time — everything measured." delay={0.1} />
        <ColumnCard icon="🎯" title="Verified Users" desc="Real players, not bots, with proven activity and genuine engagement." delay={0.2} />
        <ColumnCard icon="🔄" title="Viral Loop" desc="5-level referral system multiplies your reach organically." delay={0.3} />
      </div>
      <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }}
        className="text-center mt-10 text-sm text-[hsl(215,20%,55%)]">Start with a free pilot. See results before committing.</motion.p>
    </Slide>,

    // Slide 9 — CTA
    <Slide key={9}>
      <Particles />
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="text-center z-10 max-w-3xl">
        <h2 className="font-display text-5xl md:text-7xl font-bold text-[hsl(210,40%,96%)] mb-4">
          Ready to Launch?
        </h2>
        <p className="text-xl text-[hsl(215,20%,55%)] mb-12">
          Let's turn your token distribution into an <span className="text-[hsl(43,90%,60%)]">event</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            href="#" className="px-8 py-4 rounded-xl font-display font-bold text-lg bg-gradient-to-r from-[hsl(43,90%,60%)] to-[hsl(36,100%,50%)] text-[hsl(222,47%,5%)] shadow-[0_4px_30px_hsla(43,90%,60%,0.4)]">
            Book a Demo
          </motion.a>
          <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            href="#" className="px-8 py-4 rounded-xl font-display font-bold text-lg border-2 border-[hsl(192,100%,50%)] text-[hsl(192,100%,50%)] hover:bg-[hsla(192,100%,50%,0.08)]">
            Read the Docs
          </motion.a>
        </div>
        <div className="mt-16 flex gap-6 justify-center text-[hsl(215,20%,55%)] text-sm">
          <span>hello@arctico.io</span>
          <span>·</span>
          <span>@arctico_io</span>
        </div>
      </motion.div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] rounded-full bg-[radial-gradient(ellipse,hsla(43,90%,60%,0.06),transparent_70%)] pointer-events-none" />
    </Slide>,
  ];

  return (
    <div className="fixed inset-0 bg-[hsl(222,47%,5%)] overflow-hidden select-none" onWheel={onWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 z-50 bg-[hsla(215,25%,17%,0.5)]">
        <motion.div className="h-full bg-gradient-to-r from-[hsl(192,100%,50%)] to-[hsl(43,90%,60%)]"
          animate={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }} transition={{ duration: 0.4 }} />
      </div>

      {/* Slide content */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={current} custom={direction}
          variants={slideVariants} initial="enter" animate="center" exit="exit"
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0">
          {slides[current]}
        </motion.div>
      </AnimatePresence>

      {/* Dot navigation */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-[hsl(43,90%,60%)] scale-125' : 'bg-[hsla(215,25%,17%,0.8)] hover:bg-[hsla(215,20%,30%,1)]'}`} />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-4 left-4 z-50 text-xs font-mono text-[hsl(215,20%,55%)]">
        {String(current + 1).padStart(2, '0')} / {TOTAL_SLIDES}
      </div>
    </div>
  );
};

export default AirdropPresentation;
