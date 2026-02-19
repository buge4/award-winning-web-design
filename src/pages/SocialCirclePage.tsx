import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

const CIRCLE_DATA = [
  { level: 1, label: 'Circle 1', members: 8, active: 5, color: 'bg-pngwin-green', textColor: 'text-pngwin-green', borderColor: 'border-pngwin-green/30', bonus: '2%' },
  { level: 2, label: 'Circle 2', members: 3, active: 2, color: 'bg-ice', textColor: 'text-ice', borderColor: 'border-ice/30', bonus: '2%' },
  { level: 3, label: 'Circle 3', members: 2, active: 1, color: 'bg-ice', textColor: 'text-ice', borderColor: 'border-ice/30', bonus: '2%' },
  { level: 4, label: 'Circle 4', members: 1, active: 0, color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple', borderColor: 'border-pngwin-purple/30', bonus: '2%' },
  { level: 5, label: 'Circle 5', members: 0, active: 0, color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple', borderColor: 'border-pngwin-purple/30', bonus: '2%' },
];

const TIERS = [
  { name: 'Egg', min: 0, color: 'text-muted-foreground', bonus: '1x' },
  { name: 'Hatchling', min: 3, color: 'text-pngwin-green', bonus: '1.2x' },
  { name: 'Waddle', min: 10, color: 'text-ice', bonus: '1.5x' },
  { name: 'Colony', min: 25, color: 'text-pngwin-purple', bonus: '2x' },
  { name: 'Emperor', min: 50, color: 'text-primary', bonus: '3x' },
];

const REFERRAL_EARNINGS = [
  { user: '@MoonShot', level: 1, earned: 196, event: 'Won Arctic Rush #46' },
  { user: '@StarGazer', level: 1, earned: 65, event: 'PvP Duel win' },
  { user: '@ColdFish', level: 2, earned: 40, event: 'Won Quick Freeze' },
  { user: '@IcyPenguin', level: 3, earned: 18, event: 'Won Blind Auction' },
  { user: '@SnowDrift', level: 2, earned: 12, event: 'PvP Duel win' },
];

const totalMembers = CIRCLE_DATA.reduce((a, c) => a + c.members, 0);
const totalActive = CIRCLE_DATA.reduce((a, c) => a + c.active, 0);

const SocialCirclePage = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://pngwin.io/ref/cryptoking';

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl font-bold">🐧 Social Circle</h1>
          <Link to="/social/how-it-works" className="px-4 py-2 bg-secondary border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground font-display font-semibold transition-colors">
            How it works →
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Total Members" value={totalMembers} color="ice" />
          <KpiCard label="Active This Week" value={totalActive} color="green" />
          <KpiCard label="Total Earned" value="2,340" color="gold" />
          <KpiCard label="Missed Bonuses" value="180" color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Interactive Circle Visualization */}
          <div className="lg:col-span-1 space-y-5">
            {/* Visualization */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-bold text-sm mb-4 text-center">Your Colony</h3>
              <div className="w-56 h-56 mx-auto relative">
                {/* Concentric rings */}
                {CIRCLE_DATA.map((c, i) => {
                  const inset = `${48 - i * 10}%`;
                  const hasMembers = c.members > 0;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`absolute rounded-full border-2 ${hasMembers ? c.borderColor : 'border-border/30'} ${hasMembers ? '' : 'opacity-30'}`}
                      style={{ inset }}
                    />
                  );
                })}
                {/* Center */}
                <div className="absolute inset-[48%] rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-[10px] font-bold text-background shadow-gold">YOU</div>
                </div>
                {/* Dots for each circle member */}
                {CIRCLE_DATA.map((c, ring) => {
                  if (c.members === 0) return null;
                  const count = Math.min(c.members, 8);
                  const radius = 26 + ring * 14;
                  return Array.from({ length: count }).map((_, j) => {
                    const angle = (j / count) * 2 * Math.PI - Math.PI / 2 + ring * 0.3;
                    const x = 50 + radius * Math.cos(angle) / 1.1;
                    const y = 50 + radius * Math.sin(angle) / 1.1;
                    const isActive = j < c.active;
                    return (
                      <motion.div
                        key={`${ring}-${j}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: ring * 0.15 + j * 0.05 }}
                        className={`absolute w-2 h-2 rounded-full ${isActive ? c.color : 'bg-muted-foreground/30'}`}
                        style={{ left: `${x}%`, top: `${y}%` }}
                        title={isActive ? 'Active' : 'Inactive'}
                      />
                    );
                  });
                })}
                {/* Pulse */}
                {[0, 1].map(i => (
                  <motion.div
                    key={`p-${i}`}
                    className="absolute inset-[42%] rounded-full border border-primary/15"
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: i * 1.5 }}
                  />
                ))}
              </div>

              {/* Level legend */}
              <div className="flex justify-between mt-5">
                {CIRCLE_DATA.map((c, i) => (
                  <div key={i} className="text-center">
                    <div className="text-[8px] text-muted-foreground">L{c.level}</div>
                    <div className={`font-mono text-xs font-bold ${c.textColor}`}>{c.bonus}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Level Breakdown */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-bold text-sm mb-3">Circle Breakdown</h3>
              <div className="space-y-2">
                {CIRCLE_DATA.map((c, i) => (
                  <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${c.members > 0 ? c.borderColor + ' bg-card' : 'border-border/30 bg-muted/20 opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${c.members > 0 ? c.color : 'bg-muted-foreground/30'}`} />
                      <span className="text-xs font-semibold">{c.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">{c.active}/{c.members} active</span>
                      <span className={`font-mono font-bold ${c.textColor}`}>{c.members}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{totalActive}/{totalMembers} active</span>
                  <span className="font-mono font-bold text-primary">{totalMembers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-5">
            {/* Referral Link */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Your Referral Link</h3>
              <div className="flex gap-2 mb-3">
                <input readOnly value={referralLink} className="flex-1 px-3 py-2 bg-background border border-border rounded-md font-mono text-xs text-muted-foreground" />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-md shadow-gold"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </motion.button>
              </div>
              <div className="flex gap-2">
                {['Telegram', 'WhatsApp', 'Twitter'].map(p => (
                  <button key={p} className="px-3 py-1.5 bg-secondary border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors">{p}</button>
                ))}
              </div>
            </div>

            {/* Tier Progress */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Tier Progress</h3>
              <div className="flex items-center gap-2 mb-3">
                {TIERS.map((tier, i) => (
                  <div key={i} className={`flex-1 text-center py-2 rounded text-[10px] font-semibold ${
                    totalMembers >= tier.min ? `${tier.color} bg-gold-subtle` : 'text-muted-foreground bg-muted'
                  }`}>
                    {tier.name}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${Math.min((totalMembers / 25) * 100, 100)}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">{totalMembers}/25 referrals to Colony tier (2x bonus multiplier)</div>
            </div>

            {/* Activity This Week */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Activity This Week</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-background rounded-lg p-3 text-center">
                  <div className="font-mono text-xl font-bold text-ice">{totalActive}</div>
                  <div className="text-[10px] text-muted-foreground">Active Members</div>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <div className="font-mono text-xl font-bold text-pngwin-green">47</div>
                  <div className="text-[10px] text-muted-foreground">Bids By Circle</div>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <div className="font-mono text-xl font-bold text-primary">331</div>
                  <div className="text-[10px] text-muted-foreground">Earned (PNGWIN)</div>
                </div>
              </div>
            </div>

            {/* Earnings Table */}
            <div className="bg-card border border-border rounded-lg">
              <div className="px-5 py-3 border-b border-border font-display font-bold text-sm">Recent Earnings</div>
              {REFERRAL_EARNINGS.map((e, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-ice-subtle text-ice">L{e.level}</span>
                    <div>
                      <span className="text-sm font-semibold">{e.user}</span>
                      <div className="text-[11px] text-muted-foreground">{e.event}</div>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-pngwin-green">+{e.earned}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCirclePage;
