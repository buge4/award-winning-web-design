import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const API_BASE = 'http://89.167.102.46:3000/api/dashboard';

const STATUS_COLORS: Record<string, string> = {
  accumulating: 'bg-pngwin-green/20 text-pngwin-green',
  hot_mode: 'bg-pngwin-red/20 text-pngwin-red',
  grace_period: 'bg-pngwin-orange/20 text-pngwin-orange',
  closed: 'bg-muted text-muted-foreground',
  resolved: 'bg-pngwin-green/10 text-pngwin-green',
  cancelled: 'bg-pngwin-red/10 text-pngwin-red/60',
};

const AdminInstanceDetail = () => {
  const { configId, instanceId } = useParams<{ configId: string; instanceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [socialPayouts, setSocialPayouts] = useState<any[]>([]);
  const [freeBidsCount, setFreeBidsCount] = useState({ free: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bids' | 'transactions' | 'social'>('bids');

  // Action modals
  const [actionModal, setActionModal] = useState<{ action: string; label: string; destructive?: boolean } | null>(null);
  const [actionConfirm, setActionConfirm] = useState('');
  const [actionValue, setActionValue] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => { if (instanceId) loadAll(); }, [instanceId]);

  const loadAll = async () => {
    setLoading(true);

    const [instRes, bidsRes, txRes, configRes, freeBidsRes, socialRes] = await Promise.all([
      supabase.from('auction_instances').select('*').eq('id', instanceId).single(),
      supabase.from('auction_bids').select('*, users(username)').eq('instance_id', instanceId).order('created_at', { ascending: false }),
      supabase.from('ledger_events').select('*, users(username)').eq('game_instance_id', instanceId).order('created_at', { ascending: false }).limit(200),
      configId ? supabase.from('auction_configs').select('*').eq('id', configId).single() : Promise.resolve({ data: null }),
      supabase.from('auction_free_bids').select('total_granted, used').eq('instance_id', instanceId),
      supabase.from('ledger_events').select('*, users(username)').eq('game_instance_id', instanceId).eq('event_type', 'SOCIAL_BONUS').order('created_at', { ascending: false }),
    ]);

    setData(instRes.data);
    if (configRes.data) setConfig(configRes.data);
    else if (instRes.data?.config_id) {
      const { data: cfgData } = await supabase.from('auction_configs').select('*').eq('id', instRes.data.config_id).single();
      setConfig(cfgData);
    }
    setBids(bidsRes.data ?? []);
    setTransactions(txRes.data ?? []);
    setSocialPayouts(socialRes.data ?? []);

    const freeTotal = (freeBidsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.total_granted ?? 0), 0);
    const freeUsed = (freeBidsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.used ?? 0), 0);
    setFreeBidsCount({ free: freeTotal, paid: Number(instRes.data?.total_bids ?? 0) - freeUsed });

    setLoading(false);
  };

  const handleAction = async (action: string) => {
    setActionSubmitting(true);
    try {
      if (action === 'resolve') {
        const { error } = await supabase.rpc('resolve_auction_inline', { p_instance_id: instanceId });
        if (error) throw error;
        toast.success('Resolved!');
      } else if (action === 'extend') {
        const newEnd = new Date(Date.now() + parseInt(actionValue || '60') * 60000).toISOString();
        const { error } = await supabase.from('auction_instances').update({ scheduled_end: newEnd }).eq('id', instanceId);
        if (error) throw error;
        toast.success(`Extended by ${actionValue || 60} minutes`);
      } else if (action === 'edit_fee') {
        const { error } = await supabase.from('auction_configs').update({ bid_fee: parseFloat(actionValue) }).eq('id', config?.id);
        if (error) throw error;
        toast.success(`Bid fee updated to ${actionValue}`);
      } else if (action === 'fund_jackpot') {
        const { error } = await supabase.rpc('create_ledger_event', {
          p_user_id: user?.id, p_event_type: 'ADMIN_CREDIT', p_gross_amount: parseFloat(actionValue),
          p_direction: 'IN', p_source_project: 'auction', p_source_reference: 'jackpot_fund_' + Date.now(),
          p_source_type: 'admin', p_source_id: null, p_description: 'Admin jackpot funding',
          p_metadata: { currency: config?.currency ?? 'PNGWIN', target: 'jackpot' },
        });
        if (error) throw error;
        toast.success(`Jackpot funded with ${actionValue}`);
      } else {
        const { error } = await supabase.rpc('admin_auction_action', {
          p_admin_id: user?.id, p_instance_id: instanceId, p_action: action, p_value: actionValue || null,
        });
        if (error) throw error;
        toast.success(`${action} completed!`);
      }
      setActionModal(null);
      setActionConfirm('');
      setActionValue('');
      loadAll();
    } catch (err: any) {
      toast.error(err.message ?? 'Action failed');
    }
    setActionSubmitting(false);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;
  if (!data) return <div className="text-center py-10 text-muted-foreground text-sm">Instance not found</div>;

  const totalFees = Number(data.total_bid_fees ?? 0);
  const prizePct = config?.split_prize_pct ?? 55;
  const burnPct = config?.split_burn_pct ?? 15;
  const platformPct = config?.split_platform_pct ?? 15;
  const socialPct = config?.split_social_pct ?? 5;
  const jpPct = config?.split_jackpot_pct ?? 10;

  const splits = [
    { key: 'Prize', pct: prizePct, amount: Math.floor(totalFees * prizePct / 100), color: 'bg-pngwin-green', textColor: 'text-pngwin-green' },
    { key: 'Burn', pct: burnPct, amount: Math.floor(totalFees * burnPct / 100), color: 'bg-pngwin-red', textColor: 'text-pngwin-red' },
    { key: 'Platform', pct: platformPct, amount: Math.floor(totalFees * platformPct / 100), color: 'bg-pngwin-purple', textColor: 'text-pngwin-purple' },
    { key: 'Social', pct: socialPct, amount: Math.floor(totalFees * socialPct / 100), color: 'bg-ice', textColor: 'text-ice' },
    { key: 'Jackpot', pct: jpPct, amount: Math.floor(totalFees * jpPct / 100), color: 'bg-primary', textColor: 'text-primary' },
  ];

  // Top spenders
  const spenderMap: Record<string, { username: string; bids: number; spent: number }> = {};
  bids.forEach(b => {
    const uid = b.user_id;
    if (!spenderMap[uid]) spenderMap[uid] = { username: b.users?.username ?? '—', bids: 0, spent: 0 };
    spenderMap[uid].bids++;
    spenderMap[uid].spent += Number(b.bid_fee_paid ?? config?.bid_fee ?? 0);
  });
  const topSpenders = Object.values(spenderMap).sort((a, b) => b.spent - a.spent).slice(0, 10);

  const winnerBid = bids.find(b => b.is_winning);
  const isActive = ['accumulating', 'hot_mode', 'grace_period'].includes(data.status);

  const actions = [
    ...(isActive ? [
      { action: 'pause', label: '⏸ Pause', destructive: false },
      { action: 'extend', label: '⏰ Extend', destructive: false },
      { action: 'edit_fee', label: '✏️ Edit Fee', destructive: false },
      { action: 'end', label: '🏁 Force Close', destructive: true },
    ] : []),
    ...(data.status === 'closed' ? [{ action: 'resolve', label: '✅ Resolve', destructive: false }] : []),
    ...(data.status === 'accumulating' ? [{ action: 'resume', label: '▶ Resume', destructive: false }] : []),
    ...(!['resolved', 'cancelled'].includes(data.status) ? [
      { action: 'cancel', label: '❌ Cancel+Refund', destructive: true },
    ] : []),
    { action: 'fund_jackpot', label: '💰 Fund Jackpot', destructive: false },
  ];

  return (
    <div>
      <button onClick={() => navigate(configId ? `/admin/games/${configId}` : '/admin/games')}
        className="text-xs text-muted-foreground hover:text-foreground mb-4">← Back</button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-xl font-bold mb-1">{config?.name ?? 'Auction'}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${STATUS_COLORS[data.status] ?? 'bg-muted text-muted-foreground'}`}>
                {data.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-muted-foreground">
                ID: {instanceId?.slice(0, 8)}...
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {actions.map(a => (
              <button key={a.action} onClick={() => setActionModal(a)}
                className={`px-3 py-1.5 text-[10px] font-semibold rounded-lg border transition-all ${
                  a.destructive
                    ? 'border-pngwin-red/20 text-pngwin-red hover:bg-pngwin-red/10'
                    : 'border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: 'Total Bids', value: Number(data.total_bids ?? 0), icon: '🎯', color: 'text-foreground' },
          { label: 'Players', value: Number(data.total_unique_bidders ?? 0), icon: '👥', color: 'text-ice' },
          { label: 'Revenue', value: totalFees.toLocaleString(), icon: '💰', color: 'text-primary' },
          { label: 'Free Bids', value: freeBidsCount.free, icon: '🎁', color: 'text-pngwin-green' },
          { label: 'Avg/Player', value: Number(data.total_unique_bidders ?? 0) > 0 ? Math.round(totalFees / Number(data.total_unique_bidders)).toLocaleString() : '0', icon: '📊', color: 'text-pngwin-purple' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{kpi.icon}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{kpi.label}</span>
            </div>
            <div className={`font-mono text-lg font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Fund Breakdown (live) */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <h2 className="font-display font-bold text-sm mb-3">Fund Breakdown (live)</h2>
        <div className="flex gap-0.5 h-6 rounded-full overflow-hidden mb-3">
          {splits.map(s => (
            <div key={s.key} className={`${s.color} relative group`} style={{ width: `${s.pct}%` }}>
              <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-background opacity-0 group-hover:opacity-100 transition-opacity">
                {s.pct}%
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {splits.map(s => (
            <div key={s.key} className="text-center">
              <div className={`font-mono text-sm font-bold ${s.textColor}`}>{s.amount.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">{s.key} ({s.pct}%)</div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs">
          <span>Free: <span className="font-mono font-bold text-pngwin-green">{freeBidsCount.free}</span></span>
          <span>Paid: <span className="font-mono font-bold">{freeBidsCount.paid}</span></span>
        </div>
      </div>

      {/* Winner */}
      {winnerBid && (
        <div className="bg-gold-subtle border border-gold rounded-xl p-4 mb-4">
          <div className="text-xs text-muted-foreground">🏆 Winner</div>
          <div className="font-bold text-primary text-lg">@{winnerBid.users?.username ?? 'Unknown'}</div>
          <div className="font-mono text-sm">Bid: {winnerBid.bid_amount} · Prize: {Number(data.prize_pool ?? 0).toLocaleString()} PNGWIN</div>
        </div>
      )}

      {/* Top Spenders */}
      {topSpenders.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-4">
          <h2 className="font-display font-bold text-sm mb-3">🏅 Top Spenders</h2>
          <div className="space-y-1.5">
            {topSpenders.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                  <span className="font-medium">@{s.username}</span>
                  <span className="text-[10px] text-muted-foreground">{s.bids} bids</span>
                </div>
                <span className="font-mono font-bold text-primary">{s.spent.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {([
          { key: 'bids' as const, label: `🎯 All Bids (${bids.length})` },
          { key: 'transactions' as const, label: `📋 Transactions (${transactions.length})` },
          { key: 'social' as const, label: `🤝 Social Payouts (${socialPayouts.length})` },
        ]).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
              activeTab === tab.key ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground border-transparent hover:bg-secondary'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bids Tab */}
      {activeTab === 'bids' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Player', 'Bid Amount', 'Fee Paid', 'Status', 'Position', 'Time'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bids.map(b => (
                  <tr key={b.id} className="border-b border-border/30 hover:bg-card-hover">
                    <td className="px-4 py-2 text-sm">@{b.users?.username ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-sm">{b.bid_amount}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{b.bid_fee_paid ?? config?.bid_fee ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.is_winning ? 'bg-gold-subtle text-primary' : b.is_burned ? 'bg-pngwin-red/10 text-pngwin-red' : b.is_unique ? 'bg-pngwin-green/10 text-pngwin-green' : 'bg-muted text-muted-foreground'
                      }`}>
                        {b.is_winning ? '🏆 WINNER' : b.is_burned ? 'BURNED' : b.is_unique ? 'UNIQUE' : 'DUP'}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{b.bid_position ?? '—'}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {bids.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No bids</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  {['Time', 'User', 'Type', 'Dir', 'Amount', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border/30 hover:bg-card-hover">
                    <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-sm">@{(Array.isArray(tx.users) ? tx.users[0]?.username : tx.users?.username) ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secondary text-muted-foreground">{tx.event_type}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`font-mono text-xs font-bold ${tx.direction === 'IN' ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                        {tx.direction}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-sm font-bold">{Number(tx.gross_amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{tx.description ?? '—'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-sm">No transactions</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Social Payouts Tab */}
      {activeTab === 'social' && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Time', 'Recipient', 'Amount', 'Description'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {socialPayouts.map(sp => (
                  <tr key={sp.id} className="border-b border-border/30">
                    <td className="px-4 py-2 text-xs text-muted-foreground">
                      {new Date(sp.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-2 text-sm">@{(Array.isArray(sp.users) ? sp.users[0]?.username : sp.users?.username) ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-sm font-bold text-pngwin-green">+{Number(sp.gross_amount).toLocaleString()}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{sp.description ?? '—'}</td>
                  </tr>
                ))}
                {socialPayouts.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground text-sm">No social payouts for this instance</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Modal */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setActionModal(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className={`bg-card border rounded-2xl p-6 max-w-sm w-full ${actionModal.destructive ? 'border-pngwin-red/30' : 'border-border-active'}`}
              onClick={(e: any) => e.stopPropagation()}>
              <h3 className="font-display font-bold text-lg mb-4">{actionModal.label}</h3>
              <div className="space-y-4">
                {/* Value input for extend/edit_fee/fund_jackpot */}
                {['extend', 'edit_fee', 'fund_jackpot'].includes(actionModal.action) && (
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      {actionModal.action === 'extend' ? 'Minutes to extend' : actionModal.action === 'edit_fee' ? 'New bid fee' : 'Amount to fund'}
                    </label>
                    <input type="number" value={actionValue} onChange={e => setActionValue(e.target.value)}
                      placeholder={actionModal.action === 'extend' ? '60' : '0'}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
                  </div>
                )}

                {/* Destructive confirmation */}
                {actionModal.destructive && (
                  <div>
                    <p className="text-xs text-pngwin-red mb-2">
                      Type <span className="font-mono font-bold">{actionModal.action.toUpperCase()}</span> to confirm.
                    </p>
                    <input value={actionConfirm} onChange={e => setActionConfirm(e.target.value)}
                      placeholder={actionModal.action.toUpperCase()}
                      className="w-full px-3 py-2.5 bg-background border border-pngwin-red/30 rounded-lg text-sm font-mono focus:outline-none focus:border-pngwin-red" />
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setActionModal(null); setActionConfirm(''); setActionValue(''); }}
                    className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (actionModal.destructive && actionConfirm !== actionModal.action.toUpperCase()) {
                        toast.error(`Type "${actionModal.action.toUpperCase()}" to confirm`);
                        return;
                      }
                      handleAction(actionModal.action);
                    }}
                    disabled={actionSubmitting}
                    className={`flex-1 py-2 font-display font-bold text-xs rounded-lg disabled:opacity-60 ${
                      actionModal.destructive
                        ? 'bg-pngwin-red text-white'
                        : 'gradient-gold text-primary-foreground shadow-gold'
                    }`}>
                    {actionSubmitting ? 'Processing...' : 'Confirm'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminInstanceDetail;
