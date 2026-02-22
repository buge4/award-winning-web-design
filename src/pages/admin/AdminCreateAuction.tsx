// Extracted from original AdminPage — Create Auction form
// This is the full create auction form with all modular toggles

import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AUCTION_TYPES = ['live_before_hot', 'timed', 'blind_count', 'blind_timed', 'free', 'jackpot'] as const;
const CURRENCIES = ['PNGWIN', 'TON', 'BTC', 'ETH', 'SOL'] as const;
const TYPE_META: Record<string, { icon: string; label: string; desc: string }> = {
  live_before_hot: { icon: '🎯', label: 'Live', desc: 'Accumulate → Hot Mode → Winner' },
  timed: { icon: '⏱️', label: 'Timed', desc: 'Fixed countdown auction' },
  blind_count: { icon: '🙈', label: 'Blind (Count)', desc: 'Hidden end after X bids' },
  blind_timed: { icon: '🙈', label: 'Blind (Timed)', desc: 'Hidden end after timer' },
  free: { icon: '🎁', label: 'Free', desc: 'No cost, real prizes' },
  jackpot: { icon: '🎰', label: 'Jackpot', desc: 'Sealed bids, rollover if no exact hit' },
};
const DEFAULT_SPLIT = { winner: 55, burn: 15, platform: 15, social: 5, rollover: 10 };

