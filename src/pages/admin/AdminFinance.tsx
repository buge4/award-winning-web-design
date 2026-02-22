import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AdminFinance = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [totals, setTotals] = useState({ revenue: 0, house: 0, burned: 0, social: 0, jackpot: 0, prizes: 0 });
  const [burnData, setBurnData] = useState<any[]>([]);
  const [jackpotInfo, setJackpotInfo] = useState({ pool: 0, dailyInflow: 0 });

  useEffect(() => { loadAll(); }, [period]);

  const getDateFilter = () => {
    const now = new Date();
    if (period === 'today') return new Date(now.toISOString().split('T')[0]).toISOString();
    if (period === 'week') return new Date(now.getTime() - 7 * 86400000).toISOString();
    if (period === 'month') return new Date(now.getTime() - 30 * 86400000).toISOString();
    return '2000-01-01T00:00:00Z';
  };

  const loadAll = async () => {
    setLoading(true);
    const since = getDateFilter();

    const [revenueRes, allocRes, burnRes, jackpotRes, burnChartRes] = await Promise.all([
      supabase.from('ledger_events').select('gross_amount').in('event_type', ['BID_FEE', 'AUCTION_BID']).eq('direction', 'OUT').gte('created_at', since),
      supabase.from('ledger_allocations').select('recipient_type, amount').gte('created_at', since),
      supabase.from('ledger_allocations').select('amount').eq('recipient_type', 'burn').gte('created_at', since),
      supabase.from('jackpots').select('current_balance').eq('status', 'ACTIVE'),
      supabase.from('ledger_allocations').select('amount, created_at').eq('recipient_type', 'burn').gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString()).order('created_at'),
    ]);

    const revenue = (revenueRes.data ?? []).reduce((s: number, e: any) => s + Number(e.gross_amount), 0);
    const allocs = allocRes.data ?? [];
    const byType = (type: string) => allocs.filter((a: any) => a.recipient_type === type).reduce((s: number, a: any) => s + Number(a.amount), 0);

    setTotals({
      revenue,
      house: byType('platform'),
      burned: byType('burn'),
      social: byType('social_L1') + byType('social_L2') + byType('social_L3') + byType('social_L4') + byType('social_L5'),
      jackpot: byType('jackpot'),
      prizes: byType('winner') + byType('rollover'),
    });

    setJackpotInfo({
      pool: (jackpotRes.data ?? []).reduce((s: number, j: any) => s + Number(j.current_balance), 0),
      dailyInflow: byType('jackpot') / Math.max(1, period === 'today' ? 1 : period === 'week' ? 7 : 30),
    });

    // Burn chart by day
    const burnByDay: Record<string, number> = {};
    (burnChartRes.data ?? []).forEach((b: any) => {
      const day = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      burnByDay[day] = (burnByDay[day] ?? 0) + Number(b.amount);
    });
    setBurnData(Object.entries(burnByDay).map(([day, amount]) => ({ day, amount })));

    setLoading(false);
  };

  const pieData = [
    { name: 'Prizes', value: totals.prizes, color: 'hsl(152, 100%, 45%)' },
    { name: 'House', value: totals.house, color: 'hsl(192, 100%, 50%)' },
    { name: 'Burn', value: totals.burned, color: 'hsl(350, 100%, 63%)' },
    { name: 'Social', value: totals.social, color: 'hsl(270, 91%, 65%)' },
    { name: 'Jackpot', value: totals.jackpot, color: 'hsl(45, 90%, 60%)' },
  ].filter(d => d.value > 0);

  const summaryCards = [
    { label: 'Total Revenue', value: totals.revenue, color: 'text-primary', icon: '💰' },
    { label: 'House Take', value: totals.house, color: 'text-ice', icon: '🏦' },
    { label: 'Total Burned', value: totals.burned, color: 'text-pngwin-red', icon: '🔥' },
    { label: 'Social Paid', value: totals.social, color: 'text-pngwin-purple', icon: '🐧' },
    { label: 'Jackpot Feed', value: totals.jackpot, color: 'text-pngwin-orange', icon: '🎰' },
    { label: 'Prizes Paid', value: totals.prizes, color: 'text-pngwin-green', icon: '🏆' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">💰 Finance</h1>
        <div className="flex gap-1">
          {(['today', 'week', 'month', 'all'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                period === p ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground border-transparent hover:bg-secondary'
              }`}>{p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {summaryCards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-1 mb-1">
              <span>{c.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{c.label}</span>
            </div>
            <div className={`font-mono text-lg font-bold ${c.color}`}>{loading ? '...' : c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fund Flow Breakdown */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">📊 Fund Allocation</h2>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-xs">{d.name}</span>
                    <span className="font-mono text-xs font-bold">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">No data</div>
          )}
        </div>

        {/* Jackpot Report */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">🎰 Jackpot Report</h2>
          <div className="space-y-4">
            <div className="bg-background rounded-lg p-4">
              <div className="text-[10px] text-muted-foreground uppercase">Current Pool</div>
              <div className="font-mono text-2xl font-bold text-pngwin-orange">{jackpotInfo.pool.toLocaleString()} <span className="text-xs text-muted-foreground">PNGWIN</span></div>
            </div>
            <div className="bg-background rounded-lg p-4">
              <div className="text-[10px] text-muted-foreground uppercase">Avg Daily Inflow</div>
              <div className="font-mono text-lg font-bold text-primary">{Math.floor(jackpotInfo.dailyInflow).toLocaleString()} <span className="text-xs text-muted-foreground">PNGWIN/day</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Burn Chart */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-4">🔥 Burn Rate (Last 30 Days)</h2>
        {burnData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={burnData}>
              <defs>
                <linearGradient id="gradBurn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(350, 100%, 63%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(350, 100%, 63%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
              <Area type="monotone" dataKey="amount" stroke="hsl(350, 100%, 63%)" fill="url(#gradBurn)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">No burn data</div>
        )}
      </div>
    </div>
  );
};

export default AdminFinance;
