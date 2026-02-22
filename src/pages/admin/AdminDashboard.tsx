import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface KpiData {
  totalPlayers: number;
  playersToday: number;
  totalRevenue: number;
  totalBurned: number;
  activeGames: number;
  jackpotPool: number;
}

interface Record {
  label: string;
  value: string;
  sub: string;
  icon: string;
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
  const [kpis, setKpis] = useState<KpiData>({ totalPlayers: 0, playersToday: 0, totalRevenue: 0, totalBurned: 0, activeGames: 0, jackpotPool: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [playerData, setPlayerData] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadKpis(), loadRevenueChart(), loadPlayerChart(), loadActivity(), loadRecords()]);
    setLoading(false);
  };

  const loadKpis = async () => {
    const [playersRes, playersTodayRes, revenueRes, burnRes, activeRes, jackpotRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', new Date().toISOString().split('T')[0]),
      supabase.from('ledger_events').select('gross_amount').in('event_type', ['BID_FEE', 'AUCTION_BID']).eq('direction', 'OUT'),
      supabase.from('ledger_allocations').select('amount').eq('recipient_type', 'burn'),
      supabase.from('auction_instances').select('id', { count: 'exact', head: true }).in('status', ['accumulating', 'hot_mode', 'grace_period']),
      supabase.from('jackpots').select('current_balance').eq('status', 'ACTIVE'),
    ]);

    const totalRevenue = (revenueRes.data ?? []).reduce((sum: number, e: any) => sum + Number(e.gross_amount), 0);
    const totalBurned = (burnRes.data ?? []).reduce((sum: number, e: any) => sum + Number(e.amount), 0);
    const jackpotPool = (jackpotRes.data ?? []).reduce((sum: number, j: any) => sum + Number(j.current_balance), 0);

    setKpis({
      totalPlayers: playersRes.count ?? 0,
      playersToday: playersTodayRes.count ?? 0,
      totalRevenue,
      totalBurned,
      activeGames: activeRes.count ?? 0,
      jackpotPool,
    });
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
    const { data } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at');

    if (!data) return;

    const byDay: { [key: string]: number } = {};
    data.forEach((u: any) => {
      const day = new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = (byDay[day] ?? 0) + 1;
    });

    let cumulative = 0;
    setPlayerData(Object.entries(byDay).map(([day, count]) => {
      cumulative += count;
      return { day, signups: count, cumulative };
    }));
  };

  const loadActivity = async () => {
    const { data } = await supabase
      .from('ledger_events')
      .select('id, event_type, description, gross_amount, direction, created_at, users(username)')
      .order('created_at', { ascending: false })
      .limit(20);

    setActivity((data ?? []) as ActivityItem[]);
  };

  const loadRecords = async () => {
    const [mostBidsRes, highRevRes, bigWinRes] = await Promise.all([
      supabase.from('auction_instances').select('id, total_bids, auction_configs(name)').order('total_bids', { ascending: false }).limit(1).single(),
      supabase.from('auction_instances').select('id, total_bid_fees, auction_configs(name)').order('total_bid_fees', { ascending: false }).limit(1).single(),
      supabase.from('ledger_events').select('gross_amount, users(username)').eq('event_type', 'AUCTION_WIN').order('gross_amount', { ascending: false }).limit(1).single(),
    ]);

    const recs: Record[] = [];
    if (mostBidsRes.data) {
      const d = mostBidsRes.data as any;
      recs.push({ icon: '🎯', label: 'Most Bids', value: `${d.total_bids} bids`, sub: d.auction_configs?.name ?? '' });
    }
    if (highRevRes.data) {
      const d = highRevRes.data as any;
      recs.push({ icon: '💰', label: 'Highest Revenue', value: `${Number(d.total_bid_fees).toLocaleString()} PNGWIN`, sub: d.auction_configs?.name ?? '' });
    }
    if (bigWinRes.data) {
      const d = bigWinRes.data as any;
      recs.push({ icon: '🏆', label: 'Biggest Win', value: `${Number(d.gross_amount).toLocaleString()} PNGWIN`, sub: d.users?.username ? `@${d.users.username}` : '' });
    }
    setRecords(recs);
  };

  const kpiCards = [
    { label: 'Total Players', value: kpis.totalPlayers.toLocaleString(), sub: `+${kpis.playersToday} today`, color: 'text-ice', icon: '👥' },
    { label: 'Total Revenue', value: `${kpis.totalRevenue.toLocaleString()}`, sub: 'PNGWIN collected', color: 'text-primary', icon: '💰' },
    { label: 'Total Burned', value: `${kpis.totalBurned.toLocaleString()}`, sub: 'PNGWIN destroyed', color: 'text-pngwin-red', icon: '🔥' },
    { label: 'Active Games', value: kpis.activeGames.toString(), sub: 'auctions running', color: 'text-pngwin-green', icon: '🎮' },
    { label: 'Jackpot Pool', value: `${kpis.jackpotPool.toLocaleString()}`, sub: 'PNGWIN', color: 'text-pngwin-orange', icon: '🎰' },
  ];

  const eventIcon = (type: string) => {
    if (type.includes('BID')) return '🎯';
    if (type.includes('WIN')) return '🏆';
    if (type.includes('BURN')) return '🔥';
    if (type.includes('CREDIT')) return '💰';
    return '📋';
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">📊 Dashboard</h1>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {kpiCards.map((kpi, i) => (
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
                <Tooltip
                  contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }}
                  labelStyle={{ color: 'hsl(210, 40%, 96%)' }}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(45, 90%, 60%)" fill="url(#gradRevenue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
              {loading ? 'Loading...' : 'No revenue data yet'}
            </div>
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
                    {(Array.isArray(item.users) ? item.users[0]?.username : item.users?.username) && <span className="text-ice font-semibold">@{Array.isArray(item.users) ? item.users[0]?.username : item.users?.username}</span>}{' '}
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

      {/* Player Growth Chart */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-display font-bold text-sm mb-4">👥 Player Growth (Last 30 Days)</h2>
        {playerData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={playerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <Tooltip
                contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }}
              />
              <Bar dataKey="signups" fill="hsl(192, 100%, 50%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            {loading ? 'Loading...' : 'No signup data yet'}
          </div>
        )}
      </div>

      {/* Records & Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Records */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">🏅 Records & Highlights</h2>
          <div className="space-y-3">
            {records.map((rec, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <span className="text-xl">{rec.icon}</span>
                <div className="flex-1">
                  <div className="text-[10px] text-muted-foreground uppercase">{rec.label}</div>
                  <div className="font-mono text-sm font-bold text-foreground">{rec.value}</div>
                  <div className="text-[10px] text-muted-foreground">{rec.sub}</div>
                </div>
              </div>
            ))}
            {records.length === 0 && <div className="text-center text-muted-foreground text-xs py-4">No records yet</div>}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">⚡ Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Create Auction', icon: '➕', path: '/admin/auctions/create', color: 'bg-gold-subtle border-gold text-primary' },
              { label: 'View Auctions', icon: '📋', path: '/admin/auctions', color: 'bg-ice-subtle border-ice text-ice' },
              { label: 'View Users', icon: '👥', path: '/admin/users', color: 'bg-purple-subtle border-pngwin-purple/20 text-pngwin-purple' },
              { label: 'Revenue Report', icon: '💰', path: '/admin/finance', color: 'bg-green-subtle border-pngwin-green/20 text-pngwin-green' },
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
    </div>
  );
};

export default AdminDashboard;
