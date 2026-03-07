import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface SpecialOfferBannerProps {
  instanceId: string;
}

interface SpecialOffer {
  id: string;
  reward_amount: number;
  max_claims: number;
  claimed_count: number;
  expires_at: string | null;
  trigger_type: 'count' | 'time';
}

const SpecialOfferBanner = ({ instanceId }: SpecialOfferBannerProps) => {
  const [offer, setOffer] = useState<SpecialOffer | null>(null);
  const [countdown, setCountdown] = useState('');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!instanceId) return;

    supabase
      .from('auction_promotions')
      .select('*')
      .eq('instance_id', instanceId)
      .eq('is_active', true)
      .eq('promo_type', 'special_offer')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const d = data[0] as any;
          setOffer({
            id: d.id,
            reward_amount: Number(d.reward_amount ?? 1),
            max_claims: Number(d.max_claims ?? 20),
            claimed_count: Number(d.claimed_count ?? 0),
            expires_at: d.expires_at ?? null,
            trigger_type: d.trigger_type ?? 'count',
          });
        }
      });
  }, [instanceId]);

  // Countdown timer
  useEffect(() => {
    if (!offer?.expires_at) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(offer.expires_at!).getTime() - Date.now()) / 1000));
      if (diff <= 0) { setVisible(false); return; }
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setCountdown(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [offer?.expires_at]);

  if (!offer || !visible) return null;

  const slotsLeft = offer.max_claims - offer.claimed_count;
  if (slotsLeft <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        className="sticky top-16 z-40 mx-auto max-w-3xl"
      >
        <div className="mx-4 mb-4">
          <div className="relative bg-gradient-to-r from-pngwin-orange/15 via-primary/10 to-pngwin-orange/15 border border-pngwin-orange/30 rounded-2xl p-4 backdrop-blur-sm overflow-hidden">
            {/* Animated shimmer */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-primary/5 to-transparent skew-x-12"
            />

            <div className="relative flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
                className="text-3xl shrink-0"
              >
                ⚡
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm uppercase tracking-wide text-foreground">
                  SPECIAL OFFER — Bid NOW for {offer.reward_amount} FREE hot bid{offer.reward_amount > 1 ? 's' : ''}!
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                {offer.expires_at && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">⏰</span>
                    <span className="font-mono text-lg font-bold text-pngwin-orange">{countdown}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">🎟</span>
                  <span className="font-mono text-sm font-bold text-foreground">{slotsLeft}/{offer.max_claims} left</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SpecialOfferBanner;
