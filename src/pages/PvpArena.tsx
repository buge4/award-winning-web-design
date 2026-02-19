import { useState } from 'react';
import { motion } from 'framer-motion';
import { DUEL_ROOMS, RECENT_DUELS } from '@/data/mockData';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

const PvpArena = () => {
  const [modalRoom, setModalRoom] = useState<typeof DUEL_ROOMS[0] | null>(null);
  const [bidValue, setBidValue] = useState('');

  const handlePlaceBid = () => {
    if (!modalRoom) return;
    toast.success(`Bid placed in ${modalRoom.fee} PNGWIN room! Waiting for opponent...`);
    setModalRoom(null);
    setBidValue('');
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">⚔️ PvP Duel Arena</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Place your bid. Wait for an opponent. Closest to the random target wins.
            </p>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <KpiCard label="Duels" value={23} color="gold" />
            <KpiCard label="Wins" value={14} color="green" />
            <KpiCard label="Win Rate" value="61%" color="ice" />
            <KpiCard label="Net P/L" value="+340" color="green" />
          </div>
        </div>

        {/* Room Grid */}
        <h2 className="font-display font-bold text-lg mb-4">Choose Your Stakes</h2>
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

        {/* How It Works */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h3 className="font-semibold mb-4">How PvP Duels Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center text-xs text-muted-foreground">
            {[
              { icon: '⚡', title: '1. Pick a Room', desc: 'Choose your entry level.' },
              { icon: '🔒', title: '2. Place Blind Bid', desc: "Enter a value. Opponent can't see it." },
              { icon: '🎲', title: '3. Random Target', desc: 'A provably fair number is generated.' },
              { icon: '🏆', title: '4. Closest Wins', desc: 'Whoever bid closest takes the prize!' },
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
        <div className="bg-card border border-border rounded-lg p-5 mb-8">
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

        {/* Recent Duels */}
        <h2 className="font-display font-bold text-lg mb-4">Recent Duels</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {RECENT_DUELS.map((duel) => (
            <div key={duel.id} className="px-5 py-3 flex items-center justify-between border-b border-border/50 last:border-b-0 hover:bg-card-hover transition-colors">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${
                  duel.result === 'won' ? 'bg-green-subtle text-pngwin-green' : 'bg-red-subtle text-pngwin-red'
                }`}>
                  {duel.result}
                </span>
                <span className="text-sm">
                  <strong>You</strong> vs {duel.opponent}
                </span>
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
      </div>

      {/* Modal */}
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
              <button
                onClick={() => setModalRoom(null)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ✕
              </button>
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
    </div>
  );
};

export default PvpArena;
