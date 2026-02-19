import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const STEPS = [
  { icon: '🎟️', title: 'Join a Tournament', desc: 'Pay the entry fee to secure your spot in the bracket. 8, 16, 32, or 64 players.' },
  { icon: '⚔️', title: 'Get Paired', desc: "You're randomly matched with an opponent in each round." },
  { icon: '🎯', title: 'Play a Mini-Auction', desc: 'Each round: both players get 5 bids. Highest unique bid wins the round.' },
  { icon: '📈', title: 'Winner Advances', desc: 'Beat your opponent and move to the next round. Loser is eliminated.' },
  { icon: '🏆', title: 'Become Champion', desc: 'Win every round to claim the championship and the biggest share of the prize pool!' },
];

const HowTournamentsWork = () => (
  <div className="min-h-screen pt-16 pb-20 md:pb-0">
    <div className="container py-12 max-w-3xl">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-bold mb-3">How Tournaments Work</h1>
        <p className="text-muted-foreground">Bracket-style auction combat. Outbid everyone to become champion.</p>
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

      <div className="text-center">
        <Link to="/tournaments" className="inline-block px-8 py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold">
          Browse Tournaments →
        </Link>
      </div>
    </div>
  </div>
);

export default HowTournamentsWork;
