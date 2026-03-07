import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_BASE = 'http://89.167.102.46:3000/api/dashboard';

interface KpiData {
  totalPlayers: number;
  playersToday: number;
  totalRevenue: number;
  totalBurned: number;
  activeAuctions: number;
  jackpotPool: number;
  bids24h: number;
  auctionRevenue: number;
  prizesPaid: number;
  engineStatus: string;
  engineLatency: number | null;
}

interface ActivityItem {
  id: string;
  event_type: string;
  description: string;
  gross_amount: number;
  direction: string;
  created_at: string;
  users?: any;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<KpiData>({
    totalPlayers: 0, playersToday: 0, totalRevenue: 0, totalBurned: 0,
    activeAuctions: 0, jackpotPool: 0, bids24h: 0, auctionRevenue: 0, prizesPaid: 0,
    engineStatus: '...', engineLatency: null,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [playerData, setPlayerData] = useState<any[]>([]);
  const [burnData, setBurnData] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [auctionSummary, setAuctionSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadKpis(), loadRevenueChart(), loadPlayerChart(), loadBurnChart(), loadActivity(), loadAuctionSummary()]);
    setLoading(false);
  };

  const loadKpis = async () => {
    // Try fast API for burns
    let burnTotal = 0;
    try {
      const burnRes = await fetch(`${API_BASE}/burns`);
      if (burnRes.ok) {
        const json = await burnRes.json();
        burnTotal = Number(json?.PNGWIN ?? json?.pngwin ?? 0) + Number(json?.TON ?? json?.ton ?? 0) + Number(json?.SOL ?? json?.sol ?? 0);
      }
    } catch { /* fallback below */ }

    // Try fast API for jackpot
    let jackpotPool = 0;
    try {
      const jpRes = await fetch(`${API_BASE}/jackpot`);
      if (jpRes.ok) {
        const json = await jpRes.json();
        jackpotPool = Number(json?.prize_pool ?? json?.current_balance ?? 0);
      }
    } catch { /* fallback */ }

    // Engine health check
    let engineStatus = '❌ Offline';
    let engineLatency: number | null = null;
    try {
      const t0 = performance.now();
      const healthRes = await fetch('http://89.167.102.46:3000/health', { signal: AbortSignal.timeout(5000) });
      engineLatency = Math.round(performance.now() - t0);
      if (healthRes.ok) engineStatus = '✅ Healthy';
      else engineStatus = '⚠️ Degraded';
    } catch { engineStatus = '❌ Offline'; }

    const [playersRes, playersTodayRes, revenueRes, activeRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('ledger_events').select('gross_amount').in('event_type', ['BID_FEE', 'AUCTION_BID']).eq('direction', 'OUT'),
      supabase.from('auction_instances').select('id', { count: 'exact', head: true }).in('status', ['accumulating', 'hot_mode', 'grace_period']),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce((sum: number, e: any) => sum + Number(e.gross_amount), 0);

    // Get burn from DB if API failed
    if (burnTotal === 0) {
      const { data: burnData } = await supabase.from('auction_instances').select('burn_total, burned_amount').gt('burned_amount', 0);
      burnTotal = (burnData ?? []).reduce((s: number, r: any) => s + Number(r.burn_total ?? r.burned_amount ?? 0), 0);
    }

    // 24h bids count
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const { count: bids24h } = await supabase.from('auction_bids').select('id', { count: 'exact', head: true }).gte('created_at', yesterday);

    setKpis({
      totalPlayers: playersRes.count ?? 0,
      playersToday: playersTodayRes.count ?? 0,
      totalRevenue,
      totalBurned: burnTotal,
      activeAuctions: activeRes.count ?? 0,
      jackpotPool,
      bids24h: bids24h ?? 0,
      auctionRevenue: totalRevenue,
      prizesPaid: 0,
      engineStatus,
      engineLatency,
    });
  };

  const loadAuctionSummary = async () => {
    try {
      const res = await fetch(`${API_BASE}/auctions`);
      if (res.ok) {
        const json = await res.json();
        const active = (json ?? []).filter((r: any) => ['accumulating', 'scheduled', 'hot_mode', 'grace_period'].includes(r.status));
        setAuctionSummary(active);
        return;
      }
    } catch { /* fallback */ }

    const { data } = await supabase
      .from('auction_instances')
      .select('*, auction_configs(name, auction_type, bid_fee)')
      .in('status', ['accumulating', 'hot_mode', 'grace_period'])
      .order('created_at', { ascending: false });
    setAuctionSummary(data ?? []);
  };

  const loadRevenueChart = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await supabase
      .from('ledger_events')
      .select('gross_amount, created_at, source_project')
      .in('event_type', ['BID_FEE', 'AUCTION_BID'])
      .eq('direction', 'OUT')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at');

    if (!data) return;
    const byDay: { [key: string]: { auction: number; total: number } } = {};
    data.forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!byDay[day]) byDay[day] = { auction: 0, total: 0 };
      byDay[day].total += Number(e.gross_amount);
      if (e.source_project === 'auction') byDay[day].auction += Number(e.gross_amount);
    });
    setRevenueData(Object.entries(byDay).map(([day, vals]) => ({ day, ...vals })));
  };

  const loadPlayerChart = async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data } = await supabase.from('users').select('created_at').gte('created_at', thirtyDaysAgo).order('created_at');
    if (!data) return;
    const byDay: { [key: string]: number } = {};
    data.forEach((u: any) => {
      const day = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] ?? 0) + 1;
    });
    let cumulative = 0;
    setPlayerData(Object.entries(byDay).map(([day, count]) => { cumulative += count; return { day, signups: count, cumulative }; }));
  };

  const loadBurnChart = async () => {
    const { data } = await supabase
      .from('ledger_events')
      .select('gross_amount, created_at')
      .eq('event_type', 'BURN')
      .eq('direction', 'OUT')
      .order('created_at');
    if (!data || data.length === 0) return;
    const byDay: { [key: string]: number } = {};
    data.forEach((e: any) => {
      const day = new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] ?? 0) + Number(e.gross_amount);
    });
    let cumulative = 0;
    setBurnData(Object.entries(byDay).map(([day, amount]) => { cumulative += amount; return { day, burned: amount, cumulative }; }));
  };

  const loadActivity = async () => {
    const { data } = await supabase
      .from('ledger_events')
      .select('id, event_type, description, gross_amount, direction, created_at, users(username)')
      .order('created_at', { ascending: false })
      .limit(20);
    setActivity((data ?? []) as ActivityItem[]);
  };

  const eventIcon = (type: string) => {
    if (type.includes('BID')) return '🎯';
    if (type.includes('WIN')) return '🏆';
    if (type.includes('BURN')) return '🔥';
    if (type.includes('CREDIT')) return '💰';
    if (type.includes('SOCIAL')) return '🐧';
    return '📋';
  };

  // KPI cards — Row 1: Platform Health
  const healthCards = [
    { label: 'Total Users', value: kpis.totalPlayers.toLocaleString(), sub: `+${kpis.playersToday} today`, color: 'text-ice', icon: '👥' },
    { label: 'Total Volume', value: `${kpis.totalRevenue.toLocaleString()}`, sub: 'PNGWIN collected', color: 'text-primary', icon: '💰' },
    { label: 'Total Burned', value: `${kpis.totalBurned.toLocaleString()}`, sub: 'PNGWIN destroyed', color: 'text-pngwin-red', icon: '🔥' },
    { label: 'Active Auctions', value: kpis.activeAuctions.toString(), sub: 'running now', color: 'text-pngwin-green', icon: '🎮' },
    { label: 'Jackpot Pool', value: `${kpis.jackpotPool.toLocaleString()}`, sub: 'PNGWIN', color: 'text-pngwin-orange', icon: '🎰' },
    { label: 'Engine', value: kpis.engineStatus, sub: kpis.engineLatency !== null ? `${kpis.engineLatency}ms latency` : '—', color: kpis.engineStatus.includes('✅') ? 'text-pngwin-green' : 'text-pngwin-red', icon: '⚙️' },
  ];

  // KPI cards — Row 2: Auction Activity
  const auctionCards = [
    { label: 'Bids (24h)', value: kpis.bids24h.toLocaleString(), sub: 'last 24 hours', color: 'text-ice', icon: '🎯' },
    { label: 'Auction Revenue', value: kpis.auctionRevenue.toLocaleString(), sub: 'total PNGWIN', color: 'text-primary', icon: '📊' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">📊 Dashboard</h1>

      {/* Row 1: Platform Health */}
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Platform Health</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        {healthCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 hover:border-border-active transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{kpi.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className={`font-mono text-xl font-bold ${kpi.color}`}>{loading ? '...' : kpi.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Row 2: Auction Activity */}
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Auction Activity</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {auctionCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 + 0.3 }}
            className="bg-card border border-border rounded-xl p-4 hover:border-border-active transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{kpi.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
            </div>
            <div className={`font-mono text-xl font-bold ${kpi.color}`}>{loading ? '...' : kpi.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Active Auctions Summary */}
      {auctionSummary.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h2 className="font-display font-bold text-sm mb-3">🎮 Active Auctions</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {auctionSummary.map((a: any) => {
              const config = a.auction_configs ?? {};
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/admin/auctions/${a.id}`)}
                  className="bg-background border border-border rounded-lg p-3 text-left hover:border-border-active transition-all"
                >
                  <div className="font-display font-bold text-xs truncate">{config.name ?? 'Auction'}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      a.status === 'hot_mode' ? 'bg-pngwin-red animate-pulse' : 'bg-pngwin-green'
                    }`} />
                    <span className="text-[9px] text-muted-foreground uppercase">{a.status.replace('_', ' ')}</span>
                  </div>
                  <div className="font-mono text-sm font-bold text-foreground mt-1">{Number(a.total_bids ?? 0)} bids</div>
                  <div className="text-[9px] text-muted-foreground">
                    Pool: {Number(a.prize_pool ?? 0).toLocaleString()} · Fee: {Number(config.bid_fee ?? 0)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">📈 Revenue (Last 30 Days)</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(45, 90%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
                <Area type="monotone" dataKey="total" stroke="hsl(45, 90%, 60%)" fill="url(#gradRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">{loading ? 'Loading...' : 'No revenue data yet'}</div>
          )}
        </div>

        {/* Activity Feed */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">⚡ Activity Feed</h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
            {activity.map(item => (
              <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                <span className="text-sm mt-0.5">{eventIcon(item.event_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs truncate">
                    {(Array.isArray(item.users) ? item.users[0]?.username : item.users?.username) && (
                      <span className="text-ice font-semibold">@{Array.isArray(item.users) ? item.users[0]?.username : item.users?.username}</span>
                    )}{' '}
                    <span className="text-muted-foreground">{item.description || item.event_type}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.gross_amount > 0 && (
                      <span className={`font-mono text-[10px] font-bold ${item.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                        {item.direction === 'IN' ? '+' : '-'}{Number(item.gross_amount).toLocaleString()}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div className="text-center text-muted-foreground text-xs py-8">No activity yet</div>}
          </div>
        </div>
      </div>

      {/* Burn Accumulation Chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-display font-bold text-sm mb-4">🔥 Burn Accumulation</h2>
        {burnData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={burnData}>
              <defs>
                <linearGradient id="gradBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 80%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(0, 80%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
              <Area type="monotone" dataKey="cumulative" stroke="hsl(0, 80%, 55%)" fill="url(#gradBurn)" strokeWidth={2} name="Cumulative Burn" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">{loading ? 'Loading...' : 'No burn data yet'}</div>
        )}
      </div>

      {/* Player Growth Chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-display font-bold text-sm mb-4">👥 Player Growth (Last 30 Days)</h2>
        {playerData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={playerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
              <Bar dataKey="signups" fill="hsl(192, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">{loading ? 'Loading...' : 'No signup data yet'}</div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-4">⚡ Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Create Auction', icon: '➕', path: '/admin/auctions/create', color: 'bg-gold-subtle border-gold text-primary' },
            { label: 'View Auctions', icon: '📋', path: '/admin/auctions', color: 'bg-ice-subtle border-ice text-ice' },
            { label: 'View Users', icon: '👥', path: '/admin/users', color: 'bg-purple-subtle border-pngwin-purple/20 text-pngwin-purple' },
            { label: 'Accounting', icon: '💰', path: '/admin/accounting', color: 'bg-green-subtle border-pngwin-green/20 text-pngwin-green' },
          ].map(action => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${action.color}`}
            >
              <div className="text-xl mb-1">{action.icon}</div>
              <div className="text-xs font-bold">{action.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
