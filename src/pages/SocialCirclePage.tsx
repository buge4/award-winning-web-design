import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { MISSED_BONUSES } from '@/data/socialCircleMock';
import { useSocialCircleSummary } from '@/hooks/useAuctions';
import { useAuth } from '@/context/AuthContext';

/* ─── Animated counter ─── */
const useCounter = (target: number, inView: boolean, duration = 1200) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [inView, target, duration]);
  return count;
};

const FALLBACK_CIRCLES = [
  { level: 1, label: 'Circle 1', members: 8, active: 5, earned: 1240, missed: 40, bonus: '2%' },
  { level: 2, label: 'Circle 2', members: 3, active: 2, earned: 680, missed: 18, bonus: '2%' },
  { level: 3, label: 'Circle 3', members: 2, active: 1, earned: 290, missed: 22, bonus: '2%' },
  { level: 4, label: 'Circle 4', members: 1, active: 0, earned: 130, missed: 0, bonus: '2%' },
  { level: 5, label: 'Circle 5', members: 0, active: 0, earned: 0, missed: 0, bonus: '2%' },
];

const LEVEL_STYLES = [
  { ring: 'from-pngwin-green/40 to-pngwin-green/10', dot: 'bg-pngwin-green', text: 'text-pngwin-green', glow: 'shadow-[0_0_12px_hsla(152,100%,45%,0.4)]' },
  { ring: 'from-ice/40 to-ice/10', dot: 'bg-ice', text: 'text-ice', glow: 'shadow-[0_0_12px_hsla(192,100%,50%,0.4)]' },
  { ring: 'from-ice/30 to-ice/5', dot: 'bg-ice', text: 'text-ice', glow: 'shadow-[0_0_12px_hsla(192,100%,50%,0.3)]' },
  { ring: 'from-pngwin-purple/30 to-pngwin-purple/5', dot: 'bg-pngwin-purple', text: 'text-pngwin-purple', glow: 'shadow-[0_0_12px_hsla(270,91%,65%,0.3)]' },
  { ring: 'from-pngwin-purple/20 to-pngwin-purple/5', dot: 'bg-pngwin-purple', text: 'text-pngwin-purple', glow: 'shadow-[0_0_12px_hsla(270,91%,65%,0.2)]' },
];

const TIERS = [
  { name: 'Egg', min: 0, emoji: '🥚', unlock: 'Circle 1', pct: 20 },
  { name: 'Hatchling', min: 3, emoji: '🐣', unlock: 'Circle 1-2', pct: 40 },
  { name: 'Waddle', min: 10, emoji: '🐧', unlock: 'Circle 1-3', pct: 60 },
  { name: 'Colony', min: 25, emoji: '👑', unlock: 'Circle 1-4', pct: 80 },
  { name: 'Emperor', min: 50, emoji: '🏆', unlock: 'All 5 Circles', pct: 100 },
];

