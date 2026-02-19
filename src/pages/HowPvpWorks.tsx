import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STEPS = [
  { icon: '⚡', title: 'Choose Your Stake', desc: 'Pick a duel room from 10 to 5,000 PNGWIN. Higher stakes, bigger rewards.' },
  { icon: '🔒', title: 'Place Your Sealed Bid', desc: "Enter a value (XX.XX format) from 0.01 to 99.99. Your opponent can't see it." },
  { icon: '⏳', title: 'Wait for Opponent', desc: 'Your opponent places their sealed bid. Neither can see the other.' },
  { icon: '🎲', title: 'Random Number Generated', desc: 'A provably fair random number between 00.01 and 99.99 is generated.' },
  { icon: '🏆', title: 'Closest Unique Bid Wins', desc: 'Whoever bid closest to the random number takes the pot! If both bid identically, the first bidder wins.' },
];

const HowPvpWorks = () => (
  <div className="min-h-screen pt-16 pb-20 md:pb-0">
    <div className="container py-12 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold mb-3">How PvP Duels Work</h1>
        <p className="text-muted-foreground">1v1 sealed bid duels. Quick. Exciting. Skill-based.</p>
      </div>

      <div className="space-y-6 mb-12">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex gap-5 items-start bg-card border border-border rounded-lg p-6"
          >
            <div className="text-4xl shrink-0">{step.icon}</div>
            <div>
              <span className="text-xs text-muted-foreground font-mono">STEP {i + 1}</span>
              <h3 className="font-display font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Split */}
      <div className="bg-card border border-border rounded-lg p-6 mb-8">
        <h3 className="font-semibold mb-3">Revenue Split (per duel)</h3>
        <div className="flex gap-2 flex-wrap">
          {[
            { pct: '65%', label: 'Winner', color: 'text-pngwin-green' },
            { pct: '10%', label: 'Burn', color: 'text-pngwin-orange' },
            { pct: '10%', label: 'Platform', color: 'text-muted-foreground' },
            { pct: '5%', label: 'Social', color: 'text-ice' },
            { pct: '10%', label: 'Jackpot', color: 'text-primary' },
          ].map((item, i) => (
            <div key={i} className="flex-1 min-w-[70px] text-center p-3 bg-background rounded-md">
              <div className={`font-mono text-lg font-bold ${item.color}`}>{item.pct}</div>
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <Link to="/pvp" className="inline-block px-8 py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold">
          Enter Arena →
        </Link>
      </div>
    </div>
  </div>
);

export default HowPvpWorks;