const AdminCreateAuction = () => {
  const navigate = useNavigate();
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
  const [socialCircleEnabled, setSocialCircleEnabled] = useState(true);
  const [socialCircleMode, setSocialCircleMode] = useState<'per_bid' | 'on_win'>('per_bid');
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(false);
  const [earlyBirdCount, setEarlyBirdCount] = useState('10');
  const [earlyBirdReward, setEarlyBirdReward] = useState('5');
  const [airdropEnabled, setAirdropEnabled] = useState(false);
  const [airdropAmount, setAirdropAmount] = useState('');
  const [rngPickCount, setRngPickCount] = useState('5');
  const [phaseMode, setPhaseMode] = useState<'timed' | 'count' | 'accumulate_hot' | 'timed_count'>('accumulate_hot');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('15');

  const showFreeFields = auctionType === 'free';
  const showJackpotFields = auctionType === 'jackpot';
  const splitTotal = Object.values(split).reduce((a, b) => a + b, 0);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (splitTotal !== 100) { toast.error('Revenue split must total 100%'); return; }

    // Compute duration_seconds from phase mode
    const computedDuration = (phaseMode === 'timed' || phaseMode === 'timed_count')
      ? (parseInt(durationHours || '0') * 3600 + parseInt(durationMinutes || '0') * 60) || null
      : null;
    const computedBidsToClose = (phaseMode === 'count' || phaseMode === 'timed_count')
      ? parseInt(totalBidsLimit) || null
      : null;
    const computedBidsToHot = phaseMode === 'accumulate_hot' ? parseInt(bidsToHot) || null : null;
    const computedHotDuration = phaseMode === 'accumulate_hot' ? parseInt(hotDuration) || null : null;

    // Validation: at least one end condition
    if (!computedDuration && !computedBidsToClose && !computedBidsToHot) {
      toast.error('Auction must have at least one end condition (duration, max bids, or accumulate→hot)');
      return;
    }
    setSubmitting(true);
    try {
      const { user } = (await supabase.auth.getUser()).data;
      const prizeType = auctionType === 'jackpot' ? 'jackpot' : auctionType === 'free' ? 'manual' : 'pool_funded';
      
      // Step 1: Call RPC with only supported parameters
      const { data, error } = await supabase.rpc('admin_create_auction', {
        p_admin_id: user?.id,
        p_name: name.trim(),
        p_slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        p_auction_type: auctionType,
        p_bid_fee: parseFloat(bidFee),
        p_min_bid_value: parseFloat(minBidValue),
        p_max_bid_value: parseFloat(maxBidValue),
        p_duration_seconds: computedDuration,
        p_total_bids_to_hot: computedBidsToHot,
        p_hot_mode_duration_seconds: computedHotDuration,
        p_total_bids_to_close: computedBidsToClose,
        p_prize_type: prizeType,
        p_manual_prize_title: showFreeFields ? prizeDescription : null,
        p_jackpot_seed: showJackpotFields ? parseFloat(jackpotSeed || '0') : 0,
        p_split_prize_pct: split.winner,
        p_split_burn_pct: split.burn,
        p_split_house_pct: split.platform,
        p_split_social_pct: split.social,
        p_split_jackpot_pct: split.rollover,
      });
      if (error) throw error;

      // Step 2: Get the instance_id (returned by RPC), then find the config_id
      const instanceId = data;
      if (instanceId) {
        const { data: instance } = await supabase
          .from('auction_instances')
          .select('config_id')
          .eq('id', instanceId)
          .single();

        if (instance?.config_id) {
          await supabase
            .from('auction_configs')
            .update({
              resolution_method: resolutionMethod,
              visibility: visibility,
              rng_pick_count: (resolutionMethod === 'rng_exact' || resolutionMethod === 'rng_closest') ? parseInt(rngPickCount) : 1,
            })
            .eq('id', instance.config_id);
        }
      }

      toast.success(`Auction "${name}" created!`);
      navigate('/admin/auctions');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to create auction');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = TYPE_META[auctionType] ?? TYPE_META.live_before_hot;

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors";
  const monoInputClass = `${inputClass} font-mono`;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">➕ Create Auction</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            {/* Type selector */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Auction Type</label>
              <div className="grid grid-cols-3 gap-2">
                {AUCTION_TYPES.map(t => {
                  const m = TYPE_META[t];
                  return (
                    <button key={t} onClick={() => setAuctionType(t)}
                      className={`p-3 rounded-lg border text-center transition-all ${auctionType === t ? 'border-primary bg-gold-subtle' : 'border-border hover:border-border-active'}`}>
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
                <select value={resolutionMethod} onChange={e => setResolutionMethod(e.target.value as any)} className={inputClass}>
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
                        visibility === v ? 'border-primary bg-gold-subtle text-primary' : 'border-border text-muted-foreground hover:border-border-active'}`}>
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
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Arctic Rush #48" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Currency</label>
                <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Bid Fee</label>
                <input value={bidFee} onChange={e => setBidFee(e.target.value)} type="number" className={monoInputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Min Bid Value</label>
                <input value={minBidValue} onChange={e => setMinBidValue(e.target.value)} type="number" step="0.01" className={monoInputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Bid Value</label>
                <input value={maxBidValue} onChange={e => setMaxBidValue(e.target.value)} type="number" step="0.01" className={monoInputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Max Bids/Player</label>
                <input value={maxBidsPerPlayer} onChange={e => setMaxBidsPerPlayer(e.target.value)} type="number" placeholder="Unlimited" className={monoInputClass} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Consecutive Limit</label>
                <input value={consecutiveLimit} onChange={e => setConsecutiveLimit(e.target.value)} type="number" className={monoInputClass} />
              </div>
            </div>

            {/* Phase Mode — End Condition */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">⏱️ Phase Mode — How does this auction end?</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {([
                  { key: 'timed', icon: '⏱️', label: 'Timed', desc: 'Ends when time runs out' },
                  { key: 'count', icon: '🔢', label: 'Count-based', desc: 'Ends when max bids reached' },
                  { key: 'accumulate_hot', icon: '🔥', label: 'Accumulate → Hot', desc: 'Bids trigger hot mode countdown' },
                  { key: 'timed_count', icon: '⚡', label: 'Timed + Count', desc: 'Whichever comes first' },
                ] as const).map(pm => (
                  <button key={pm.key} onClick={() => setPhaseMode(pm.key)}
                    className={`p-3 rounded-lg border text-center transition-all ${phaseMode === pm.key ? 'border-primary bg-gold-subtle' : 'border-border hover:border-border-active'}`}>
                    <div className="text-lg mb-0.5">{pm.icon}</div>
                    <div className="text-xs font-bold">{pm.label}</div>
                    <div className="text-[9px] text-muted-foreground">{pm.desc}</div>
                  </button>
                ))}
              </div>

              {/* Timed fields */}
              {(phaseMode === 'timed' || phaseMode === 'timed_count') && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hours</label>
                    <input value={durationHours} onChange={e => setDurationHours(e.target.value)} type="number" min="0" className={monoInputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Minutes</label>
                    <input value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} type="number" min="0" max="59" className={monoInputClass} />
                  </div>
                </div>
              )}

              {/* Count fields */}
              {(phaseMode === 'count' || phaseMode === 'timed_count') && (
                <div className="mb-3">
                  <label className="text-xs text-muted-foreground mb-1 block">Max Bids (auction ends at this count)</label>
                  <input value={totalBidsLimit} onChange={e => setTotalBidsLimit(e.target.value)} type="number" className={monoInputClass} />
                </div>
              )}

              {/* Accumulate → Hot fields */}
              {phaseMode === 'accumulate_hot' && (
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Bids to trigger Hot Mode</label>
                    <input value={bidsToHot} onChange={e => setBidsToHot(e.target.value)} type="number" className={monoInputClass} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Hot Mode Duration (sec)</label>
                    <input value={hotDuration} onChange={e => setHotDuration(e.target.value)} type="number" className={monoInputClass} />
                  </div>
                </div>
              )}
            </div>
            {showFreeFields && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prize Amount</label>
                  <input value={prizeAmount} onChange={e => setPrizeAmount(e.target.value)} type="number" className={monoInputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prize Description</label>
                  <input value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} placeholder="500 PNGWIN" className={inputClass} />
                </div>
              </div>
            )}
            {showJackpotFields && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Jackpot Seed</label>
                  <input value={jackpotSeed} onChange={e => setJackpotSeed(e.target.value)} type="number" className={monoInputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prize Description</label>
                  <input value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} className={inputClass} />
                </div>
              </div>
            )}
            {(resolutionMethod === 'rng_exact' || resolutionMethod === 'rng_closest') && (
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  {resolutionMethod === 'rng_exact' ? '🎲 Numbers to Draw' : '🎯 Numbers to Draw'}
                </label>
                <input value={rngPickCount} onChange={e => setRngPickCount(e.target.value)} type="number" min="1" max="10" className={monoInputClass} />
                <div className="text-[9px] text-muted-foreground mt-1">
                  {resolutionMethod === 'rng_exact' ? 'How many random numbers drawn for exact match' : 'How many random numbers drawn (closest bid wins)'}
                </div>
              </div>
            )}

            {/* Toggles */}
            <div className="border-t border-border pt-6 space-y-4">
              <div className="font-display font-bold text-sm mb-2">⚙️ Advanced Options</div>
              {/* Social Circle */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span>🐧</span><span className="text-sm font-semibold">Social Circle Bonuses</span></div>
                  <button onClick={() => setSocialCircleEnabled(!socialCircleEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${socialCircleEnabled ? 'bg-pngwin-green' : 'bg-border'}`}>
                    <div className={`w-4 h-4 rounded-full bg-foreground absolute top-1 transition-transform ${socialCircleEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                {socialCircleEnabled && (
                  <div className="flex gap-2 mt-2">
                    {(['per_bid', 'on_win'] as const).map(mode => (
                      <button key={mode} onClick={() => setSocialCircleMode(mode)}
                        className={`flex-1 py-1.5 rounded text-[10px] font-semibold border transition-all ${
                          socialCircleMode === mode ? 'border-primary bg-gold-subtle text-primary' : 'border-border text-muted-foreground'}`}>
                        {mode === 'per_bid' ? '💰 Per Bid' : '🏆 On Win'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Early Bird */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span>🐣</span><span className="text-sm font-semibold">Early Bird Bonus</span></div>
                  <button onClick={() => setEarlyBirdEnabled(!earlyBirdEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${earlyBirdEnabled ? 'bg-pngwin-green' : 'bg-border'}`}>
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
              {/* Airdrop */}
              <div className="bg-background rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2"><span>🪂</span><span className="text-sm font-semibold">Airdrop Tokens</span></div>
                  <button onClick={() => setAirdropEnabled(!airdropEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${airdropEnabled ? 'bg-pngwin-green' : 'bg-border'}`}>
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
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60">
              {submitting ? 'Creating...' : '🚀 CREATE AUCTION'}
            </motion.button>
          </div>
        </div>

        {/* Preview Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preview</div>
            <div className="bg-card border border-border rounded-xl p-5 relative overflow-hidden">
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
                <div className="font-mono text-2xl font-bold text-primary">0 <span className="text-xs text-muted-foreground">{currency}</span></div>
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
              {phaseMode === 'accumulate_hot' && (
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
            <div className="bg-card border border-border rounded-xl p-4">
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
    </div>
  );
};

export default AdminCreateAuction;
