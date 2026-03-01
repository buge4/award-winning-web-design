import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';

interface CryptoAuction {
  id: string;
  name: string;
  currency: string;
  status: string;
  prizePool: number;
  totalBids: number;
  bidFee: number;
  totalBidsToHot: number | null;
  hotModeEndsAt: string | null;
  visibility: string;
  manualPrizeTitle: string | null;
  manualPrizeValue: number | null;
}

const CRYPTO_COLORS: Record<string, { accent: string; bg: string; icon: string }> = {
  ETH: { accent: 'hsl(231 60% 65%)', bg: 'hsl(231 40% 12%)', icon: '💎' },
  BTC: { accent: 'hsl(33 95% 53%)', bg: 'hsl(33 40% 12%)', icon: '₿' },
  SOL: { accent: 'hsl(271 100% 63%)', bg: 'hsl(271 40% 12%)', icon: '◎' },
  TON: { accent: 'hsl(204 100% 46%)', bg: 'hsl(204 40% 12%)', icon: '💎' },
  XRP: { accent: 'hsl(210 30% 16%)', bg: 'hsl(210 20% 10%)', icon: '✕' },
};

const CryptoAuctionCards = () => {
  const [auctions, setAuctions] = useState<CryptoAuction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('auction_instances')
        .select('*, auction_configs(*)')
        .in('status', ['accumulating', 'hot_mode', 'grace_period'])
        .order('created_at', { ascending: false });

      if (data) {
        const crypto = data.filter((r: any) => {
          const currency = r.auction_configs?.currency ?? 'PNGWIN';
          return ['ETH', 'BTC', 'SOL', 'TON', 'XRP'].includes(currency);
        });

        setAuctions(crypto.map((r: any) => {
          const config = r.auction_configs ?? {};
          return {
            id: r.id,
            name: config.name ?? 'Crypto Auction',
            currency: config.currency ?? 'ETH',
            status: r.status,
            prizePool: Number(r.prize_pool ?? 0),
            totalBids: Number(r.total_bids ?? 0),
            bidFee: Number(config.bid_fee ?? 0),
            totalBidsToHot: config.total_bids_to_hot ? Number(config.total_bids_to_hot) : null,
            hotModeEndsAt: r.hot_mode_ends_at,
            visibility: config.visibility ?? 'open',
            manualPrizeTitle: config.manual_prize_title,
            manualPrizeValue: config.manual_prize_value ? Number(config.manual_prize_value) : null,
          };
        }));
      }
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading || auctions.length === 0) return null;

  return (
    <div className="container py-10">
      <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2.5">
        <span className="w-1 h-6 bg-primary rounded-sm" />
        🌐 Crypto Prize Auctions
      </h2>

      {/* Hot mode banner */}
      {auctions.filter(a => a.status === 'hot_mode').map(a => (
        <motion.div
          key={`hot-${a.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 bg-pngwin-red/10 border border-pngwin-red/30 rounded-xl px-5 py-3 text-center animate-pulse"
        >
          <span className="text-sm font-bold text-pngwin-red">
            🔥 {a.currency} AUCTION HOT MODE — All positions visible. Place your final bids!
          </span>
        </motion.div>
      ))}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {auctions.map((a, i) => {
          const theme = CRYPTO_COLORS[a.currency] ?? CRYPTO_COLORS.ETH;
          const progress = a.totalBidsToHot ? Math.min(100, (a.totalBids / a.totalBidsToHot) * 100) : 0;

          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="min-w-[260px] max-w-[300px] flex-shrink-0 bg-card border border-border rounded-2xl p-5 hover:border-border-active transition-colors relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${theme.bg}, hsl(var(--card)))`,
              }}
            >
              {/* Corner glow */}
              <div
                className="absolute top-0 right-0 w-20 h-20 opacity-10 rounded-bl-full"
                style={{ background: theme.accent }}
              />

              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{theme.icon}</span>
                <div className="flex gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                    a.status === 'hot_mode'
                      ? 'bg-pngwin-red/20 text-pngwin-red animate-pulse'
                      : 'bg-pngwin-green/10 text-pngwin-green'
                  }`}>
                    {a.status === 'hot_mode' ? '🔥 HOT' : 'LIVE'}
                  </span>
                  {a.visibility === 'blind' && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-pngwin-purple/10 text-pngwin-purple">BLIND</span>
                  )}
                </div>
              </div>

              <div className="font-display font-bold text-lg mb-1" style={{ color: theme.accent }}>
                {a.manualPrizeTitle ?? `Win ${a.currency}`}
              </div>

              {a.manualPrizeValue && (
                <div className="font-mono text-2xl font-bold text-foreground mb-2">
                  {a.manualPrizeValue} {a.currency}
                </div>
              )}

              {a.totalBidsToHot && (
                <div className="mb-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                    <span>Progress to hot</span>
                    <span className="font-mono">{a.totalBids}/{a.totalBidsToHot}</span>
                  </div>
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${progress}%`, background: theme.accent }}
                    />
                  </div>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground mb-3">
                Bid cost: <span className="font-mono font-bold text-foreground">{a.bidFee} {a.currency}</span>
              </div>

              <Link
                to={`/auction/${a.id}`}
                className="block w-full py-2.5 rounded-lg text-center text-xs font-bold uppercase tracking-wider transition-colors border"
                style={{
                  borderColor: theme.accent,
                  color: theme.accent,
                }}
              >
                Enter Auction →
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default CryptoAuctionCards;
