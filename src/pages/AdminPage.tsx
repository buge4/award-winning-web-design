import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KpiCard from '@/components/KpiCard';
import { toast } from 'sonner';

type AuctionTypeOption = 'live' | 'timed' | 'blind' | 'free' | 'jackpot-huba' | 'jackpot-rng';

const TYPE_OPTIONS: { type: AuctionTypeOption; icon: string; name: string; desc: string }[] = [
  { type: 'live', icon: '🎯', name: 'Live', desc: 'Accumulate → Hot Mode → Winner' },
  { type: 'timed', icon: '⏱️', name: 'Timed', desc: 'Fixed countdown auction' },
  { type: 'blind', icon: '🙈', name: 'Blind', desc: 'Hidden end condition' },
  { type: 'free', icon: '🎁', name: 'Free', desc: 'No cost, real prizes' },
  { type: 'jackpot-huba', icon: '🎰', name: 'Jackpot HUBA', desc: 'Rollover if no winner' },
  { type: 'jackpot-rng', icon: '🎲', name: 'Jackpot RNG', desc: 'Sealed bids, random draw' },
];

const SPLIT_PRESETS = {
  standard: { prize: 55, burn: 15, platform: 15, social: 5, jackpot: 10 },
  highPrize: { prize: 70, burn: 10, platform: 10, social: 5, jackpot: 5 },
  burnHeavy: { prize: 45, burn: 25, platform: 15, social: 5, jackpot: 10 },
};

