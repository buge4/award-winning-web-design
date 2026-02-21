import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useTournaments } from '@/hooks/useAuctions';
type TournamentStatus = 'open' | 'live' | 'completed';

interface Tournament {
  id: string;
  name: string;
  bracketSize: 8 | 16 | 32 | 64;
  entryFee: number;
  prizePool: number;
  playersJoined: number;
  status: TournamentStatus;
  startTime: string;
  icon: string;
}

const TOURNAMENTS: Tournament[] = [
  { id: 't1', name: 'Weekly Blitz #12', bracketSize: 16, entryFee: 50, prizePool: 520, playersJoined: 11, status: 'open', startTime: 'Today 18:00', icon: '⚡' },
  { id: 't2', name: 'Grand Slam #5', bracketSize: 32, entryFee: 100, prizePool: 2080, playersJoined: 32, status: 'live', startTime: 'In Progress', icon: '🏆' },
  { id: 't3', name: 'Mega Bracket #3', bracketSize: 64, entryFee: 200, prizePool: 8320, playersJoined: 58, status: 'open', startTime: 'Sat 20:00', icon: '💎' },
  { id: 't4', name: 'Quick 8 #47', bracketSize: 8, entryFee: 25, prizePool: 130, playersJoined: 8, status: 'completed', startTime: 'Ended', icon: '🎯' },
  { id: 't5', name: 'Weekly Blitz #11', bracketSize: 16, entryFee: 50, prizePool: 520, playersJoined: 16, status: 'completed', startTime: 'Ended', icon: '⚡' },
];

const statusStyles: Record<TournamentStatus, { bg: string; text: string; label: string }> = {
  open: { bg: 'bg-green-subtle', text: 'text-pngwin-green', label: 'OPEN' },
  live: { bg: 'bg-red-subtle', text: 'text-pngwin-red', label: '🔴 LIVE' },
  completed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'COMPLETED' },
};

const TournamentsPage = () => {
  const [tab, setTab] = useState<TournamentStatus | 'all'>('all');
  const { tournaments: dbTournaments, loading } = useTournaments();

  // Map DB tournaments or fall back to mock
  const allTournaments: Tournament[] = dbTournaments.length > 0
    ? dbTournaments.map((t: any) => ({
        id: t.id,
        name: t.name ?? 'Tournament',
        bracketSize: t.size ?? t.bracket_size ?? 16,
        entryFee: t.entry_fee ?? 50,
        prizePool: t.prize_pool ?? 0,
        playersJoined: t.players_joined ?? 0,
        status: t.status === 'open' ? 'open' : t.status === 'live' || t.status === 'in_progress' ? 'live' : 'completed',
        startTime: t.starts_at ? new Date(t.starts_at).toLocaleString() : '—',
        icon: '🏆',
      }))
    : TOURNAMENTS;

  const filtered = tab === 'all' ? allTournaments : allTournaments.filter(t => t.status === tab);

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="font-display text-3xl font-bold flex items-center gap-3">🏆 Tournaments</h1>
            <p className="text-sm text-muted-foreground mt-1">Bracket-style auction tournaments. Outbid to advance.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="Played" value={12} color="ice" />
            <KpiCard label="Won" value={3} color="gold" />
            <KpiCard label="Earnings" value="+1,840" color="green" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6">
          {(['all', 'open', 'live', 'completed'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-xs font-medium capitalize transition-all border ${
                tab === t ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground bg-transparent border-transparent hover:bg-secondary'
              }`}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tournament Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => {
            const style = statusStyles[t.status];
            return (
              <Link to={`/tournaments/${t.id}`} key={t.id}>
                <motion.div
                  whileHover={{ y: -3 }}
                  className={`bg-card border rounded-lg p-5 cursor-pointer hover:bg-card-hover transition-colors ${
                    t.status === 'live' ? 'border-pngwin-red/30 animate-hot' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.icon}</span>
                      <h3 className="font-display font-bold text-sm">{t.name}</h3>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
                    <div className="font-mono text-2xl font-bold text-primary">
                      {t.prizePool.toLocaleString()} <span className="text-xs text-muted-foreground">PNGWIN</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>Bracket: <span className="text-foreground font-semibold">{t.bracketSize}</span></span>
                    <span>Entry: <span className="text-primary font-semibold">{t.entryFee} PNGWIN</span></span>
                  </div>

                  {/* Player count bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Players</span>
                      <span className="text-foreground font-semibold">{t.playersJoined}/{t.bracketSize}</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold transition-all"
                        style={{ width: `${(t.playersJoined / t.bracketSize) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground">{t.startTime}</div>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="bg-card border border-border rounded-lg p-6 mt-10">
          <h3 className="font-semibold mb-4">How Tournament Rounds Work</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5 text-center text-xs text-muted-foreground">
            {[
              { icon: '🎟️', title: '1. Join', desc: 'Pay entry fee to enter bracket.' },
              { icon: '⚔️', title: '2. Get Paired', desc: "You're matched with an opponent." },
              { icon: '🎯', title: '3. Mini-Auction', desc: '5 bids each. Highest unique wins.' },
              { icon: '📈', title: '4. Advance', desc: 'Winner moves to next round.' },
              { icon: '🏆', title: '5. Champion', desc: 'Win the bracket, take the prize!' },
            ].map((step, i) => (
              <div key={i}>
                <div className="text-3xl mb-2">{step.icon}</div>
                <div className="font-semibold text-foreground mb-1">{step.title}</div>
                <div>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentsPage;
