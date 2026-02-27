import { motion } from 'framer-motion';

const WEEKLY_TOP = [
  { rank: 1, user: '@DiamondHands', amount: 42500 },
  { rank: 2, user: '@MoonShot', amount: 18200 },
  { rank: 3, user: '@CryptoKing', amount: 8800 },
  { rank: 4, user: '@AlphaWolf', amount: 3400 },
  { rank: 5, user: '@IcyPenguin', amount: 1200 },
];

const ALL_TIME_TOP = [
  { rank: 1, user: '@WhaleAlert', amount: 245000 },
  { rank: 2, user: '@DiamondHands', amount: 189300 },
  { rank: 3, user: '@NordicBid', amount: 134500 },
  { rank: 4, user: '@MoonShot', amount: 98200 },
  { rank: 5, user: '@CryptoKing', amount: 76100 },
];

const rankColors: Record<number, string> = {
  1: 'text-primary',
  2: 'text-[#C0C0C0]',
  3: 'text-[#CD7F32]',
};

const LeaderboardCard = ({ title, entries }: { title: string; entries: typeof WEEKLY_TOP }) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <h3 className="font-display font-bold text-base uppercase tracking-wider text-muted-foreground mb-4">{title}</h3>
    <div className="divide-y divide-border/50">
      {entries.map((e) => (
        <div key={e.rank} className="flex items-center py-2.5">
          <span className={`font-mono font-bold text-sm w-9 text-center ${rankColors[e.rank] ?? 'text-muted-foreground'}`}>
            #{e.rank}
          </span>
          <span className="flex-1 text-sm font-semibold">{e.user}</span>
          <span className="font-mono text-sm font-bold text-pngwin-green">
            +{e.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const LobbyLeaderboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="grid grid-cols-1 md:grid-cols-2 gap-5"
  >
    <LeaderboardCard title="This Week — Top Winners" entries={WEEKLY_TOP} />
    <LeaderboardCard title="All Time — Total Earned" entries={ALL_TIME_TOP} />
  </motion.div>
);

export default LobbyLeaderboard;
