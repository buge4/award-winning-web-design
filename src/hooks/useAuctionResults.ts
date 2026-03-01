import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

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

export interface AuctionResultsData {
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
  userPerformance: {
    bestPosition: number;
    bestBid: string;
    bestBidStatus: string;
    prizeEarned: number;
    socialBonus: number;
  } | null;
}

export const useAuctionResults = (instanceId?: string) => {
  const { user } = useAuth();
  const [data, setData] = useState<AuctionResultsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId) { setLoading(false); return; }

    const fetchResults = async () => {
      // 1. Fetch instance + config
      const { data: instance } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .eq('id', instanceId)
        .single();

      if (!instance) { setLoading(false); return; }

      const config = (instance as any).auction_configs ?? {};
      const totalCollected = Number(instance.total_bid_fees ?? 0);

      // 2. Fetch all bids with usernames
      const { data: bidsData } = await supabase
        .from('auction_bids')
        .select('bid_amount, is_burned, user_id, created_at, bid_position, is_winning, users(username)')
        .eq('instance_id', instanceId)
        .order('bid_amount', { ascending: false });

      const allBids: AllBid[] = (bidsData ?? []).map((b: any, i: number) => ({
        rank: i + 1,
        bidValue: Number(b.bid_amount),
        username: b.users?.username ?? `user_${String(b.user_id).slice(0, 6)}`,
        userId: String(b.user_id),
        status: b.is_burned ? 'BURNED' as const : 'UNIQUE' as const,
        timestamp: new Date(b.created_at).toLocaleString(),
      }));

      // 3. Extract winners (is_winning = true)
      const winningBids = (bidsData ?? []).filter((b: any) => b.is_winning);
      
      // 4. Try to fetch social circle payouts
      let socialPayoutsMap: Record<string, any[]> = {};
      try {
        const { data: payouts } = await supabase
          .from('social_circle_payouts')
          .select('*')
          .eq('reference_id', instanceId);
        
        if (payouts) {
          for (const p of payouts) {
            const key = String(p.winner_user_id ?? p.trigger_user_id);
            if (!socialPayoutsMap[key]) socialPayoutsMap[key] = [];
            socialPayoutsMap[key].push(p);
          }
        }
      } catch {
        // Table may not exist yet
      }

      const winners: Winner[] = winningBids.map((b: any, i: number) => {
        const userId = String(b.user_id);
        const payouts = socialPayoutsMap[userId] ?? [];
        
        const socialPayouts = [1, 2, 3, 4, 5].map((level) => {
          const payout = payouts.find((p: any) => p.level === level);
          if (payout) {
            return {
              level,
              username: payout.recipient_username ?? null,
              amount: Number(payout.amount ?? 0),
              qualified: payout.qualified !== false,
              reason: payout.reason ?? undefined,
            };
          }
          return { level, username: null, amount: 0, qualified: false };
        });

        return {
          rank: i + 1,
          username: b.users?.username ?? `user_${userId.slice(0, 6)}`,
          userId,
          bidAmount: Number(b.bid_amount),
          prizeWon: Number(b.prize_amount ?? instance.prize_pool ?? 0),
          socialPayouts,
        };
      });

      // 5. User performance
      let userPerformance = null;
      if (user) {
        const userBids = allBids.filter((b) => b.userId === user.id);
        if (userBids.length > 0) {
          const uniqueBids = userBids.filter((b) => b.status === 'UNIQUE');
          const best = uniqueBids.length > 0 ? uniqueBids[0] : userBids[0];
          const won = winners.find((w) => w.userId === user.id);
          
          userPerformance = {
            bestPosition: best.rank,
            bestBid: best.bidValue.toFixed(2),
            bestBidStatus: best.status,
            prizeEarned: won?.prizeWon ?? 0,
            socialBonus: 0, // Could sum from social payouts
          };
        }
      }

      // 6. Accounting
      const prizePoolPct = Number(config.prize_pool_pct ?? 55) / 100;
      const accounting = {
        prizePool: Math.floor(totalCollected * prizePoolPct),
        burned: Math.floor(totalCollected * 0.15),
        platform: Math.floor(totalCollected * 0.15),
        socialCircle: Math.floor(totalCollected * 0.05),
        jackpotFeed: Math.floor(totalCollected * 0.10),
      };

      setData({
        auctionTitle: config.name ?? 'Auction',
        resolvedDate: instance.actual_end
          ? new Date(instance.actual_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : '',
        totalPool: Number(instance.prize_pool ?? 0),
        totalCollected,
        winners,
        allBids,
        accounting,
        userPerformance,
      });
      setLoading(false);
    };

    fetchResults();
  }, [instanceId, user]);

  return { data, loading };
};

/** Fetch jackpot draw history for lobby */
export const useJackpotDrawHistory = () => {
  const [history, setHistory] = useState<Array<{
    week: number;
    date: string;
    prizePool: number;
    winner: string | null;
    winnerAmount: number;
    instanceId: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Query resolved + active jackpot instances
      const { data: instances } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .or('auction_type.eq.jackpot', { referencedTable: 'auction_configs' })
        .in('status', ['resolved', 'closed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(10);

      if (!instances?.length) {
        // Fallback: try name match
        const { data: fallback } = await supabase
          .from('auction_instances')
          .select('*, auction_configs(*)')
          .in('status', ['resolved', 'closed', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(20);

        const jackpots = (fallback ?? []).filter((r: any) => {
          const name = r.auction_configs?.name ?? '';
          const type = r.auction_configs?.auction_type ?? '';
          return type === 'jackpot' || name.toLowerCase().includes('jackpot');
        });

        setHistory(
          jackpots.map((r: any, i: number) => ({
            week: jackpots.length - i,
            date: r.actual_end ? new Date(r.actual_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            prizePool: Number(r.prize_pool ?? 0),
            winner: r.winner_id ? `User ${String(r.winner_id).slice(0, 6)}` : null,
            winnerAmount: Math.floor(Number(r.prize_pool ?? 0) * 0.55),
            instanceId: String(r.id),
          }))
        );
        setLoading(false);
        return;
      }

      setHistory(
        instances.map((r: any, i: number) => ({
          week: instances.length - i,
          date: r.actual_end ? new Date(r.actual_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
          prizePool: Number(r.prize_pool ?? 0),
          winner: r.winner_id ? `User ${String(r.winner_id).slice(0, 6)}` : null,
          winnerAmount: Math.floor(Number(r.prize_pool ?? 0) * 0.55),
          instanceId: String(r.id),
        }))
      );
      setLoading(false);
    };
    fetch();
  }, []);

  return { history, loading };
};
