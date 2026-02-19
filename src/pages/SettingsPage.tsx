import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const SettingsPage = () => {
  const [username, setUsername] = useState('@cryptoking');
  const [notifications, setNotifications] = useState({
    wins: true,
    burns: true,
    socialEarnings: true,
    tournaments: false,
    marketing: false,
  });

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0">
      <div className="container py-8 max-w-xl">
        <h1 className="font-display text-3xl font-bold mb-6">⚙️ Settings</h1>

        {/* Profile */}
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h2 className="font-display font-bold text-lg mb-4">Profile</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full gradient-ice flex items-center justify-center text-xl font-bold text-background">
              BJ
            </div>
            <button className="px-3 py-1.5 bg-secondary border border-border rounded-md text-xs text-muted-foreground hover:text-foreground">
              Change Avatar
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toast.success('Profile updated!')}
              className="px-6 py-2 gradient-gold text-primary-foreground font-display font-bold text-sm rounded-lg shadow-gold"
            >
              Save Changes
            </motion.button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-display font-bold text-lg mb-4">Notifications</h2>
          <div className="space-y-3">
            {Object.entries(notifications).map(([key, val]) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <button
                  onClick={() => setNotifications(prev => ({ ...prev, [key]: !val }))}
                  className={`w-10 h-5 rounded-full transition-colors relative ${val ? 'bg-primary' : 'bg-border'}`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-background transition-transform ${val ? 'left-5' : 'left-0.5'}`} />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
