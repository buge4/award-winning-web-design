import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

interface Instance {
  id: string;
  status: string;
  created_at: string;
  index: number;
}

interface InstanceNavigationProps {
  currentInstanceId: string;
  configId: string;
  configName: string;
}

const InstanceNavigation = ({ currentInstanceId, configId, configName }: InstanceNavigationProps) => {
  const [instances, setInstances] = useState<Instance[]>([]);

  useEffect(() => {
    if (!configId) return;
    supabase
      .from('auction_instances')
      .select('id, status, created_at')
      .eq('config_id', configId)
      .order('created_at', { ascending: true })
      .limit(20)
      .then(({ data }) => {
        if (data) {
          setInstances(data.map((r: any, i: number) => ({
            id: r.id,
            status: r.status,
            created_at: r.created_at,
            index: i + 1,
          })));
        }
      });
  }, [configId]);

  if (instances.length <= 1) return null;

  const currentIdx = instances.findIndex(i => i.id === currentInstanceId);
  // Show up to 5 instances centered on current
  const start = Math.max(0, Math.min(currentIdx - 2, instances.length - 5));
  const visible = instances.slice(start, start + 5);

  const shortName = configName.replace(/Weekly |Daily |Hourly |Auction |Series |Simulation /gi, '').trim();
  const isJackpot = configName.toLowerCase().includes('jackpot');
  const prefix = isJackpot ? 'Week' : '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4"
    >
      {start > 0 && (
        <Link
          to={`/auction/${instances[start - 1].id}`}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border-active transition-colors shrink-0"
        >
          ← Earlier
        </Link>
      )}
      {visible.map((inst) => {
        const isCurrent = inst.id === currentInstanceId;
        const isActive = ['accumulating', 'hot_mode', 'grace_period'].includes(inst.status);
        const isResolved = inst.status === 'resolved' || inst.status === 'closed';
        return (
          <Link
            key={inst.id}
            to={`/auction/${inst.id}`}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all shrink-0 ${
              isCurrent
                ? 'bg-pngwin-green/15 text-pngwin-green border-pngwin-green/40'
                : isResolved
                ? 'bg-card text-muted-foreground border-border hover:border-border-active'
                : isActive
                ? 'bg-primary/10 text-primary border-gold/30 hover:border-gold'
                : 'bg-secondary text-muted-foreground border-border hover:border-border-active opacity-60'
            }`}
          >
            {isCurrent && '📍 '}{isJackpot ? `${prefix} ${inst.index}` : `${prefix}${inst.index}`}
            {isResolved && !isCurrent && ' ✓'}
          </Link>
        );
      })}
      {start + 5 < instances.length && (
        <Link
          to={`/auction/${instances[start + 5].id}`}
          className="px-2.5 py-1 rounded-full text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border hover:border-border-active transition-colors shrink-0"
        >
          Later →
        </Link>
      )}
    </motion.div>
  );
};

export default InstanceNavigation;
