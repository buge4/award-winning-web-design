import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface EarlyBirdBannerProps {
  instanceId: string;
}

interface Promotion {
  id: string;
  promo_type: string;
  reward_amount: number;
  max_claims: number;
  claimed_count: number;
  is_active: boolean;
  hot_mode_only: boolean;
  expires_at: string | null;
  tier: number;
}

const EarlyBirdBanner = ({ instanceId }: EarlyBirdBannerProps) => {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!instanceId) { setLoading(false); return; }

    supabase
      .from('auction_promotions')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .then(({ data }) => {
        if (data) setPromos(data as Promotion[]);
        setLoading(false);
      });
  }, [instanceId]);

  // If no real promos, show mock for premium feel
  const displayPromos = promos.length > 0 ? promos : [
    {
      id: 'mock-eb1',
      promo_type: 'early_bird',
      reward_amount: 2,
      max_claims: 100,
      claimed_count: 73,
      is_active: true,
      hot_mode_only: true,
      expires_at: null,
      tier: 1,
    },
    {
      id: 'mock-eb2',
      promo_type: 'early_bird',
      reward_amount: 1,
      max_claims: 100,
      claimed_count: 0,
      is_active: true,
      hot_mode_only: true,
      expires_at: null,
      tier: 2,
    },
  ];

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-pngwin-orange/8 via-primary/5 to-pngwin-orange/8 border border-pngwin-orange/20 rounded-xl p-5 space-y-4"
    >
      {displayPromos.map((promo) => {
        const progress = promo.max_claims > 0 ? (promo.claimed_count / promo.max_claims) * 100 : 0;
        const isFull = promo.claimed_count >= promo.max_claims;
        const isStarted = promo.tier === 1 || (promo.tier === 2 && displayPromos[0]?.claimed_count >= displayPromos[0]?.max_claims);

        return (
          <div key={promo.id} className={`${!isStarted ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🐦</span>
              <div className="flex-1">
                <div className="font-display font-bold text-sm text-foreground">
                  {promo.tier === 1 ? 'EARLY BIRD' : `Tier ${promo.tier}`} —{' '}
                  {isFull ? (
                    <span className="text-muted-foreground">Fully claimed!</span>
                  ) : (
                    <>
                      First {promo.max_claims} bidders get{' '}
                      <span className="text-pngwin-green">{promo.reward_amount} FREE</span>{' '}
                      {promo.hot_mode_only ? 'hot-mode bids' : 'bids'}!
                    </>
                  )}
                </div>
              </div>
            </div>

            {isStarted && (
              <>
                {/* Progress bar */}
                <div className="relative h-2 bg-background rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isFull
                        ? 'bg-muted-foreground'
                        : 'bg-gradient-to-r from-pngwin-orange to-primary'
                    }`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>{promo.claimed_count}/{promo.max_claims} claimed</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </>
            )}

            {!isStarted && (
              <div className="text-[10px] text-muted-foreground italic">
                🔒 Starts after Tier {promo.tier - 1} is filled
              </div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

export default EarlyBirdBanner;