const AdminPage = () => {
  const [wizardStep, setWizardStep] = useState(0);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedType, setSelectedType] = useState<AuctionTypeOption | null>(null);
  const [auctionName, setAuctionName] = useState('');
  const [bidFee, setBidFee] = useState('10');
  const [split, setSplit] = useState(SPLIT_PRESETS.standard);

  const stepNames = ['Choose Type', 'Basic Info', 'Bid Settings', 'Revenue Split', 'Timing', 'Review & Launch'];

  const handleLaunch = () => {
    toast.success('Auction launched successfully!');
    setShowWizard(false);
    setWizardStep(0);
    setSelectedType(null);
    setAuctionName('');
  };

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-6">🛡️ Admin Panel</h1>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          <KpiCard label="Total Revenue" value="284,700" color="gold" />
          <KpiCard label="Active Players" value={892} color="green" />
          <KpiCard label="Active Auctions" value={7} color="ice" />
          <KpiCard label="Jackpot Pool" value="125,000" color="purple" />
          <KpiCard label="Tokens Burned" value="124,500" color="red" />
          <KpiCard label="Social Paid" value="18,400" color="ice" />
        </div>

        {/* Quick Launch */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { label: '⚡ Quick Live', color: 'gradient-gold text-primary-foreground' },
            { label: '⏱️ Quick Timed', color: 'bg-ice-subtle text-ice border border-ice/30' },
            { label: '🎁 Quick Free', color: 'bg-green-subtle text-pngwin-green border border-pngwin-green/30' },
            { label: '🎲 Launch Weekly RNG', color: 'bg-purple-subtle text-pngwin-purple border border-pngwin-purple/30' },
          ].map((btn, i) => (
            <motion.button
              key={i}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toast.success(`${btn.label.slice(2)} auction launched!`)}
              className={`px-4 py-2 rounded-lg font-display font-bold text-xs ${btn.color}`}
            >
              {btn.label}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowWizard(true); setWizardStep(0); }}
            className="px-4 py-2 rounded-lg font-display font-bold text-xs bg-secondary border border-border-active text-foreground"
          >
            ➕ Create Custom Auction
          </motion.button>
        </div>

        {/* Active Auctions Table */}
        <h2 className="font-display font-bold text-lg mb-4">Active Auctions</h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden mb-8">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Name</th>
                <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase">Type</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Bids</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Pool</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Arctic Rush #47', type: 'Live', bids: 67, pool: 12450 },
                { name: 'Penguin Showdown #12', type: 'Live', bids: 134, pool: 28750 },
                { name: 'Quick Freeze 15m', type: 'Timed', bids: 45, pool: 3200 },
                { name: 'Shadow Auction #8', type: 'Blind', bids: 89, pool: 8900 },
                { name: 'Lucky Number Weekly', type: 'RNG', bids: 567, pool: 62500 },
              ].map((a, i) => (
                <tr key={i} className="border-b border-border/50 last:border-0 hover:bg-card-hover transition-colors">
                  <td className="px-5 py-3 text-sm font-medium">{a.name}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gold-subtle text-primary">{a.type}</span></td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{a.bids}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-primary font-bold">{a.pool.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-xs text-muted-foreground hover:text-foreground mr-3">Edit</button>
                    <button className="text-xs text-pngwin-red hover:text-pngwin-red/80">End</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Auction Wizard Modal */}
      <AnimatePresence>
        {showWizard && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowWizard(false)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border-active rounded-2xl p-6 max-w-xl w-full max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display font-bold text-xl">Create Auction</h2>
                <button onClick={() => setShowWizard(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
              </div>

              {/* Step indicator */}
              <div className="flex gap-1 mb-6">
                {stepNames.map((_, i) => (
                  <div key={i} className={`flex-1 h-1 rounded-full ${i <= wizardStep ? 'bg-primary' : 'bg-border'}`} />
                ))}
              </div>
              <div className="text-xs text-muted-foreground mb-4">Step {wizardStep + 1} of 6: {stepNames[wizardStep]}</div>

              {/* Step 1: Choose Type */}
              {wizardStep === 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {TYPE_OPTIONS.map(opt => (
                    <motion.div
                      key={opt.type}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedType(opt.type)}
                      className={`p-4 rounded-lg border cursor-pointer text-center transition-all ${
                        selectedType === opt.type ? 'border-primary bg-gold-subtle glow-gold' : 'border-border hover:border-border-active'
                      }`}
                    >
                      <div className="text-3xl mb-2">{opt.icon}</div>
                      <div className="font-display font-bold text-sm">{opt.name}</div>
                      <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Step 2: Basic Info */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Auction Name</label>
                    <input
                      value={auctionName}
                      onChange={e => setAuctionName(e.target.value)}
                      placeholder="e.g., Arctic Rush #48"
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Description (optional)</label>
                    <textarea
                      placeholder="Short description..."
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors resize-none h-20"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Bid Settings */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Bid Fee (PNGWIN)</label>
                    <input
                      value={bidFee}
                      onChange={e => setBidFee(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Min Bid</label>
                      <input defaultValue="00.01" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Max Bid</label>
                      <input defaultValue="99.99" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Revenue Split */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-4">
                    {(['standard', 'highPrize', 'burnHeavy'] as const).map(preset => (
                      <button
                        key={preset}
                        onClick={() => setSplit(SPLIT_PRESETS[preset])}
                        className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                          JSON.stringify(split) === JSON.stringify(SPLIT_PRESETS[preset])
                            ? 'text-primary bg-gold-subtle border-gold'
                            : 'text-muted-foreground border-border hover:bg-secondary'
                        }`}
                      >
                        {preset === 'standard' ? 'Standard' : preset === 'highPrize' ? 'High Prize' : 'Burn Heavy'}
                      </button>
                    ))}
                  </div>
                  {Object.entries(split).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16 capitalize">{key}</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={val}
                        onChange={e => setSplit(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                        className="flex-1 accent-[hsl(var(--primary))]"
                      />
                      <span className="font-mono text-sm w-10 text-right">{val}%</span>
                    </div>
                  ))}
                  <div className={`text-xs font-semibold ${Object.values(split).reduce((a, b) => a + b, 0) === 100 ? 'text-pngwin-green' : 'text-pngwin-red'}`}>
                    Total: {Object.values(split).reduce((a, b) => a + b, 0)}% {Object.values(split).reduce((a, b) => a + b, 0) !== 100 && '(must be 100%)'}
                  </div>
                </div>
              )}

              {/* Step 5: Timing */}
              {wizardStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Start Time</label>
                    <input type="datetime-local" className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Duration (for timed)</label>
                    <select className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary">
                      <option>15 minutes</option>
                      <option>30 minutes</option>
                      <option>1 hour</option>
                      <option>24 hours</option>
                      <option>1 week</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 6: Review */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="bg-background rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold">{selectedType}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-semibold">{auctionName || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Bid Fee</span><span className="font-mono font-bold text-primary">{bidFee} PNGWIN</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Split</span><span className="font-mono text-xs">{Object.entries(split).map(([k, v]) => `${k}:${v}%`).join(' ')}</span></div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setWizardStep(s => Math.max(0, s - 1))}
                  className={`px-4 py-2 text-sm text-muted-foreground hover:text-foreground ${wizardStep === 0 ? 'invisible' : ''}`}
                >
                  ← Back
                </button>
                {wizardStep < 5 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setWizardStep(s => s + 1)}
                    className="px-6 py-2 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold"
                  >
                    Next →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleLaunch}
                    className="px-8 py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold"
                  >
                    🚀 LAUNCH AUCTION
                  </motion.button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPage;
