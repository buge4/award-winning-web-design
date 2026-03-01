import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import KpiCard from '@/components/KpiCard';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious
} from '@/components/ui/pagination';
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

type SortKey = keyof AuctionRow;
type SortDir = 'asc' | 'desc';

/* ───── component ───── */
const AdminAccounting = () => {
  const navigate = useNavigate();

  /* --- Section 1: Global stats --- */
  const [stats, setStats] = useState({
    totalRevenue: 0, totalPrizes: 0, totalBurned: 0,
    jackpotBalance: 0, platformProfit: 0, totalUsers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  /* --- Section 2: Per-auction table --- */
  const [auctions, setAuctions] = useState<AuctionRow[]>([]);
  const [auctionsLoading, setAuctionsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('collected');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  /* --- Section 3: Ledger transactions --- */
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerFilter, setLedgerFilter] = useState({ type: '', user: '', auction: '' });
  const LEDGER_PAGE_SIZE = 50;

  /* --- Section 4: Burn tracker --- */
  const [burnTotals, setBurnTotals] = useState({ PNGWIN: 0, TON: 0, SOL: 0 });
  const [burnChart, setBurnChart] = useState<{ day: string; cumulative: number }[]>([]);
  const [burnLoading, setBurnLoading] = useState(true);

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
    const social = ['social_L1','social_L2','social_L3','social_L4','social_L5'].reduce((s, t) => s + byType(t), 0);
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

    // Get allocations per instance
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
      const socialTotal = ['social_L1','social_L2','social_L3','social_L4','social_L5'].reduce((s, t) => s + (a[t] ?? 0), 0);
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

    // Get allocations for these events
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

  /* ─── sorted auctions ─── */
  const sortedAuctions = useMemo(() => {
    return [...auctions].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'number' && typeof bv === 'number') return sortDir === 'asc' ? av - bv : bv - av;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  }, [auctions, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      accumulating: 'bg-gold-subtle text-primary border-gold',
      hot_mode: 'bg-red-subtle text-pngwin-red border-pngwin-red/20',
      resolved: 'bg-green-subtle text-pngwin-green border-pngwin-green/20',
      closed: 'bg-purple-subtle text-pngwin-purple border-pngwin-purple/20',
      cancelled: 'text-muted-foreground bg-secondary border-transparent',
    };
    return `px-2 py-0.5 rounded text-[10px] font-medium border ${colors[s] ?? 'text-muted-foreground bg-secondary border-transparent'}`;
  };

  const ledgerPages = Math.ceil(ledgerTotal / LEDGER_PAGE_SIZE);

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold">📊 Accounting</h1>

      {/* ─── SECTION 1: GLOBAL STATS ─── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
        ) : (
          <>
            <KpiCard label="Total Revenue" value={`${fmt(stats.totalRevenue)}`} color="gold" />
            <KpiCard label="Prizes Paid" value={`${fmt(stats.totalPrizes)}`} color="green" delay={0.05} />
            <KpiCard label="Total Burned 🔥" value={`${fmt(stats.totalBurned)}`} color="red" delay={0.1} />
            <KpiCard label="Jackpot Balance" value={`${fmt(stats.jackpotBalance)}`} color="purple" delay={0.15} />
            <KpiCard label="Platform Profit" value={`${fmt(stats.platformProfit)}`} color="ice" delay={0.2} />
            <KpiCard label="Total Users" value={stats.totalUsers} color="gold" delay={0.25} />
          </>
        )}
      </div>

      {/* ─── SECTION 2: PER-AUCTION TABLE ─── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-4">📋 Per-Auction Breakdown</h2>
        {auctionsLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    ['name', 'Auction'],
                    ['auction_type', 'Type'],
                    ['status', 'Status'],
                    ['bids', 'Bids'],
                    ['users', 'Users'],
                    ['collected', 'Collected'],
                    ['prize_pool', 'Prize Pool'],
                    ['burned', 'Burned'],
                    ['jackpot_feed', 'Jackpot'],
                    ['social_pool', 'Social'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <TableHead key={key}
                      className="cursor-pointer hover:text-foreground text-xs whitespace-nowrap"
                      onClick={() => handleSort(key)}
                    >
                      {label}{sortIcon(key)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAuctions.map(row => (
                  <TableRow key={row.instance_id}
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => navigate(`/admin/auctions/${row.instance_id}`)}
                  >
                    <TableCell className="font-medium text-xs max-w-[160px] truncate">{row.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.auction_type}</TableCell>
                    <TableCell><span className={statusBadge(row.status)}>{row.status}</span></TableCell>
                    <TableCell className="font-mono text-xs">{row.bids}</TableCell>
                    <TableCell className="font-mono text-xs">{row.users}</TableCell>
                    <TableCell className="font-mono text-xs text-primary">{fmt(row.collected)}</TableCell>
                    <TableCell className="font-mono text-xs text-pngwin-green">{fmt(row.prize_pool)}</TableCell>
                    <TableCell className="font-mono text-xs text-pngwin-red">{fmt(row.burned)}</TableCell>
                    <TableCell className="font-mono text-xs text-pngwin-orange">{fmt(row.jackpot_feed)}</TableCell>
                    <TableCell className="font-mono text-xs text-pngwin-purple">{fmt(row.social_pool)}</TableCell>
                  </TableRow>
                ))}
                {sortedAuctions.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground text-sm py-8">No auctions</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* ─── SECTION 3: LEDGER TRANSACTIONS ─── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-4">📒 Ledger Transactions</h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={ledgerFilter.type || 'all'} onValueChange={v => { setLedgerFilter(f => ({ ...f, type: v === 'all' ? '' : v })); setLedgerPage(1); }}>
            <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Event Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {['BID_FEE', 'AUCTION_BID', 'AUCTION_WIN', 'CREDIT', 'SIGNUP_BONUS', 'SOCIAL_BONUS'].map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Filter by username..." value={ledgerFilter.user}
            onChange={e => { setLedgerFilter(f => ({ ...f, user: e.target.value })); setLedgerPage(1); }}
            className="w-[180px] h-8 text-xs" />
        </div>

        {ledgerLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Amount</TableHead>
                    <TableHead className="text-xs">Dir</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map(row => (
                    <Collapsible key={row.id} asChild>
                      <>
                        <TableRow className="hover:bg-secondary/50">
                          <TableCell className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                            {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </TableCell>
                          <TableCell className="text-xs font-medium">{row.event_type}</TableCell>
                          <TableCell className="text-xs text-ice">{row.username ? `@${row.username}` : '—'}</TableCell>
                          <TableCell className={`font-mono text-xs font-bold ${row.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                            {row.direction === 'IN' ? '+' : '-'}{fmt(row.gross_amount)}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{row.direction}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">{row.description}</TableCell>
                          <TableCell>
                            {row.allocations.length > 0 && (
                              <CollapsibleTrigger className="text-muted-foreground hover:text-foreground text-xs">▼</CollapsibleTrigger>
                            )}
                          </TableCell>
                        </TableRow>
                        {row.allocations.length > 0 && (
                          <CollapsibleContent asChild>
                            <tr>
                              <td colSpan={7} className="px-6 py-2 bg-secondary/30">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {row.allocations.map((a, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px]">
                                      <span className="text-muted-foreground">{a.recipient_type}:</span>
                                      <span className="font-mono font-bold">{fmt(a.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          </CollapsibleContent>
                        )}
                      </>
                    </Collapsible>
                  ))}
                  {ledger.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-sm py-8">No transactions</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {ledgerPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setLedgerPage(p => Math.max(1, p - 1))} className={ledgerPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                    </PaginationItem>
                    {Array.from({ length: Math.min(5, ledgerPages) }, (_, i) => {
                      const start = Math.max(1, Math.min(ledgerPage - 2, ledgerPages - 4));
                      const page = start + i;
                      if (page > ledgerPages) return null;
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink isActive={page === ledgerPage} onClick={() => setLedgerPage(page)} className="cursor-pointer">{page}</PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    <PaginationItem>
                      <PaginationNext onClick={() => setLedgerPage(p => Math.min(ledgerPages, p + 1))} className={ledgerPage >= ledgerPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                <div className="text-center text-[10px] text-muted-foreground mt-1">{ledgerTotal} total transactions</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── SECTION 4: BURN TRACKER ─── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-display font-bold text-sm mb-4">🔥 Burn Tracker</h2>

        {burnLoading ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : (
          <>
            {/* Totals */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {Object.entries(burnTotals).map(([token, amount]) => (
                <div key={token} className="bg-background rounded-lg p-4 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{token}</div>
                  <div className="font-mono text-xl font-bold text-pngwin-red">{fmt(amount)}</div>
                </div>
              ))}
            </div>

            {/* Cumulative burn chart */}
            {burnChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={burnChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsla(215, 25%, 17%, 0.5)" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 20%, 55%)' }} />
                  <Tooltip contentStyle={{ background: 'hsl(220, 40%, 8%)', border: '1px solid hsl(215, 25%, 17%)', borderRadius: '8px', fontSize: 12 }} />
                  <Line type="monotone" dataKey="cumulative" stroke="hsl(350, 100%, 63%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No burn data yet</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAccounting;
