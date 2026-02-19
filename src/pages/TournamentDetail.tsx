import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

interface BracketMatch {
  id: string;
  round: number;
  player1: string | null;
  player2: string | null;
  winner: string | null;
  p1Bid?: string;
  p2Bid?: string;
  isYou?: 'p1' | 'p2';
  isActive?: boolean;
}

const MOCK_BRACKET: BracketMatch[] = [
  // Round 1 (Quarterfinals)
  { id: 'm1', round: 1, player1: '@You', player2: '@NordicBid', winner: '@You', p1Bid: '87.23', p2Bid: '65.10', isYou: 'p1' },
  { id: 'm2', round: 1, player1: '@IceQueen', player2: '@MoonShot', winner: '@IceQueen', p1Bid: '91.44', p2Bid: '91.44' },
  { id: 'm3', round: 1, player1: '@CryptoKing', player2: '@AlphaWolf', winner: '@CryptoKing', p1Bid: '73.88', p2Bid: '52.11' },
  { id: 'm4', round: 1, player1: '@FrostBite', player2: '@DiamondHands', winner: '@DiamondHands', p1Bid: '45.00', p2Bid: '88.77' },
  // Round 2 (Semifinals)
  { id: 'm5', round: 2, player1: '@You', player2: '@IceQueen', winner: null, isYou: 'p1', isActive: true },
  { id: 'm6', round: 2, player1: '@CryptoKing', player2: '@DiamondHands', winner: null, isActive: true },
  // Round 3 (Final)
  { id: 'm7', round: 3, player1: null, player2: null, winner: null },
];

const PRIZE_DISTRIBUTION = [
  { place: '1st', pct: '40%', amount: 208 },
  { place: '2nd', pct: '20%', amount: 104 },
  { place: '3rd-4th', pct: '10% each', amount: 52 },
  { place: '5th-8th', pct: '5% each', amount: 26 },
];

const TournamentDetail = () => {
  const { id } = useParams();
  const [joined, setJoined] = useState(true);
  const [expandedRound, setExpandedRound] = useState<number | null>(2);

  const rounds = [
    { num: 1, name: 'Quarterfinals' },
    { num: 2, name: 'Semifinals' },
    { num: 3, name: 'Final' },
  ];

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-6">
        <Link to="/tournaments" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          ← Back to Tournaments
        </Link>

        {/* Hero */}
        <div className="bg-card border border-gold/20 rounded-xl p-6 mb-6 glow-gold">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⚡</span>
                <h1 className="font-display text-3xl font-bold">Weekly Blitz #12</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-subtle text-pngwin-red animate-pulse-glow">
                  🔴 LIVE
                </span>
              </div>
              <p className="text-sm text-muted-foreground">8-player bracket · 5 bids per round · Highest unique wins</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
              <div className="font-mono text-3xl font-bold text-primary">520 PNGWIN</div>
            </div>
          </div>
        </div>

        {/* Pool Breakdown */}
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { pct: '65%', label: 'Prizes', color: 'text-pngwin-green' },
            { pct: '10%', label: 'Burn', color: 'text-pngwin-red' },
            { pct: '5%', label: 'Social', color: 'text-ice' },
            { pct: '10%', label: 'Jackpot', color: 'text-primary' },
            { pct: '10%', label: 'House', color: 'text-muted-foreground' },
          ].map((item, i) => (
            <div key={i} className="flex-1 min-w-[70px] text-center p-3 bg-card border border-border rounded-md">
              <div className={`font-mono text-lg font-bold ${item.color}`}>{item.pct}</div>
              <div className="text-[10px] text-muted-foreground">{item.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bracket */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-lg mb-4">Bracket</h2>
            <div className="space-y-4">
              {rounds.map(round => {
                const matches = MOCK_BRACKET.filter(m => m.round === round.num);
                const isExpanded = expandedRound === round.num;
                return (
                  <div key={round.num} className="bg-card border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedRound(isExpanded ? null : round.num)}
                      className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-card-hover transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-sm">Round {round.num}: {round.name}</span>
                        {matches.some(m => m.isActive) && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-pngwin-red/20 text-pngwin-red animate-pulse-glow">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground">{isExpanded ? '−' : '+'}</span>
                    </button>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="border-t border-border"
                      >
                        {matches.map(match => (
                          <div key={match.id} className={`px-5 py-3 border-b border-border/50 last:border-0 ${match.isActive ? 'bg-pngwin-red/5' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="space-y-1.5 flex-1">
                                {/* Player 1 */}
                                <div className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                                  match.winner === match.player1 ? 'bg-green-subtle' :
                                  match.winner && match.winner !== match.player1 ? 'bg-red-subtle opacity-60' : ''
                                } ${match.isYou === 'p1' ? 'border border-primary/30' : ''}`}>
                                  <span className={`font-semibold ${match.isYou === 'p1' ? 'text-primary' : ''}`}>
                                    {match.player1 || 'TBD'}
                                  </span>
                                  {match.p1Bid && <span className="font-mono text-xs text-muted-foreground">{match.p1Bid}</span>}
                                  {match.winner === match.player1 && <span className="text-pngwin-green text-xs">✓</span>}
                                </div>
                                {/* Player 2 */}
                                <div className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${
                                  match.winner === match.player2 ? 'bg-green-subtle' :
                                  match.winner && match.winner !== match.player2 ? 'bg-red-subtle opacity-60' : ''
                                } ${match.isYou === 'p2' ? 'border border-primary/30' : ''}`}>
                                  <span className={`font-semibold ${match.isYou === 'p2' ? 'text-primary' : ''}`}>
                                    {match.player2 || 'TBD'}
                                  </span>
                                  {match.p2Bid && <span className="font-mono text-xs text-muted-foreground">{match.p2Bid}</span>}
                                  {match.winner === match.player2 && <span className="text-pngwin-green text-xs">✓</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Prize Distribution</h3>
              <div className="space-y-2">
                {PRIZE_DISTRIBUTION.map((p, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{p.place} ({p.pct})</span>
                    <span className="font-mono font-bold text-primary">{p.amount} PNGWIN</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-bold text-sm mb-3">Your Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Position</span>
                  <span className="font-semibold text-pngwin-green">Semifinals</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Next Opponent</span>
                  <span className="font-semibold text-ice">@IceQueen</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bids Remaining</span>
                  <span className="font-mono font-bold">5/5</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toast.success('Round started! Place your 5 bids.')}
                className="w-full mt-4 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold"
              >
                PLAY ROUND →
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentDetail;
