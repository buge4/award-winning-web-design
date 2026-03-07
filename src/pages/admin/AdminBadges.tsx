import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = ['Prediction', 'Winner', 'Sharpshooter', 'Social', 'PvP', 'Streak', 'Ambassador', 'High Roller', 'Special'];
const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
const QUAL_TYPES = ['achievement', 'counter', 'streak', 'social', 'spending', 'manual'];
const SCOPES = ['any_game', 'specific_game', 'jackpot_only', 'auction_only'];

const RARITY_COLORS: Record<string, string> = {
  Common: 'text-muted-foreground bg-muted',
  Uncommon: 'text-pngwin-green bg-pngwin-green/10',
  Rare: 'text-ice bg-ice/10',
  Epic: 'text-pngwin-purple bg-pngwin-purple/10',
  Legendary: 'text-primary bg-primary/10',
};

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  image_url: string | null;
  qualification_type: string;
  qualification_metric: string | null;
  qualification_target: number | null;
  qualification_scope: string;
  reward_pngwin: number;
  reward_free_bids: number;
  reward_free_coupons: number;
  reward_xp: number;
  reward_title: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  earned_count?: number;
}

const emptyBadge: Omit<Badge, 'id' | 'created_at' | 'earned_count'> = {
  name: '', description: '', category: 'Special', rarity: 'Common',
  image_url: null, qualification_type: 'manual', qualification_metric: null,
  qualification_target: null, qualification_scope: 'any_game',
  reward_pngwin: 0, reward_free_bids: 0, reward_free_coupons: 0,
  reward_xp: 0, reward_title: null, is_active: true, sort_order: 0,
};

const AdminBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editModal, setEditModal] = useState<Badge | typeof emptyBadge | null>(null);
  const [saving, setSaving] = useState(false);

  // Award modal
  const [awardModal, setAwardModal] = useState<Badge | null>(null);
  const [awardUsername, setAwardUsername] = useState('');
  const [awarding, setAwarding] = useState(false);

  useEffect(() => { loadBadges(); }, []);

  const loadBadges = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) { toast.error('Failed to load badges'); setLoading(false); return; }

    // Get earned counts
    const { data: counts } = await supabase
      .from('user_badges')
      .select('badge_id');

    const countMap: Record<string, number> = {};
    (counts ?? []).forEach((ub: any) => {
      countMap[ub.badge_id] = (countMap[ub.badge_id] ?? 0) + 1;
    });

    setBadges((data ?? []).map((b: any) => ({ ...b, earned_count: countMap[b.id] ?? 0 })));
    setLoading(false);
  };

  const handleSave = async () => {
    if (!editModal || !('name' in editModal) || !editModal.name) { toast.error('Name is required'); return; }
    setSaving(true);

    const payload = {
      name: editModal.name,
      description: editModal.description,
      category: editModal.category,
      rarity: editModal.rarity,
      image_url: editModal.image_url,
      qualification_type: editModal.qualification_type,
      qualification_metric: editModal.qualification_metric,
      qualification_target: editModal.qualification_target,
      qualification_scope: editModal.qualification_scope,
      reward_pngwin: editModal.reward_pngwin,
      reward_free_bids: editModal.reward_free_bids,
      reward_free_coupons: editModal.reward_free_coupons,
      reward_xp: editModal.reward_xp,
      reward_title: editModal.reward_title,
      is_active: editModal.is_active,
      sort_order: editModal.sort_order,
    };

    if ('id' in editModal && editModal.id) {
      const { error } = await supabase.from('badges').update(payload).eq('id', editModal.id);
      if (error) toast.error(error.message);
      else toast.success('Badge updated!');
    } else {
      const { error } = await supabase.from('badges').insert(payload);
      if (error) toast.error(error.message);
      else toast.success('Badge created!');
    }

    setSaving(false);
    setEditModal(null);
    loadBadges();
  };

  const handleAward = async () => {
    if (!awardModal || !awardUsername) return;
    setAwarding(true);
    const { data: foundUser } = await supabase.from('users').select('id').ilike('username', awardUsername).limit(1).single();
    if (!foundUser) { toast.error('User not found'); setAwarding(false); return; }

    const { error } = await supabase.from('user_badges').insert({
      user_id: foundUser.id,
      badge_id: awardModal.id,
      awarded_by: user?.id,
    });

    if (error) {
      if (error.code === '23505') toast.error('User already has this badge');
      else toast.error(error.message);
    } else {
      toast.success(`Badge awarded to @${awardUsername}!`);
    }
    setAwarding(false);
    setAwardModal(null);
    setAwardUsername('');
    loadBadges();
  };

  const filtered = categoryFilter === 'all' ? badges : badges.filter(b => b.category === categoryFilter);

  if (loading) return <div className="text-center py-10 text-muted-foreground text-sm">Loading badges...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">🏆 Badges ({badges.length})</h1>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => setEditModal({ ...emptyBadge })}
          className="px-4 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold">
          + Create New Badge
        </motion.button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <button onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
            categoryFilter === 'all' ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground'
          }`}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
              categoryFilter === c ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground'
            }`}>{c}</button>
        ))}
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(badge => (
          <div key={badge.id} className="bg-card border border-border rounded-xl p-4 hover:border-border-active transition-all">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-2xl">
                {badge.image_url ? <img src={badge.image_url} alt="" className="w-8 h-8 rounded" /> : '🏅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-bold text-sm">{badge.name}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${RARITY_COLORS[badge.rarity] ?? 'bg-muted text-muted-foreground'}`}>
                    {badge.rarity}
                  </span>
                  <span className="text-[9px] text-muted-foreground">{badge.category}</span>
                  <span className="text-[9px] text-muted-foreground">· {badge.earned_count ?? 0} earned</span>
                </div>
              </div>
            </div>

            {/* Qualification */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1">Qualification</div>
              <div className="text-xs">
                <span className="font-mono text-primary">{badge.qualification_type}</span>
                {badge.qualification_target && (
                  <span className="text-muted-foreground"> · target: {badge.qualification_target}</span>
                )}
                {badge.qualification_metric && (
                  <span className="text-muted-foreground"> · {badge.qualification_metric}</span>
                )}
              </div>
            </div>

            {/* Rewards */}
            {(badge.reward_pngwin > 0 || badge.reward_free_bids > 0 || badge.reward_xp > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {badge.reward_pngwin > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{badge.reward_pngwin} PNGWIN</span>}
                {badge.reward_free_bids > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-ice/10 text-ice font-mono">{badge.reward_free_bids} free bids</span>}
                {badge.reward_xp > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-pngwin-purple/10 text-pngwin-purple font-mono">{badge.reward_xp} XP</span>}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button onClick={() => setEditModal(badge)} className="text-[10px] text-ice hover:underline">✏️ Edit</button>
              <button onClick={() => setAwardModal(badge)} className="text-[10px] text-pngwin-green hover:underline">🎁 Award</button>
              {!badge.is_active && <span className="text-[10px] text-pngwin-red">⚠️ Inactive</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground text-sm">No badges found.</div>
        )}
      </div>

      {/* Edit/Create Modal */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setEditModal(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border-active rounded-2xl p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e: any) => e.stopPropagation()}>
              <h3 className="font-display font-bold text-lg mb-4">
                {'id' in editModal ? '✏️ Edit Badge' : '🏅 Create Badge'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                  <input value={editModal.name} onChange={e => setEditModal({ ...editModal, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                  <textarea value={editModal.description} onChange={e => setEditModal({ ...editModal, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Category</label>
                    <select value={editModal.category} onChange={e => setEditModal({ ...editModal, category: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rarity</label>
                    <select value={editModal.rarity} onChange={e => setEditModal({ ...editModal, rarity: e.target.value })}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
                      {RARITIES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                {/* Qualification */}
                <div className="border-t border-border pt-4">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-semibold">Qualification</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Type</label>
                      <select value={editModal.qualification_type} onChange={e => setEditModal({ ...editModal, qualification_type: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
                        {QUAL_TYPES.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Scope</label>
                      <select value={editModal.qualification_scope} onChange={e => setEditModal({ ...editModal, qualification_scope: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary">
                        {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Metric</label>
                      <input value={editModal.qualification_metric ?? ''} onChange={e => setEditModal({ ...editModal, qualification_metric: e.target.value || null })}
                        placeholder="e.g. total_wins"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Target Value</label>
                      <input type="number" value={editModal.qualification_target ?? ''} onChange={e => setEditModal({ ...editModal, qualification_target: e.target.value ? Number(e.target.value) : null })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                <div className="border-t border-border pt-4">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-semibold">Rewards</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">PNGWIN Bonus</label>
                      <input type="number" value={editModal.reward_pngwin} onChange={e => setEditModal({ ...editModal, reward_pngwin: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Free Bids</label>
                      <input type="number" value={editModal.reward_free_bids} onChange={e => setEditModal({ ...editModal, reward_free_bids: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">XP Points</label>
                      <input type="number" value={editModal.reward_xp} onChange={e => setEditModal({ ...editModal, reward_xp: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs font-mono focus:outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground mb-1 block">Title/Flair</label>
                      <input value={editModal.reward_title ?? ''} onChange={e => setEditModal({ ...editModal, reward_title: e.target.value || null })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>

                {/* Active + Sort */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={editModal.is_active} onChange={e => setEditModal({ ...editModal, is_active: e.target.checked })}
                      className="accent-primary" />
                    <span className="text-xs">Active</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    <input type="number" value={editModal.sort_order} onChange={e => setEditModal({ ...editModal, sort_order: Number(e.target.value) })}
                      className="w-16 px-2 py-1 bg-background border border-border rounded text-xs font-mono focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setEditModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSave} disabled={saving}
                    className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60">
                    {saving ? 'Saving...' : 'Save Badge'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Award Modal */}
      <AnimatePresence>
        {awardModal && (
          <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setAwardModal(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border-active rounded-2xl p-6 max-w-sm w-full" onClick={(e: any) => e.stopPropagation()}>
              <h3 className="font-display font-bold text-lg mb-4">🎁 Award "{awardModal.name}"</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Username</label>
                  <input value={awardUsername} onChange={e => setAwardUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setAwardModal(null)} className="flex-1 py-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg">Cancel</button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleAward} disabled={awarding || !awardUsername}
                    className="flex-1 py-2 gradient-gold text-primary-foreground font-display font-bold text-xs rounded-lg shadow-gold disabled:opacity-60">
                    {awarding ? 'Awarding...' : 'Award Badge'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBadges;
