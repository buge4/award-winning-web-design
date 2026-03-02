import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

const PAGE_SIZE = 50;

const BidHistory = ({ bids }: { bids: any[] }) => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [expandedAuction, setExpandedAuction] = useState<string | null>(null);

  // Group bids by auction name
  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    bids.forEach(b => {
      const name = b.auction_instances?.auction_configs?.name ?? 'Unknown';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(b);
    });
    return Array.from(map.entries()).map(([name, items]) => ({
      name,
      bids: items,
      wins: items.filter((b: any) => b.is_winning).length,
      burned: items.filter((b: any) => b.is_burned).length,
    }));
  }, [bids]);

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return grouped;
    if (typeFilter === 'won') return grouped.filter(g => g.wins > 0);
    if (typeFilter === 'burned') return grouped.filter(g => g.burned > 0);
    return grouped;
  }, [grouped, typeFilter]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    const diff = Date.now() - date.getTime();
    if (diff < 86400000) return formatDistanceToNow(date, { addSuffix: true });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-bold text-sm">🎯 Bid History ({bids.length})</h3>
        <div className="flex gap-1.5">
          {['all', 'won', 'burned'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                typeFilter === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}>
              {t === 'all' ? 'All' : t === 'won' ? '🏆 Won' : '🔥 Burned'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">No bids found</div>
        ) : (
          filtered.map(group => (
            <div key={group.name} className="border-b border-border/30 last:border-0">
              {/* Auction header */}
              <button
                onClick={() => setExpandedAuction(expandedAuction === group.name ? null : group.name)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{expandedAuction === group.name ? '▼' : '▶'}</span>
                  <span className="text-sm font-semibold">{group.name}</span>
                  <span className="text-[10px] text-muted-foreground">{group.bids.length} bids</span>
                </div>
                <div className="flex items-center gap-2">
                  {group.wins > 0 && <span className="text-[10px] font-bold text-primary">🏆 {group.wins}</span>}
                  {group.burned > 0 && <span className="text-[10px] font-bold text-pngwin-red">🔥 {group.burned}</span>}
                  <span className="text-[10px] text-pngwin-green font-bold">
                    ✅ {group.bids.length - group.burned}
                  </span>
                </div>
              </button>

              {/* Expanded bids */}
              <AnimatePresence>
                {expandedAuction === group.name && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="px-4 pb-3">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/50">
                            {['Bid', 'Fee Paid', 'Status', 'Won?', 'Date'].map(h => (
                              <th key={h} className="text-left px-2 py-1.5 text-[9px] text-muted-foreground uppercase">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {group.bids.map((b: any) => (
                            <tr key={b.id} className={`border-b border-border/20 ${
                              b.is_winning ? 'bg-primary/[0.06]' : b.is_burned ? 'bg-pngwin-red/[0.06]' : ''
                            }`}>
                              <td className={`px-2 py-1.5 font-mono text-sm ${b.is_burned ? 'line-through text-muted-foreground' : ''}`}>
                                {b.bid_amount}
                                {b.is_unique && !b.is_burned && <span className="inline-block w-1.5 h-1.5 rounded-full bg-pngwin-green ml-1.5 align-middle" />}
                              </td>
                              <td className="px-2 py-1.5 font-mono text-[11px] text-muted-foreground">{b.bid_fee_paid ?? '—'}</td>
                              <td className="px-2 py-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                                  b.is_burned ? 'bg-pngwin-red/10 text-pngwin-red' : 'bg-pngwin-green/10 text-pngwin-green'
                                }`}>
                                  {b.is_burned ? 'BURNED' : 'UNIQUE'}
                                </span>
                              </td>
                              <td className="px-2 py-1.5">{b.is_winning ? '🏆' : '—'}</td>
                              <td className="px-2 py-1.5 text-[10px] text-muted-foreground">{formatDate(b.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BidHistory;
