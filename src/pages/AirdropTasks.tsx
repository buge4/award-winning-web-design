import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface TaskItem {
  id: string;
  description: string;
  reward_amount: number;
  reward_type: string;
  campaign_name: string;
  token_symbol: string;
  completed: boolean;
}

const AirdropTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    const { data: rawTasks } = await supabase
      .from('airdrop_tasks')
      .select('*, airdrop_campaigns(name, token_symbol, status)')
      .eq('airdrop_campaigns.status', 'active');

    if (!rawTasks) { setLoading(false); return; }

    let completedIds = new Set<string>();
    if (user) {
      const { data: completions } = await supabase
        .from('airdrop_task_completions')
        .select('task_id')
        .eq('user_id', user.id)
        .eq('verified', true);
      completedIds = new Set((completions ?? []).map((c: any) => c.task_id));
    }

    setTasks(rawTasks.filter((t: any) => t.airdrop_campaigns?.status === 'active').map((t: any) => ({
      id: t.id,
      description: t.description,
      reward_amount: t.reward_amount,
      reward_type: t.reward_type,
      campaign_name: t.airdrop_campaigns?.name ?? '',
      token_symbol: t.airdrop_campaigns?.token_symbol ?? 'YAUC',
      completed: completedIds.has(t.id),
    })));
    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-20 pb-24 md:pb-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="font-display text-3xl font-bold">Airdrop Tasks</h1>
          <p className="text-sm text-muted-foreground mt-2">Complete tasks to earn free tokens</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <div className="text-muted-foreground text-sm">No tasks available right now</div>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`bg-card border rounded-xl p-5 transition-all ${
                  task.completed ? 'border-pngwin-green/30 opacity-70' : 'border-border hover:border-pngwin-purple/40'
                }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{task.description}</span>
                      {task.completed && <span className="text-pngwin-green text-sm">✅</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-pngwin-purple font-mono font-bold">🎟 {task.reward_amount} {task.token_symbol}</span>
                      <span className="text-[10px] text-muted-foreground">{task.reward_type}</span>
                      <span className="text-[10px] text-muted-foreground">• {task.campaign_name}</span>
                    </div>
                  </div>
                  <div>
                    {task.completed ? (
                      <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-pngwin-green/10 text-pngwin-green border border-pngwin-green/20">Completed</span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-gold">Available</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AirdropTasks;
