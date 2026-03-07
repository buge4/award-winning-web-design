import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface JackpotRound {
  week: number;
  instanceId: string;
  status: 'resolved' | 'live' | 'next' | 'upcoming';
  prizePool: number;
  winner?: string | null;
  drawnNumbers?: number[];
}

const RoundCarousel = () => {
  const [rounds, setRounds] = useState<JackpotRound[]>([]);
  const [selectedRound, setSelectedRound] = useState<JackpotRound | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRounds = async () => {
      // Fetch all jackpot instances
      const { data: instances } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .order('created_at', { ascending: true });

      if (!instances?.length) {
        // Fallback mock data for premium feel
        setRounds(generateMockRounds());
        return;
      }

      const jackpotInstances = instances.filter(
        (r: any) => r.auction_configs?.auction_type === 'jackpot' ||
          (r.auction_configs?.name ?? '').toLowerCase().includes('jackpot')
      );

      if (jackpotInstances.length === 0) {
        setRounds(generateMockRounds());
        return;
      }

      const mapped: JackpotRound[] = jackpotInstances.map((r: any, i: number) => {
        const isLive = ['accumulating', 'hot_mode', 'grace_period'].includes(r.status);
        const isResolved = r.status === 'resolved' || r.status === 'closed';
        return {
          week: i + 1,
          instanceId: r.id,
          status: isLive ? 'live' : isResolved ? 'resolved' : 'upcoming',
          prizePool: Number(r.prize_pool ?? 0),
          winner: r.winner_id ? `User ${String(r.winner_id).slice(0, 6)}` : null,
          drawnNumbers: r.drawn_numbers ?? undefined,
        };
      });

      // Mark the one after live as 'next'
      const liveIdx = mapped.findIndex(r => r.status === 'live');
      if (liveIdx >= 0 && liveIdx + 1 < mapped.length && mapped[liveIdx + 1].status === 'upcoming') {
        mapped[liveIdx + 1].status = 'next';
      }

      // Add future rounds if needed
      const totalNeeded = Math.min(Math.max(mapped.length + 3, 7), 7);
      while (mapped.length < totalNeeded) {
        mapped.push({
          week: mapped.length + 1,
          instanceId: `future-${mapped.length}`,
          status: 'upcoming',
          prizePool: 0,
        });
      }

      setRounds(mapped);
      setSelectedRound(mapped.find(r => r.status === 'live') ?? mapped[mapped.length - 1]);
    };

    fetchRounds();
  }, []);

  useEffect(() => {
    // Auto-scroll to live round
    if (scrollRef.current && rounds.length > 0) {
      const liveIdx = rounds.findIndex(r => r.status === 'live');
      if (liveIdx >= 0) {
        const chip = scrollRef.current.children[liveIdx] as HTMLElement;
        if (chip) {
          chip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }
    }
  }, [rounds]);

  const statusStyles: Record<string, string> = {
    resolved: 'border-border bg-secondary/60 text-muted-foreground hover:border-border-active',
    live: 'border-pngwin-purple bg-pngwin-purple/10 text-pngwin-purple ring-2 ring-pngwin-purple/20',
    next: 'border-primary bg-gold-subtle text-primary hover:border-primary',
    upcoming: 'border-border bg-card text-muted-foreground hover:border-border-active',
  };

  const statusIcons: Record<string, string> = {
    resolved: '✓',
    live: '🟣',
    next: '🟡',
    upcoming: '⏳',
  };

  return (
    <div className="w-full">
      {/* Carousel */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {rounds.map((round) => {
            const isSelected = selectedRound?.instanceId === round.instanceId;
            return (
              <motion.button
                key={round.instanceId}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedRound(round)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold whitespace-nowrap
                  transition-all duration-200 shrink-0
                  ${statusStyles[round.status]}
                  ${isSelected ? 'ring-2 ring-offset-1 ring-offset-background ring-primary/40 scale-105' : ''}
                  ${round.status === 'live' ? 'animate-pulse-glow' : ''}
                `}
              >
                <span className="text-sm">{statusIcons[round.status]}</span>
                <span className="font-display tracking-wide">W{round.week}</span>
                {round.status === 'resolved' && <span className="text-[9px] opacity-60">Done</span>}
                {round.status === 'live' && <span className="text-[9px] uppercase tracking-widest">LIVE</span>}
                {round.status === 'next' && <span className="text-[9px] uppercase tracking-widest">Next</span>}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Round Detail */}
      {selectedRound && (
        <motion.div
          key={selectedRound.instanceId}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          {selectedRound.status === 'resolved' ? (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-sm">Week {selectedRound.week} — Results</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Resolved</span>
              </div>

              {selectedRound.drawnNumbers && selectedRound.drawnNumbers.length > 0 && (
                <div className="flex gap-2 mb-3 justify-center">
                  {selectedRound.drawnNumbers.map((num, i) => (
                    <div key={i} className="w-14 h-16 bg-background border-2 border-primary/30 rounded-lg flex items-center justify-center">
                      <span className="font-mono text-lg font-bold text-primary">{num.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="font-mono">
                  Pool: <span className="text-primary font-bold">{selectedRound.prizePool.toLocaleString()}</span> PNGWIN
                </div>
                {selectedRound.winner ? (
                  <span className="text-pngwin-green font-semibold">🏆 {selectedRound.winner}</span>
                ) : (
                  <span className="text-pngwin-orange font-semibold">🔄 Rolled Over</span>
                )}
              </div>

              {!selectedRound.instanceId.startsWith('future-') && (
                <Link
                  to={`/auction/${selectedRound.instanceId}`}
                  className="block mt-3 text-center text-xs text-ice hover:text-ice/80 font-semibold transition-colors"
                >
                  View full results →
                </Link>
              )}
            </div>
          ) : selectedRound.status === 'next' ? (
            <div className="bg-gold-subtle border border-primary/20 rounded-xl p-5 text-center">
              <div className="text-xs text-primary uppercase tracking-[3px] font-bold mb-1">Up Next</div>
              <div className="text-sm text-muted-foreground">Starts after Week {selectedRound.week - 1} resolves</div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 text-center">
              <div className="text-xs text-muted-foreground uppercase tracking-[3px] mb-1">Week {selectedRound.week}</div>
              <div className="text-sm text-muted-foreground">Scheduled</div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

function generateMockRounds(): JackpotRound[] {
  return [
    { week: 1, instanceId: 'mock-w1', status: 'resolved', prizePool: 25000, winner: '@WhaleAlert', drawnNumbers: [42.17, 88.03, 15.92, 67.41, 3.55] },
    { week: 2, instanceId: 'mock-w2', status: 'resolved', prizePool: 50000, winner: null, drawnNumbers: [91.22, 44.78, 12.05, 73.60, 29.14] },
    { week: 3, instanceId: 'mock-w3', status: 'resolved', prizePool: 75000, winner: '@DiamondHands', drawnNumbers: [55.33, 22.19, 68.87, 41.02, 99.01] },
    { week: 4, instanceId: 'mock-w4', status: 'resolved', prizePool: 110000, winner: null },
    { week: 5, instanceId: 'mock-w5', status: 'live', prizePool: 150000 },
    { week: 6, instanceId: 'mock-w6', status: 'next', prizePool: 0 },
    { week: 7, instanceId: 'mock-w7', status: 'upcoming', prizePool: 0 },
  ];
}

export default RoundCarousel;
