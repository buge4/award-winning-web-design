import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const STATUS_COLORS: Record<string, string> = {
  accumulating: 'bg-ice/20 text-ice',
  hot_mode: 'bg-pngwin-red/20 text-pngwin-red',
  grace_period: 'bg-pngwin-green/20 text-pngwin-green',
  closed: 'bg-muted text-muted-foreground',
  resolved: 'bg-pngwin-green/20 text-pngwin-green',
  cancelled: 'bg-pngwin-red/10 text-pngwin-red/60',
};

const RESOLUTION_BADGE: Record<string, { label: string; color: string }> = {
  highest_unique_bid: { label: '🏆 Highest Unique', color: 'bg-gold-subtle text-primary border-gold' },
  rng_closest: { label: '🎯 RNG Closest', color: 'bg-purple-subtle text-pngwin-purple border-pngwin-purple/20' },
  rng_exact: { label: '🎰 Jackpot Draw', color: 'bg-red-subtle text-pngwin-red border-pngwin-red/20' },
};

const AdminAuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [adminLog, setAdminLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bids' | 'timeline' | 'log'>('bids');
  const [bidFilter, setBidFilter] = useState<'all' | 'unique' | 'burned'>('all');
  const [bidSort, setBidSort] = useState<'time' | 'amount' | 'user'>('time');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { if (id) loadAll(); }, [id]);

  const loadAll = async () => {
    setLoading(true);
    const [instRes, bidsRes, logRes] = await Promise.all([
      supabase.from('auction_instances').select('*, auction_configs(*), fund_allocations(*)').eq('id', id).single(),
      supabase.from('auction_bids').select('*, users(username)').eq('instance_id', id).order('created_at', { ascending: false }),
      supabase.from('auction_admin_log').select('*').eq('instance_id', id).order('created_at', { ascending: false }),
    ]);
    if (instRes.data) setData(instRes.data);
    setBids(bidsRes.data ?? []);
    setAdminLog(logRes.data ?? []);
    setLoading(false);
  };

  const handleAction = async (action: string, label: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('admin_auction_action', {
      p_admin_id: user?.id, p_instance_id: id, p_action: action, p_value: null,
    });
    if (error) toast.error(error.message); else { toast.success(`${label}!`); loadAll(); }
  };

  const handleResolve = async () => {
    const { error } = await supabase.rpc('resolve_auction_inline', { p_instance_id: id });
    if (error) toast.error(error.message); else { toast.success('Resolved!'); loadAll(); }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;
  if (!data) return <div className="text-center py-10 text-muted-foreground text-sm">Auction not found</div>;

  const config = data.auction_configs ?? {};
  const fund = data.fund_allocations?.[0] ?? data.fund_allocations ?? {};
  const resBadge = RESOLUTION_BADGE[config.resolution_method] ?? RESOLUTION_BADGE.highest_unique_bid;
  const statusClass = STATUS_COLORS[data.status] ?? 'bg-muted text-muted-foreground';

  const splits = [
    { key: 'Prize', pct: fund.prize_pool_pct ?? config.prize_pool_pct ?? 55, color: 'bg-pngwin-green', textColor: 'text-pngwin-green' },
    { key: 'House', pct: fund.house_fee_pct ?? config.platform_pct ?? 15, color: 'bg-ice', textColor: 'text-ice' },
    { key: 'Burn', pct: fund.burn_pct ?? config.burn_pct ?? 15, color: 'bg-pngwin-red', textColor: 'text-pngwin-red' },
    { key: 'Social', pct: fund.social_circle_pct ?? config.social_circle_pct ?? 5, color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple' },
    { key: 'Jackpot', pct: fund.jackpot_pct ?? config.rollover_pct ?? 10, color: 'bg-primary', textColor: 'text-primary' },
  ];
  const totalFees = Number(data.total_bid_fees) || 0;

  const winnerBid = bids.find(b => b.is_winning);

  const filteredBids = bids
    .filter(b => bidFilter === 'all' ? true : bidFilter === 'unique' ? (b.is_unique && !b.is_burned) : b.is_burned)
    .sort((a, b) => {
      if (bidSort === 'amount') return Number(b.bid_amount) - Number(a.bid_amount);
      if (bidSort === 'user') return (a.users?.username ?? '').localeCompare(b.users?.username ?? '');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const timelineEvents = [
    { label: 'Created', time: data.created_at, active: true },
    { label: 'First Bid', time: bids.length > 0 ? bids[bids.length - 1]?.created_at : null, active: bids.length > 0 },
    { label: 'Hot Mode', time: data.hot_mode_started_at, active: !!data.hot_mode_started_at },
    { label: 'Grace Period', time: data.status === 'grace_period' ? data.hot_mode_ends_at : null, active: data.status === 'grace_period' },
    { label: 'Closed', time: data.actual_end, active: ['closed', 'resolved'].includes(data.status) },
    { label: 'Resolved', time: data.status === 'resolved' ? data.actual_end : null, active: data.status === 'resolved' },
  ];

  return (
    <div>
      <button onClick={() => navigate('/admin/auctions')} className="text-xs text-muted-foreground hover:text-foreground mb-4">← Back to Auctions</button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-xl font-bold mb-1">{config.name ?? 'Auction'}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${statusClass}`}>{data.status}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${resBadge.color}`}>{resBadge.label}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground">
                {config.visibility === 'blind' ? '🙈 Blind' : '👁️ Open'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {['accumulating', 'hot_mode', 'grace_period'].includes(data.status) && (
              <button onClick={() => handleAction('end', 'Closed')} className="px-3 py-1.5 text-xs bg-pngwin-orange/20 text-pngwin-orange rounded-lg hover:bg-pngwin-orange/30">Close</button>
            )}
            {data.status === 'closed' && (
              <button onClick={handleResolve} className="px-3 py-1.5 text-xs bg-ice/20 text-ice rounded-lg hover:bg-ice/30">Resolve</button>
            )}
            {!['resolved', 'cancelled'].includes(data.status) && (
              <button onClick={() => handleAction('cancel', 'Cancelled')} className="px-3 py-1.5 text-xs bg-pngwin-red/20 text-pngwin-red rounded-lg hover:bg-pngwin-red/30">Cancel</button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Bids', value: data.total_bids, color: 'text-foreground', icon: '🎯' },
          { label: 'Prize Pool', value: `${Number(data.prize_pool).toLocaleString()} PNGWIN`, color: 'text-primary', icon: '💰' },
          { label: 'Burned', value: `${Number(data.burned_amount).toLocaleString()} PNGWIN`, color: 'text-pngwin-red', icon: '🔥' },
          { label: 'House Revenue', value: `${Math.floor(totalFees * ((fund.house_fee_pct ?? config.platform_pct ?? 15) / 100)).toLocaleString()} PNGWIN`, color: 'text-ice', icon: '🏦' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{s.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{s.label}</span>
            </div>
            <div className={`font-mono text-lg font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Fund Allocation Visual */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="font-display font-bold text-sm mb-3">Fund Allocation</h2>
        <div className="flex gap-0.5 h-6 rounded-full overflow-hidden mb-3">
          {splits.map(s => (
            <div key={s.key} className={`${s.color} relative group`} style={{ width: `${s.pct}%` }}>
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-background opacity-0 group-hover:opacity-100 transition-opacity">
                {s.pct}%
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {splits.map(s => (
            <div key={s.key} className="text-center">
              <div className={`font-mono text-sm font-bold ${s.textColor}`}>
                {Math.floor(totalFees * s.pct / 100).toLocaleString()}
              </div>
              <div className="text-[9px] text-muted-foreground">{s.key} ({s.pct}%)</div>
            </div>
          ))}
        </div>
      </div>

      {/* Winner (if resolved) */}
      {winnerBid && (
        <div className="bg-gold-subtle border border-gold rounded-xl p-4 mb-4">
          <div className="text-xs text-muted-foreground">🏆 Winner</div>
          <div className="font-bold text-primary text-lg">@{winnerBid.users?.username ?? 'Unknown'}</div>
          <div className="font-mono text-sm">Bid: {winnerBid.bid_amount} • Prize: {Number(data.prize_pool).toLocaleString()} PNGWIN</div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['bids', 'timeline', 'log'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
              activeTab === tab ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground border-transparent hover:bg-secondary'
            }`}>
            {tab === 'bids' ? `🎯 Bids (${bids.length})` : tab === 'timeline' ? '📅 Timeline' : `📝 Admin Log (${adminLog.length})`}
          </button>
        ))}
      </div>

      {/* Bids Tab */}
      {activeTab === 'bids' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex gap-2 p-3 border-b border-border">
            {(['all', 'unique', 'burned'] as const).map(f => (
              <button key={f} onClick={() => setBidFilter(f)}
                className={`px-3 py-1 rounded text-[10px] font-semibold ${bidFilter === f ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                {f === 'all' ? 'All' : f === 'unique' ? '✅ Unique' : '🔥 Burned'}
              </button>
            ))}
            <div className="flex-1" />
            <select value={bidSort} onChange={e => setBidSort(e.target.value as any)}
              className="px-2 py-1 bg-background border border-border rounded text-[10px] focus:outline-none">
              <option value="time">Sort: Time</option>
              <option value="amount">Sort: Amount</option>
              <option value="user">Sort: User</option>
            </select>
          </div>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Player', 'Bid Amount', 'Fee Paid', 'Status', 'Position', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBids.map(b => (
                  <tr key={b.id} className="border-b border-border/30 hover:bg-card-hover">
                    <td className="px-4 py-2 text-sm">@{b.users?.username ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-sm">{b.bid_amount}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{b.bid_fee_paid}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.is_winning ? 'bg-gold-subtle text-primary' : b.is_burned ? 'bg-pngwin-red/10 text-pngwin-red' : 'bg-pngwin-green/10 text-pngwin-green'
                      }`}>
                        {b.is_winning ? '🏆 WINNER' : b.is_burned ? 'BURNED' : 'UNIQUE'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{b.bid_position ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            {timelineEvents.map((evt, i) => (
              <div key={i} className="relative pl-10 pb-6 last:pb-0">
                <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                  evt.active ? (i === timelineEvents.filter(e => e.active).length - 1 ? 'bg-primary border-primary' : 'bg-pngwin-green border-pngwin-green') : 'bg-muted border-border'
                }`} />
                <div className="text-sm font-semibold">{evt.label}</div>
                <div className="text-[10px] text-muted-foreground">
                  {evt.time ? new Date(evt.time).toLocaleString() : 'Not yet'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Log Tab */}
      {activeTab === 'log' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Action', 'Admin', 'Time', 'Details'].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminLog.map(log => (
                <tr key={log.id} className="border-b border-border/30">
                  <td className="px-4 py-2 text-sm font-semibold">{log.action}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{log.admin_id?.slice(0, 8)}...</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground font-mono max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                </tr>
              ))}
              {adminLog.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No admin actions logged</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionDetail;
