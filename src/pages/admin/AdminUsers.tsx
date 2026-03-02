import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import UplineSection from '@/components/admin/users/UplineSection';
import ReferralSummary from '@/components/admin/users/ReferralSummary';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import TransactionHistory from '@/components/admin/users/TransactionHistory';
import BidHistory from '@/components/admin/users/BidHistory';
import CreditModal from '@/components/admin/users/CreditModal';
import { CURRENCIES, getCurrencyConfig, formatCurrencyAmount } from '@/lib/currencies';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'balance'>('date');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [userWallets, setUserWallets] = useState<Record<string, number>>({});
  const [userWalletDetails, setUserWalletDetails] = useState<Record<string, any>>({});
  const [creditModal, setCreditModal] = useState<{ userId: string; username: string } | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditDirection, setCreditDirection] = useState<'IN' | 'OUT'>('IN');
  const [creditReason, setCreditReason] = useState('');
  const [creditCurrency, setCreditCurrency] = useState('PNGWIN');
  const [submitting, setSubmitting] = useState(false);

  // Change Sponsor modal
  const [sponsorModal, setSponsorModal] = useState<{ userId: string; username: string; currentSponsor: string } | null>(null);
  const [newSponsor, setNewSponsor] = useState('');
  const [sponsorSubmitting, setSponsorSubmitting] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    Promise.all([
      supabase.from('project_members').select('*, users(*)').eq('project_slug', 'auction'),
      supabase.from('wallets').select('user_id, balance, currency').eq('project_slug', 'auction'),
    ]).then(([membersRes, walletsRes]) => {
      const walletMap = new Map<string, number>();
      (walletsRes.data ?? []).forEach((w: any) => {
        const cur = w.currency ?? 'PNGWIN';
        if (cur === 'PNGWIN') walletMap.set(w.user_id, (walletMap.get(w.user_id) ?? 0) + Number(w.balance));
      });
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
    const [ledgerRes, bidsRes, referralsRes, walletsRes] = await Promise.all([
      supabase.from('ledger_events').select('*').eq('user_id', userId).eq('source_project', 'auction').order('created_at', { ascending: false }).limit(200),
      supabase.from('auction_bids').select('*, auction_instances(auction_configs(name))').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
      supabase.from('users').select('id, username').eq('upline_1', userId),
      supabase.from('wallets').select('balance, currency, total_won, total_spent, total_bonus').eq('user_id', userId).eq('project_slug', 'auction'),
    ]);

    const wMap: Record<string, number> = {};
    const wDetails: Record<string, any> = {};
    (walletsRes.data ?? []).forEach((w: any) => {
      const cur = w.currency ?? 'PNGWIN';
      wMap[cur] = Number(w.balance);
      wDetails[cur] = { total_won: Number(w.total_won ?? 0), total_spent: Number(w.total_spent ?? 0), total_bonus: Number(w.total_bonus ?? 0) };
    });
    setUserWallets(wMap);
    setUserWalletDetails(wDetails);

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
      p_description: creditReason || `Admin ${creditDirection === 'IN' ? 'credit' : 'debit'} (${creditCurrency})`,
      p_metadata: { currency: creditCurrency },
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); }
    else {
      toast.success(`${creditDirection === 'IN' ? 'Credit' : 'Debit'} applied (${creditCurrency})!`);
      setCreditModal(null); setCreditAmount(''); setCreditReason(''); setCreditCurrency('PNGWIN');
      fetchUsers();
      if (selectedUser) loadUserDetail(selectedUser.user_id);
    }
  };

  const handleChangeSponsor = async () => {
    if (!sponsorModal || !newSponsor) return;
    setSponsorSubmitting(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch(
        'https://bfnkbidqriackvtsvqqq.supabase.co/functions/v1/claude-admin-chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbmtiaWRxcmlhY2t2dHN2cXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTgwMjUsImV4cCI6MjA4NzA5NDAyNX0.mo_X9CfCDiEaKesbD1A5F1fUH9P_cJoWqJNsgq9NiNw',
          },
          body: JSON.stringify({
            message: `Change sponsor: move @${sponsorModal.username} under @${newSponsor}`,
            conversation_history: [],
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Error ${res.status}`);
      toast.success(`Sponsor change requested for @${sponsorModal.username} → @${newSponsor}`);
      setSponsorModal(null);
      setNewSponsor('');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to change sponsor');
    }
    setSponsorSubmitting(false);
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

  // ─── User Detail View ───
  if (selectedUser) {
    const u = selectedUser.users ?? {};
    const sponsorUsername = u.upline_1 ? '...' : 'None';

    return (
      <div>
        <button onClick={() => { setSelectedUser(null); setUserDetail(null); setUserWallets({}); }}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">
          ← Back to Users
        </button>

        {/* User Card */}
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
            <div className="flex gap-2">
              <button onClick={() => setCreditModal({ userId: selectedUser.user_id, username: u.username ?? 'user' })}
                className="text-xs text-ice hover:text-ice/80 px-3 py-1.5 border border-ice/20 rounded-lg">💰 Credit/Debit</button>
              <button onClick={() => setSponsorModal({ userId: selectedUser.user_id, username: u.username ?? 'user', currentSponsor: sponsorUsername })}
                className="text-xs text-pngwin-orange hover:text-pngwin-orange/80 px-3 py-1.5 border border-pngwin-orange/20 rounded-lg">🔄 Change Sponsor</button>
            </div>
          </div>
          {u.referral_code && (
            <div className="mt-3 pt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Referral Code: </span>
              <span className="font-mono text-xs text-primary">{u.referral_code}</span>
            </div>
          )}
        </div>

        {/* Multi-Currency Wallet Balances */}
        <div className="bg-card border border-border rounded-xl p-4 mb-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">💰 Wallet Balances</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {CURRENCIES.map(cur => {
              const cfg = getCurrencyConfig(cur);
              const bal = userWallets[cur] ?? 0;
              const walletDetail = userWalletDetails[cur];
              return (
                <div key={cur} className={`border rounded-lg p-3 ${cfg.borderColor} ${cfg.bgColor}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{cfg.icon}</span>
                    <span className={`text-[10px] font-bold ${cfg.color}`}>{cur}</span>
                  </div>
                  <div className="font-mono text-lg font-bold">{formatCurrencyAmount(bal, cur)}</div>
                  {walletDetail && (
                    <div className="text-[9px] text-muted-foreground mt-1 space-y-0.5">
                      <div>Won: {formatCurrencyAmount(walletDetail.total_won ?? 0, cur)} · Spent: {formatCurrencyAmount(walletDetail.total_spent ?? 0, cur)}</div>
                      <div>Bonus: {formatCurrencyAmount(walletDetail.total_bonus ?? 0, cur)}</div>
                    </div>
                  )}
                  <div className="flex gap-1 mt-2">
                    <button onClick={(e) => { e.stopPropagation(); setCreditDirection('IN'); setCreditCurrency(cur); setCreditModal({ userId: selectedUser.user_id, username: u.username ?? 'user' }); }}
                      className="flex-1 text-[9px] font-bold py-1 rounded bg-pngwin-green/10 text-pngwin-green hover:bg-pngwin-green/20 transition-colors">Credit</button>
                    <button onClick={(e) => { e.stopPropagation(); setCreditDirection('OUT'); setCreditCurrency(cur); setCreditModal({ userId: selectedUser.user_id, username: u.username ?? 'user' }); }}
                      className="flex-1 text-[9px] font-bold py-1 rounded bg-pngwin-red/10 text-pngwin-red hover:bg-pngwin-red/20 transition-colors">Debit</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <UserStatsCards userId={selectedUser.user_id} userDetail={userDetail} />

        {/* Upline */}
        <UplineSection user={u} />

        {/* Referral Summary */}
        <ReferralSummary userId={selectedUser.user_id} totalReferrals={userDetail?.referrals?.length ?? 0} />

        {/* Transaction History */}
        <TransactionHistory ledger={userDetail?.ledger ?? []} />

        {/* Bid History */}
        <BidHistory bids={userDetail?.bids ?? []} />

        {/* Credit Modal - extended with currency */}
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
                    <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                    <div className="flex gap-1 flex-wrap">
                      {CURRENCIES.map(c => {
                        const cfg = getCurrencyConfig(c);
                        return (
                          <button key={c} onClick={() => setCreditCurrency(c)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                              creditCurrency === c
                                ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`
                                : 'border-border text-muted-foreground'
                            }`}>
                            {cfg.icon} {c}
                          </button>
                        );
                      })}
                    </div>
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

        {/* Change Sponsor Modal */}
        <AnimatePresence>
          {sponsorModal && (
            <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSponsorModal(null)}>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="bg-card border border-border-active rounded-2xl p-6 max-w-sm w-full" onClick={(e: any) => e.stopPropagation()}>
                <h3 className="font-display font-bold text-lg mb-4">🔄 Change Sponsor</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Current Sponsor</label>
                    <div className="px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-muted-foreground">
                      @{sponsorModal.currentSponsor}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">New Sponsor Username</label>
                    <input value={newSponsor} onChange={(e: any) => setNewSponsor(e.target.value)} placeholder="Enter username..."
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSponsorModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleChangeSponsor} disabled={sponsorSubmitting || !newSponsor}
                      className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60">
                      {sponsorSubmitting ? 'Processing...' : 'Confirm Change'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─── User List View ───
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

export default AdminUsers;
