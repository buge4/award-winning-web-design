import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// ── Types ──────────────────────────────────────────────
const AUCTION_TYPES = [
  'live_before_hot', 'timed', 'blind_count', 'blind_timed', 'free', 'jackpot',
] as const;

const CURRENCIES = ['PNGWIN', 'TON', 'BTC', 'ETH', 'SOL'] as const;

const TYPE_META: Record<string, { icon: string; label: string; desc: string }> = {
  live_before_hot: { icon: '🎯', label: 'Live', desc: 'Accumulate → Hot Mode → Winner' },
  timed: { icon: '⏱️', label: 'Timed', desc: 'Fixed countdown auction' },
  blind_count: { icon: '🙈', label: 'Blind (Count)', desc: 'Hidden end after X bids' },
  blind_timed: { icon: '🙈', label: 'Blind (Timed)', desc: 'Hidden end after timer' },
  free: { icon: '🎁', label: 'Free', desc: 'No cost, real prizes' },
  jackpot: { icon: '🎰', label: 'Jackpot', desc: 'Sealed bids, rollover if no exact hit' },
};

const STATUS_COLORS: Record<string, string> = {
  accumulating: 'bg-pngwin-orange/20 text-pngwin-orange',
  hot_mode: 'bg-pngwin-red/20 text-pngwin-red',
  grace_period: 'bg-pngwin-green/20 text-pngwin-green',
  closed: 'bg-muted text-muted-foreground',
  resolved: 'bg-ice/20 text-ice',
  cancelled: 'bg-pngwin-red/10 text-pngwin-red/60',
};

const DEFAULT_SPLIT = { winner: 55, burn: 15, platform: 15, social: 5, rollover: 10 };

interface AuctionInstance {
  id: string;
  config_id: string;
  status: string;
  total_bids: number;
  unique_bidders: number;
  total_bid_fees: number;
  prize_pool: number;
  burned_amount: number;
  winner_id: string | null;
  winning_amount: number | null;
  winning_bid_id: string | null;
  created_at: string;
  actual_end: string | null;
  scheduled_start: string | null;
  hot_mode_started_at: string | null;
  hot_mode_ends_at: string | null;
  auction_configs: {
    name: string;
    auction_type: string;
    currency: string;
    bid_fee: number;
    min_bid_value: number;
    max_bid_value: number;
    prize_pool_pct: number;
    platform_pct: number;
    burn_pct: number;
    social_circle_pct: number;
    rollover_pct: number;
  };
}

interface UserRow {
  user_id: string;
  users: { id: string; username: string; email: string; role: string };
  walletBalance?: number;
}

// ── Admin Page ─────────────────────────────────────────
const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState<'auctions' | 'create' | 'results' | 'users'>('auctions');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Check admin role once auth is ready
  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); setIsAdmin(false); return; }
    setChecking(true);
    supabase.rpc('get_my_role').then(({ data, error }) => {
      console.log('[AdminPage] get_my_role result:', data, error);
      setIsAdmin(!!data && ['admin', 'super_admin'].includes(data));
      setChecking(false);
    });
  }, [user, authLoading]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) {
      setLoginError(error.message);
      setLoginLoading(false);
    } else {
      setLoginLoading(false);
      // auth state change will trigger the useEffect above
    }
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card/80 backdrop-blur-xl border border-border-active rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="font-display font-bold text-xl">Admin Login</div>
            <div className="text-xs text-muted-foreground mt-1">Sign in with an admin account</div>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••" />
            </div>
            {loginError && <div className="text-xs text-destructive">{loginError}</div>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60">
              {loginLoading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-muted-foreground text-sm">Access denied. You do not have admin privileges.</div>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-primary hover:underline">Go Home</button>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: 'auctions' as const, label: '📋 Manage Auctions' },
    { key: 'create' as const, label: '➕ Create Auction' },
    { key: 'results' as const, label: '🏆 Results' },
    { key: 'users' as const, label: '👥 Users' },
  ];

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🛡️ Admin Panel</h1>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-8 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-all border ${
                activeTab === tab.key
                  ? 'text-primary bg-gold-subtle border-gold'
                  : 'text-muted-foreground bg-transparent border-transparent hover:text-foreground hover:bg-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'auctions' && <ManageAuctions />}
        {activeTab === 'create' && <CreateAuction onCreated={() => setActiveTab('auctions')} />}
        {activeTab === 'results' && <AuctionResults />}
        {activeTab === 'users' && <UserManagement />}
      </div>
    </div>
  );
};

