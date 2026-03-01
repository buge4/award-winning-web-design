import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import UplineSection from '@/components/admin/users/UplineSection';
import ReferralSummary from '@/components/admin/users/ReferralSummary';
import UserStatsCards from '@/components/admin/users/UserStatsCards';
import TransactionHistory from '@/components/admin/users/TransactionHistory';
import BidHistory from '@/components/admin/users/BidHistory';
import CreditModal from '@/components/admin/users/CreditModal';

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'balance'>('date');
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
      supabase.from('ledger_events').select('*').eq('user_id', userId).eq('source_project', 'auction').order('created_at', { ascending: false }).limit(200),
      supabase.from('auction_bids').select('*, auction_instances(auction_configs(name))').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
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

  // ─── User Detail View ───
  if (selectedUser) {
    const u = selectedUser.users ?? {};

    return (
      <div>
        <button onClick={() => { setSelectedUser(null); setUserDetail(null); }}
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
            <div className="text-right">
              <div className="text-[10px] text-muted-foreground">Wallet Balance</div>
              <div className="font-mono text-xl font-bold text-primary">{(selectedUser.walletBalance ?? 0).toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">PNGWIN</div>
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

        {/* Stats */}
        <UserStatsCards userId={selectedUser.user_id} userDetail={userDetail} />

        {/* Upline */}
        <UplineSection user={u} />

        {/* Referral Summary (replaces badge dump) */}
        <ReferralSummary userId={selectedUser.user_id} totalReferrals={userDetail?.referrals?.length ?? 0} />

        {/* Transaction History */}
        <TransactionHistory ledger={userDetail?.ledger ?? []} />

        {/* Bid History */}
        <BidHistory bids={userDetail?.bids ?? []} />

        <CreditModal creditModal={creditModal} setCreditModal={setCreditModal} creditAmount={creditAmount} setCreditAmount={setCreditAmount}
          creditDirection={creditDirection} setCreditDirection={setCreditDirection} creditReason={creditReason} setCreditReason={setCreditReason}
          submitting={submitting} handleCredit={handleCredit} />
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
