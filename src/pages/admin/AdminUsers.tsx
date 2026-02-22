import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'balance' | 'bids'>('date');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [creditModal, setCreditModal] = useState<{ userId: string; username: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDirection, setCreditDirection] = useState<'IN' | 'OUT'>('IN');
  const [creditReason, setCreditReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    Promise.all([
      supabase.from('project_members').select('*, users(*)').eq('project_slug', 'auction'),
      supabase.from('wallets').select('user_id, balance').eq('project_slug', 'auction'),
    ]).then(([membersRes, walletsRes]) => {
      const walletMap = new Map<string, number>();
      (walletsRes.data ?? []).forEach((w: any) => walletMap.set(w.user_id, w.balance));
      const mapped = (membersRes.data ?? []).map((row: any) => ({
        ...row,
        walletBalance: walletMap.get(row.user_id) ?? 0,
      }));
      setUsers(mapped);
      setLoading(false);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const loadUserDetail = async (userId: string) => {
    const [ledgerRes, bidsRes, referralsRes] = await Promise.all([
      supabase.from('ledger_events').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('auction_bids').select('*, auction_instances(auction_configs(name))').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
      supabase.from('users').select('id, username').eq('upline_1', userId),
    ]);
    setUserDetail({
      ledger: ledgerRes.data ?? [],
      bids: bidsRes.data ?? [],
      referrals: referralsRes.data ?? [],
    });
  };

  const handleSelectUser = (row: any) => {
    setSelectedUser(row);
    loadUserDetail(row.user_id);
  };

  const handleCredit = async () => {
    if (!creditModal || !creditAmount) return;
    setSubmitting(true);
    const { error } = await supabase.rpc('create_ledger_event', {
      p_user_id: creditModal.userId,
      p_event_type: 'ADMIN_CREDIT',
      p_gross_amount: parseFloat(creditAmount),
      p_direction: creditDirection,
      p_source_project: 'auction',
      p_source_reference: 'admin_' + Date.now(),
      p_source_type: 'admin',
      p_source_id: null,
      p_description: creditReason || `Admin ${creditDirection === 'IN' ? 'credit' : 'debit'}`,
      p_metadata: {},
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); }
    else { toast.success(`${creditDirection === 'IN' ? 'Credit' : 'Debit'} applied!`); setCreditModal(null); setCreditAmount(''); setCreditReason(''); fetchUsers(); }
  };

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(r => {
        const u = r.users ?? {};
        return u.username?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.referral_code?.toLowerCase().includes(s);
      });
    }
    if (roleFilter !== 'all') list = list.filter(r => r.users?.role === roleFilter);
    if (sortBy === 'balance') list = [...list].sort((a, b) => (b.walletBalance ?? 0) - (a.walletBalance ?? 0));
    else if (sortBy === 'date') list = [...list].sort((a, b) => new Date(b.users?.created_at ?? 0).getTime() - new Date(a.users?.created_at ?? 0).getTime());
    return list;
  }, [users, search, roleFilter, sortBy]);

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading users...</div>;

  // User Detail View
  if (selectedUser) {
    const u = selectedUser.users ?? {};
    const detailTab = ['transactions', 'bids', 'referrals'] as const;
    const [tab, setTab] = [detailTab[0], () => {}]; // Simple tab state managed inline

    return (
      <div>
        <button onClick={() => { setSelectedUser(null); setUserDetail(null); }} className="text-xs text-muted-foreground hover:text-foreground mb-4">← Back to Users</button>

        {/* Header */}
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-ice flex items-center justify-center text-lg font-bold text-background">
              {(u.username ?? '??').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-display text-xl font-bold">@{u.username ?? '—'}</div>
              <div className="text-xs text-muted-foreground">{u.email}</div>
              <div className="flex gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  u.role === 'admin' || u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                }`}>{u.role ?? 'player'}</span>
                <span className="text-[10px] text-muted-foreground">Since {new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">Wallet Balance</div>
              <div className="font-mono text-xl font-bold text-primary">{(selectedUser.walletBalance ?? 0).toLocaleString()}</div>
              <button onClick={() => setCreditModal({ userId: selectedUser.user_id, username: u.username ?? 'user' })}
                className="text-xs text-ice hover:text-ice/80 mt-1">💰 Credit/Debit</button>
            </div>
          </div>
          {u.referral_code && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Referral Code: </span>
              <span className="font-mono text-xs text-primary">{u.referral_code}</span>
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Total Bids', value: userDetail?.bids?.length ?? 0, icon: '🎯' },
            { label: 'Wins', value: userDetail?.bids?.filter((b: any) => b.is_winning)?.length ?? 0, icon: '🏆' },
            { label: 'Referrals', value: userDetail?.referrals?.length ?? 0, icon: '🐧' },
            { label: 'Transactions', value: userDetail?.ledger?.length ?? 0, icon: '📋' },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3">
              <span className="mr-1">{s.icon}</span>
              <span className="text-[10px] text-muted-foreground">{s.label}</span>
              <div className="font-mono text-lg font-bold">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Referral Tree */}
        {userDetail?.referrals?.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-4">
            <h3 className="font-display font-bold text-sm mb-3">🐧 Referral Tree ({userDetail.referrals.length})</h3>
            <div className="flex flex-wrap gap-2">
              {userDetail.referrals.map((ref: any) => (
                <span key={ref.id} className="px-3 py-1 bg-ice-subtle text-ice rounded-full text-xs font-semibold">@{ref.username}</span>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-bold text-sm">📋 Transaction History</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Date', 'Type', 'Amount', 'Dir', 'Project', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(userDetail?.ledger ?? []).map((e: any) => (
                  <tr key={e.id} className="border-b border-border/30">
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs font-semibold">{e.event_type}</td>
                    <td className="px-4 py-2 font-mono text-sm">{Number(e.gross_amount).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`text-[10px] font-bold ${e.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>{e.direction}</span>
                    </td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{e.source_project}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground truncate max-w-xs">{e.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bid History */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-display font-bold text-sm">🎯 Bid History</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Auction', 'Bid', 'Status', 'Won?', 'Date'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(userDetail?.bids ?? []).map((b: any) => (
                  <tr key={b.id} className="border-b border-border/30">
                    <td className="px-4 py-2 text-xs">{b.auction_instances?.auction_configs?.name ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-sm">{b.bid_amount}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${b.is_burned ? 'bg-pngwin-red/10 text-pngwin-red' : 'bg-pngwin-green/10 text-pngwin-green'}`}>
                        {b.is_burned ? 'BURNED' : 'UNIQUE'}
                      </span>
                    </td>
                    <td className="px-4 py-2">{b.is_winning ? '🏆' : '—'}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Credit Modal */}
        <CreditModal creditModal={creditModal} setCreditModal={setCreditModal} creditAmount={creditAmount} setCreditAmount={setCreditAmount}
          creditDirection={creditDirection} setCreditDirection={setCreditDirection} creditReason={creditReason} setCreditReason={setCreditReason}
          submitting={submitting} handleCredit={handleCredit} />
      </div>
    );
  }

  // User List View
  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-4">👥 Users</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username, email, referral..."
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs w-64 focus:outline-none focus:border-primary" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
          <option value="all">All Roles</option>
          <option value="player">Player</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
          className="px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
          <option value="date">Sort: Signup Date</option>
          <option value="balance">Sort: Balance</option>
        </select>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['User', 'Email', 'Role', 'Signup', 'Referral Code', 'Balance', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row: any) => {
                const u = row.users ?? {};
                return (
                  <tr key={row.user_id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors cursor-pointer"
                    onClick={() => handleSelectUser(row)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full gradient-ice flex items-center justify-center text-[10px] font-bold text-background">
                          {(u.username ?? '??').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">@{u.username ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{u.email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.role === 'admin' || u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>{u.role ?? 'player'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{u.referral_code ?? '—'}</td>
                    <td className="px-4 py-3 font-mono text-sm text-primary font-bold">{(row.walletBalance ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setCreditModal({ userId: row.user_id, username: u.username ?? 'user' })}
                        className="text-xs text-ice hover:text-ice/80">💰 Credit</button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground text-sm">No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreditModal creditModal={creditModal} setCreditModal={setCreditModal} creditAmount={creditAmount} setCreditAmount={setCreditAmount}
        creditDirection={creditDirection} setCreditDirection={setCreditDirection} creditReason={creditReason} setCreditReason={setCreditReason}
        submitting={submitting} handleCredit={handleCredit} />
    </div>
  );
};

// Shared Credit/Debit Modal
const CreditModal = ({ creditModal, setCreditModal, creditAmount, setCreditAmount, creditDirection, setCreditDirection, creditReason, setCreditReason, submitting, handleCredit }: any) => (
  <AnimatePresence>
    {creditModal && (
      <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setCreditModal(null)}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          className="bg-card border border-border-active rounded-2xl p-6 max-w-sm w-full" onClick={(e: any) => e.stopPropagation()}>
          <h3 className="font-display font-bold text-lg mb-4">💰 Credit/Debit @{creditModal.username}</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <button onClick={() => setCreditDirection('IN')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'IN' ? 'bg-pngwin-green/20 text-pngwin-green border-pngwin-green/30' : 'border-border text-muted-foreground'}`}>
                ➕ Credit (IN)
              </button>
              <button onClick={() => setCreditDirection('OUT')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'OUT' ? 'bg-pngwin-red/20 text-pngwin-red border-pngwin-red/30' : 'border-border text-muted-foreground'}`}>
                ➖ Debit (OUT)
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
              <input value={creditAmount} onChange={(e: any) => setCreditAmount(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
              <input value={creditReason} onChange={(e: any) => setCreditReason(e.target.value)} placeholder="Admin adjustment"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreditModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCredit} disabled={submitting || !creditAmount}
                className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60">
                {submitting ? 'Processing...' : 'Confirm'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default AdminUsers;
