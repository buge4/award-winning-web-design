import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const AUCTION_TYPES = [
  { key: 'live_before_hot', icon: '🎯', label: 'Live', desc: 'Accumulate → Hot → Winner' },
  { key: 'timed', icon: '⏱️', label: 'Timed', desc: 'Fixed countdown' },
  { key: 'free', icon: '🎁', label: 'Free', desc: 'No cost, real prizes' },
  { key: 'jackpot', icon: '🎰', label: 'Jackpot', desc: 'Rollover if no match' },
] as const;

const PHASE_MODES = [
  { key: 'timed', icon: '⏱️', label: 'Timed', desc: 'Ends after duration' },
  { key: 'count', icon: '🔢', label: 'Count', desc: 'Ends at bid limit' },
  { key: 'accumulate_hot', icon: '🔥', label: 'Accumulate → Hot', desc: 'Hot mode countdown' },
  { key: 'timed_count', icon: '⚡', label: 'Hybrid', desc: 'First condition wins' },
] as const;

const DEFAULT_SPLIT = { winner: 55, burn: 15, platform: 15, social: 5, rollover: 10 };
const SPLIT_META: Record<string, { label: string; color: string }> = {
  winner: { label: 'Winner', color: 'text-pngwin-green' },
  burn: { label: 'Burn', color: 'text-pngwin-red' },
  platform: { label: 'Platform', color: 'text-muted-foreground' },
  social: { label: 'Social', color: 'text-ice' },
  rollover: { label: 'Jackpot', color: 'text-primary' },
};

/* ── Reusable sub-components ── */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
    {children}
  </div>
);