const SocialCirclePage = () => {
  const { user } = useAuth();
  const { summary, loading: summaryLoading } = useSocialCircleSummary();
  const [copied, setCopied] = useState(false);
  const [showMissed, setShowMissed] = useState(false);
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  const CIRCLE_DATA = (() => {
    if (summary?.levels && Array.isArray(summary.levels)) {
      return summary.levels.map((lvl: any, i: number) => ({
        level: i + 1,
        label: `Circle ${i + 1}`,
        members: lvl.total ?? lvl.members ?? 0,
        active: lvl.active ?? 0,
        earned: lvl.earned ?? 0,
        missed: lvl.missed ?? 0,
        bonus: `${lvl.pct ?? 2}%`,
      }));
    }
    return FALLBACK_CIRCLES;
  })();

  const totalMembers = CIRCLE_DATA.reduce((a: number, c: any) => a + c.members, 0);
  const totalActive = CIRCLE_DATA.reduce((a: number, c: any) => a + c.active, 0);
  const totalEarned = summary?.total_earned ?? 2340;
  const totalMissed = summary?.total_missed ?? MISSED_BONUSES.reduce((a: number, b: any) => a + b.missed, 0);
  const referralCode = summary?.referral_code ?? 'cryptoking';
  const referralLink = `https://pngwin.io/ref/${referralCode}`;

  const currentTierIdx = TIERS.reduce((acc, t, i) => totalMembers >= t.min ? i : acc, 0);
  const currentTier = TIERS[currentTierIdx];
  const nextTier = TIERS[currentTierIdx + 1];

  const earnedCount = useCounter(totalEarned, heroInView);
  const membersCount = useCounter(totalMembers, heroInView);
  const activeCount = useCounter(totalActive, heroInView);

  const recentEarnings = summary?.recent_earnings ?? [
    { user: '@MoonShot', level: 1, earned: 196, event: 'Won Arctic Rush #46', time: '2m ago' },
    { user: '@StarGazer', level: 1, earned: 65, event: 'PvP Duel win', time: '18m ago' },
    { user: '@ColdFish', level: 2, earned: 40, event: 'Won Quick Freeze', time: '1h ago' },
    { user: '@IcyPenguin', level: 3, earned: 18, event: 'Won Blind Auction', time: '3h ago' },
    { user: '@SnowDrift', level: 2, earned: 12, event: 'PvP Duel win', time: '5h ago' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* ─── HERO SECTION ─── */}
      <div ref={heroRef} className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-radial from-primary/[0.06] to-transparent blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-radial from-ice/[0.04] to-transparent blur-3xl" />
        </div>

        <div className="container py-10 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-primary uppercase tracking-[5px] mb-2 font-semibold">
                Social Circle
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-display text-3xl md:text-4xl font-bold">
                Your Colony
              </motion.h1>
            </div>
            <Link to="/social/how-it-works" className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground font-display font-semibold transition-colors">
              How it works →
            </Link>
          </div>

          {summaryLoading && (
            <div className="text-center py-4 text-muted-foreground text-sm mb-4">Loading social circle data...</div>
          )}

          {/* ─── BIG KPI ROW ─── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Earned', value: earnedCount.toLocaleString(), suffix: ' PNGWIN', color: 'text-primary', border: 'border-gold glow-gold' },
              { label: 'Colony Size', value: membersCount, suffix: ' members', color: 'text-ice', border: 'border-ice' },
              { label: 'Active Now', value: activeCount, suffix: ` / ${totalMembers}`, color: 'text-pngwin-green', border: 'border-l-2 border-l-pngwin-green' },
              { label: 'Missed', value: totalMissed, suffix: ' PNGWIN', color: 'text-pngwin-red', border: 'border-l-2 border-l-pngwin-red', clickable: true },
            ].map((kpi, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.08 }}
                onClick={kpi.clickable ? () => setShowMissed(!showMissed) : undefined}
                className={`bg-card border ${kpi.border} rounded-xl p-5 ${kpi.clickable ? 'cursor-pointer hover:bg-card-hover transition-colors' : ''}`}
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className={`font-mono text-2xl md:text-3xl font-bold ${kpi.color}`}>
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.suffix}</div>
                {kpi.clickable && <div className="text-[9px] text-pngwin-red mt-1">{showMissed ? 'Hide details ▲' : 'View details ▼'}</div>}
              </motion.div>
            ))}
          </div>

          {/* ─── MISSED BONUSES ─── */}
          <AnimatePresence>
            {showMissed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-card border border-pngwin-red/20 rounded-xl p-6">
                  <h3 className="font-display font-bold text-sm mb-1 text-pngwin-red">⚠️ Missed Bonuses — {totalMissed} PNGWIN lost</h3>
                  <p className="text-[10px] text-muted-foreground mb-4">You weren't active when your circle members won</p>
                  <div className="space-y-1.5">
                    {MISSED_BONUSES.map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 bg-red-subtle rounded-lg text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-muted-foreground shrink-0">{m.date}:</span>
                          <span className="font-semibold text-ice truncate">{m.user}</span>
                          <span className="text-muted-foreground truncate hidden sm:inline">{m.event}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-pngwin-red">-{m.missed} PNGWIN</span>
                          <span className="text-[9px] text-muted-foreground">({m.reason})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-gold-subtle border border-gold rounded-lg text-center">
                    <span className="text-xs">💡 <strong>TIP:</strong> Place at least 1 bid in every auction to never miss a bonus!</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ─── LEFT: COLONY VISUALIZATION ─── */}
          <div className="lg:col-span-5 space-y-6">
            {/* Interactive Colony */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary/[0.04] blur-3xl" />
              </div>

              <div className="text-center mb-4 relative z-10">
                <h3 className="font-display font-bold text-lg">Your Colony</h3>
                <p className="text-[10px] text-muted-foreground">5 circles • {totalMembers} members • {totalActive} active</p>
              </div>

              {/* Colony rings */}
              <div className="w-72 h-72 md:w-80 md:h-80 mx-auto relative z-10">
                {/* Concentric rings */}
                {CIRCLE_DATA.map((c: any, i: number) => {
                  const size = 100 - i * 16;
                  const hasMembers = c.members > 0;
                  const isHovered = hoveredLevel === i;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 100 }}
                      onMouseEnter={() => setHoveredLevel(i)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      className="absolute rounded-full transition-all duration-300"
                      style={{
                        width: `${size}%`,
                        height: `${size}%`,
                        left: `${(100 - size) / 2}%`,
                        top: `${(100 - size) / 2}%`,
                        border: `1.5px solid`,
                        borderColor: hasMembers
                          ? isHovered ? 'hsla(var(--primary), 0.5)' : `hsla(var(--border), 0.4)`
                          : 'hsla(var(--border), 0.15)',
                        background: isHovered && hasMembers ? 'hsla(var(--primary), 0.03)' : 'transparent',
                      }}
                    />
                  );
                })}

                {/* Center "YOU" node */}
                <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                  <motion.div
                    animate={{ boxShadow: ['0 0 15px hsla(43,90%,60%,0.3)', '0 0 30px hsla(43,90%,60%,0.5)', '0 0 15px hsla(43,90%,60%,0.3)'] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-xs font-display font-bold text-primary-foreground"
                  >
                    YOU
                  </motion.div>
                </div>

                {/* Member dots */}
                {CIRCLE_DATA.map((c: any, ring: number) => {
                  if (c.members === 0) return null;
                  const count = Math.min(c.members, 12);
                  const radiusPct = 10 + ring * 8;
                  return Array.from({ length: count }).map((_, j) => {
                    const angle = (j / count) * 2 * Math.PI - Math.PI / 2 + ring * 0.4;
                    const x = 50 + radiusPct * Math.cos(angle);
                    const y = 50 + radiusPct * Math.sin(angle);
                    const isActive = j < c.active;
                    const style = LEVEL_STYLES[ring];
                    return (
                      <motion.div
                        key={`${ring}-${j}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + ring * 0.12 + j * 0.04, type: 'spring' }}
                        className={`absolute rounded-full transition-all duration-300 ${
                          isActive ? `${style.dot} ${hoveredLevel === ring ? style.glow : ''}` : 'bg-muted-foreground/20'
                        }`}
                        style={{
                          width: isActive ? '8px' : '5px',
                          height: isActive ? '8px' : '5px',
                          left: `${x}%`,
                          top: `${y}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                    );
                  });
                })}

                {/* Pulse rings from center */}
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={`pulse-${i}`}
                    className="absolute rounded-full border border-primary/10"
                    style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                    animate={{ width: ['24px', '160px'], height: ['24px', '160px'], opacity: [0.4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, delay: i * 1.3 }}
                  />
                ))}
              </div>

              {/* Level legend */}
              <div className="flex justify-between mt-6 px-2 relative z-10">
                {CIRCLE_DATA.map((c: any, i: number) => {
                  const style = LEVEL_STYLES[i];
                  return (
                    <motion.div
                      key={i}
                      onMouseEnter={() => setHoveredLevel(i)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      className={`text-center cursor-pointer transition-all duration-200 ${hoveredLevel === i ? 'scale-110' : ''}`}
                    >
                      <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${c.members > 0 ? style.dot : 'bg-muted-foreground/20'}`} />
                      <div className="text-[9px] text-muted-foreground">L{c.level}</div>
                      <div className={`font-mono text-xs font-bold ${c.members > 0 ? style.text : 'text-muted-foreground/40'}`}>{c.bonus}</div>
                      <div className="text-[8px] text-muted-foreground">{c.active}/{c.members}</div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Hovered level detail tooltip */}
              <AnimatePresence>
                {hoveredLevel !== null && CIRCLE_DATA[hoveredLevel].members > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="mt-4 bg-secondary border border-border rounded-lg p-3 relative z-10"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-display font-bold ${LEVEL_STYLES[hoveredLevel].text}`}>
                        {CIRCLE_DATA[hoveredLevel].label}
                      </span>
                      <span className="text-muted-foreground">
                        {CIRCLE_DATA[hoveredLevel].active} active / {CIRCLE_DATA[hoveredLevel].members} total
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Earned</span>
                      <span className="font-mono font-bold text-pngwin-green">+{CIRCLE_DATA[hoveredLevel].earned?.toLocaleString() ?? 0}</span>
                    </div>
                    {(CIRCLE_DATA[hoveredLevel].missed ?? 0) > 0 && (
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-muted-foreground">Missed</span>
                        <span className="font-mono font-bold text-pngwin-red">-{CIRCLE_DATA[hoveredLevel].missed}</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* ─── TIER PROGRESS ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-display font-bold text-sm mb-4">Colony Rank</h3>

              {/* Current tier badge */}
              <div className="flex items-center gap-4 mb-5 p-4 bg-gold-subtle border border-gold rounded-xl">
                <span className="text-3xl">{currentTier.emoji}</span>
                <div className="flex-1">
                  <div className="font-display font-bold text-lg text-primary">{currentTier.name}</div>
                  <div className="text-xs text-muted-foreground">Unlocks: {currentTier.unlock}</div>
                </div>
                {nextTier && (
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Next: {nextTier.name}</div>
                    <div className="text-xs font-mono font-bold text-primary">{nextTier.min - totalMembers} more</div>
                  </div>
                )}
              </div>

              {/* Tier steps */}
              <div className="flex items-center gap-1 mb-3">
                {TIERS.map((t, i) => (
                  <div key={i} className="flex-1 relative">
                    <div className={`h-2 rounded-full transition-colors ${i <= currentTierIdx ? 'gradient-gold' : 'bg-border'}`} />
                    <div className={`absolute -top-0.5 right-0 w-3 h-3 rounded-full border-2 border-background ${
                      i <= currentTierIdx ? 'gradient-gold' : 'bg-border'
                    }`} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-muted-foreground">
                {TIERS.map((t, i) => (
                  <span key={i} className={i <= currentTierIdx ? 'text-primary font-semibold' : ''}>{t.emoji} {t.name}</span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── RIGHT: EARNINGS & REFERRAL ─── */}
          <div className="lg:col-span-7 space-y-6">

            {/* ─── REFERRAL LINK ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-card border border-gold/20 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-primary/[0.06] blur-3xl" />
              </div>
              <div className="relative z-10">
                <h3 className="font-display font-bold text-sm mb-1">Grow Your Colony</h3>
                <p className="text-[10px] text-muted-foreground mb-4">Share your link — everyone who joins plays for you, up to 5 levels deep.</p>
                <div className="flex gap-2 mb-3">
                  <input readOnly value={referralLink} className="flex-1 px-3 py-2.5 bg-background border border-border rounded-lg font-mono text-xs text-muted-foreground" />
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="px-5 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold"
                  >
                    {copied ? '✓ Copied' : 'Copy Link'}
                  </motion.button>
                </div>
                <div className="flex gap-2">
                  {[
                    { name: 'Telegram', icon: '✈️' },
                    { name: 'WhatsApp', icon: '💬' },
                    { name: 'Twitter / X', icon: '𝕏' },
                  ].map(p => (
                    <button key={p.name} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <span>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ─── CIRCLE BREAKDOWN CARDS ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card border border-border rounded-2xl p-6"
            >
              <h3 className="font-display font-bold text-sm mb-4">Circle Breakdown</h3>
              <div className="space-y-2">
                {CIRCLE_DATA.map((c: any, i: number) => {
                  const style = LEVEL_STYLES[i];
                  const activePct = c.members > 0 ? (c.active / c.members) * 100 : 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.08 }}
                      onMouseEnter={() => setHoveredLevel(i)}
                      onMouseLeave={() => setHoveredLevel(null)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                        c.members > 0
                          ? 'border-border hover:border-primary/30 bg-card cursor-pointer'
                          : 'border-border/30 bg-muted/10 opacity-40'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full shrink-0 ${c.members > 0 ? style.dot : 'bg-muted-foreground/20'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{c.label}</span>
                          <span className="text-[10px] text-muted-foreground">{c.active}/{c.members} active</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${style.dot}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${activePct}%` }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        {c.earned > 0 && <div className="font-mono text-xs font-bold text-pngwin-green">+{c.earned.toLocaleString()}</div>}
                        <div className={`font-mono text-[10px] font-bold ${style.text}`}>{c.bonus}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">{totalActive}/{totalMembers} active</span>
                  <span className="font-mono font-bold text-pngwin-green">+{totalEarned.toLocaleString()}</span>
                </div>
              </div>
            </motion.div>

            {/* ─── LIVE EARNINGS FEED ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-sm">Recent Earnings</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-pngwin-green animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">Live</span>
                </div>
              </div>
              <div className="divide-y divide-border/50">
                {recentEarnings.map((e: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.08 }}
                    className="px-6 py-3.5 flex items-center justify-between hover:bg-card-hover transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${LEVEL_STYLES[Math.min((e.level ?? 1) - 1, 4)].dot} text-primary-foreground`}>
                        L{e.level}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold truncate">{e.user}</span>
                          <span className="text-[10px] text-muted-foreground hidden sm:inline">{e.time ?? ''}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{e.event}</div>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-pngwin-green shrink-0">+{e.earned}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ─── ACTIVITY STATS ─── */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { label: 'Active Members', value: totalActive, icon: '🟢', color: 'text-pngwin-green' },
                { label: 'Circle Bids', value: summary?.circle_bids ?? 47, icon: '🎯', color: 'text-ice' },
                { label: 'This Week', value: `${totalEarned.toLocaleString()}`, icon: '💰', color: 'text-primary' },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className={`font-mono text-xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCirclePage;
