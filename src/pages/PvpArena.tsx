import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DUEL_ROOMS, RECENT_DUELS } from '@/data/mockData';
import KpiCard from '@/components/KpiCard';
import BidInput from '@/components/BidInput';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

type DuelTab = 'open' | 'my' | 'live' | 'settled';

interface OpenDuel {
  id: string;
  creator: string;
  stake: number;
  status: 'waiting' | 'accepted' | 'settled';
  opponent?: string;
  result?: 'won' | 'lost';
  time: string;
}

const OPEN_DUELS: OpenDuel[] = [
  { id: 'd1', creator: '@NordicBid', stake: 100, status: 'waiting', time: '2m ago' },
  { id: 'd2', creator: '@AlphaWolf', stake: 500, status: 'waiting', time: '5m ago' },
  { id: 'd3', creator: '@MoonShot', stake: 50, status: 'waiting', time: '8m ago' },
  { id: 'd4', creator: 'You', stake: 200, status: 'waiting', time: '12m ago' },
];

const LIVE_DUELS: OpenDuel[] = [
  { id: 'l1', creator: '@IceQueen', stake: 100, status: 'accepted', opponent: '@FrostBite', time: 'In progress' },
  { id: 'l2', creator: '@StarGazer', stake: 200, status: 'accepted', opponent: '@ColdFish', time: 'In progress' },
];

