import { motion } from 'framer-motion';
import { MY_BIDS } from '@/data/mockData';
import { useAuth } from '@/context/AuthContext';

const MOCK_AUCTION_NAMES: Record<string, string> = {
  '1': 'Jackpot W5',
  '2': 'Daily #12',
  '3': 'Arctic Rush #48',
  '4': 'Shadow Bid #4',
  '5': 'Jackpot W5',
  '6': 'Daily #12',
  '7': 'Arctic Rush #48',
  '8': 'Shadow Bid #4',
  '9': 'Jackpot W5',
  '10': 'Daily #12',
};

const MyRecentBids = () => {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-2xl p-6"
    >
      {!user ? (
        <p className="text-center text-muted-foreground text-sm py-6">
          Log in to see your bids
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {MY_BIDS.map((bid) => (
            <div key={bid.id} className="flex items-center py-3 gap-4">
              {/* Status dot */}
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  bid.status === 'unique'
                    ? 'bg-pngwin-green shadow-[0_0_8px_hsla(152,100%,45%,0.3)]'
                    : 'bg-pngwin-red shadow-[0_0_8px_hsla(350,100%,63%,0.3)]'
                }`}
              />

              {/* Bid value */}
              <div className="font-mono text-xl font-bold flex-1">{bid.value}</div>

              {/* Auction name */}
              <div className="text-xs text-muted-foreground flex-1 hidden sm:block">
                {MOCK_AUCTION_NAMES[bid.id] ?? 'Auction'}
              </div>

              {/* Rank */}
              {bid.position && (
                <span className="font-mono text-xs font-bold bg-background rounded-md px-2.5 py-1 text-primary border border-primary/20">
                  #{bid.position}
                </span>
              )}

              {/* Status badge */}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                  bid.status === 'unique'
                    ? 'bg-pngwin-green text-primary-foreground'
                    : 'bg-pngwin-red text-foreground'
                }`}
              >
                {bid.status === 'unique' ? 'UNIQUE' : 'BURNED'}
              </span>

              {/* Time */}
              <span className="text-[11px] text-muted-foreground min-w-[60px] text-right">
                {bid.timestamp}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MyRecentBids;
