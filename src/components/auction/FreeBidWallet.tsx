import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface FreeBidWalletProps {
  instanceId: string;
  currentPhase: string;
}

interface FreeBidRecord {
  id: string;
  total_granted: number;
  used: number;
  remaining: number;
  hot_mode_only: boolean;
  granted_by: string;
}

const FreeBidWallet = ({ instanceId, currentPhase }: FreeBidWalletProps) => {
  const { user } = useAuth();
  const [freeBids, setFreeBids] = useState<FreeBidRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !instanceId) { setLoading(false); return; }

    supabase
      .from('auction_free_bids')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('user_id', user.id)
      .gt('remaining', 0)
      .then(({ data }) => {
        if (data) setFreeBids(data as FreeBidRecord[]);
        setLoading(false);
      });
  }, [user, instanceId]);

  if (loading || freeBids.length === 0) return null;

  const totalRemaining = freeBids.reduce((sum, fb) => sum + fb.remaining, 0);
  const hotModeOnly = freeBids.some(fb => fb.hot_mode_only);
  const isHotMode = currentPhase === 'hot_mode' || currentPhase === 'grace_period';
  const canUse = !hotModeOnly || isHotMode;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="bg-gradient-to-r from-pngwin-green/8 via-pngwin-green/5 to-pngwin-green/8 border border-pngwin-green/20 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pngwin-green/10 flex items-center justify-center text-lg shrink-0">
            🎁
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display font-bold text-sm text-pngwin-green">
              You have {totalRemaining} FREE BID{totalRemaining > 1 ? 'S' : ''}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {hotModeOnly ? (
                isHotMode ? (
                  <span className="text-pngwin-green">✅ Usable now — Hot Mode active</span>
                ) : (
                  <span className="text-pngwin-orange">⏳ Usable in: Hot Mode only</span>
                )
              ) : (
                <span className="text-pngwin-green">✅ Usable anytime</span>
              )}
            </div>
          </div>
          {canUse && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-pngwin-green shrink-0"
            />
          )}
        </div>

        {/* Source breakdown */}
        {freeBids.length > 1 && (
          <div className="mt-3 pt-3 border-t border-pngwin-green/10 space-y-1">
            {freeBids.map((fb) => (
              <div key={fb.id} className="flex justify-between text-[10px] text-muted-foreground">
                <span className="capitalize">{fb.granted_by.replace(/_/g, ' ')}</span>
                <span className="font-mono">{fb.remaining}/{fb.total_granted}</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FreeBidWallet;
