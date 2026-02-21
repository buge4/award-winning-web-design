import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Auction } from '@/data/mockData';

// Map a Supabase auction_instance row to our local Auction shape
const mapRow = (row: Record<string, unknown>): Auction => {
  const config = (row.auction_configs as Record<string, unknown>) ?? {};
  const rawType = String(config.auction_type ?? config.type ?? row.type ?? 'live');

  // Map DB auction_type to our local AuctionType
  const typeMap: Record<string, Auction['type']> = {
    live_before_hot: 'live_before_hot',
    timed: 'timed',
    blind_count: 'blind_count',
    blind_timed: 'blind_timed',
    free: 'free',
    jackpot: 'jackpot',
  };
  const type = typeMap[rawType] ?? (rawType as Auction['type']);

  const statusMap: Record<string, Auction['status']> = {
    accumulating: 'accumulating',
    hot_mode: 'hot_mode',
    grace_period: 'grace_period',
    closed: 'closed',
    resolved: 'resolved',
    cancelled: 'cancelled',
  };
  const status = statusMap[String(row.status)] ?? (row.status as Auction['status']) ?? 'accumulating';

  // Compute prize pool: use DB value, or derive from bid fees × prize_pool_pct
  const dbPrizePool = Number(row.prize_pool ?? 0);
  const totalBidFees = Number(row.total_bid_fees ?? 0);
  const prizePoolPct = Number(config.prize_pool_pct ?? 55) / 100;
  const computedPrizePool = dbPrizePool > 0 ? dbPrizePool : Math.floor(totalBidFees * prizePoolPct);

  return {
    id: String(row.id),
    title: String(config.name ?? row.title ?? 'Auction'),
    type,
    status,
    prizePool: computedPrizePool,
    bidCount: Number(row.total_bids ?? 0),
    bidCost: Number(config.bid_fee ?? 10),
    uniqueBids: Number(row.unique_bidders ?? 0),
    burnedBids: Number(row.burned_amount ?? 0),
    icon: type === 'jackpot' ? '🎰' : type === 'free' ? '🎁' : type === 'blind_count' || type === 'blind_timed' ? '🙈' : type === 'timed' ? '⏱️' : '🎯',
    timeRemaining: row.time_remaining ? String(row.time_remaining) : undefined,
    bidTarget: config.total_bids_to_hot ? Number(config.total_bids_to_hot) : undefined,
    rolloverWeek: row.rollover_week ? Number(row.rollover_week) : undefined,
    rolloverHistory: row.rollover_history ? (row.rollover_history as number[]) : undefined,
  };
};

/** Fetch all auction instances (optionally filter by active statuses) */
export const useAuctions = (activeOnly = false) => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let query = supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.in('status', ['scheduled', 'accumulating', 'hot_mode', 'grace_period']);
    }

    query.then(({ data, error }) => {
      if (data && data.length > 0) {
        setAuctions(data.map(row => mapRow(row as Record<string, unknown>)));
      }
      setLoading(false);
      if (error) console.error('useAuctions error:', error.message);
    });
  }, [activeOnly]);

  return { auctions, loading };
};

/** Fetch a single auction instance by id */
export const useAuctionDetail = (instanceId?: string) => {
  const [auction, setAuction] = useState<Auction | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAuction = useCallback(() => {
    if (!instanceId) { setLoading(false); return; }

    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .eq('id', instanceId)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setAuction(mapRow(data as Record<string, unknown>));
        }
        setLoading(false);
        if (error) console.error('useAuctionDetail error:', error.message);
      });
  }, [instanceId]);

  useEffect(() => {
    fetchAuction();
  }, [fetchAuction]);

  return { auction, loading, refetch: fetchAuction };
};

/** Fetch resolved auctions for history */
export const useAuctionHistory = () => {
  const [auctions, setAuctions] = useState<Array<{
    id: string; title: string; type: string; date: string;
    winner: string; winningBid: string; prizeWon: number;
    totalBids: number; players: number; uniqueBids: number; burnedBids: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .eq('status', 'resolved')
      .order('actual_end', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          setAuctions(data.map((row: any) => ({
            id: row.id,
            title: row.auction_configs?.name ?? 'Auction',
            type: row.auction_configs?.auction_type ?? 'live',
            date: row.actual_end ? new Date(row.actual_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            winner: row.winner_id ? `User ${String(row.winner_id).slice(0, 6)}` : '—',
            winningBid: row.winning_amount ? String(row.winning_amount) : '—',
            prizeWon: Number(row.prize_pool ?? 0),
            totalBids: Number(row.total_bids ?? 0),
            players: Number(row.unique_bidders ?? 0),
            uniqueBids: Number(row.unique_bidders ?? 0),
            burnedBids: Number(row.burned_amount ?? 0),
          })));
        }
        setLoading(false);
        if (error) console.error('useAuctionHistory error:', error.message);
      });
  }, []);

  return { auctions, loading };
};

