import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  accumulating: 'bg-pngwin-green/20 text-pngwin-green border-pngwin-green/30',
  hot_mode: 'bg-pngwin-red/20 text-pngwin-red border-pngwin-red/30',
  grace_period: 'bg-pngwin-orange/20 text-pngwin-orange border-pngwin-orange/30',
  closed: 'bg-muted text-muted-foreground border-border',
  resolved: 'bg-pngwin-green/10 text-pngwin-green border-pngwin-green/20',
  cancelled: 'bg-pngwin-red/10 text-pngwin-red/60 border-pngwin-red/10',
  scheduled: 'bg-ice/10 text-ice border-ice/20',
};

const STATUS_ICON: Record<string, string> = {
  accumulating: '🟢', hot_mode: '🔴', grace_period: '🟡',
  closed: '⚪', resolved: '✅', cancelled: '❌', scheduled: '⏳',
};

const AdminGameTracker = () => {
  const { configId } = useParams<{ configId: string }>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [bidChartData, setBidChartData] = useState<any[]>([]);

  useEffect(() => { if (configId) loadAll(); }, [configId]);

  const loadAll = async () => {
    setLoading(true);
    const [configRes, instRes] = await Promise.all([
      supabase.from('auction_configs').select('*').eq('id', configId).single(),
      supabase.from('auction_instances')
        .select('id, status, total_bids, total_bid_fees, total_unique_bidders, prize_pool, burned_amount, created_at, scheduled_end, actual_end, hot_mode_started_at')
        .eq('config_id', configId)
        .order('created_at', { ascending: false }),
    ]);

    setConfig(configRes.data);
    const insts = instRes.data ?? [];
    setInstances(insts);

    // Build charts from instances (newest last for charts)
    const sorted = [...insts].reverse();
    setRevenueChartData(sorted.map((inst, i) => ({
      label: `#${i + 1}`,
      revenue: Number(inst.total_bid_fees ?? 0),
      bids: Number(inst.total_bids ?? 0),
      burned: Number(inst.burned_amount ?? 0),
    })));
    setBidChartData(sorted.map((inst, i) => ({
      label: `#${i + 1}`,
      bids: Number(inst.total_bids ?? 0),
      players: Number(inst.total_unique_bidders ?? 0),
    })));

    setLoading(false);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;
  if (!config) return <div className="text-center py-10 text-muted-foreground text-sm">Config not found</div>;

  const activeInstances = instances.filter(i => ['accumulating', 'hot_mode', 'grace_period', 'scheduled'].includes(i.status));
  const resolvedInstances = instances.filter(i => i.status === 'resolved');
  const totalRevenue = instances.reduce((s, i) => s + Number(i.total_bid_fees ?? 0), 0);
  const totalBids = instances.reduce((s, i) => s + Number(i.total_bids ?? 0), 0);
  const totalBurned = instances.reduce((s, i) => s + Number(i.burned_amount ?? 0), 0);

  // Week-over-week comparison (last 2 instances)
  const current = instances[0];
  const previous = instances[1];
  const wowMetrics = current && previous ? [
    { label: 'Bids', cur: Number(current.total_bids ?? 0), prev: Number(previous.total_bids ?? 0) },
    { label: 'Players', cur: Number(current.total_unique_bidders ?? 0), prev: Number(previous.total_unique_bidders ?? 0) },
    { label: 'Revenue', cur: Number(current.total_bid_fees ?? 0), prev: Number(previous.total_bid_fees ?? 0) },
    { label: 'Prize Pool', cur: Number(current.prize_pool ?? 0), prev: Number(previous.prize_pool ?? 0) },
    { label: 'Burned', cur: Number(current.burned_amount ?? 0), prev: Number(previous.burned_amount ?? 0) },
  ] : [];

  const pctChange = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? '+∞' : '0%';
    const pct = ((cur - prev) / prev * 100).toFixed(0);
    return Number(pct) >= 0 ? `+${pct}%` : `${pct}%`;
  };

  return (
    <div>
      <button onClick={() => navigate('/admin/games')} className="text-xs text-muted-foreground hover:text-foreground mb-4">← Back to Games</button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-xl font-bold mb-1">{config.name} — Master Dashboard</h1>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>CONFIG: {config.auction_type?.replace('_', ' ')} · {config.bid_fee} {config.currency ?? 'PNGWIN'}/bid · {config.visibility}</div>
              <div>FUND SPLIT: {config.split_prize_pct}% prize · {config.split_burn_pct}% burn · {config.split_platform_pct}% platform · {config.split_social_pct}% social · {config.split_jackpot_pct}% JP</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate(`/admin/auctions/create`)}
              className="px-3 py-1.5 text-xs bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20">
              ➕ New Instance
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Instances', value: instances.length, icon: '📊', color: 'text-foreground' },
          { label: 'Active Now', value: activeInstances.length, icon: '🟢', color: 'text-pngwin-green' },
          { label: 'Total Revenue', value: totalRevenue.toLocaleString(), icon: '💰', color: 'text-primary' },
          { label: 'Total Bids', value: totalBids.toLocaleString(), icon: '🎯', color: 'text-ice' },
          { label: 'Total Burned', value: totalBurned.toLocaleString(), icon: '🔥', color: 'text-pngwin-red' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span>{kpi.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{kpi.label}</span>
            </div>
            <div className={`font-mono text-xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Instance Timeline */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="font-display font-bold text-sm mb-3">Instance Timeline</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {instances.map((inst, i) => (
            <button
              key={inst.id}
              onClick={() => navigate(`/admin/games/${configId}/${inst.id}`)}
              className={`flex-shrink-0 border rounded-lg p-3 text-left min-w-[120px] transition-all hover:scale-[1.02] ${STATUS_COLORS[inst.status] ?? 'bg-muted border-border'}`}
            >
              <div className="text-xs font-bold">#{instances.length - i}</div>
              <div className="text-lg my-0.5">{STATUS_ICON[inst.status] ?? '⚪'}</div>
              <div className="text-[10px] font-mono">{Number(inst.total_bids ?? 0)} bids</div>
              <div className="text-[9px] opacity-70">{Number(inst.total_bid_fees ?? 0).toLocaleString()}</div>
            </button>
          ))}
          {instances.length === 0 && <div className="text-muted-foreground text-sm">No instances yet</div>}
        </div>
      </div>

      {/* Week-over-Week Comparison */}
      {wowMetrics.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="font-display font-bold text-sm mb-3">Instance-over-Instance Comparison</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Metric', `Current (#${instances.length})`, `Previous (#${instances.length - 1})`, 'Change'].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wowMetrics.map(m => {
                const change = pctChange(m.cur, m.prev);
                const isPositive = change.startsWith('+') && change !== '+0%';
                const isNegative = change.startsWith('-');
                return (
                  <tr key={m.label} className="border-b border-border/30">
                    <td className="px-3 py-2 text-sm font-medium">{m.label}</td>
                    <td className="px-3 py-2 font-mono text-sm">{m.cur.toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono text-sm text-muted-foreground">{m.prev.toLocaleString()}</td>
                    <td className={`px-3 py-2 font-mono text-sm font-bold ${isPositive ? 'text-pngwin-green' : isNegative ? 'text-pngwin-red' : 'text-muted-foreground'}`}>
                      {change} {isPositive ? '⬆' : isNegative ? '⬇' : ''}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">📊 Revenue per Instance</h2>
          {revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="revenue" fill="hsl(45, 90%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">🎯 Bids per Instance</h2>
          {bidChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={bidChartData}>
                <defs>
                  <linearGradient id="gradBids" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(192, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(192, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
                <Area type="monotone" dataKey="bids" stroke="hsl(192, 100%, 50%)" fill="url(#gradBids)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No data</div>}
        </div>
      </div>

      {/* All Instances Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display font-bold text-sm">All Instances ({instances.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['#', 'Status', 'Bids', 'Players', 'Revenue', 'Prize Pool', 'Burned', 'Created', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {instances.map((inst, i) => (
                <tr key={inst.id} className="border-b border-border/30 hover:bg-card-hover cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/games/${configId}/${inst.id}`)}>
                  <td className="px-4 py-2 font-mono text-sm font-bold">#{instances.length - i}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${STATUS_COLORS[inst.status]?.split(' ').slice(0, 2).join(' ') ?? 'bg-muted text-muted-foreground'}`}>
                      {STATUS_ICON[inst.status] ?? '⚪'} {inst.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-sm">{Number(inst.total_bids ?? 0)}</td>
                  <td className="px-4 py-2 font-mono text-sm text-muted-foreground">{Number(inst.total_unique_bidders ?? 0)}</td>
                  <td className="px-4 py-2 font-mono text-sm text-primary font-bold">{Number(inst.total_bid_fees ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono text-sm text-pngwin-green">{Number(inst.prize_pool ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2 font-mono text-sm text-pngwin-red">{Number(inst.burned_amount ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(inst.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-xs text-primary">View →</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminGameTracker;