// ── Manage Auctions ────────────────────────────────────
const ManageAuctions = () => {
  const [instances, setInstances] = useState<AuctionInstance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = () => {
    setLoading(true);
    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (data) setInstances(data as unknown as AuctionInstance[]);
        setLoading(false);
        if (error) console.error('ManageAuctions error:', error);
      });
  };

  useEffect(() => { fetchInstances(); }, []);

  const handleAction = async (id: string, action: string, label: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.rpc('admin_auction_action', {
      p_admin_id: user?.id,
      p_instance_id: id,
      p_action: action,
      p_value: null,
    });
    if (error) toast.error(error.message); else { toast.success(`Auction ${label}!`); fetchInstances(); }
  };

  const handleResolve = async (id: string) => {
    const { error } = await supabase.rpc('resolve_auction_inline', { p_instance_id: id });
    if (error) toast.error(error.message); else { toast.success('Auction resolved!'); fetchInstances(); }
  };

  const handleDelete = async (id: string, totalBids: number) => {
    if (totalBids > 0) { toast.error('Cannot delete auction with bids'); return; }
    const { error } = await supabase.from('auction_instances').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Auction deleted'); fetchInstances(); }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Name</th>
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Type</th>
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Status</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Bids</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Pool</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Burned</th>
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Created</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instances.map(inst => {
              const config = inst.auction_configs;
              const meta = TYPE_META[config?.auction_type] ?? { icon: '🎯', label: config?.auction_type };
              const statusClass = STATUS_COLORS[inst.status] ?? 'bg-muted text-muted-foreground';
              return (
                <tr key={inst.id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">{config?.name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs">{meta.icon} {meta.label}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${statusClass}`}>
                      {inst.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{inst.total_bids}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-primary font-bold">{Number(inst.prize_pool).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-pngwin-red">{Number(inst.burned_amount).toLocaleString()}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(inst.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right space-x-2">
                    {['accumulating', 'hot_mode', 'grace_period'].includes(inst.status) && (
                      <button onClick={() => handleAction(inst.id, 'end', 'closed')} className="text-xs text-pngwin-orange hover:text-pngwin-orange/80">Close</button>
                    )}
                    {inst.status === 'closed' && (
                      <button onClick={() => handleResolve(inst.id)} className="text-xs text-ice hover:text-ice/80">Resolve</button>
                    )}
                    {!['resolved', 'cancelled'].includes(inst.status) && (
                      <button onClick={() => handleAction(inst.id, 'cancel', 'cancelled')} className="text-xs text-pngwin-red hover:text-pngwin-red/80">Cancel</button>
                    )}
                    {inst.total_bids === 0 && (
                      <button onClick={() => handleDelete(inst.id, inst.total_bids)} className="text-xs text-muted-foreground hover:text-foreground">Delete</button>
                    )}
                  </td>
                </tr>
              );
            })}
            {instances.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-muted-foreground text-sm">No auctions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Create Auction ─────────────────────────────────────
const CreateAuction = ({ onCreated }: { onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [auctionType, setAuctionType] = useState<string>('live_before_hot');
  const [resolutionMethod, setResolutionMethod] = useState<'highest_unique_bid' | 'rng_exact' | 'rng_closest'>('highest_unique_bid');
  const [visibility, setVisibility] = useState<'open' | 'blind'>('open');
  const [currency, setCurrency] = useState<string>('PNGWIN');
  const [bidFee, setBidFee] = useState('10');
  const [minBidValue, setMinBidValue] = useState('0.01');
  const [maxBidValue, setMaxBidValue] = useState('99.99');
  const [maxBidsPerPlayer, setMaxBidsPerPlayer] = useState('');
  const [consecutiveLimit, setConsecutiveLimit] = useState('5');
  const [bidsToHot, setBidsToHot] = useState('100');
  const [hotDuration, setHotDuration] = useState('300');
  const [totalDuration, setTotalDuration] = useState('900');
  const [totalBidsLimit, setTotalBidsLimit] = useState('500');
  const [prizeAmount, setPrizeAmount] = useState('');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [jackpotSeed, setJackpotSeed] = useState('');
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [submitting, setSubmitting] = useState(false);

  // New toggles
  const [socialCircleEnabled, setSocialCircleEnabled] = useState(true);
  const [socialCircleMode, setSocialCircleMode] = useState<'per_bid' | 'on_win'>('per_bid');
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(false);
  const [earlyBirdCount, setEarlyBirdCount] = useState('10');
  const [earlyBirdReward, setEarlyBirdReward] = useState('5');
  const [airdropEnabled, setAirdropEnabled] = useState(false);
  const [airdropAmount, setAirdropAmount] = useState('');

  const showLiveFields = auctionType === 'live_before_hot';
  const showTimedFields = ['timed', 'blind_timed'].includes(auctionType);
  const showBlindCountFields = auctionType === 'blind_count';
  const showFreeFields = auctionType === 'free';
  const showJackpotFields = auctionType === 'jackpot';

  const splitTotal = Object.values(split).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (splitTotal !== 100) { toast.error('Revenue split must total 100%'); return; }

    setSubmitting(true);
    try {
      const { user } = (await supabase.auth.getUser()).data;
      const prizeType = auctionType === 'jackpot' ? 'jackpot' : auctionType === 'free' ? 'manual' : 'pool_funded';

      const { data, error } = await supabase.rpc('admin_create_auction', {
        p_admin_id: user?.id,
        p_name: name.trim(),
        p_slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        p_auction_type: auctionType,
        p_bid_fee: parseFloat(bidFee),
        p_min_bid_value: parseFloat(minBidValue),
        p_max_bid_value: parseFloat(maxBidValue),
        p_duration_seconds: showTimedFields ? parseInt(totalDuration) : null,
        p_total_bids_to_hot: showLiveFields ? parseInt(bidsToHot) : null,
        p_hot_mode_duration_seconds: showLiveFields ? parseInt(hotDuration) : null,
        p_total_bids_to_close: showBlindCountFields ? parseInt(totalBidsLimit) : null,
        p_prize_type: prizeType,
        p_manual_prize_title: showFreeFields ? prizeDescription : null,
        p_jackpot_seed: showJackpotFields ? parseFloat(jackpotSeed || '0') : 0,
        p_split_prize_pct: split.winner,
        p_split_burn_pct: split.burn,
        p_split_house_pct: split.platform,
        p_split_social_pct: split.social,
        p_split_jackpot_pct: split.rollover,
        p_resolution_method: resolutionMethod,
        p_visibility: visibility,
      });

      if (error) throw error;
      toast.success(`Auction "${name}" created!`);
      onCreated();
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create auction');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = TYPE_META[auctionType] ?? TYPE_META.live_before_hot;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form */}
      <div className="lg:col-span-2">
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {/* Type selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Auction Type</label>
            <div className="grid grid-cols-3 gap-2">
              {AUCTION_TYPES.map(t => {
                const m = TYPE_META[t];
                return (
                  <button
                    key={t}
                    onClick={() => setAuctionType(t)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      auctionType === t ? 'border-primary bg-gold-subtle' : 'border-border hover:border-border-active'
                    }`}
                  >
                    <div className="text-xl mb-1">{m.icon}</div>
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[9px] text-muted-foreground">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Resolution & Visibility */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Resolution Method</label>
              <select value={resolutionMethod} onChange={e => setResolutionMethod(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                <option value="highest_unique_bid">🏆 Highest Unique Bid</option>
                <option value="rng_exact">🎲 RNG Exact Match</option>
                <option value="rng_closest">🎯 RNG Closest Match</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Visibility</label>
              <div className="flex gap-2 mt-0.5">
                {(['open', 'blind'] as const).map(v => (
                  <button key={v} onClick={() => setVisibility(v)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                      visibility === v ? 'border-primary bg-gold-subtle text-primary' : 'border-border text-muted-foreground hover:border-border-active'
                    }`}>
                    {v === 'open' ? '👁️ Open' : '🙈 Blind'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground mb-1 block">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Arctic Rush #48"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Bid Fee</label>
              <input value={bidFee} onChange={e => setBidFee(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Bid Value</label>
              <input value={minBidValue} onChange={e => setMinBidValue(e.target.value)} type="number" step="0.01"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Bid Value</label>
              <input value={maxBidValue} onChange={e => setMaxBidValue(e.target.value)} type="number" step="0.01"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Max Bids/Player (optional)</label>
              <input value={maxBidsPerPlayer} onChange={e => setMaxBidsPerPlayer(e.target.value)} type="number" placeholder="Unlimited"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Consecutive Limit</label>
              <input value={consecutiveLimit} onChange={e => setConsecutiveLimit(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Conditional fields */}
          {showLiveFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bids to Hot</label>
                <input value={bidsToHot} onChange={e => setBidsToHot(e.target.value)} type="number"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Hot Duration (sec)</label>
                <input value={hotDuration} onChange={e => setHotDuration(e.target.value)} type="number"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {showTimedFields && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Duration (sec)</label>
              <input value={totalDuration} onChange={e => setTotalDuration(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
          )}

          {showBlindCountFields && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Total Bids Limit</label>
              <input value={totalBidsLimit} onChange={e => setTotalBidsLimit(e.target.value)} type="number"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
            </div>
          )}

          {showFreeFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prize Amount</label>
                <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} type="number"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prize Description</label>
                <input value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} placeholder="500 PNGWIN"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {showJackpotFields && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Jackpot Seed</label>
                <input value={jackpotSeed} onChange={e => setJackpotSeed(e.target.value)} type="number"
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prize Description</label>
                <input value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
          )}

          {/* Toggles Section */}
          <div className="border-t border-border pt-6 space-y-4">
            <div className="font-display font-bold text-sm mb-2">⚙️ Advanced Options</div>

            {/* Social Circle Toggle */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>🐧</span>
                  <span className="text-sm font-semibold">Social Circle Bonuses</span>
                </div>
                <button
                  onClick={() => setSocialCircleEnabled(!socialCircleEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${socialCircleEnabled ? 'bg-pngwin-green' : 'bg-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-foreground absolute top-1 transition-transform ${socialCircleEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {socialCircleEnabled && (
                <div className="flex gap-2 mt-2">
                  {(['per_bid', 'on_win'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSocialCircleMode(mode)}
                      className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${
                        socialCircleMode === mode ? 'border-primary bg-gold-subtle text-primary' : 'border-border text-muted-foreground'
                      }`}
                    >
                      {mode === 'per_bid' ? '💰 Per Bid' : '🏆 On Win'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Early Bird Toggle */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>🐣</span>
                  <span className="text-sm font-semibold">Early Bird Bonus</span>
                </div>
                <button
                  onClick={() => setEarlyBirdEnabled(!earlyBirdEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${earlyBirdEnabled ? 'bg-pngwin-green' : 'bg-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-foreground absolute top-1 transition-transform ${earlyBirdEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {earlyBirdEnabled && (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">First N bids</label>
                    <input value={earlyBirdCount} onChange={e => setEarlyBirdCount(e.target.value)} type="number"
                      className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">Reward (PNGWIN)</label>
                    <input value={earlyBirdReward} onChange={e => setEarlyBirdReward(e.target.value)} type="number"
                      className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Airdrop Toggle */}
            <div className="bg-background rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>🪂</span>
                  <span className="text-sm font-semibold">Airdrop Tokens</span>
                </div>
                <button
                  onClick={() => setAirdropEnabled(!airdropEnabled)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${airdropEnabled ? 'bg-pngwin-green' : 'bg-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-foreground absolute top-1 transition-transform ${airdropEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {airdropEnabled && (
                <div className="mt-2">
                  <label className="text-[10px] text-muted-foreground mb-1 block">Airdrop per bid (tokens)</label>
                  <input value={airdropAmount} onChange={e => setAirdropAmount(e.target.value)} type="number" placeholder="1"
                    className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                </div>
              )}
            </div>
          </div>

          {/* Revenue Split */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Revenue Split</label>
            <div className="space-y-2">
              {Object.entries(split).map(([key, val]) => {
                const colors: Record<string, string> = { winner: 'text-pngwin-green', burn: 'text-pngwin-red', platform: 'text-muted-foreground', social: 'text-ice', rollover: 'text-primary' };
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`text-xs w-20 capitalize ${colors[key] ?? ''}`}>{key}</span>
                    <input type="range" min={0} max={100} value={val}
                      onChange={e => setSplit(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="flex-1 accent-[hsl(var(--primary))]" />
                    <span className="font-mono text-sm w-10 text-right">{val}%</span>
                  </div>
                );
              })}
            </div>
            <div className={`text-xs font-semibold mt-2 ${splitTotal === 100 ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
              Total: {splitTotal}% {splitTotal !== 100 && '(must be 100%)'}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60"
          >
            {submitting ? 'Creating...' : '🚀 CREATE AUCTION'}
          </motion.button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 space-y-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preview</div>
          <div className="bg-card border border-border rounded-lg p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{meta.icon}</span>
                <h3 className="font-display font-bold text-sm">{name || 'Auction Name'}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-gold-subtle text-primary border border-gold">
                {meta.label}
              </span>
            </div>

            <div className="mb-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prize Pool</div>
              <div className="font-mono text-2xl font-bold text-primary">
                0 <span className="text-xs text-muted-foreground">{currency}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground mb-3">
              <span>Bids: <span className="text-foreground font-semibold">0</span></span>
              <span>Unique: <span className="text-pngwin-green font-semibold">0</span></span>
              <span>Burned: <span className="text-pngwin-red font-semibold">0</span></span>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>Range:</span>
              <span className="font-mono font-semibold text-foreground">
                {parseFloat(minBidValue || '0.01').toFixed(2)} — {parseFloat(maxBidValue || '99.99').toFixed(2)}
              </span>
            </div>

            {showLiveFields && (
              <div className="mb-3">
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-muted-foreground">Bids to Hot Mode</span>
                  <span className="text-primary font-semibold">0/{bidsToHot}</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold w-0" />
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-border flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Bid Cost</span>
              <span className="font-mono font-bold text-primary">
                {parseFloat(bidFee || '0') === 0 ? 'FREE' : `${bidFee} ${currency}`}
              </span>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            {socialCircleEnabled && (
              <span className="px-2 py-1 rounded text-[10px] font-semibold bg-ice-subtle text-ice border border-ice/20">
                🐧 Social {socialCircleMode === 'per_bid' ? 'Per Bid' : 'On Win'}
              </span>
            )}
            {earlyBirdEnabled && (
              <span className="px-2 py-1 rounded text-[10px] font-semibold bg-pngwin-orange/10 text-pngwin-orange border border-pngwin-orange/20">
                🐣 Early Bird (first {earlyBirdCount})
              </span>
            )}
            {airdropEnabled && (
              <span className="px-2 py-1 rounded text-[10px] font-semibold bg-pngwin-purple/10 text-pngwin-purple border border-pngwin-purple/20">
                🪂 Airdrop {airdropAmount || '?'}/bid
              </span>
            )}
          </div>

          {/* Split preview */}
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-2">Revenue Split</div>
            <div className="flex gap-1 h-4 rounded-full overflow-hidden mb-2">
              <div className="bg-pngwin-green" style={{ width: `${split.winner}%` }} />
              <div className="bg-pngwin-red" style={{ width: `${split.burn}%` }} />
              <div className="bg-muted-foreground" style={{ width: `${split.platform}%` }} />
              <div className="bg-ice" style={{ width: `${split.social}%` }} />
              <div className="bg-primary" style={{ width: `${split.rollover}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
              <span className="text-pngwin-green">Winner {split.winner}%</span>
              <span className="text-pngwin-red">Burn {split.burn}%</span>
              <span className="text-muted-foreground">Platform {split.platform}%</span>
              <span className="text-ice">Social {split.social}%</span>
              <span className="text-primary">Jackpot {split.rollover}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Auction Results ────────────────────────────────────
const AuctionResults = () => {
  const [instances, setInstances] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('auction_instances')
      .select('*, auction_configs(*)')
      .eq('status', 'resolved')
      .order('actual_end', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setInstances(data);
        setLoading(false);
      });
  }, []);

  const loadDetail = async (id: string) => {
    const { data } = await supabase
      .from('auction_instances')
      .select('*, auction_configs(*), auction_bids(*, users(username))')
      .eq('id', id)
      .single();
    if (data) setSelected(data);
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading...</div>;

  if (selected) {
    const config = selected.auction_configs;
    const bids = selected.auction_bids ?? [];
    const winnerBid = bids.find((b: any) => b.is_winning);
    const pctSplit = {
      winner: config?.prize_pool_pct ?? DEFAULT_SPLIT.winner,
      burn: config?.burn_pct ?? DEFAULT_SPLIT.burn,
      platform: config?.platform_pct ?? DEFAULT_SPLIT.platform,
      social: config?.social_circle_pct ?? DEFAULT_SPLIT.social,
      rollover: config?.rollover_pct ?? DEFAULT_SPLIT.rollover,
    };
    const pool = Number(selected.prize_pool);

    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground mb-4">← Back to Results</button>
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-1">{config?.name ?? 'Auction'}</h2>
          <div className="text-xs text-muted-foreground mb-4">{config?.auction_type} • Resolved {selected.actual_end ? new Date(selected.actual_end).toLocaleString() : ''}</div>

          {winnerBid && (
            <div className="bg-gold-subtle border border-gold rounded-lg p-4 mb-4">
              <div className="text-xs text-muted-foreground">Winner</div>
              <div className="font-bold text-primary">{winnerBid.users?.username ?? 'Unknown'}</div>
              <div className="font-mono text-sm">Bid: {winnerBid.bid_amount} • Prize: {pool.toLocaleString()} {config?.currency}</div>
            </div>
          )}

          {/* Financial summary */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
            <div className="bg-background rounded-md p-3 text-center">
              <div className="font-mono text-sm font-bold text-primary">{pool.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">Total Pool</div>
            </div>
            {Object.entries(pctSplit).map(([key, pct]: [string, any]) => (
              <div key={key} className="bg-background rounded-md p-3 text-center">
                <div className="font-mono text-sm font-bold">{Math.floor(pool * pct / 100).toLocaleString()}</div>
                <div className="text-[9px] text-muted-foreground capitalize">{key} ({pct}%)</div>
              </div>
            ))}
          </div>

          {/* All bids */}
          <h3 className="font-display font-bold text-sm mb-2">All Bids ({bids.length})</h3>
          <div className="bg-background rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-2 text-[10px] text-muted-foreground uppercase">Player</th>
                  <th className="text-right px-4 py-2 text-[10px] text-muted-foreground uppercase">Bid</th>
                  <th className="text-center px-4 py-2 text-[10px] text-muted-foreground uppercase">Status</th>
                  <th className="text-right px-4 py-2 text-[10px] text-muted-foreground uppercase">Position</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((b: any) => (
                  <tr key={b.id} className="border-b border-border/30">
                    <td className="px-4 py-2 text-sm">{b.users?.username ?? '—'}</td>
                    <td className="px-4 py-2 text-right font-mono text-sm">{b.bid_amount}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        b.is_winning ? 'bg-gold-subtle text-primary' : b.is_burned ? 'bg-pngwin-red/10 text-pngwin-red' : 'bg-pngwin-green/10 text-pngwin-green'
                      }`}>
                        {b.is_winning ? '🏆 WINNER' : b.is_burned ? 'BURNED' : 'UNIQUE'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-sm text-muted-foreground">{b.bid_position ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {instances.map(inst => {
        const config = inst.auction_configs;
        const meta = TYPE_META[config?.auction_type] ?? { icon: '🎯', label: config?.auction_type };
        return (
          <button
            key={inst.id}
            onClick={() => loadDetail(inst.id)}
            className="w-full bg-card border border-border rounded-lg p-5 text-left hover:bg-card-hover transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span>{meta.icon}</span>
                  <span className="font-display font-bold text-sm">{config?.name}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {inst.actual_end ? new Date(inst.actual_end).toLocaleDateString() : ''} • {inst.total_bids} bids
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-bold text-primary">{Number(inst.prize_pool).toLocaleString()} {config?.currency}</div>
                {inst.winning_amount && <div className="font-mono text-xs text-muted-foreground">Win: {inst.winning_amount}</div>}
              </div>
            </div>
          </button>
        );
      })}
      {instances.length === 0 && (
        <div className="text-center py-10 text-muted-foreground text-sm">No resolved auctions yet.</div>
      )}
    </div>
  );
};

// ── User Management ────────────────────────────────────
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${creditDirection === 'IN' ? 'Credit' : 'Debit'} applied!`);
      setCreditModal(null);
      setCreditAmount('');
      setCreditReason('');
      fetchUsers();
    }
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading users...</div>;

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">User</th>
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Email</th>
              <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Role</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Balance</th>
              <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row: any) => {
              const u = row.users ?? {};
              return (
                <tr key={row.user_id} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full gradient-ice flex items-center justify-center text-[10px] font-bold text-background">
                        {(u.username ?? '??').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">@{u.username ?? '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{u.email ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      u.role === 'admin' || u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {u.role ?? 'user'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-primary font-bold">{(row.walletBalance ?? 0).toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => setCreditModal({ userId: row.user_id, username: u.username ?? 'user' })}
                      className="text-xs text-ice hover:text-ice/80"
                    >
                      💰 Credit/Debit
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Credit/Debit Modal */}
      <AnimatePresence>
        {creditModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setCreditModal(null)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border-active rounded-2xl p-6 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="font-display font-bold text-lg mb-4">💰 Credit/Debit @{creditModal.username}</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCreditDirection('IN')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'IN' ? 'bg-pngwin-green/20 text-pngwin-green border-pngwin-green/30' : 'border-border text-muted-foreground'}`}
                  >
                    ➕ Credit (IN)
                  </button>
                  <button
                    onClick={() => setCreditDirection('OUT')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border ${creditDirection === 'OUT' ? 'bg-pngwin-red/20 text-pngwin-red border-pngwin-red/30' : 'border-border text-muted-foreground'}`}
                  >
                    ➖ Debit (OUT)
                  </button>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} type="number"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Reason</label>
                  <input value={creditReason} onChange={e => setCreditReason(e.target.value)} placeholder="Admin adjustment"
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCreditModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCredit}
                    disabled={submitting || !creditAmount}
                    className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60"
                  >
                    {submitting ? 'Processing...' : 'Confirm'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminPage;
