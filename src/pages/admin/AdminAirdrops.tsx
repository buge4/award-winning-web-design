import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface Campaign {
  id: string;
  name: string;
  partner: string;
  token_symbol: string;
  total_pool: number;
  distributed: number;
  status: string;
  created_at: string;
}

interface Task {
  id: string;
  campaign_id: string;
  description: string;
  reward_amount: number;
  reward_type: string;
  completions: number;
}

const AdminAirdrops = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  useEffect(() => { loadCampaigns(); }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('airdrop_campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  };

  const loadTasks = async (campaignId: string) => {
    setTasksLoading(true);
    const { data } = await supabase
      .from('airdrop_tasks')
      .select('*, airdrop_task_completions(count)')
      .eq('campaign_id', campaignId)
      .order('created_at');
    setTasks((data ?? []).map((t: any) => ({
      ...t,
      completions: t.airdrop_task_completions?.[0]?.count ?? 0,
    })));
    setTasksLoading(false);
  };

  const handleSelectCampaign = (c: Campaign) => {
    setSelectedCampaign(c);
    loadTasks(c.id);
  };

  const statusColor = (s: string) => {
    if (s === 'active') return 'bg-pngwin-green/20 text-pngwin-green';
    if (s === 'ended') return 'bg-muted text-muted-foreground';
    if (s === 'paused') return 'bg-pngwin-orange/20 text-pngwin-orange';
    return 'bg-muted text-muted-foreground';
  };

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading campaigns...</div>;

  if (selectedCampaign) {
    const pct = selectedCampaign.total_pool > 0 ? (selectedCampaign.distributed / selectedCampaign.total_pool) * 100 : 0;
    return (
      <div>
        <button onClick={() => { setSelectedCampaign(null); setTasks([]); }}
          className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to Campaigns</button>

        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold">{selectedCampaign.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(selectedCampaign.status)}`}>{selectedCampaign.status}</span>
                <span className="text-xs text-muted-foreground">{selectedCampaign.partner}</span>
                <span className="text-xs font-mono text-pngwin-purple">{selectedCampaign.token_symbol}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-background rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Total Pool</div>
              <div className="font-mono text-lg font-bold text-pngwin-purple">{selectedCampaign.total_pool.toLocaleString()}</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Distributed</div>
              <div className="font-mono text-lg font-bold text-pngwin-green">{selectedCampaign.distributed.toLocaleString()}</div>
            </div>
            <div className="bg-background rounded-lg p-3">
              <div className="text-[10px] text-muted-foreground uppercase">Remaining</div>
              <div className="font-mono text-lg font-bold">{(selectedCampaign.total_pool - selectedCampaign.distributed).toLocaleString()}</div>
            </div>
          </div>

          <div className="w-full bg-background rounded-full h-3 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pngwin-purple to-pngwin-purple/60 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          <div className="text-[10px] text-muted-foreground mt-1 text-right">{pct.toFixed(1)}% distributed</div>
        </div>

        <h3 className="font-display font-bold text-sm mb-3">📋 Tasks</h3>
        {tasksLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">No tasks for this campaign</div>
        ) : (
          <div className="space-y-3">
            {tasks.map(task => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{task.description}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-pngwin-purple font-mono">🎟 {task.reward_amount} {selectedCampaign.token_symbol}</span>
                      <span className="text-[10px] text-muted-foreground">{task.reward_type}</span>
                      <span className="text-[10px] text-muted-foreground">• {task.completions} completions</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">🎟 Airdrop Campaigns</h1>

      {campaigns.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No airdrop campaigns found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c, i) => {
            const pct = c.total_pool > 0 ? (c.distributed / c.total_pool) * 100 : 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => handleSelectCampaign(c)}
                className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:border-pngwin-purple/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-sm">{c.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColor(c.status)}`}>{c.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-muted-foreground">{c.partner}</span>
                  <span className="text-xs font-mono text-pngwin-purple">🎟 {c.token_symbol}</span>
                </div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-muted-foreground">Pool</span>
                  <span className="font-mono font-semibold">{c.total_pool.toLocaleString()}</span>
                </div>
                <div className="w-full bg-background rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-pngwin-purple/60 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">{pct.toFixed(1)}% distributed • {new Date(c.created_at).toLocaleDateString()}</div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminAirdrops;