const Field = ({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <label className="text-[11px] text-muted-foreground mb-1.5 block">{label}</label>
    {children}
  </div>
);

const Toggle = ({ label, icon, enabled, onToggle, children }: {
  label: string; icon: string; enabled: boolean; onToggle: () => void; children?: React.ReactNode;
}) => (
  <div className="rounded-lg border border-border bg-background/50 p-3.5">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium flex items-center gap-2">
        <span>{icon}</span>{label}
      </span>
      <button onClick={onToggle}
        className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-pngwin-green' : 'bg-border'}`}>
        <div className={`w-3.5 h-3.5 rounded-full bg-foreground absolute top-[3px] transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
    {enabled && children && <div className="mt-3 pt-3 border-t border-border/50">{children}</div>}
  </div>
);

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors";
const monoInputClass = `${inputClass} font-mono`;

const AdminCreateAuction = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [auctionType, setAuctionType] = useState('live_before_hot');
  const [resolutionMethod, setResolutionMethod] = useState<'highest_unique_bid' | 'rng_exact' | 'rng_closest'>('highest_unique_bid');
  const [visibility, setVisibility] = useState<'open' | 'blind'>('open');
  const [currency, setCurrency] = useState('PNGWIN');
  const [bidFee, setBidFee] = useState('10');
  const [minBidValue, setMinBidValue] = useState('0.01');
  const [maxBidValue, setMaxBidValue] = useState('99.99');
  const [maxBidsPerPlayer, setMaxBidsPerPlayer] = useState('');
  const [consecutiveLimit, setConsecutiveLimit] = useState('5');
  const [bidsToHot, setBidsToHot] = useState('100');
  const [hotDuration, setHotDuration] = useState('300');
  const [totalBidsLimit, setTotalBidsLimit] = useState('500');
  const [prizeDescription, setPrizeDescription] = useState('');
  const [jackpotSeed, setJackpotSeed] = useState('');
  const [split, setSplit] = useState(DEFAULT_SPLIT);
  const [submitting, setSubmitting] = useState(false);
  const [socialCircleEnabled, setSocialCircleEnabled] = useState(true);
  const [socialCircleMode, setSocialCircleMode] = useState<'per_bid' | 'on_win'>('per_bid');
  const [earlyBirdEnabled, setEarlyBirdEnabled] = useState(false);
  const [earlyBirdCount, setEarlyBirdCount] = useState('10');
  const [earlyBirdReward, setEarlyBirdReward] = useState('5');
  const [feeMode, setFeeMode] = useState<'paid' | 'free' | 'mixed'>('paid');
  const [mixedFreeBids, setMixedFreeBids] = useState('3');
  const [airdropMode, setAirdropMode] = useState<'none' | 'piggyback' | 'gamified'>('none');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [rngPickCount, setRngPickCount] = useState('5');
  const [phaseMode, setPhaseMode] = useState<'timed' | 'count' | 'accumulate_hot' | 'timed_count'>('accumulate_hot');
  const [durationHours, setDurationHours] = useState('0');
  const [durationMinutes, setDurationMinutes] = useState('15');

  const showFreeFields = auctionType === 'free';
  const showJackpotFields = auctionType === 'jackpot';
  const splitTotal = Object.values(split).reduce((a, b) => a + b, 0);
  const typeMeta = AUCTION_TYPES.find(t => t.key === auctionType) ?? AUCTION_TYPES[0];

  // Load airdrop campaigns when airdrop mode requires it
  useEffect(() => {
    if (airdropMode === 'none') return;
    setCampaignsLoading(true);
    supabase.from('airdrop_campaigns')
      .select('id, name, token_symbol, total_pool, status')
      .eq('status', 'active')
      .then(({ data }) => { setCampaigns(data ?? []); setCampaignsLoading(false); });
  }, [airdropMode]);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (splitTotal !== 100) { toast.error('Revenue split must total 100%'); return; }
    const computedDuration = (phaseMode === 'timed' || phaseMode === 'timed_count')
      ? (parseInt(durationHours || '0') * 3600 + parseInt(durationMinutes || '0') * 60) || null
      : null;
    const computedBidsToClose = (phaseMode === 'count' || phaseMode === 'timed_count')
      ? parseInt(totalBidsLimit) || null : null;
    const computedBidsToHot = phaseMode === 'accumulate_hot' ? parseInt(bidsToHot) || null : null;
    const computedHotDuration = phaseMode === 'accumulate_hot' ? parseInt(hotDuration) || null : null;
    if (!computedDuration && !computedBidsToClose && !computedBidsToHot) {
      toast.error('Set at least one end condition'); return;
    }
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
      const instanceId = data;
      if (instanceId) {
        const { data: instance } = await supabase.from('auction_instances').select('config_id').eq('id', instanceId).single();
        if (instance?.config_id) {
          await supabase.from('auction_configs').update({
            resolution_method: resolutionMethod,
            visibility,
            rng_pick_count: (resolutionMethod === 'rng_exact' || resolutionMethod === 'rng_closest') ? parseInt(rngPickCount) : 1,
            fee_mode: feeMode,
            airdrop_mode: airdropMode,
            mixed_free_bids: feeMode === 'mixed' ? parseInt(mixedFreeBids) || 3 : null,
          }).eq('id', instance.config_id);
        }
        // Link airdrop campaign if selected
        if (selectedCampaignId && airdropMode !== 'none') {
          await supabase.rpc('link_airdrop_to_auction', {
            p_campaign_id: selectedCampaignId,
            p_instance_id: instanceId,
          });
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

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Create Auction</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── FORM ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1 · Type & Identity */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <Section title="Auction Type">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AUCTION_TYPES.map(t => (
                  <button key={t.key} onClick={() => setAuctionType(t.key)}
                    className={`p-3 rounded-lg border text-center transition-all ${auctionType === t.key ? 'border-primary bg-primary/5' : 'border-border hover:border-border-active'}`}>
                    <div className="text-lg mb-0.5">{t.icon}</div>
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight">{t.desc}</div>
                  </button>
                ))}
              </div>
            </Section>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" className="sm:col-span-2">
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Arctic Rush #48" className={inputClass} />
              </Field>
              <Field label="Resolution Method">
                <select value={resolutionMethod} onChange={e => setResolutionMethod(e.target.value as any)} className={inputClass}>
                  <option value="highest_unique_bid">🏆 Highest Unique Bid</option>
                  <option value="rng_exact">🎲 RNG Exact Match</option>
                  <option value="rng_closest">🎯 RNG Closest</option>
                </select>
              </Field>
              <Field label="Visibility">
                <div className="flex gap-2">
                  {(['open', 'blind'] as const).map(v => (
                    <button key={v} onClick={() => setVisibility(v)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        visibility === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-border-active'}`}>
                      {v === 'open' ? '👁️ Open' : '🙈 Blind'}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            {(resolutionMethod === 'rng_exact' || resolutionMethod === 'rng_closest') && (
              <Field label={`Numbers to Draw (${resolutionMethod === 'rng_exact' ? 'exact match' : 'closest wins'})`}>
                <input value={rngPickCount} onChange={e => setRngPickCount(e.target.value)} type="number" min="1" max="10" className={monoInputClass} />
              </Field>
            )}
          </div>

          {/* 2 · Bid Settings */}
          <div className="bg-card border border-border rounded-xl p-5">
            <Section title="Bid Settings">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field label="Bid Fee">
                  <input value={bidFee} onChange={e => setBidFee(e.target.value)} type="number" className={monoInputClass} />
                </Field>
                <Field label="Min Value">
                  <input value={minBidValue} onChange={e => setMinBidValue(e.target.value)} type="number" step="0.01" className={monoInputClass} />
                </Field>
                <Field label="Max Value">
                  <input value={maxBidValue} onChange={e => setMaxBidValue(e.target.value)} type="number" step="0.01" className={monoInputClass} />
                </Field>
                <Field label="Currency">
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                    {['PNGWIN', 'TON', 'BTC', 'ETH', 'SOL'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Max Bids / Player">
                  <input value={maxBidsPerPlayer} onChange={e => setMaxBidsPerPlayer(e.target.value)} type="number" placeholder="∞" className={monoInputClass} />
                </Field>
                <Field label="Consecutive Limit">
                  <input value={consecutiveLimit} onChange={e => setConsecutiveLimit(e.target.value)} type="number" className={monoInputClass} />
                </Field>
              </div>
            </Section>
          </div>

          {/* 3 · End Condition */}
          <div className="bg-card border border-border rounded-xl p-5">
            <Section title="End Condition">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PHASE_MODES.map(pm => (
                  <button key={pm.key} onClick={() => setPhaseMode(pm.key)}
                    className={`p-2.5 rounded-lg border text-center transition-all ${phaseMode === pm.key ? 'border-primary bg-primary/5' : 'border-border hover:border-border-active'}`}>
                    <div className="text-base mb-0.5">{pm.icon}</div>
                    <div className="text-[11px] font-bold">{pm.label}</div>
                    <div className="text-[9px] text-muted-foreground leading-tight">{pm.desc}</div>
                  </button>
                ))}
              </div>

              {(phaseMode === 'timed' || phaseMode === 'timed_count') && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Field label="Hours">
                    <input value={durationHours} onChange={e => setDurationHours(e.target.value)} type="number" min="0" className={monoInputClass} />
                  </Field>
                  <Field label="Minutes">
                    <input value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} type="number" min="0" max="59" className={monoInputClass} />
                  </Field>
                </div>
              )}

              {(phaseMode === 'count' || phaseMode === 'timed_count') && (
                <Field label="Max Total Bids" className="mt-3">
                  <input value={totalBidsLimit} onChange={e => setTotalBidsLimit(e.target.value)} type="number" className={monoInputClass} />
                </Field>
              )}

              {phaseMode === 'accumulate_hot' && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <Field label="Bids to trigger Hot">
                    <input value={bidsToHot} onChange={e => setBidsToHot(e.target.value)} type="number" className={monoInputClass} />
                  </Field>
                  <Field label="Hot Duration (sec)">
                    <input value={hotDuration} onChange={e => setHotDuration(e.target.value)} type="number" className={monoInputClass} />
                  </Field>
                </div>
              )}
            </Section>
          </div>

          {/* 4 · Prize (conditional) */}
          {(showFreeFields || showJackpotFields) && (
            <div className="bg-card border border-border rounded-xl p-5">
              <Section title={showJackpotFields ? 'Jackpot Settings' : 'Prize Settings'}>
                <div className="grid grid-cols-2 gap-4">
                  {showJackpotFields && (
                    <Field label="Jackpot Seed">
                      <input value={jackpotSeed} onChange={e => setJackpotSeed(e.target.value)} type="number" className={monoInputClass} />
                    </Field>
                  )}
                  <Field label="Prize Description" className={showFreeFields ? 'col-span-2' : ''}>
                    <input value={prizeDescription} onChange={e => setPrizeDescription(e.target.value)} placeholder="e.g. 500 PNGWIN" className={inputClass} />
                  </Field>
                </div>
              </Section>
            </div>
          )}

          {/* 5 · Bonuses */}
          <div className="bg-card border border-border rounded-xl p-5">
            <Section title="Bonuses">
              <div className="space-y-3">
                <Toggle label="Social Circle" icon="🐧" enabled={socialCircleEnabled} onToggle={() => setSocialCircleEnabled(!socialCircleEnabled)}>
                  <div className="flex gap-2">
                    {(['per_bid', 'on_win'] as const).map(mode => (
                      <button key={mode} onClick={() => setSocialCircleMode(mode)}
                        className={`flex-1 py-1.5 rounded text-[11px] font-semibold border transition-all ${
                          socialCircleMode === mode ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground'}`}>
                        {mode === 'per_bid' ? '💰 Per Bid' : '🏆 On Win'}
                      </button>
                    ))}
                  </div>
                </Toggle>

                <Toggle label="Early Bird" icon="🐣" enabled={earlyBirdEnabled} onToggle={() => setEarlyBirdEnabled(!earlyBirdEnabled)}>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First N bids">
                      <input value={earlyBirdCount} onChange={e => setEarlyBirdCount(e.target.value)} type="number"
                        className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                    </Field>
                    <Field label="Reward (PNGWIN)">
                      <input value={earlyBirdReward} onChange={e => setEarlyBirdReward(e.target.value)} type="number"
                        className="w-full px-2 py-1.5 bg-card border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                    </Field>
                  </div>
                </Toggle>
              </div>
            </Section>
          </div>

          {/* 6 · Airdrop Settings */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <Section title="Airdrop Settings (optional)">
              {/* Fee Mode */}
              <div className="space-y-2">
                <label className="text-[11px] text-muted-foreground block">Fee Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'paid', icon: '💰', label: 'Paid', desc: 'Every bid costs the bid fee' },
                    { key: 'free', icon: '🎁', label: 'Free', desc: 'All bids free (partner-funded)' },
                    { key: 'mixed', icon: '🔀', label: 'Mixed', desc: 'First N bids free, then paid' },
                  ] as const).map(fm => (
                    <button key={fm.key} onClick={() => setFeeMode(fm.key)}
                      className={`p-2.5 rounded-lg border text-center transition-all ${feeMode === fm.key ? 'border-primary bg-primary/5' : 'border-border hover:border-border-active'}`}>
                      <div className="text-base mb-0.5">{fm.icon}</div>
                      <div className="text-[11px] font-bold">{fm.label}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight">{fm.desc}</div>
                    </button>
                  ))}
                </div>
                {feeMode === 'mixed' && (
                  <Field label="Free bids per player" className="mt-2">
                    <input value={mixedFreeBids} onChange={e => setMixedFreeBids(e.target.value)} type="number" min="1" className={monoInputClass} />
                  </Field>
                )}
              </div>

              {/* Airdrop Mode */}
              <div className="space-y-2 mt-4">
                <label className="text-[11px] text-muted-foreground block">Airdrop Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'none', icon: '⛔', label: 'None', desc: 'No airdrop' },
                    { key: 'piggyback', icon: '🤝', label: 'Piggyback', desc: 'Tokens after auction resolves' },
                    { key: 'gamified', icon: '🎮', label: 'Gamified', desc: 'Tokens earned per bid' },
                  ] as const).map(am => (
                    <button key={am.key} onClick={() => { setAirdropMode(am.key); if (am.key === 'none') setSelectedCampaignId(''); }}
                      className={`p-2.5 rounded-lg border text-center transition-all ${airdropMode === am.key ? 'border-primary bg-primary/5' : 'border-border hover:border-border-active'}`}>
                      <div className="text-base mb-0.5">{am.icon}</div>
                      <div className="text-[11px] font-bold">{am.label}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight">{am.desc}</div>
                    </button>
                  ))}
                </div>

                {airdropMode !== 'none' && (
                  <div className="mt-3 space-y-3">
                    <Field label="Link Airdrop Campaign">
                      {campaignsLoading ? (
                        <div className="text-xs text-muted-foreground py-2">Loading campaigns…</div>
                      ) : campaigns.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-2">No active campaigns found</div>
                      ) : (
                        <select value={selectedCampaignId} onChange={e => setSelectedCampaignId(e.target.value)} className={inputClass}>
                          <option value="">Select campaign…</option>
                          {campaigns.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.token_symbol})</option>
                          ))}
                        </select>
                      )}
                    </Field>
                    {selectedCampaign && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1">
                        <div className="text-xs font-semibold text-primary">{selectedCampaign.name}</div>
                        <div className="flex gap-4 text-[11px] text-muted-foreground">
                          <span>Token: <b className="text-foreground">{selectedCampaign.token_symbol}</b></span>
                          <span>Pool: <b className="text-foreground">{Number(selectedCampaign.total_pool).toLocaleString()}</b></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Section>
          </div>

          {/* 6 · Revenue Split */}
          <div className="bg-card border border-border rounded-xl p-5">
            <Section title="Revenue Split">
              <div className="space-y-2.5">
                {Object.entries(split).map(([key, val]) => {
                  const meta = SPLIT_META[key];
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`text-xs w-16 font-medium ${meta?.color ?? ''}`}>{meta?.label ?? key}</span>
                      <input type="range" min={0} max={100} value={val}
                        onChange={e => setSplit(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="flex-1 accent-[hsl(var(--primary))]" />
                      <span className="font-mono text-xs w-10 text-right">{val}%</span>
                    </div>
                  );
                })}
              </div>
              <div className={`text-xs font-semibold mt-3 ${splitTotal === 100 ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                Total: {splitTotal}%{splitTotal !== 100 && ' — must equal 100%'}
              </div>
            </Section>
          </div>

          {/* Submit */}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSubmit} disabled={submitting}
            className="w-full py-3.5 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60">
            {submitting ? 'Creating…' : '🚀 CREATE AUCTION'}
          </motion.button>
        </div>

        {/* ── SIDEBAR PREVIEW ── */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Live Preview</h3>

            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeMeta.icon}</span>
                  <span className="font-display font-bold text-sm truncate">{name || 'Auction Name'}</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-primary/5 text-primary border border-primary/20">
                  {typeMeta.label}
                </span>
              </div>

              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Prize Pool</div>
                <div className="font-mono text-2xl font-bold text-primary">0 <span className="text-xs text-muted-foreground">{currency}</span></div>
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Bids: <b className="text-foreground">0</b></span>
                {visibility === 'open' && <>
                  <span>Unique: <b className="text-pngwin-green">0</b></span>
                  <span>Burned: <b className="text-pngwin-red">0</b></span>
                </>}
                {visibility === 'blind' && <span className="text-muted-foreground italic">Blind</span>}
              </div>

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                Range: <span className="font-mono font-medium text-foreground">
                  {parseFloat(minBidValue || '0.01').toFixed(2)} — {parseFloat(maxBidValue || '99.99').toFixed(2)}
                </span>
              </div>

              {phaseMode === 'accumulate_hot' && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">Bids to Hot</span>
                    <span className="text-primary font-semibold">0/{bidsToHot}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary/50 to-primary w-0" />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Bid Cost</span>
                <span className="font-mono font-bold text-primary">
                  {parseFloat(bidFee || '0') === 0 ? 'FREE' : `${bidFee} ${currency}`}
                </span>
              </div>
            </div>

            {/* Feature badges */}
            {(socialCircleEnabled || earlyBirdEnabled || feeMode !== 'paid' || airdropMode !== 'none') && (
              <div className="flex flex-wrap gap-1.5">
                {socialCircleEnabled && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-ice/5 text-ice border border-ice/20">
                    🐧 Social {socialCircleMode === 'per_bid' ? 'Per Bid' : 'On Win'}
                  </span>
                )}
                {earlyBirdEnabled && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-pngwin-orange/10 text-pngwin-orange border border-pngwin-orange/20">
                    🐣 First {earlyBirdCount}
                  </span>
                )}
                {feeMode === 'free' && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-pngwin-green/10 text-pngwin-green border border-pngwin-green/20">
                    🎁 FREE
                  </span>
                )}
                {feeMode === 'mixed' && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-pngwin-green/10 text-pngwin-green border border-pngwin-green/20">
                    🎁 {mixedFreeBids} Free Bids
                  </span>
                )}
                {airdropMode !== 'none' && (
                  <span className="px-2 py-1 rounded text-[10px] font-semibold bg-primary/5 text-primary border border-primary/20">
                    🪂 Airdrop{selectedCampaign ? ` · ${selectedCampaign.token_symbol}` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Split bar */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="text-[11px] text-muted-foreground mb-2 font-semibold uppercase tracking-wider">Revenue Split</div>
              <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-2">
                <div className="bg-pngwin-green" style={{ width: `${split.winner}%` }} />
                <div className="bg-pngwin-red" style={{ width: `${split.burn}%` }} />
                <div className="bg-muted-foreground" style={{ width: `${split.platform}%` }} />
                <div className="bg-ice" style={{ width: `${split.social}%` }} />
                <div className="bg-primary" style={{ width: `${split.rollover}%` }} />
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
                {Object.entries(split).map(([key, val]) => {
                  const meta = SPLIT_META[key];
                  return <span key={key} className={meta?.color}>{meta?.label} {val}%</span>;
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateAuction;
