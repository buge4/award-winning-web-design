import { useState } from 'react';
import { toast } from 'sonner';

const AdminSettings = () => {
  const [platformName, setPlatformName] = useState('Arctico');
  const [defaultSplit, setDefaultSplit] = useState({ prize: 55, house: 15, burn: 15, social: 5, jackpot: 10 });
  const [jackpotSeed, setJackpotSeed] = useState('1000');
  const [minPlayersJackpot, setMinPlayersJackpot] = useState('10');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const splitTotal = Object.values(defaultSplit).reduce((a, b) => a + b, 0);

  const handleSave = () => {
    if (splitTotal !== 100) { toast.error('Split must total 100%'); return; }
    toast.success('Settings saved (local only — backend persistence coming soon)');
  };

  const inputClass = "w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">⚙️ Platform Settings</h1>

      <div className="max-w-2xl space-y-6">
        {/* General */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">General</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Platform Name</label>
              <input value={platformName} onChange={e => setPlatformName(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>

        {/* Default Fund Allocation */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">Default Fund Allocation</h2>
          <div className="space-y-2">
            {Object.entries(defaultSplit).map(([key, val]) => {
              const colors: Record<string, string> = { prize: 'text-pngwin-green', house: 'text-muted-foreground', burn: 'text-pngwin-red', social: 'text-ice', jackpot: 'text-primary' };
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-xs w-20 capitalize ${colors[key] ?? ''}`}>{key}</span>
                  <input type="range" min={0} max={100} value={val}
                    onChange={e => setDefaultSplit(prev => ({ ...prev, [key]: Number(e.target.value) }))}
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

        {/* Jackpot */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">Jackpot Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Default Seed Amount</label>
              <input value={jackpotSeed} onChange={e => setJackpotSeed(e.target.value)} type="number" className={`${inputClass} font-mono`} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Min Players to Start</label>
              <input value={minPlayersJackpot} onChange={e => setMinPlayersJackpot(e.target.value)} type="number" className={`${inputClass} font-mono`} />
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-display font-bold text-sm mb-4">Maintenance</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Maintenance Mode</div>
              <div className="text-xs text-muted-foreground">Disable all user-facing gameplay</div>
            </div>
            <button onClick={() => setMaintenanceMode(!maintenanceMode)}
              className={`w-11 h-6 rounded-full transition-colors relative ${maintenanceMode ? 'bg-pngwin-red' : 'bg-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-foreground absolute top-1 transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold">
          💾 Save Settings
        </button>
      </div>
    </div>
  );
};

export default AdminSettings;
