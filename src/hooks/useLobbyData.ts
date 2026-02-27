import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface LobbyAuction {
  id: string;
  title: string;
  configId: string;
  auctionType: string;
  status: string;
  prizePool: number;
  totalBids: number;
  uniqueBidders: number;
  burnedAmount: number;
  bidFee: number;
  scheduledEnd: string | null;
  hotModeEndsAt: string | null;
  totalBidsToHot: number | null;
  visibility: string;
  history: Array<{
    id: string;
    label: string;
    isSelected: boolean;
    isResolved: boolean;
  }>;
}

export interface LobbyBid {
  id: string;
  value: string;
  status: 'unique' | 'burned';
  position?: number;
  timestamp: string;
  auctionName: string;
}

const fetchAuctionByConfigName = async (nameLike: string): Promise<LobbyAuction | null> => {
  // First get the active instance
  const { data: instances, error } = await supabase
    .from('auction_instances')
    .select('*, auction_configs(*)')
    .in('status', ['accumulating', 'hot_mode', 'grace_period'])
    .order('created_at', { ascending: false });

  if (error || !instances?.length) return null;

  // Filter by config name
  const match = instances.find((row: any) => {
    const name = row.auction_configs?.name ?? '';
    return name.toLowerCase().includes(nameLike.toLowerCase());
  });

  if (!match) return null;

  const config = (match as any).auction_configs ?? {};
  const configId = config.id ?? match.config_id;

  // Fetch last 4 instances from same config for history
  const { data: historyRows } = await supabase
    .from('auction_instances')
    .select('id, status, created_at')
    .eq('config_id', configId)
    .order('created_at', { ascending: false })
    .limit(4);

  const history = (historyRows ?? [])
    .reverse() // ascending order like CryptoPix
    .map((h: any, i: number, arr: any[]) => ({
      id: String(h.id),
      label: `#${arr.length - i + (instances.length > 4 ? instances.length - 4 : 0)}`,
      isSelected: h.id === match.id,
      isResolved: h.status === 'resolved' || h.status === 'closed',
    }));

  return {
    id: String(match.id),
    title: config.name ?? 'Auction',
    configId: String(configId),
    auctionType: config.auction_type ?? 'live_before_hot',
    status: match.status,
    prizePool: Number(match.prize_pool ?? 0),
    totalBids: Number(match.total_bids ?? 0),
    uniqueBidders: Number(match.unique_bidders ?? 0),
    burnedAmount: Number(match.burned_amount ?? 0),
    bidFee: Number(config.bid_fee ?? 10),
    scheduledEnd: match.scheduled_end ?? null,
    hotModeEndsAt: match.hot_mode_ends_at ?? null,
    totalBidsToHot: config.total_bids_to_hot ? Number(config.total_bids_to_hot) : null,
    visibility: config.visibility ?? 'open',
    history,
  };
};

export const useHeroJackpot = () => {
  const [data, setData] = useState<LobbyAuction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      // Try jackpot type first
      const { data: instances } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .in('status', ['accumulating', 'hot_mode', 'grace_period'])
        .order('created_at', { ascending: false });

      if (instances?.length) {
        const jackpot = instances.find((r: any) =>
          r.auction_configs?.auction_type === 'jackpot' ||
          (r.auction_configs?.name ?? '').toLowerCase().includes('jackpot')
        );

        if (jackpot) {
          const config = (jackpot as any).auction_configs ?? {};
          setData({
            id: String(jackpot.id),
            title: config.name ?? 'Weekly Jackpot',
            configId: String(config.id ?? jackpot.config_id),
            auctionType: 'jackpot',
            status: jackpot.status,
            prizePool: Number(jackpot.prize_pool ?? 0),
            totalBids: Number(jackpot.total_bids ?? 0),
            uniqueBidders: Number(jackpot.unique_bidders ?? 0),
            burnedAmount: Number(jackpot.burned_amount ?? 0),
            bidFee: Number(config.bid_fee ?? 25),
            scheduledEnd: jackpot.scheduled_end ?? null,
            hotModeEndsAt: jackpot.hot_mode_ends_at ?? null,
            totalBidsToHot: null,
            visibility: 'open',
            history: [],
          });
        }
      }
      setLoading(false);
    };
    fetch();
  }, []);

  return { data, loading };
};

export const useFeaturedAuction = (nameLike: string) => {
  const [data, setData] = useState<LobbyAuction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuctionByConfigName(nameLike).then((result) => {
      setData(result);
      setLoading(false);
    });
  }, [nameLike]);

  return { data, loading };
};

export const useMyRecentBids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState<LobbyBid[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('auction_bids')
      .select('*, auction_instances(id, auction_configs(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setBids(data.map((b: any) => ({
        id: String(b.id),
        value: String(b.bid_amount ?? '00.00'),
        status: b.is_burned ? 'burned' as const : 'unique' as const,
        position: b.bid_position ?? undefined,
        timestamp: formatTimeAgo(b.created_at),
        auctionName: b.auction_instances?.auction_configs?.name ?? 'Auction',
      })));
    }
    setLoading(false);
    if (error) console.error('useMyRecentBids error:', error.message);
  }, [user]);

  useEffect(() => { fetchBids(); }, [fetchBids]);

  return { bids, loading, refetch: fetchBids };
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
