import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

const TYPE_COLORS: Record<string, string> = {
  BID_FEE: 'bg-ice/10 text-ice',
  PRIZE: 'bg-primary/10 text-primary',
  SOCIAL_BONUS: 'bg-pngwin-green/10 text-pngwin-green',
  BURN: 'bg-pngwin-red/10 text-pngwin-red',
  ADMIN_CREDIT: 'bg-pngwin-purple/10 text-pngwin-purple',
  DEPOSIT: 'bg-pngwin-green/10 text-pngwin-green',
  SIGNUP_BONUS: 'bg-primary/10 text-primary',
};

const PAGE_SIZE = 50;

const TransactionHistory = ({ ledger }: { ledger: any[] }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<Record<string, any[]>>({});

  const types = useMemo(() => {
    const s = new Set(ledger.map(e => e.event_type));
    return ['all', ...Array.from(s)];
  }, [ledger]);

  const filtered = useMemo(() => {
    let list = ledger;
    if (typeFilter !== 'all') list = list.filter(e => e.event_type === typeFilter);
    return list;
  }, [ledger, typeFilter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!allocations[id]) {
      const { data } = await supabase.from('ledger_allocations')
        .select('*')
        .eq('ledger_event_id', id)
        .order('created_at');
      setAllocations(prev => ({ ...prev, [id]: data ?? [] }));
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 86400000) return formatDistanceToNow(date, { addSuffix: true });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-bold text-sm">📋 Transaction History</h3>
        <div className="flex gap-1.5">
          {types.map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(0); }}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                typeFilter === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-card z-10">
            <tr className="border-b border-border">
              {['', 'Date', 'Type', 'Amount', 'Dir', 'Description'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((e: any) => (
              <>
                <tr key={e.id} className="border-b border-border/30 hover:bg-card-hover cursor-pointer transition-colors"
                  onClick={() => toggleExpand(e.id)}>
                  <td className="px-4 py-2 text-[10px] text-muted-foreground">{expanded === e.id ? '▼' : '▶'}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">{formatDate(e.created_at)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${TYPE_COLORS[e.event_type] ?? 'bg-muted text-muted-foreground'}`}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-mono text-sm font-bold">{Number(e.gross_amount).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`text-[10px] font-bold ${e.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                      {e.direction === 'IN' ? '↑ IN' : '↓ OUT'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-xs">{e.description}</td>
                </tr>
                <AnimatePresence>
                  {expanded === e.id && (
                    <tr key={`${e.id}-exp`}>
                      <td colSpan={6} className="p-0">
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden">
                          <div className="px-8 py-3 bg-secondary/50 border-b border-border">
                            {(allocations[e.id] ?? []).length === 0 ? (
                              <span className="text-[10px] text-muted-foreground">No sub-allocations</span>
                            ) : (
                              <div className="space-y-1">
                                {(allocations[e.id] ?? []).map((a: any) => (
                                  <div key={a.id} className="flex items-center gap-3 text-[11px]">
                                    <span className="text-muted-foreground w-20">{a.recipient_type}</span>
                                    <span className="font-mono font-bold">{Number(a.amount).toLocaleString()}</span>
                                    <span className="text-muted-foreground">{a.description}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </AnimatePresence>
              </>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">{filtered.length} transactions</span>
          <div className="flex gap-1.5">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="px-2 py-1 text-[10px] border border-border rounded hover:bg-card-hover disabled:opacity-30">← Prev</button>
            <span className="px-2 py-1 text-[10px] text-muted-foreground">{page + 1} / {totalPages}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="px-2 py-1 text-[10px] border border-border rounded hover:bg-card-hover disabled:opacity-30">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
