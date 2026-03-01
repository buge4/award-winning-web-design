import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface Winner {
  rank: number;
  username: string;
  userId: string;
  bidAmount: number;
  prizeWon: number;
  socialPayouts: Array<{
    level: number;
    username: string | null;
    amount: number;
    qualified: boolean;
    reason?: string;
  }>;
}

interface AllBid {
  rank: number;
  bidValue: number;
  username: string;
  userId: string;
  status: 'UNIQUE' | 'BURNED';
  timestamp: string;
}

interface AuctionResultsProps {
  auctionTitle: string;
  resolvedDate: string;
  totalPool: number;
  totalCollected: number;
  winners: Winner[];
  allBids: AllBid[];
  accounting: {
    prizePool: number;
    burned: number;
    platform: number;
    socialCircle: number;
    jackpotFeed: number;
  };
  userPerformance?: {
    bestPosition: number;
    bestBid: string;
    bestBidStatus: string;
    prizeEarned: number;
    socialBonus: number;
  } | null;
}

const BIDS_PER_PAGE = 50;
const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const AuctionResults = ({
  auctionTitle,
  resolvedDate,
  totalPool,
  totalCollected,
  winners,
  allBids,
  accounting,
  userPerformance,
}: AuctionResultsProps) => {
  const { user } = useAuth();
  const [expandedWinners, setExpandedWinners] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(allBids.length / BIDS_PER_PAGE);
  const paginatedBids = allBids.slice((currentPage - 1) * BIDS_PER_PAGE, currentPage * BIDS_PER_PAGE);

  const toggleWinner = (rank: number) => {
    setExpandedWinners((prev) => {
      const next = new Set(prev);
      next.has(rank) ? next.delete(rank) : next.add(rank);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-card border border-gold rounded-xl p-6">
        <h2 className="font-display text-xl font-bold text-primary mb-1">
          🏆 AUCTION RESULTS — {auctionTitle}
        </h2>
        <div className="text-sm text-muted-foreground">
          Resolved: {resolvedDate} | Total Pool: {totalPool.toLocaleString()} PNGWIN
        </div>
      </div>

      {/* Your Performance */}
      {userPerformance && (
        <div className="bg-card border border-ice/30 rounded-xl p-5">
          {userPerformance.prizeEarned > 0 ? (
            <>
              <div className="text-sm font-semibold text-foreground mb-1">
                📍 Your Best Position: #{userPerformance.bestPosition} (Bid {userPerformance.bestBid} — {userPerformance.bestBidStatus})
              </div>
              <div className="text-sm text-pngwin-green font-bold">
                💰 You earned: {userPerformance.prizeEarned.toLocaleString()} PNGWIN prize
                {userPerformance.socialBonus > 0 && ` + ${userPerformance.socialBonus.toLocaleString()} PNGWIN social circle bonus`}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">
              You didn't win this time. Best position: #{userPerformance.bestPosition} (Bid {userPerformance.bestBid})
            </div>
          )}
        </div>
      )}

      {/* Winners Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <span className="font-display font-bold text-sm">Winners</span>
        </div>
        <div className="divide-y divide-border/50">
          {winners.length === 0 ? (
            <div className="px-5 py-8 text-center text-muted-foreground text-sm">
              No winners — prize rolled over
            </div>
          ) : (
            winners.map((w) => {
              const isExpanded = expandedWinners.has(w.rank);
              const emoji = RANK_EMOJI[w.rank] ?? `#${w.rank}`;
              return (
                <div key={w.rank}>
                  <button
                    onClick={() => toggleWinner(w.rank)}
                    className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{emoji}</span>
                      <div>
                        <span className="font-display font-bold text-sm">
                          {w.rank === 1 ? '1ST PRIZE' : w.rank === 2 ? '2ND PRIZE' : w.rank === 3 ? '3RD PRIZE' : `${w.rank}TH PRIZE`}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          — @{w.username} — Bid: {w.bidAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-pngwin-green">
                        Won: {w.prizeWon.toLocaleString()} PNGWIN
                      </span>
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isExpanded && w.socialPayouts.length > 0 && (
                    <div className="px-5 pb-4 pl-14 space-y-1">
                      {w.socialPayouts.map((sp, i) => {
                        const isLast = i === w.socialPayouts.length - 1;
                        const prefix = isLast ? '└──' : '├──';
                        return (
                          <div key={i} className="flex items-center gap-2 font-mono text-xs">
                            <span className="text-muted-foreground">{prefix}</span>
                            <span className="text-muted-foreground">L{sp.level}:</span>
                            {sp.username ? (
                              <>
                                <span className="text-foreground">@{sp.username}</span>
                                {sp.qualified ? (
                                  <span className="text-pngwin-green font-bold">+{sp.amount} PNGWIN</span>
                                ) : (
                                  <span className="text-pngwin-red">❌ -{sp.amount} PNGWIN ({sp.reason})</span>
                                )}
                              </>
                            ) : (
                              <span className="text-muted-foreground italic">(empty — no L{sp.level} referral)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Accounting Breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-display font-bold text-sm mb-3">ACCOUNTING</h3>
        <div className="space-y-1.5 font-mono text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Collected</span>
            <span className="font-bold text-foreground">{totalCollected.toLocaleString()} PNGWIN</span>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">→ Prize Pool (55%)</span>
            <span className="text-pngwin-green">{accounting.prizePool.toLocaleString()} PNGWIN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">→ Burned (15%)</span>
            <span className="text-pngwin-red">{accounting.burned.toLocaleString()} PNGWIN 🔥</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">→ Platform (15%)</span>
            <span className="text-foreground">{accounting.platform.toLocaleString()} PNGWIN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">→ Social Circle (5%)</span>
            <span className="text-ice">{accounting.socialCircle.toLocaleString()} PNGWIN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">→ Jackpot Feed (10%)</span>
            <span className="text-primary">{accounting.jackpotFeed.toLocaleString()} PNGWIN</span>
          </div>
        </div>
      </div>

      {/* All Bids (Paginated) */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="font-display font-bold text-sm">All Bids ({allBids.length})</span>
          {totalPages > 1 && (
            <span className="text-[10px] text-muted-foreground">Page {currentPage}/{totalPages}</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[10px] text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-2 text-left">Rank</th>
                <th className="px-3 py-2 text-left">Bid</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedBids.map((bid) => {
                const isOwn = user && bid.userId === user.id;
                return (
                  <tr
                    key={`${bid.rank}-${bid.bidValue}`}
                    className={isOwn ? 'bg-gold-subtle border-l-2 border-l-primary' : ''}
                  >
                    <td className="px-5 py-2 font-mono text-xs text-muted-foreground">#{bid.rank}</td>
                    <td className="px-3 py-2 font-mono text-xs font-bold">{bid.bidValue.toFixed(2)}</td>
                    <td className="px-3 py-2 text-xs">
                      {isOwn ? <b className="text-primary">@{bid.username} (you)</b> : `@${bid.username}`}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        bid.status === 'UNIQUE' ? 'bg-pngwin-green/10 text-pngwin-green' : 'bg-pngwin-red/10 text-pngwin-red'
                      }`}>
                        {bid.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[10px] text-muted-foreground">{bid.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-border">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage + i - 2;
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuctionResults;
