import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useMyRecentBids } from '@/hooks/useLobbyData';
import { Skeleton } from '@/components/ui/skeleton';

const MyRecentBids = () => {
  const { user } = useAuth();
  const { bids, loading } = useMyRecentBids();

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
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : bids.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-6">
          No bids yet. Enter an auction to get started!
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {bids.map((bid) => (
            <div key={bid.id} className="flex items-center py-3 gap-4">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  bid.status === 'unique'
                    ? 'bg-pngwin-green shadow-[0_0_8px_hsla(152,100%,45%,0.3)]'
                    : 'bg-pngwin-red shadow-[0_0_8px_hsla(350,100%,63%,0.3)]'
                }`}
              />
              <div className="font-mono text-xl font-bold flex-1">{bid.value}</div>
              <div className="text-xs text-muted-foreground flex-1 hidden sm:block">
                {bid.auctionName}
              </div>
              {bid.position && (
                <span className="font-mono text-xs font-bold bg-background rounded-md px-2.5 py-1 text-primary border border-primary/20">
                  #{bid.position}
                </span>
              )}
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-md ${
                  bid.status === 'unique'
                    ? 'bg-pngwin-green text-primary-foreground'
                    : 'bg-pngwin-red text-foreground'
                }`}
              >
                {bid.status === 'unique' ? 'UNIQUE' : 'BURNED'}
              </span>
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
