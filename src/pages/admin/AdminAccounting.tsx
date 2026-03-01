import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '@/components/admin/StatCard';
import AuctionBreakdownCard from '@/components/admin/AuctionBreakdownCard';
import TransactionBadge from '@/components/admin/TransactionBadge';
import BurnCard from '@/components/admin/BurnCard';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent
} from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

/* ───── types ───── */
interface AuctionRow {
  instance_id: string;
  name: string;
  auction_type: string;
  status: string;
  bids: number;
  users: number;
  collected: number;
  prize_pool: number;
  burned: number;
  jackpot_feed: number;
  social_pool: number;
}

interface LedgerRow {
  id: string;
  created_at: string;
  event_type: string;
  description: string;
  gross_amount: number;
  direction: string;
  user_id: string;
  username: string;
  instance_id: string | null;
  balance_after: number;
  allocations: { recipient_type: string; amount: number }[];
}

/* ───── component ───── */
const AdminAccounting = () => {
  const navigate = useNavigate();

  /* --- Section 1: Global stats --- */
  const [stats, setStats] = useState({
    totalRevenue: 0, totalPrizes: 0, totalBurned: 0,
    jackpotBalance: 0, platformProfit: 0, totalUsers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  /* --- Section 2: Per-auction cards --- */
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [auctionFilter, setAuctionFilter] = useState<'all' | 'accumulating' | 'resolved' | 'closed'>('all');

  /* --- Section 3: Ledger transactions --- */
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerFilter, setLedgerFilter] = useState({ type: '', user: '' });
  const LEDGER_PAGE_SIZE = 50;

  /* --- Section 4: Burn tracker --- */
  const [burnTotals, setBurnTotals] = useState({ PNGWIN: 0, TON: 0, SOL: 0 });
  const [burnChart, setBurnChart] = useState<{ day: string; cumulative: number }[]>([]);
  const [burnLoading, setBurnLoading] = useState(true);

  /* --- Expandable ledger rows --- */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  useEffect(() => {
    loadStats();
    loadAuctions();
    loadBurns();
  }, []);

  useEffect(() => { loadLedger(); }, [ledgerPage, ledgerFilter]);

  /* ─── loaders ─── */
  const loadStats = async () => {
    setStatsLoading(true);
    const [revRes, allocRes, jpRes, usersRes] = await Promise.all([
      supabase.from('ledger_events').select('gross_amount').in('event_type', ['BID_FEE', 'AUCTION_BID']).eq('direction', 'OUT'),
      supabase.from('ledger_allocations').select('recipient_type, amount'),
      supabase.from('jackpots').select('current_balance').eq('status', 'ACTIVE'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ]);

    const revenue = (revRes.data ?? []).reduce((s, e: any) => s + Number(e.gross_amount), 0);
    const allocs = allocRes.data ?? [];
    const byType = (t: string) => allocs.filter((a: any) => a.recipient_type === t).reduce((s, a: any) => s + Number(a.amount), 0);
    const prizes = byType('winner') + byType('rollover');
    const burned = byType('burn');
    const social = ['social_L1', 'social_L2', 'social_L3', 'social_L4', 'social_L5'].reduce((s, t) => s + byType(t), 0);
    const platform = byType('platform');
    const jackpot = (jpRes.data ?? []).reduce((s, j: any) => s + Number(j.current_balance), 0);

    setStats({
      totalRevenue: revenue, totalPrizes: prizes, totalBurned: burned,
      jackpotBalance: jackpot, platformProfit: platform, totalUsers: usersRes.count ?? 0,
    });
    setStatsLoading(false);
  };

  const loadAuctions = async () => {
    setAuctionsLoading(true);
    const { data: instances } = await supabase
      .from('auction_instances')
      .select('id, status, total_bids, total_unique_bidders, total_bid_fees, auction_configs(name, auction_type)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!instances) { setAuctionsLoading(false); return; }

    const ids = instances.map((i: any) => i.id);
    const { data: allocs } = await supabase
      .from('ledger_allocations')
      .select('game_instance_id, recipient_type, amount')
      .in('game_instance_id', ids);

    const allocMap: Record<string, Record<string, number>> = {};
    (allocs ?? []).forEach((a: any) => {
      if (!allocMap[a.game_instance_id]) allocMap[a.game_instance_id] = {};
      allocMap[a.game_instance_id][a.recipient_type] = (allocMap[a.game_instance_id][a.recipient_type] ?? 0) + Number(a.amount);
    });

    const rows: AuctionRow[] = instances.map((i: any) => {
      const a = allocMap[i.id] ?? {};
      const socialTotal = ['social_L1', 'social_L2', 'social_L3', 'social_L4', 'social_L5'].reduce((s, t) => s + (a[t] ?? 0), 0);
      return {
        instance_id: i.id,
        name: i.auction_configs?.name ?? 'Unknown',
        auction_type: i.auction_configs?.auction_type ?? '',
        status: i.status,
        bids: i.total_bids ?? 0,
        users: i.total_unique_bidders ?? 0,
        collected: Number(i.total_bid_fees ?? 0),
        prize_pool: (a.winner ?? 0) + (a.rollover ?? 0),
        burned: a.burn ?? 0,
        jackpot_feed: a.jackpot ?? 0,
        social_pool: socialTotal,
      };
    });

    setAuctions(rows);
    setAuctionsLoading(false);
  };

  const loadLedger = async () => {
    setLedgerLoading(true);
    const from = (ledgerPage - 1) * LEDGER_PAGE_SIZE;
    const to = from + LEDGER_PAGE_SIZE - 1;

    let query = supabase
      .from('ledger_events')
      .select('id, created_at, event_type, description, gross_amount, direction, user_id, game_instance_id, users(username)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (ledgerFilter.type) query = query.eq('event_type', ledgerFilter.type);
    if (ledgerFilter.user) query = query.ilike('users.username', `%${ledgerFilter.user}%`);

    const { data, count } = await query;
    setLedgerTotal(count ?? 0);

    if (!data) { setLedgerLoading(false); return; }

    const eventIds = data.map((e: any) => e.id);
    const { data: allocs } = await supabase
      .from('ledger_allocations')
      .select('ledger_event_id, recipient_type, amount')
      .in('ledger_event_id', eventIds);

    const allocMap: Record<string, { recipient_type: string; amount: number }[]> = {};
    (allocs ?? []).forEach((a: any) => {
      if (!allocMap[a.ledger_event_id]) allocMap[a.ledger_event_id] = [];
      allocMap[a.ledger_event_id].push({ recipient_type: a.recipient_type, amount: Number(a.amount) });
    });

    const rows: LedgerRow[] = data.map((e: any) => ({
      id: e.id,
      created_at: e.created_at,
      event_type: e.event_type,
      description: e.description ?? '',
      gross_amount: Number(e.gross_amount),
      direction: e.direction,
      user_id: e.user_id,
      username: (Array.isArray(e.users) ? e.users[0]?.username : e.users?.username) ?? '',
      instance_id: e.game_instance_id,
      balance_after: 0,
      allocations: allocMap[e.id] ?? [],
    }));

    setLedger(rows);
    setLedgerLoading(false);
  };

  const loadBurns = async () => {
    setBurnLoading(true);
    const { data } = await supabase
      .from('ledger_allocations')
      .select('amount, created_at, currency')
      .eq('recipient_type', 'burn')
      .order('created_at');

    const totals: Record<string, number> = { PNGWIN: 0, TON: 0, SOL: 0 };
    const byDay: Record<string, number> = {};
    let cumulative = 0;

    (data ?? []).forEach((b: any) => {
      const amt = Number(b.amount);
      const cur = b.currency ?? 'PNGWIN';
      totals[cur] = (totals[cur] ?? 0) + amt;
      cumulative += amt;
      const day = new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      byDay[day] = cumulative;
    });

    setBurnTotals(totals as any);
    setBurnChart(Object.entries(byDay).map(([day, cumulative]) => ({ day, cumulative })));
    setBurnLoading(false);
  };

  const filteredAuctions = useMemo(() => {
    if (auctionFilter === 'all') return auctions;
    return auctions.filter(a => a.status === auctionFilter);
  }, [auctions, auctionFilter]);

  const ledgerPages = Math.ceil(ledgerTotal / LEDGER_PAGE_SIZE);
  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  const maxBurn = Math.max(...Object.values(burnTotals), 1);

  const allocColor: Record<string, string> = {
    winner: 'text-pngwin-green',
    rollover: 'text-pngwin-green',
    burn: 'text-pngwin-red',
    platform: 'text-foreground',
    jackpot: 'text-primary',
    social_L1: 'text-ice',
    social_L2: 'text-ice',
    social_L3: 'text-ice',
    social_L4: 'text-ice',
    social_L5: 'text-ice',
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Admin <span className="text-primary">Accounting</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Financial overview · Live Supabase data</p>
        </div>
        <button
          onClick={() => { loadStats(); loadAuctions(); loadLedger(); loadBurns(); }}
          className="px-4 py-2 text-xs font-medium bg-card border border-border rounded-lg hover:border-border-active transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* ─── SECTION 1: GLOBAL STATS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-[14px]" />)
        ) : (
          <>
            <StatCard label="Total Revenue" value={fmt(stats.totalRevenue)} color="green" icon="💰" />
            <StatCard label="Tokens Burned" value={fmt(stats.totalBurned)} color="red" icon="🔥" delay={0.05} />
            <StatCard label="Jackpot Balance" value={fmt(stats.jackpotBalance)} color="gold" icon="🎰" delay={0.1} />
            <StatCard label="Active Users" value={stats.totalUsers} color="cyan" icon="👥" delay={0.15} />
            <StatCard label="Prizes Paid" value={fmt(stats.totalPrizes)} color="purple" icon="🏆" delay={0.2} />
            <StatCard label="Platform Profit" value={fmt(stats.platformProfit)} color="blue" icon="📊" delay={0.25} />
          </>
        )}
      </div>

      {/* ─── SECTION 2: AUCTION CARDS ─── */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="font-display font-bold text-lg">Live Auction Analytics</h2>
          </div>
          <div className="flex gap-1">
            {(['all', 'accumulating', 'resolved', 'closed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setAuctionFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  auctionFilter === f
                    ? 'bg-primary/10 border-gold text-primary'
                    : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {auctionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-[14px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAuctions.map((row, i) => (
              <AuctionBreakdownCard
                key={row.instance_id}
                name={row.name}
                auctionType={row.auction_type}
                status={row.status}
                bids={row.bids}
                users={row.users}
                collected={row.collected}
                prizePool={row.prize_pool}
                burned={row.burned}
                jackpotFeed={row.jackpot_feed}
                socialPool={row.social_pool}
                onClick={() => navigate(`/admin/auctions/${row.instance_id}`)}
                delay={Math.min(i * 0.04, 0.3)}
              />
            ))}
            {filteredAuctions.length === 0 && (
              <div className="col-span-full text-center text-muted-foreground text-sm py-12">No auctions found</div>
            )}
          </div>
        )}
      </div>

      {/* ─── SECTION 3: TRANSACTION LEDGER ─── */}
      <div className="bg-card border border-border rounded-[14px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-pngwin-purple" />
            <h2 className="font-display font-bold text-base">Transaction Ledger</h2>
          </div>
          <div className="flex gap-2">
            <Select value={ledgerFilter.type || 'all'} onValueChange={v => { setLedgerFilter(f => ({ ...f, type: v === 'all' ? '' : v })); setLedgerPage(1); }}>
              <SelectTrigger className="w-[140px] h-8 text-[11px] bg-background border-border">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {['BID_FEE', 'AUCTION_BID', 'AUCTION_WIN', 'CREDIT', 'SIGNUP_BONUS', 'SOCIAL_BONUS'].map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Search user..."
              value={ledgerFilter.user}
              onChange={e => { setLedgerFilter(f => ({ ...f, user: e.target.value })); setLedgerPage(1); }}
              className="w-[150px] h-8 text-[11px] bg-background"
            />
          </div>
        </div>

        {ledgerLoading ? (
          <div className="p-5"><Skeleton className="h-64 w-full rounded-lg" /></div>
        ) : (
          <>
            {/* Header row */}
            <div className="grid grid-cols-[140px_70px_1fr_100px_80px_100px_32px] items-center px-5 py-2.5 text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border/50">
              <div>Timestamp</div>
              <div>Type</div>
              <div>User</div>
              <div>Auction</div>
              <div className="text-right">Amount</div>
              <div className="text-right">Balance</div>
              <div />
            </div>

            {/* Rows */}
            {ledger.map(row => (
              <div key={row.id}>
                <div
                  className="grid grid-cols-[140px_70px_1fr_100px_80px_100px_32px] items-center px-5 py-3 text-[13px] border-b border-border/30 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => row.allocations.length > 0 && toggleRow(row.id)}
                >
                  <div className="font-mono text-[12px] text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div><TransactionBadge type={row.event_type} /></div>
                  <div className="font-medium truncate">{row.username ? `@${row.username}` : '—'}</div>
                  <div className="text-xs text-muted-foreground truncate">{row.instance_id ? row.instance_id.slice(0, 8) : '—'}</div>
                  <div className={`font-mono text-xs font-bold text-right ${row.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                    {row.direction === 'IN' ? '+' : '-'}{fmt(row.gross_amount)}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground text-right">—</div>
                  <div className="text-center text-muted-foreground">
                    {row.allocations.length > 0 && (
                      <span className={`text-xs transition-transform inline-block ${expandedRows.has(row.id) ? 'rotate-180' : ''}`}>▼</span>
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                {expandedRows.has(row.id) && row.allocations.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-background/50 px-5 py-3 border-b border-border/30"
                  >
                    <div className="pl-10 space-y-1.5">
                      {row.allocations.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-[12px]">
                          <span className="text-muted-foreground">
                            → {a.recipient_type === 'burn' ? `Burned 🔥` : a.recipient_type}
                          </span>
                          <span className={`font-mono font-semibold ${allocColor[a.recipient_type] ?? 'text-foreground'}`}>
                            {a.recipient_type === 'winner' || a.recipient_type.startsWith('social') ? '+' : ''}{fmt(a.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}

            {ledger.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-12">No transactions</div>
            )}

            {/* Pagination */}
            {ledgerPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <div className="text-[12px] text-muted-foreground">
                  Showing {((ledgerPage - 1) * LEDGER_PAGE_SIZE) + 1}–{Math.min(ledgerPage * LEDGER_PAGE_SIZE, ledgerTotal)} of {ledgerTotal.toLocaleString()}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setLedgerPage(p => Math.max(1, p - 1))}
                    disabled={ledgerPage <= 1}
                    className="w-8 h-8 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
                  >
                    ‹
                  </button>
                  {Array.from({ length: Math.min(5, ledgerPages) }, (_, i) => {
                    const start = Math.max(1, Math.min(ledgerPage - 2, ledgerPages - 4));
                    const page = start + i;
                    if (page > ledgerPages) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => setLedgerPage(page)}
                        className={`w-8 h-8 rounded-lg text-xs font-semibold border transition-colors ${
                          page === ledgerPage
                            ? 'bg-primary/10 border-gold text-primary'
                            : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setLedgerPage(p => Math.min(ledgerPages, p + 1))}
                    disabled={ledgerPage >= ledgerPages}
                    className="w-8 h-8 rounded-lg text-xs font-semibold bg-secondary border border-border text-muted-foreground disabled:opacity-30 hover:text-foreground transition-colors"
                  >
                    ›
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── SECTION 4: BURN TRACKER ─── */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2 h-2 rounded-full bg-pngwin-red" />
          <h2 className="font-display font-bold text-lg">🔥 Token Burn Tracker</h2>
        </div>

        {burnLoading ? (
          <Skeleton className="h-48 w-full rounded-[14px]" />
        ) : (
          <>
            {/* Burn cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(burnTotals).map(([token, amount], i) => {
                const icons: Record<string, string> = { PNGWIN: '🐧', TON: '💎', SOL: '◎' };
                return (
                  <BurnCard
                    key={token}
                    token={token}
                    icon={icons[token] ?? '🪙'}
                    amount={amount}
                    maxAmount={maxBurn}
                    delay={i * 0.08}
                  />
                );
              })}
            </div>

            {/* Cumulative burn chart */}
            <div className="bg-card border border-border rounded-[14px] p-6">
              <div className="text-sm font-semibold mb-4">Cumulative Burns Over Time</div>
              {burnChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={burnChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(220, 40%, 8%)',
                        border: '1px solid hsl(215, 25%, 17%)',
                        borderRadius: '10px',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(350, 100%, 63%)"
                      strokeWidth={2}
                      dot={false}
                      fill="hsla(350, 100%, 63%, 0.06)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No burn data yet</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAccounting;
