import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const API_BASE = 'http://89.167.102.46:3000/api/dashboard';

interface GameConfig {
  id: string;
  name: string;
  auction_type: string;
  bid_fee: number;
  currency: string;
  visibility: string;
  resolution_method: string;
  is_recurring: boolean;
  split_prize_pct: number;
  split_burn_pct: number;
  split_platform_pct: number;
  split_social_pct: number;
  split_jackpot_pct: number;
  instances: InstanceSummary[];
}

interface InstanceSummary {
  id: string;
  status: string;
  total_bids: number;
  total_bid_fees: number;
  total_unique_bidders: number;
  created_at: string;
  scheduled_end: string | null;
  actual_end: string | null;
}

const STATUS_ICON: Record<string, string> = {
  accumulating: '🟢',
  hot_mode: '🔴',
  grace_period: '🟡',
  closed: '⚪',
  resolved: '✅',
  cancelled: '❌',
  scheduled: '⏳',
};

const TYPE_ICON: Record<string, string> = {
  timed: '⏱️',
  blind_timed: '🙈',
  blind_count: '🙈',
  live_before_hot: '🔥',
  free: '🎁',
  jackpot: '🎰',
};

const AdminGames = () => {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<GameConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    setLoading(true);

    // Try fast API first
    let instances: any[] = [];
    try {
      const res = await fetch(`${API_BASE}/auctions`);
      if (res.ok) instances = await res.json();
    } catch { /* fallback */ }

    // Get configs from Supabase
    const { data: configData } = await supabase
      .from('auction_configs')
      .select('*')
      .order('name');

    if (!configData) { setLoading(false); return; }

    // If no API instances, get from Supabase
    if (instances.length === 0) {
      const { data: instData } = await supabase
        .from('auction_instances')
        .select('id, config_id, status, total_bids, total_bid_fees, total_unique_bidders, created_at, scheduled_end, actual_end')
        .order('created_at', { ascending: false });
      instances = instData ?? [];
    }

    // Group instances by config
    const instancesByConfig: Record<string, InstanceSummary[]> = {};
    instances.forEach((inst: any) => {
      const cid = inst.config_id;
      if (!instancesByConfig[cid]) instancesByConfig[cid] = [];
      instancesByConfig[cid].push({
        id: inst.id,
        status: inst.status,
        total_bids: Number(inst.total_bids ?? 0),
        total_bid_fees: Number(inst.total_bid_fees ?? 0),
        total_unique_bidders: Number(inst.total_unique_bidders ?? 0),
        created_at: inst.created_at,
        scheduled_end: inst.scheduled_end,
        actual_end: inst.actual_end,
      });
    });

    const mapped: GameConfig[] = configData.map((c: any) => ({
      id: c.id,
      name: c.name,
      auction_type: c.auction_type,
      bid_fee: Number(c.bid_fee ?? 0),
      currency: c.currency ?? 'PNGWIN',
      visibility: c.visibility ?? 'open',
      resolution_method: c.resolution_method ?? 'highest_unique_bid',
      is_recurring: c.is_recurring ?? false,
      split_prize_pct: Number(c.split_prize_pct ?? 55),
      split_burn_pct: Number(c.split_burn_pct ?? 15),
      split_platform_pct: Number(c.split_platform_pct ?? 15),
      split_social_pct: Number(c.split_social_pct ?? 5),
      split_jackpot_pct: Number(c.split_jackpot_pct ?? 10),
      instances: instancesByConfig[c.id] ?? [],
    }));

    // Sort: recurring first, then by instance count
    mapped.sort((a, b) => {
      if (a.is_recurring !== b.is_recurring) return a.is_recurring ? -1 : 1;
      return b.instances.length - a.instances.length;
    });

    setConfigs(mapped);
    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading games...</div>;

  const recurring = configs.filter(c => c.is_recurring);
  const oneOff = configs.filter(c => !c.is_recurring);

  const renderConfigCard = (config: GameConfig) => {
    const activeInstances = config.instances.filter(i => ['accumulating', 'hot_mode', 'grace_period', 'scheduled'].includes(i.status));
    const resolvedInstances = config.instances.filter(i => i.status === 'resolved');
    const totalRevenue = config.instances.reduce((s, i) => s + i.total_bid_fees, 0);
    const totalBids = config.instances.reduce((s, i) => s + i.total_bids, 0);

    return (
      <motion.div
        key={config.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5 hover:border-border-active transition-all cursor-pointer"
        onClick={() => navigate(`/admin/games/${config.id}`)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="font-display font-bold text-sm flex items-center gap-2">
              <span>{TYPE_ICON[config.auction_type] ?? '🎮'}</span>
              {config.name}
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground font-semibold uppercase">
                {config.auction_type.replace('_', ' ')}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                {config.visibility === 'blind' ? '🙈 Blind' : '👁️ Open'}
              </span>
              {config.is_recurring && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-pngwin-green/10 text-pngwin-green font-semibold">
                  🔄 Recurring
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-lg font-bold text-primary">{totalRevenue.toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">total revenue</div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="text-center">
            <div className="font-mono text-sm font-bold">{config.instances.length}</div>
            <div className="text-[9px] text-muted-foreground">Instances</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-bold text-pngwin-green">{activeInstances.length}</div>
            <div className="text-[9px] text-muted-foreground">Active</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-bold">{totalBids.toLocaleString()}</div>
            <div className="text-[9px] text-muted-foreground">Total Bids</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-sm font-bold">{resolvedInstances.length}</div>
            <div className="text-[9px] text-muted-foreground">Resolved</div>
          </div>
        </div>

        {/* Fund split mini-bar */}
        <div className="flex h-2 rounded-full overflow-hidden mb-2">
          <div className="bg-pngwin-green" style={{ width: `${config.split_prize_pct}%` }} />
          <div className="bg-pngwin-red" style={{ width: `${config.split_burn_pct}%` }} />
          <div className="bg-pngwin-purple" style={{ width: `${config.split_platform_pct}%` }} />
          <div className="bg-ice" style={{ width: `${config.split_social_pct}%` }} />
          <div className="bg-primary" style={{ width: `${config.split_jackpot_pct}%` }} />
        </div>
        <div className="text-[8px] text-muted-foreground">
          {config.split_prize_pct}% prize · {config.split_burn_pct}% burn · {config.split_platform_pct}% platform · {config.split_social_pct}% social · {config.split_jackpot_pct}% JP
        </div>

        {/* Recent instances timeline */}
        {config.instances.length > 0 && (
          <div className="flex gap-1 mt-3 overflow-x-auto">
            {config.instances.slice(0, 8).map(inst => (
              <div key={inst.id} className="flex-shrink-0 text-center" title={`${inst.status} · ${inst.total_bids} bids`}>
                <div className="text-sm">{STATUS_ICON[inst.status] ?? '⚪'}</div>
                <div className="text-[8px] text-muted-foreground font-mono">{inst.total_bids}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">🎮 Game Management</h1>
        <button onClick={() => navigate('/admin/auctions/create')}
          className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold">
          + Create New
        </button>
      </div>

      {/* Recurring Games */}
      {recurring.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
            🔄 Recurring Games ({recurring.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {recurring.map(renderConfigCard)}
          </div>
        </>
      )}

      {/* One-off Games */}
      {oneOff.length > 0 && (
        <>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3 font-semibold">
            One-off Games ({oneOff.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {oneOff.map(renderConfigCard)}
          </div>
        </>
      )}

      {configs.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">No game configs found.</div>
      )}
    </div>
  );
};

export default AdminGames;
