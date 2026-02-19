import { motion } from 'framer-motion';
import { LEADERBOARD } from '@/data/mockData';

const LeaderboardPage = () => {
  const [first, second, third, ...rest] = LEADERBOARD;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8">
        <h1 className="font-display text-3xl font-bold mb-8">🏆 Leaderboard</h1>

        {/* Podium */}
        <div className="flex justify-center gap-4 mb-10 items-end">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center w-28"
          >
            <div className="text-3xl mb-2">🥈</div>
            <div className="bg-card border border-border rounded-lg p-4 h-28 flex flex-col justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-muted-foreground to-border-active mx-auto mb-1.5 flex items-center justify-center text-xs font-bold text-background">
                {second.initials}
              </div>
              <div className="font-semibold text-xs">{second.username}</div>
              <div className="font-mono text-[11px] text-primary">{second.earnings.toLocaleString()}</div>
            </div>
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center w-32"
          >
            <div className="text-4xl mb-2">🥇</div>
            <div className="bg-card border border-gold/30 rounded-lg p-5 h-36 flex flex-col justify-center glow-gold">
              <div className="w-11 h-11 rounded-full gradient-gold mx-auto mb-1.5 flex items-center justify-center text-sm font-bold text-background">
                {first.initials}
              </div>
              <div className="font-bold text-sm">{first.username}</div>
              <div className="font-mono text-xs text-primary">{first.earnings.toLocaleString()}</div>
            </div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center w-28"
          >
            <div className="text-3xl mb-2">🥉</div>
            <div className="bg-card border border-border rounded-lg p-4 h-24 flex flex-col justify-center">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-dim to-gold mx-auto mb-1.5 flex items-center justify-center text-xs font-bold text-background">
                {third.initials}
              </div>
              <div className="font-semibold text-xs">{third.username}</div>
              <div className="font-mono text-[11px] text-primary">{third.earnings.toLocaleString()}</div>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">Rank</th>
                <th className="text-left px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">Player</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">Wins</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">Earnings</th>
                <th className="text-right px-5 py-3 text-[10px] text-muted-foreground uppercase tracking-wider">Streak</th>
              </tr>
            </thead>
            <tbody>
              {LEADERBOARD.map((entry) => (
                <tr key={entry.rank} className="border-b border-border/50 last:border-b-0 hover:bg-card-hover transition-colors">
                  <td className="px-5 py-3">
                    <span className={`font-mono text-sm font-bold ${entry.rank <= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                      #{entry.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full gradient-ice flex items-center justify-center text-[10px] font-bold text-background">
                        {entry.initials}
                      </div>
                      <span className="text-sm font-medium">{entry.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-sm">{entry.wins}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-primary font-semibold">
                    {entry.earnings.toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {entry.streak > 0 ? (
                      <span className="text-pngwin-orange font-mono text-sm font-semibold">🔥 {entry.streak}</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