export const useMyBids = (auctionId?: string) => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Array<{ id: string; value: string; status: 'unique' | 'burned'; position?: number; timestamp: string }>>([]);

  const fetchBids = useCallback(() => {
    if (!user) return;
    let query = supabase
      .from('auction_bids')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (auctionId) {
      query = query.eq('instance_id', auctionId);
    }

    query.then(({ data }) => {
      if (data) {
        setBids(
          data.map(b => ({
            id: String(b.id),
            value: String(b.bid_amount ?? '00.00'),
            status: b.is_burned ? 'burned' : 'unique',
            position: b.bid_position ?? undefined,
            timestamp: new Date(b.created_at).toLocaleTimeString(),
          }))
        );
      }
    });
  }, [user, auctionId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  return { bids, refetch: fetchBids };
};

export const usePlaceBid = () => {
  const { user } = useAuth();

  const placeBid = async (instanceId: string, bidValue: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'You must be signed in to bid.' };

    const numericValue = parseFloat(bidValue);
    const { data, error } = await supabase.rpc('place_auction_bid', {
      p_user_id: user.id,
      p_instance_id: instanceId,
      p_bid_amount: numericValue,
    });

    if (error) {
      return { success: false, message: error.message };
    }
    return { success: true, message: `Bid ${bidValue} placed!` };
  };

  return { placeBid };
};

/** Fetch leaderboard for a specific auction */
export const useAuctionLeaderboard = (instanceId?: string) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<Array<{
    rank: number; username: string; bid_amount: number; is_unique: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId || !user) { setLoading(false); return; }
    supabase.rpc('get_auction_leaderboard', {
      p_instance_id: instanceId,
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setEntries(data);
      setLoading(false);
      if (error) console.error('useAuctionLeaderboard error:', error.message);
    });
  }, [instanceId, user]);

  return { entries, loading };
};

/** Fetch burned values count for an auction */
export const useAuctionBurnedValues = (instanceId?: string) => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId) { setLoading(false); return; }
    supabase.rpc('get_auction_burned_values_count', {
      p_instance_id: instanceId,
    }).then(({ data, error }) => {
      if (data !== null) setCount(Number(data));
      setLoading(false);
      if (error) console.error('useAuctionBurnedValues error:', error.message);
    });
  }, [instanceId]);

  return { count, loading };
};

/** Fetch platform leaderboard from project_members + users */
export const useLeaderboard = () => {
  const [entries, setEntries] = useState<Array<{
    rank: number; username: string; initials: string;
    wins: number; earnings: number; streak: number;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('project_members')
      .select('*, users(*)')
      .eq('project_slug', 'auction')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          const mapped = data.map((row: any, i: number) => {
            const u = row.users ?? {};
            const uname = u.username ?? `user_${String(row.user_id).slice(0, 6)}`;
            return {
              rank: i + 1,
              username: `@${uname}`,
              initials: uname.slice(0, 2).toUpperCase(),
              wins: u.wins ?? 0,
              earnings: u.earnings ?? 0,
              streak: u.streak ?? 0,
            };
          });
          setEntries(mapped);
        }
        setLoading(false);
        if (error) console.error('useLeaderboard error:', error.message);
      });
  }, []);

  return { entries, loading };
};

/** Fetch user profile from users table */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{
    username: string; email: string; role: string;
    referral_code: string; created_at: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setProfile({
            username: data.username ?? '',
            email: data.email ?? '',
            role: data.role ?? 'user',
            referral_code: data.referral_code ?? '',
            created_at: data.created_at ?? '',
          });
        }
        setLoading(false);
        if (error) console.error('useProfile error:', error.message);
      });
  }, [user]);

  return { profile, loading };
};

/** Fetch social circle summary */
export const useSocialCircleSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('get_social_circle_summary', {
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setSummary(data);
      setLoading(false);
      if (error) console.error('useSocialCircleSummary error:', error.message);
    });
  }, [user]);

  return { summary, loading };
};

/** Fetch user badges with progress */
export const useUserBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('get_user_badges_with_progress', {
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setBadges(data);
      setLoading(false);
      if (error) console.error('useUserBadges error:', error.message);
    });
  }, [user]);

  return { badges, loading };
};

/** Fetch user weekly activity */
export const useWeeklyActivity = () => {
  const { user } = useAuth();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('get_user_weekly_activity', {
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setActivity(data);
      setLoading(false);
      if (error) console.error('useWeeklyActivity error:', error.message);
    });
  }, [user]);

  return { activity, loading };
};

/** Fetch public platform stats */
export const usePlatformStats = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('public_platform_stats').then(({ data, error }) => {
      if (data) setStats(data);
      setLoading(false);
      if (error) console.error('usePlatformStats error:', error.message);
    });
  }, []);

  return { stats, loading };
};

/** PvP hooks */
export const usePvpRooms = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('pvp_rooms')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setRooms(data);
        setLoading(false);
        if (error) console.error('usePvpRooms error:', error.message);
      });
  }, []);

  return { rooms, loading };
};

export const usePvpUserStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('get_pvp_user_stats', {
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setStats(data);
      setLoading(false);
      if (error) console.error('usePvpUserStats error:', error.message);
    });
  }, [user]);

  return { stats, loading };
};

export const usePvpRecentDuels = () => {
  const [duels, setDuels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.rpc('get_pvp_recent_duels', {
      p_limit: 20,
    }).then(({ data, error }) => {
      if (data) setDuels(data);
      setLoading(false);
      if (error) console.error('usePvpRecentDuels error:', error.message);
    });
  }, []);

  return { duels, loading };
};

/** Tournament hooks */
export const useTournaments = () => {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setTournaments(data);
        setLoading(false);
        if (error) console.error('useTournaments error:', error.message);
      });
  }, []);

  return { tournaments, loading };
};

/** Jackpot history */
export const useJackpotHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase.rpc('get_weekly_jackpot_history', {
      p_user_id: user.id,
    }).then(({ data, error }) => {
      if (data) setHistory(data);
      setLoading(false);
      if (error) console.error('useJackpotHistory error:', error.message);
    });
  }, [user]);

  return { history, loading };
};
