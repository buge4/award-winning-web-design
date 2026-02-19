import { motion, useInView } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import slide1Img from '@/assets/social/slide1-hook.jpg';
import slide2Img from '@/assets/social/slide2-foundation.jpg';
import slide3Img from '@/assets/social/slide3-duplication.jpg';
import slide4Img from '@/assets/social/slide4-reward.jpg';
import slide5Img from '@/assets/social/slide5-jackpot.jpg';
import slide6Img from '@/assets/social/slide6-tiers.jpg';
import slide7Img from '@/assets/social/slide7-power.jpg';
import slide8Img from '@/assets/social/slide8-cta.jpg';

/* ─── Animated counter hook ─── */
const useCounter = (target: number, inView: boolean, duration = 1500) => {
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

/* ─── Panel image component ─── */
const PanelImage = ({ src, alt }: { src: string; alt: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6 }}
    className="w-full rounded-2xl overflow-hidden border border-border/30 shadow-2xl"
  >
    <img src={src} alt={alt} className="w-full h-auto object-cover" loading="lazy" />
  </motion.div>
);

/* ─── Section wrapper with scroll detection ─── */
const Section = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });
  return (
    <div ref={ref} className={`min-h-screen flex items-center justify-center px-6 py-20 ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="max-w-5xl w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

const HowSocialCircleWorks = () => {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://pngwin.io/ref/cryptoking';

  // Counters
  const megaRef = useRef(null);
  const megaInView = useInView(megaRef, { once: true, margin: '-20%' });
  const megaJackpot = useCounter(1000000, megaInView);
  const megaBonus = useCounter(100000, megaInView);
  const megaYou = useCounter(20000, megaInView);

  const networkRef = useRef(null);
  const networkInView = useInView(networkRef, { once: true, margin: '-20%' });
  const networkCoupons = useCounter(847, networkInView);
  const networkTotal = useCounter(3905, networkInView);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      {/* Slide 1: The Hook */}
      <Section>
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <div className="text-xs text-primary uppercase tracking-[6px] mb-6 font-semibold">🐧 SOCIAL CIRCLE</div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-6 max-w-4xl mx-auto">
              Everyone in Your Circle Who Is Playing,{' '}
              <span className="text-primary">Plays For YOU</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-12">
              Build your circle. When they win, you win. It's that simple.
            </p>
          </motion.div>
          <PanelImage src={slide1Img} alt="Social Circle network visualization with concentric rings" />
        </div>
      </Section>

      {/* Slide 2: Build the First Circle */}
      <Section className="bg-card/30">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs text-pngwin-green uppercase tracking-[4px] mb-3 font-semibold">STEP 1</div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">
              Your First Circle Is Your <span className="text-pngwin-green">Foundation</span>
            </h2>
            <p className="text-muted-foreground text-base mb-6">
              Share your referral link. Every person who signs up using your link joins your 1st Circle. There's <span className="text-foreground font-semibold">no limit</span> — the more people in your first circle, the stronger your network.
            </p>
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Your Referral Link</div>
              <div className="flex gap-2">
                <input readOnly value={referralLink} className="flex-1 px-3 py-2 bg-card border border-border rounded-md font-mono text-xs text-muted-foreground" />
                <button onClick={handleCopy} className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-md shadow-gold">
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <PanelImage src={slide2Img} alt="First circle with numbered referrals around you" />
        </div>
      </Section>

      {/* Slide 3: Circles Grow */}
      <Section>
        <div className="text-center mb-12">
          <div className="text-xs text-ice uppercase tracking-[4px] mb-3 font-semibold">STEP 2</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Circles Grow By <span className="text-ice">Duplication</span>
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Your friends' friends' friends are all playing for you — up to 5 levels deep.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <PanelImage src={slide3Img} alt="Exponential network growth visualization" />

          <div className="space-y-3">
            <div className="text-sm text-muted-foreground mb-4">If everyone invites just 5 people:</div>
            {[
              { label: 'Circle 1 — Your direct referrals', count: 5, color: 'bg-pngwin-green', textColor: 'text-pngwin-green' },
              { label: 'Circle 2 — Friends of friends', count: 25, color: 'bg-ice', textColor: 'text-ice' },
              { label: 'Circle 3 — 3 levels deep', count: 125, color: 'bg-ice', textColor: 'text-ice' },
              { label: 'Circle 4 — 4 levels deep', count: 625, color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple' },
              { label: 'Circle 5 — 5 levels deep', count: 3125, color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-3"
              >
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm flex-1">{item.label}</span>
                <span className={`font-mono text-sm font-bold ${item.textColor}`}>{item.count.toLocaleString()}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="bg-gold-subtle border border-gold rounded-lg px-4 py-3 text-center"
            >
              <span className="text-sm text-muted-foreground">Total: </span>
              <span className="font-mono text-xl font-bold text-primary">3,905 people playing for you!</span>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* Slide 4: How It Pays */}
      <Section className="bg-card/30">
        <div className="text-center mb-12">
          <div className="text-xs text-primary uppercase tracking-[4px] mb-3 font-semibold">THE REWARD</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            <span className="text-primary">10%</span> of Every Prize Goes to the Social Circle
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            When someone in your circle wins, 10% of their prize is split across the 5 levels above them.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <PanelImage src={slide4Img} alt="Prize pool splitting into 5 reward levels" />
          
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="text-sm text-muted-foreground">Prize Pool Example</div>
              <div className="font-mono text-4xl font-bold text-primary">100,000 PNGWIN</div>
              <div className="text-sm text-muted-foreground mt-1">10% = 10,000 PNGWIN to Social Circle</div>
            </div>

            <div className="space-y-2">
              {[
                { level: 1, label: 'Level 1 — Direct referrer', pct: '2%', amount: '2,000', color: 'border-pngwin-green/30 bg-green-subtle' },
                { level: 2, label: 'Level 2', pct: '2%', amount: '2,000', color: 'border-ice/30 bg-ice-subtle' },
                { level: 3, label: 'Level 3', pct: '2%', amount: '2,000', color: 'border-ice/30 bg-ice-subtle' },
                { level: 4, label: 'Level 4', pct: '2%', amount: '2,000', color: 'border-pngwin-purple/30 bg-purple-subtle' },
                { level: 5, label: 'Level 5', pct: '2%', amount: '2,000', color: 'border-pngwin-purple/30 bg-purple-subtle' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${item.color}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">{item.pct}</span>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-mono text-sm font-bold text-pngwin-green">{item.amount} PNGWIN</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Slide 5: Mega Jackpot Example */}
      <Section>
        <div ref={megaRef} className="text-center">
          <div className="text-xs text-primary uppercase tracking-[4px] mb-3 font-semibold">THE BIG ONE</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-8">
            When Your Circle Wins <span className="text-primary">BIG</span>
          </h2>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <PanelImage src={slide5Img} alt="Massive jackpot win celebration with trophy and coins" />

            <div>
              <div className="bg-card border border-gold/20 rounded-xl p-8 glow-gold mb-6">
                <div className="text-4xl mb-4">🏆</div>
                <div className="text-sm text-muted-foreground mb-1">@MoonShot (in your 3rd circle) wins the MEGA JACKPOT</div>
                <div className="font-mono text-4xl md:text-5xl font-bold text-primary mb-4">
                  {megaJackpot.toLocaleString()} <span className="text-xl">PNGWIN</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  10% Social Circle Bonus = <span className="font-mono font-bold text-pngwin-green">{megaBonus.toLocaleString()} PNGWIN</span>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  { level: 1, who: 'Who referred @MoonShot', amount: 20000 },
                  { level: 2, who: 'Level 2 upline', amount: 20000 },
                  { level: 3, who: "That's YOU! 🎉", amount: 20000, highlight: true },
                  { level: 4, who: 'Level 4 upline', amount: 20000 },
                  { level: 5, who: 'Level 5 upline', amount: 20000 },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-lg border text-sm ${
                      item.highlight
                        ? 'border-gold/40 bg-gold-subtle glow-gold'
                        : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">L{item.level}</span>
                      <span className={item.highlight ? 'font-bold text-primary' : ''}>{item.who}</span>
                    </div>
                    <span className="font-mono font-bold text-pngwin-green">+{item.amount.toLocaleString()}</span>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="bg-gold-subtle border border-gold rounded-xl p-5 glow-gold"
              >
                <div className="text-sm text-muted-foreground mb-1">You just earned</div>
                <div className="font-mono text-3xl font-bold text-primary">{megaYou.toLocaleString()} PNGWIN</div>
                <div className="text-sm text-muted-foreground mt-1">because someone 3 levels deep won! 🎉</div>
              </motion.div>
            </div>
          </div>
        </div>
      </Section>

      {/* Slide 6: Stay Active */}
      <Section className="bg-card/30">
        <div className="text-center mb-10">
          <div className="text-xs text-pngwin-orange uppercase tracking-[4px] mb-3 font-semibold">IMPORTANT</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Stay Active to <span className="text-pngwin-orange">Unlock</span> Your Rewards
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            You must participate in the same game as the winner to qualify. Inactive uplines forfeit — their bonus rolls into the Jackpot.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-4xl mx-auto">
          <div className="space-y-3">
            {[
              { tier: 'Tier 1', req: 'Place 1+ bid this round', unlock: 'Circle 1 rewards', pct: 25, color: 'text-muted-foreground' },
              { tier: 'Tier 2', req: 'Place 5+ bids this week', unlock: 'Circle 1-2 rewards', pct: 50, color: 'text-pngwin-green' },
              { tier: 'Tier 3', req: '3+ active circle members', unlock: 'Circle 1-3 rewards', pct: 75, color: 'text-ice' },
              { tier: 'Tier 4', req: '10+ active circle members', unlock: 'ALL 5 circles', pct: 100, color: 'text-primary' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-lg p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`font-display font-bold text-sm ${item.color}`}>{item.tier}</span>
                    <span className="text-xs text-muted-foreground">{item.req}</span>
                  </div>
                  <span className="text-xs font-semibold text-primary">{item.unlock} ({item.pct}%)</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${item.pct}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <PanelImage src={slide6Img} alt="Tier unlock progression system" />
        </div>
      </Section>

      {/* Slide 7: Why Powerful */}
      <Section>
        <div ref={networkRef} className="text-center mb-12">
          <div className="text-xs text-ice uppercase tracking-[4px] mb-3 font-semibold">THE POWER</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            The More People, The More <span className="text-ice">Chances</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto mb-10">
          <PanelImage src={slide7Img} alt="Solo player vs networked player comparison" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="text-pngwin-red text-3xl mb-3">😐</div>
            <h3 className="font-display font-bold text-lg mb-2">Without Social Circle</h3>
            <p className="text-muted-foreground text-sm">
              You play alone. You can only win if YOUR bid wins. One shot per game.
            </p>
          </div>
          <div className="bg-card border border-gold/20 rounded-xl p-6 glow-gold">
            <div className="text-primary text-3xl mb-3">🚀</div>
            <h3 className="font-display font-bold text-lg mb-2 text-primary">With Social Circle</h3>
            <p className="text-muted-foreground text-sm mb-4">
              <span className="font-mono font-bold text-primary">{networkTotal.toLocaleString()}</span> people playing for you. ANY of them winning means YOU earn.
            </p>
            <div className="bg-background rounded-lg p-3 text-center">
              <div className="text-xs text-muted-foreground mb-1">Your network submitted this week</div>
              <div className="font-mono text-2xl font-bold text-ice">{networkCoupons.toLocaleString()} bids</div>
              <div className="text-[10px] text-muted-foreground">That's {networkCoupons.toLocaleString()} chances for YOU to earn</div>
            </div>
          </div>
        </div>
      </Section>

      {/* Slide 8: CTA */}
      <Section className="bg-card/30">
        <div className="text-center">
          <div className="text-xs text-primary uppercase tracking-[6px] mb-6 font-semibold">GET STARTED</div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-8">
            Start Building Your Circle <span className="text-primary">Today</span>
          </h2>

          <div className="max-w-2xl mx-auto mb-10">
            <PanelImage src={slide8Img} alt="Share your referral link across social platforms" />
          </div>

          {/* Referral Link */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2 mb-3">
              <input readOnly value={referralLink} className="flex-1 px-3 py-2.5 bg-background border border-border rounded-md font-mono text-xs text-muted-foreground" />
              <button onClick={handleCopy} className="px-5 py-2.5 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-md shadow-gold">
                {copied ? '✓ Copied' : 'Copy Link'}
              </button>
            </div>
            <div className="flex gap-2 justify-center">
              {['Telegram', 'WhatsApp', 'Twitter', 'Email'].map(p => (
                <button key={p} className="px-3 py-1.5 bg-secondary border border-border rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Preview stats */}
          <div className="bg-card border border-border rounded-xl p-5 max-w-md mx-auto mb-8">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="font-mono text-xl font-bold text-ice">33</div>
                <div className="text-[10px] text-muted-foreground">Circle Members</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-pngwin-green">7</div>
                <div className="text-[10px] text-muted-foreground">Active This Week</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-primary">127</div>
                <div className="text-[10px] text-muted-foreground">Total Earned (PNGWIN)</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-pngwin-red">43</div>
                <div className="text-[10px] text-muted-foreground">Missed Bonuses</div>
              </div>
            </div>
          </div>

          <Link
            to="/social"
            className="inline-block px-8 py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold"
          >
            Go to My Social Circle →
          </Link>
        </div>
      </Section>
    </div>
  );
};

export default HowSocialCircleWorks;
