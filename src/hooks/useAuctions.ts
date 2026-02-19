import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Auction } from '@/data/mockData';

// Map a Supabase auction_instance row to our local Auction shape
// We keep mock data as fallback for fields not in the DB
const mapRow = (row: Record<string, unknown>): Auction => {
  const config = (row.auction_configs as Record<string, unknown>) ?? {};
  const type = (config.type as Auction['type']) ?? (row.type as Auction['type']) ?? 'live';
  return {
    id: String(row.id ?? row.instance_id),
    title: String(config.name ?? row.title ?? 'Auction'),
    type,
    status: (row.status as Auction['status']) ?? 'active',
    prizePool: Number(row.prize_pool ?? config.prize_pool ?? 0),
    bidCount: Number(row.bid_count ?? 0),
    bidCost: Number(config.bid_cost ?? config.entry_fee ?? 10),
    uniqueBids: Number(row.unique_bids ?? 0),
    burnedBids: Number(row.burned_bids ?? 0),
    icon: type === 'rng' ? '🎲' : type === 'jackpot' ? '🎰' : type === 'free' ? '🎁' : type === 'blind' ? '🙈' : type === 'timed' ? '⏱️' : '🎯',
    timeRemaining: row.time_remaining ? String(row.time_remaining) : undefined,
    bidTarget: config.bid_target ? Number(config.bid_target) : undefined,
    rolloverWeek: row.rollover_week ? Number(row.rollover_week) : undefined,
    rolloverHistory: row.rollover_history ? (row.rollover_history as number[]) : undefined,
  };
};

export const useAuctions = () => {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data && data.length > 0) {
          setAuctions(data.map(row => mapRow(row as Record<string, unknown>)));
        }
        // If no data or error, keep empty — pages will fall back to mock data
        setLoading(false);
        if (error) console.error('useAuctions error:', error.message);
      });
  }, []);

  return { auctions, loading };
};

export const useMyBids = (auctionId?: string) => {
  const { user } = useAuth();
  const [bids, setBids] = useState<Array<{ id: string; value: string; status: 'unique' | 'burned'; position?: number; timestamp: string }>>([]);

  const fetchBids = () => {
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
            value: String(b.bid_value ?? b.bid_amount ?? '00.00'),
            status: b.is_unique ? 'unique' : 'burned',
            position: b.position ?? undefined,
            timestamp: new Date(b.created_at).toLocaleTimeString(),
          }))
        );
      }
    });
  };

  useEffect(() => {
    fetchBids();
  }, [user, auctionId]);

  return { bids, refetch: fetchBids };
};

export const usePlaceBid = () => {
  const { user } = useAuth();

  const placeBid = async (instanceId: string, bidValue: string): Promise<{ success: boolean; message: string }> => {
    if (!user) return { success: false, message: 'You must be signed in to bid.' };

    const numericValue = parseFloat(bidValue);
    const { error } = await supabase.rpc('place_auction_bid', {
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

