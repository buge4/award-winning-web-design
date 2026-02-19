import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STEPS = [
  { icon: '🎯', title: 'Place a Bid', desc: 'Choose a value between 00.01 and 99.99. Each bid costs a small fee that goes into the prize pool.' },
  { icon: '🔥', title: 'Unique or Burned', desc: 'If someone else bids the same value, both bids are burned. Your bid must be unique to survive.' },
  { icon: '🏆', title: 'Highest Unique Wins', desc: 'When the auction ends, the highest bid value that is still unique wins the entire prize pool.' },
  { icon: '🧠', title: 'Bid Smart', desc: "Obvious numbers get burned fast. Think differently. The strategic player wins, not the lucky one." },
  { icon: '💎', title: 'Earn & Grow', desc: 'Win prizes, build your Social Circle, climb the leaderboard. Every win in your network earns passive rewards.' },
];

const TYPES = [
  { icon: '🎯', name: 'Live', color: 'border-gold/30', desc: 'Bids accumulate until a target is reached, triggering "Hot Mode" — a countdown where every bid adds +30 seconds. When time runs out, highest unique bid wins.', phases: ['Accumulation', 'Hot Mode', 'Winner'] },
  { icon: '⏱️', name: 'Timed', color: 'border-ice/30', desc: 'Fixed countdown. Simple and straightforward. When the timer hits zero, highest unique bid wins the pool.', phases: ['Timer Starts', 'Bids Placed', 'Winner'] },
  { icon: '🙈', name: 'Blind', color: 'border-pngwin-purple/30', desc: "You don't know when it ends. The end condition is hidden — it could end at any moment. Keep bidding if you dare.", phases: ['??? Bids', '??? Time', 'Surprise End'] },
  { icon: '🎁', name: 'Free', color: 'border-pngwin-green/30', desc: 'No cost to enter. Real prizes. Limited to 5 bids per player. Perfect for newcomers.', phases: ['Free Entry', '5 Bids Max', 'Real Prizes'] },
  { icon: '🎰', name: 'Jackpot HUBA', color: 'border-gold/30', desc: 'If nobody has the highest unique bid when it ends, the entire prize pool rolls over to next week. It keeps growing until someone wins.', phases: ['Bid Phase', 'No Winner?', 'ROLLOVER!'] },
  { icon: '🎲', name: 'Jackpot RNG', color: 'border-ice/30', desc: 'Sealed bids. Random draw. 5 prize positions drawn live every Saturday. If a drawn number matches a unique bid, that player wins!', phases: ['Sealed Bids', 'Saturday Draw', '5 Prizes!'] },
];

const HowAuctionsWork = () => (
  <div className="min-h-screen pt-16 pb-20 md:pb-0">
    <div className="container py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold mb-3">How PNGWIN Auctions Work</h1>
        <p className="text-muted-foreground max-w-lg mx-auto">
          The world's first unique bid auction platform. Strategy beats luck.
        </p>
      </div>

      {/* Core Steps */}
      <div className="space-y-6 mb-16">
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">STEP {i + 1}</span>
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Auction Types */}
      <h2 className="font-display text-2xl font-bold text-center mb-8">Auction Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        {TYPES.map((type, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`bg-card border ${type.color} rounded-lg p-5`}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{type.icon}</span>
              <h3 className="font-display font-bold text-base">{type.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">{type.desc}</p>
            <div className="flex gap-2">
              {type.phases.map((phase, j) => (
                <div key={j} className="flex items-center gap-1 text-[10px]">
                  {j > 0 && <span className="text-muted-foreground">→</span>}
                  <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">{phase}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-center space-y-3">
        <Link
          to="/auctions"
          className="inline-block px-8 py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold"
        >
          Start Bidding →
        </Link>
        <div>
          <Link
            to="/auction/demo/draw"
            className="inline-block px-5 py-2 bg-secondary border border-border text-muted-foreground font-display font-semibold text-sm rounded-lg hover:text-foreground transition-colors"
          >
            🎲 See the RNG Draw in Action →
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default HowAuctionsWork;
