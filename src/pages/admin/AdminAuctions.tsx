import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
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
  highest_unique_bid: { label: 'Highest Unique', color: 'bg-gold-subtle text-primary border-gold' },
  rng_closest: { label: 'RNG Closest', color: 'bg-purple-subtle text-pngwin-purple border-pngwin-purple/20' },
  rng_exact: { label: 'Jackpot Draw', color: 'bg-red-subtle text-pngwin-red border-pngwin-red/20' },
};

const TYPE_META: Record<string, { icon: string; label: string }> = {
  live_before_hot: { icon: '🎯', label: 'Live' },
  timed: { icon: '⏱️', label: 'Timed' },
  blind_count: { icon: '🙈', label: 'Blind' },
  blind_timed: { icon: '🙈', label: 'Blind' },
  free: { icon: '🎁', label: 'Free' },
  jackpot: { icon: '🎰', label: 'Jackpot' },
};

const AdminAuctions = () => {
  const navigate = useNavigate();
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [resolutionFilter, setResolutionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'revenue' | 'bids'>('date');

  const fetchInstances = () => {
    setLoading(true);
    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setInstances(data);
        setLoading(false);
        if (error) console.error(error);
      });
  };

  useEffect(() => { fetchInstances(); }, []);

  const handleAction = async (id: string, action: string, label: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('admin_auction_action', {
      p_admin_id: user?.id, p_instance_id: id, p_action: action, p_value: null,
    });
    if (error) toast.error(error.message); else { toast.success(`Auction ${label}!`); fetchInstances(); }
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase.rpc('resolve_auction_inline', { p_instance_id: id });
    if (error) toast.error(error.message); else { toast.success('Auction resolved!'); fetchInstances(); }
  };

  const handleDelete = async (id: string, totalBids: number) => {
    if (totalBids > 0) { toast.error('Cannot delete auction with bids'); return; }
    const { error } = await supabase.from('auction_instances').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Deleted'); fetchInstances(); }
  };

  const filtered = useMemo(() => {
    let list = instances;
    if (statusFilter !== 'all') list = list.filter(i => i.status === statusFilter);
    if (resolutionFilter !== 'all') list = list.filter(i => i.auction_configs?.resolution_method === resolutionFilter);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(i => i.auction_configs?.name?.toLowerCase().includes(s));
    }
    if (sortBy === 'revenue') list = [...list].sort((a, b) => Number(b.total_bid_fees) - Number(a.total_bid_fees));
    else if (sortBy === 'bids') list = [...list].sort((a, b) => b.total_bids - a.total_bids);
    return list;
  }, [instances, statusFilter, resolutionFilter, search, sortBy]);

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-bold">📋 Auctions</h1>
        <button onClick={() => navigate('/admin/auctions/create')} className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold">
          ➕ Create
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name..."
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs w-48 focus:outline-none focus:border-primary" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
          <option value="all">All Status</option>
          {['accumulating', 'hot_mode', 'grace_period', 'closed', 'resolved', 'cancelled'].map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        <select value={resolutionFilter} onChange={e => setResolutionFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
          <option value="all">All Resolution</option>
          <option value="highest_unique_bid">Highest Unique</option>
          <option value="rng_closest">RNG Closest</option>
          <option value="rng_exact">RNG Exact</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
          <option value="date">Sort: Date</option>
          <option value="revenue">Sort: Revenue</option>
          <option value="bids">Sort: Bids</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Name', 'Type', 'Status', 'Resolution', 'Visibility', 'Bid Fee', 'Bids', 'Pool', 'Burned', 'Created', 'Winner', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(inst => {
                const config = inst.auction_configs;
                const meta = TYPE_META[config?.auction_type] ?? { icon: '🎯', label: config?.auction_type };
                const statusClass = STATUS_COLORS[inst.status] ?? 'bg-muted text-muted-foreground';
                const resBadge = RESOLUTION_BADGE[config?.resolution_method] ?? RESOLUTION_BADGE.highest_unique_bid;
                return (
                  <tr key={inst.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors cursor-pointer"
                    onClick={() => navigate(`/admin/auctions/${inst.id}`)}>
                    <td className="px-4 py-3 text-sm font-medium">{config?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-xs">{meta.icon} {meta.label}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${statusClass}`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${resBadge.color}`}>
                        {resBadge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">{config?.visibility === 'blind' ? '🙈 Blind' : '👁️ Open'}</td>
                    <td className="px-4 py-3 font-mono text-xs">{config?.bid_fee}</td>
                    <td className="px-4 py-3 font-mono text-sm">{inst.total_bids}</td>
                    <td className="px-4 py-3 font-mono text-sm text-primary font-bold">{Number(inst.prize_pool).toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-sm text-pngwin-red">{Number(inst.burned_amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(inst.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs">{inst.winner_id ? '✅' : '—'}</td>
                    <td className="px-4 py-3 text-right space-x-2" onClick={e => e.stopPropagation()}>
                      {['accumulating', 'hot_mode', 'grace_period'].includes(inst.status) && (
                        <button onClick={() => handleAction(inst.id, 'end', 'closed')} className="text-xs text-pngwin-orange hover:text-pngwin-orange/80">Close</button>
                      )}
                      {inst.status === 'closed' && (
                        <button onClick={() => handleResolve(inst.id)} className="text-xs text-ice hover:text-ice/80">Resolve</button>
                      )}
                      {!['resolved', 'cancelled'].includes(inst.status) && (
                        <button onClick={() => handleAction(inst.id, 'cancel', 'cancelled')} className="text-xs text-pngwin-red hover:text-pngwin-red/80">Cancel</button>
                      )}
                      {inst.total_bids === 0 && (
                        <button onClick={() => handleDelete(inst.id, inst.total_bids)} className="text-xs text-muted-foreground hover:text-foreground">Delete</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={12} className="px-5 py-10 text-center text-muted-foreground text-sm">No auctions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminAuctions;
