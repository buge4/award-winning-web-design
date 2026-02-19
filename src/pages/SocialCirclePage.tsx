import { useState } from 'react';
import { motion } from 'framer-motion';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

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
        <h1 className="font-display text-3xl font-bold mb-6">🐧 Social Circle</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <KpiCard label="Circle Size" value={14} color="ice" />
          <KpiCard label="Active This Week" value={8} color="green" />
          <KpiCard label="Total Earned" value="2,340" color="gold" />
          <KpiCard label="Missed Bonuses" value="180" color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Circle Visualization */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-bold text-sm mb-4 text-center">Your Colony</h3>
              <div className="w-56 h-56 mx-auto relative">
                {/* Concentric rings */}
                <div className="absolute inset-0 rounded-full border border-pngwin-purple/15" />
                <div className="absolute inset-[12%] rounded-full border border-pngwin-purple/20" />
                <div className="absolute inset-[24%] rounded-full border border-ice/25" />
                <div className="absolute inset-[36%] rounded-full border border-ice/35" />
                <div className="absolute inset-[48%] rounded-full border border-pngwin-green/40" />
                <div className="absolute inset-[48%] rounded-full flex items-center justify-center text-3xl">🐧</div>
                {/* Level labels */}
                <div className="absolute -right-2 top-[48%] text-[9px] text-pngwin-green font-semibold">L1</div>
                <div className="absolute -right-2 top-[36%] text-[9px] text-ice font-semibold">L2</div>
                <div className="absolute -right-2 top-[24%] text-[9px] text-ice font-semibold">L3</div>
                <div className="absolute -right-2 top-[12%] text-[9px] text-pngwin-purple font-semibold">L4</div>
                <div className="absolute -right-2 top-0 text-[9px] text-pngwin-purple font-semibold">L5</div>
                {/* People dots */}
                <div className="absolute top-[42%] left-[25%] text-sm">👤</div>
                <div className="absolute top-[52%] left-[70%] text-sm">👤</div>
                <div className="absolute top-[38%] left-[62%] text-sm">👤</div>
                <div className="absolute top-[58%] left-[30%] text-sm">👤</div>
                <div className="absolute top-[28%] left-[45%] text-xs opacity-75">👤</div>
                <div className="absolute top-[68%] left-[55%] text-xs opacity-75">👤</div>
                <div className="absolute top-[18%] left-[35%] text-xs opacity-50">👤</div>
                <div className="absolute top-[22%] left-[60%] text-xs opacity-50">👤</div>
              </div>

              {/* Level bonuses */}
              <div className="flex justify-between mt-6 text-center">
                {[
                  { l: 'L1', pct: '8%', c: 'text-pngwin-green' },
                  { l: 'L2', pct: '5%', c: 'text-ice' },
                  { l: 'L3', pct: '3%', c: 'text-ice' },
                  { l: 'L4', pct: '2%', c: 'text-pngwin-purple' },
                  { l: 'L5', pct: '2%', c: 'text-pngwin-purple' },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="text-[9px] text-muted-foreground">{item.l}</div>
                    <div className={`font-mono text-sm font-bold ${item.c}`}>{item.pct}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Referral + Earnings */}
          <div className="lg:col-span-2 space-y-5">
            {/* Referral Link */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Your Referral Link</h3>
              <div className="flex gap-2 mb-3">
                <input
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-md font-mono text-xs text-muted-foreground"
                />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-md shadow-gold"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </motion.button>
              </div>
              <div className="flex gap-2">
                {['Telegram', 'WhatsApp', 'Twitter'].map(platform => (
                  <button key={platform} className="px-3 py-1.5 bg-secondary border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors">
                    {platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Tier Progress */}
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Tier Progress</h3>
              <div className="flex items-center gap-2 mb-3">
                {TIERS.map((tier, i) => (
                  <div key={i} className={`flex-1 text-center py-2 rounded text-[10px] font-semibold ${
                    14 >= tier.min ? `${tier.color} bg-gold-subtle` : 'text-muted-foreground bg-muted'
                  }`}>
                    {tier.name}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold" style={{ width: `${(14 / 25) * 100}%` }} />
              </div>
              <div className="text-xs text-muted-foreground mt-2">14/25 referrals to Colony tier (2x bonus multiplier)</div>
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

        {/* How Bonuses Work */}
        <div className="bg-card border border-border rounded-lg p-6 mt-8">
          <h3 className="font-semibold mb-3">How Social Circle Bonuses Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
            <div><span className="font-semibold text-foreground">Automatic:</span> When anyone in your circle wins a prize, you earn a bonus % based on their level in your network.</div>
            <div><span className="font-semibold text-foreground">5 Levels Deep:</span> L1 = 8%, L2 = 5%, L3 = 3%, L4 = 2%, L5 = 2%. Total potential: 20% bonus.</div>
            <div><span className="font-semibold text-foreground">Tier Multiplier:</span> Grow your circle to unlock tier bonuses that multiply all earnings. Emperor tier = 3x!</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialCirclePage;
