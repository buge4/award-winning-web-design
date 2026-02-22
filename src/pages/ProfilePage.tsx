import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import KpiCard from '@/components/KpiCard';
import { useProfile, useUserBadges, useWeeklyActivity } from '@/hooks/useAuctions';
import { useAuth } from '@/context/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { badges, loading: badgesLoading } = useUserBadges();
  const { activity, loading: activityLoading } = useWeeklyActivity();

  if (!user) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐧</div>
          <p className="text-muted-foreground text-sm mb-4">Sign in to view your profile.</p>
          <Link to="/signin" className="text-primary text-sm hover:underline">Sign In →</Link>
        </div>
      </div>
    );
  }

  const initials = profile?.username ? profile.username.slice(0, 2).toUpperCase() : '??';
  const earnedBadges = Array.isArray(badges) ? badges.filter((b: any) => b.earned) : [];
  const totalXP = Array.isArray(badges) ? badges.reduce((a: number, b: any) => a + (b.xp ?? 0), 0) : 0;

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-3xl">
        <h1 className="font-display text-3xl font-bold mb-6">👤 My Profile</h1>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-8 mb-6"
        >
          {profileLoading ? (
            <div className="text-muted-foreground text-sm">Loading profile...</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-20 h-20 rounded-full gradient-ice flex items-center justify-center text-2xl font-bold text-background">
                {initials}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="font-display font-bold text-xl">@{profile?.username || 'unknown'}</div>
                <div className="text-sm text-muted-foreground">{profile?.email}</div>
                <div className="flex gap-3 mt-2 justify-center sm:justify-start">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-gold-subtle text-primary border border-gold">
                    {profile?.role}
                  </span>
                  {profile?.referral_code && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono text-muted-foreground border border-border">
                      ref: {profile.referral_code}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-muted-foreground mt-2">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}
                </div>
              </div>
              <Link
                to="/settings"
                className="px-4 py-2 bg-secondary border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground font-display font-semibold transition-colors"
              >
                Edit Profile →
              </Link>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <KpiCard label="Total XP" value={totalXP.toLocaleString()} color="ice" />
          <KpiCard label="Badges Earned" value={earnedBadges.length} color="gold" />
          <KpiCard label="Weekly Bids" value={activity?.bids_this_week ?? '—'} color="green" />
          <KpiCard label="Weekly Wins" value={activity?.wins_this_week ?? '—'} color="purple" />
        </div>

        {/* Badges Preview */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">🏆 Badges</h2>
            <Link to="/badges" className="text-xs text-ice hover:text-ice/80 font-semibold">View All →</Link>
          </div>
          {badgesLoading ? (
            <div className="text-muted-foreground text-sm">Loading badges...</div>
          ) : earnedBadges.length === 0 ? (
            <div className="text-muted-foreground text-sm">No badges earned yet. Start bidding!</div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {earnedBadges.slice(0, 8).map((b: any, i: number) => (
                <div key={i} className="w-14 h-14 rounded-xl bg-gold-subtle border border-gold/30 flex items-center justify-center text-2xl" title={b.name}>
                  {b.icon ?? '🏅'}
                </div>
              ))}
              {earnedBadges.length > 8 && (
                <div className="w-14 h-14 rounded-xl bg-secondary border border-border flex items-center justify-center text-xs text-muted-foreground font-bold">
                  +{earnedBadges.length - 8}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg mb-4">📊 Weekly Activity</h2>
          {activityLoading ? (
            <div className="text-muted-foreground text-sm">Loading activity...</div>
          ) : activity ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Bids Placed', value: activity.bids_this_week ?? 0, color: 'text-ice' },
                { label: 'Auctions Entered', value: activity.auctions_entered ?? 0, color: 'text-primary' },
                { label: 'Wins', value: activity.wins_this_week ?? 0, color: 'text-pngwin-green' },
                { label: 'PNGWIN Earned', value: activity.earned_this_week ?? 0, color: 'text-primary' },
              ].map((s, i) => (
                <div key={i} className="bg-background rounded-lg p-4 text-center">
                  <div className={`font-mono text-2xl font-bold ${s.color}`}>{typeof s.value === 'number' ? s.value.toLocaleString() : s.value}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No activity data yet.</div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { label: '💎 Wallet', to: '/wallet' },
            { label: '🐧 Social Circle', to: '/social' },
            { label: '🏆 Leaderboard', to: '/leaderboard' },
            { label: '⚙️ Settings', to: '/settings' },
          ].map(l => (
            <Link key={l.to} to={l.to} className="bg-card border border-border rounded-lg p-4 text-center text-sm font-display font-semibold hover:border-border-active hover:bg-card-hover transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