const PvpArena = () => {
  const [modalRoom, setModalRoom] = useState<typeof DUEL_ROOMS[0] | null>(null);
  const [bidValue, setBidValue] = useState('');
  const [duelTab, setDuelTab] = useState<DuelTab>('open');
  const [showCreateDuel, setShowCreateDuel] = useState(false);
  const [createStake, setCreateStake] = useState('');
  const [showLiveDuel, setShowLiveDuel] = useState(false);
  const [liveDuelPhase, setLiveDuelPhase] = useState<'bid' | 'reveal' | 'result'>('bid');
  const [revealDigits, setRevealDigits] = useState(['?', '?', '?', '?']);

  const handlePlaceBid = () => {
    if (!modalRoom) return;
    toast.success(`Bid placed in ${modalRoom.fee} PNGWIN room! Waiting for opponent...`);
    setModalRoom(null);
    setBidValue('');
  };

  const handleCreateDuel = () => {
    toast.success(`Duel created for ${createStake} PNGWIN! Waiting for challenger...`);
    setShowCreateDuel(false);
    setCreateStake('');
  };

  const handleAcceptDuel = (duel: OpenDuel) => {
    setShowLiveDuel(true);
    setLiveDuelPhase('bid');
  };

  const handleLiveBid = (value: string) => {
    toast.success(`Bid ${value} placed! Waiting for reveal...`);
    setLiveDuelPhase('reveal');
    // Simulate reveal
    const target = '47.23';
    const digits = target.replace('.', '');
    setTimeout(() => {
      setRevealDigits([digits[0], '?', '?', '?']);
      setTimeout(() => {
        setRevealDigits([digits[0], digits[1], '?', '?']);
        setTimeout(() => {
          setRevealDigits([digits[0], digits[1], digits[2], '?']);
          setTimeout(() => {
            setRevealDigits([digits[0], digits[1], digits[2], digits[3]]);
            setTimeout(() => setLiveDuelPhase('result'), 800);
          }, 600);
        }, 600);
      }, 600);
    }, 1000);
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">⚔️ PvP Duel Arena</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sealed bid duels. Place your bid. Closest to the random target wins.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Duels" value={23} color="gold" />
            <KpiCard label="Wins" value={14} color="green" />
            <KpiCard label="Win Rate" value="61%" color="ice" />
            <KpiCard label="Net P/L" value="+340" color="green" />
          </div>
        </div>

        {/* Quick Duel Rooms */}
        <h2 className="font-display font-bold text-lg mb-4">⚡ Quick Duel — Auto Match</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
          {DUEL_ROOMS.map((room) => (
            <motion.div
              key={room.id}
              whileHover={{ y: -3 }}
              onClick={() => setModalRoom(room)}
              className={`bg-card border rounded-lg p-5 cursor-pointer text-center transition-all ${
                room.status === 'waiting'
                  ? 'border-gold/30 glow-gold'
                  : 'border-border hover:border-border-active'
              }`}
            >
              <div className="font-display text-3xl font-bold text-primary mb-1">
                {room.fee.toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground mb-3">PNGWIN</div>
              <div
                className={`text-[11px] font-semibold px-3 py-1.5 rounded-full inline-block ${
                  room.status === 'waiting'
                    ? 'bg-gold-subtle text-primary border border-gold animate-pulse-glow'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {room.status === 'waiting' ? '⚡ 1 WAITING' : 'EMPTY'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-2">
                Win: <span className="text-pngwin-green font-semibold">+{room.winAmount.toLocaleString()}</span>
              </div>
              {room.opponent && (
                <div className="text-[10px] text-muted-foreground mt-1">
                  {room.opponent} · {room.opponentTime}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Open Duels Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg">🎯 Sealed Bid Duels</h2>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateDuel(true)}
            className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs tracking-wider rounded-lg shadow-gold"
          >
            + Create Duel
          </motion.button>
        </div>

        {/* Duel Tabs */}
        <div className="flex gap-1.5 mb-4">
          {(['open', 'my', 'live', 'settled'] as const).map(t => (
            <button
              key={t}
              onClick={() => setDuelTab(t)}
              className={`px-4 py-2 rounded-md text-xs font-medium capitalize transition-all border ${
                duelTab === t ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground bg-transparent border-transparent hover:bg-secondary'
              }`}
            >
              {t === 'my' ? 'My Duels' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Duel List */}
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-10">
          {duelTab === 'open' && OPEN_DUELS.map(duel => (
            <div key={duel.id} className="px-5 py-3.5 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{duel.creator}</span>
                <span className="text-xs text-muted-foreground">{duel.time}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-primary">{duel.stake} PNGWIN</span>
                {duel.creator !== 'You' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAcceptDuel(duel)}
                    className="px-3 py-1.5 gradient-gold text-primary-foreground font-display font-bold text-[10px] tracking-wider rounded"
                  >
                    ACCEPT
                  </motion.button>
                ) : (
                  <span className="px-3 py-1.5 bg-gold-subtle text-primary text-[10px] font-semibold rounded animate-pulse-glow">WAITING</span>
                )}
              </div>
            </div>
          ))}
          {duelTab === 'live' && LIVE_DUELS.map(duel => (
            <div key={duel.id} className="px-5 py-3.5 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-pngwin-red/20 text-pngwin-red animate-pulse-glow">LIVE</span>
                <span className="text-sm">{duel.creator} vs {duel.opponent}</span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">{duel.stake} PNGWIN</span>
            </div>
          ))}
          {duelTab === 'my' && (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">Your active duels will appear here.</div>
          )}
          {duelTab === 'settled' && RECENT_DUELS.map(duel => (
            <div key={duel.id} className="px-5 py-3 flex items-center justify-between border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                  duel.result === 'won' ? 'bg-green-subtle text-pngwin-green' : 'bg-red-subtle text-pngwin-red'
                }`}>{duel.result}</span>
                <span className="text-sm"><strong>You</strong> vs {duel.opponent}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-muted-foreground">{duel.fee} PNGWIN</span>
                <span className={`font-mono text-sm font-bold ${duel.result === 'won' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                  {duel.result === 'won' ? '+' : ''}{duel.amount}
                </span>
                <span className="text-[11px] text-muted-foreground">{duel.time}</span>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">How PvP Duels Work</h3>
            <Link to="/pvp/how-it-works" className="text-xs text-ice hover:text-ice/80">Learn more →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 text-center text-xs text-muted-foreground">
            {[
              { icon: '⚡', title: '1. Pick Stakes', desc: 'Choose your entry level.' },
              { icon: '🔒', title: '2. Sealed Bid', desc: "Enter XX.XX. Opponent can't see." },
              { icon: '🎲', title: '3. Random Target', desc: 'Provably fair number generated.' },
              { icon: '📏', title: '4. Distance Check', desc: 'Closest bid to target wins.' },
              { icon: '🏆', title: '5. Winner Takes', desc: '65% of the pot goes to winner!' },
            ].map((step, i) => (
              <div key={i}>
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-semibold text-foreground mb-1">{step.title}</div>
                <div>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Split */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Revenue Split (per duel)</h3>
          <div className="flex gap-2 flex-wrap">
            {[
              { pct: '65%', label: 'Winner', color: 'text-pngwin-green' },
              { pct: '10%', label: 'Burn', color: 'text-pngwin-orange' },
              { pct: '10%', label: 'Platform', color: 'text-muted-foreground' },
              { pct: '5%', label: 'Social', color: 'text-ice' },
              { pct: '10%', label: 'Jackpot', color: 'text-primary' },
            ].map((item, i) => (
              <div key={i} className="flex-1 min-w-[70px] text-center p-2.5 bg-background rounded-md">
                <div className={`font-mono text-lg font-bold ${item.color}`}>{item.pct}</div>
                <div className="text-[10px] text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Duel Modal */}
      {modalRoom && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setModalRoom(null)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border-active rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="font-display font-bold text-xl">PvP Duel — {modalRoom.fee} PNGWIN</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {modalRoom.status === 'waiting'
                    ? `${modalRoom.opponent} is waiting for a challenger!`
                    : "You'll wait for an opponent to join."}
                </p>
              </div>
              <button onClick={() => setModalRoom(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Your Bid</div>
                <input
                  type="text"
                  value={bidValue}
                  onChange={(e) => setBidValue(e.target.value.replace(/[^\d.]/g, '').slice(0, 5))}
                  placeholder="00.00"
                  className="w-full py-4 bg-background border-2 border-border rounded-lg text-center font-mono text-3xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
                />
                <div className="text-[11px] text-muted-foreground mt-2">Range: 0.01 — {modalRoom.maxBid}</div>
              </div>

              <div className="flex justify-between text-sm py-3 border-t border-border">
                <span className="text-muted-foreground">Entry Fee</span>
                <span className="font-mono font-bold text-primary">{modalRoom.fee} PNGWIN</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Potential Win</span>
                <span className="font-mono font-bold text-pngwin-green">+{modalRoom.winAmount} PNGWIN</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePlaceBid}
                className="w-full py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold mt-2"
              >
                PLACE BID & ENTER DUEL
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Duel Modal */}
      <AnimatePresence>
        {showCreateDuel && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowCreateDuel(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border-active rounded-2xl p-8 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="font-display font-bold text-xl">Create Sealed Bid Duel</h2>
                <button onClick={() => setShowCreateDuel(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Stake Amount (PNGWIN)</label>
                  <input
                    value={createStake}
                    onChange={e => setCreateStake(e.target.value.replace(/\D/g, ''))}
                    placeholder="100"
                    className="w-full px-3 py-3 bg-background border-2 border-border rounded-lg text-center font-mono text-2xl font-bold text-primary focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Winner takes 65% · Minimum: 10 PNGWIN
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCreateDuel}
                  className="w-full py-3.5 gradient-gold text-primary-foreground font-display font-bold text-base tracking-wider rounded-lg shadow-gold"
                >
                  CREATE DUEL
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Live Duel Modal */}
      <AnimatePresence>
        {showLiveDuel && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-card border border-border-active rounded-2xl p-8 max-w-lg w-full"
            >
              <div className="text-center mb-6">
                <div className="text-xs text-ice uppercase tracking-[4px] mb-2">⚔️ LIVE DUEL</div>
                <div className="flex items-center justify-center gap-6">
                  <div>
                    <div className="w-12 h-12 rounded-full gradient-gold mx-auto mb-1 flex items-center justify-center text-sm font-bold text-background">YOU</div>
                    <div className="text-xs font-semibold">@cryptoking</div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  <div>
                    <div className="w-12 h-12 rounded-full gradient-ice mx-auto mb-1 flex items-center justify-center text-sm font-bold text-background">NB</div>
                    <div className="text-xs font-semibold">@NordicBid</div>
                  </div>
                </div>
                <div className="font-mono text-lg font-bold text-primary mt-2">100 PNGWIN</div>
              </div>

              {liveDuelPhase === 'bid' && (
                <div>
                  <BidInput onSubmit={handleLiveBid} bidCost={0} />
                </div>
              )}

              {liveDuelPhase === 'reveal' && (
                <div className="text-center py-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">Random Target Revealing...</div>
                  <div className="flex items-center justify-center gap-2">
                    {revealDigits.map((d, i) => (
                      <div key={i} className={`w-14 h-16 rounded-lg flex items-center justify-center font-mono text-3xl font-bold border-2 ${
                        d !== '?' ? 'border-primary bg-gold-subtle text-primary' : 'border-ice/50 bg-background text-ice animate-pulse-glow'
                      }`}>
                        {d}
                        {i === 1 && <span className="absolute ml-16 text-3xl text-muted-foreground">.</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {liveDuelPhase === 'result' && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">🎉</div>
                  <div className="font-display text-2xl font-bold text-pngwin-green mb-2">YOU WIN!</div>
                  <div className="text-sm text-muted-foreground mb-1">Target: 47.23 · Your bid: 45.00 · Opponent: 82.10</div>
                  <div className="font-mono text-3xl font-bold text-pngwin-green mb-4">+65 PNGWIN</div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowLiveDuel(false); setLiveDuelPhase('bid'); setRevealDigits(['?','?','?','?']); }}
                    className="px-8 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold"
                  >
                    BACK TO ARENA
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PvpArena;
