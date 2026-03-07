import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const NOTIF_TYPES = ['announcement', 'special_offer', 'game_update', 'maintenance', 'promotion', 'welcome'];
const TARGET_MODES = ['all', 'active', 'specific_user'] as const;

interface SentNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  link: string | null;
  created_at: string;
  metadata: any;
}

const AdminNotifications = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'send' | 'history'>('send');

  // Send form
  const [targetMode, setTargetMode] = useState<typeof TARGET_MODES[number]>('all');
  const [targetUser, setTargetUser] = useState('');
  const [notifType, setNotifType] = useState('announcement');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [sending, setSending] = useState(false);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  // History
  const [history, setHistory] = useState<SentNotification[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => { loadRecipientCount(); }, [targetMode, targetUser]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab]);

  const loadRecipientCount = async () => {
    if (targetMode === 'specific_user') {
      if (!targetUser) { setRecipientCount(0); return; }
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true })
        .ilike('username', `%${targetUser}%`);
      setRecipientCount(count ?? 0);
    } else if (targetMode === 'active') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true })
        .gte('last_active_at', sevenDaysAgo);
      setRecipientCount(count ?? 0);
    } else {
      const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
      setRecipientCount(count ?? 0);
    }
  };

  const handleSend = async () => {
    if (!title || !body) { toast.error('Title and body are required'); return; }
    setSending(true);

    try {
      let userIds: string[] = [];

      if (targetMode === 'specific_user') {
        const { data } = await supabase.from('users').select('id').ilike('username', `%${targetUser}%`);
        userIds = (data ?? []).map((u: any) => u.id);
      } else if (targetMode === 'active') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data } = await supabase.from('users').select('id').gte('last_active_at', sevenDaysAgo);
        userIds = (data ?? []).map((u: any) => u.id);
      } else {
        const { data } = await supabase.from('users').select('id');
        userIds = (data ?? []).map((u: any) => u.id);
      }

      if (userIds.length === 0) { toast.error('No recipients found'); setSending(false); return; }

      const campaignId = crypto.randomUUID();
      const notifications = userIds.map(uid => ({
        user_id: uid,
        type: notifType,
        title,
        body,
        link: link || null,
        read: false,
        metadata: { sent_by: user?.id, campaign_id: campaignId, target_mode: targetMode },
      }));

      // Insert in batches of 500
      for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        const { error } = await supabase.from('notifications').insert(batch);
        if (error) throw error;
      }

      toast.success(`Sent to ${userIds.length} users!`);
      setTitle(''); setBody(''); setLink('');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send');
    }
    setSending(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    // Get unique campaigns from recent notifications
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, type, link, created_at, metadata')
      .not('metadata->campaign_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100);

    // Deduplicate by campaign_id
    const seen = new Set<string>();
    const unique: SentNotification[] = [];
    (data ?? []).forEach((n: any) => {
      const cid = n.metadata?.campaign_id;
      if (cid && !seen.has(cid)) {
        seen.add(cid);
        unique.push(n);
      }
    });
    setHistory(unique);
    setHistoryLoading(false);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">🔔 Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['send', 'history'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
              tab === t ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground'
            }`}>
            {t === 'send' ? '📢 Send Notification' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'send' ? (
        <div className="max-w-2xl">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            {/* Target */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-semibold">Target</label>
              <div className="space-y-2">
                {[
                  { value: 'all' as const, label: 'All users', icon: '👥' },
                  { value: 'active' as const, label: 'Active users (last 7 days)', icon: '⚡' },
                  { value: 'specific_user' as const, label: 'Specific user', icon: '👤' },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="target" checked={targetMode === opt.value}
                      onChange={() => setTargetMode(opt.value)}
                      className="accent-primary" />
                    <span className="text-sm">{opt.icon} {opt.label}</span>
                  </label>
                ))}
              </div>
              {targetMode === 'specific_user' && (
                <input value={targetUser} onChange={e => setTargetUser(e.target.value)}
                  placeholder="Enter username..."
                  className="mt-2 w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
              )}
              {recipientCount !== null && (
                <div className="text-[10px] text-muted-foreground mt-1">~{recipientCount} recipients</div>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-semibold">Type</label>
              <div className="flex flex-wrap gap-1.5">
                {NOTIF_TYPES.map(t => (
                  <button key={t} onClick={() => setNotifType(t)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      notifType === t ? 'bg-primary/10 text-primary border-primary/30' : 'border-border text-muted-foreground'
                    }`}>
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block font-semibold">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Notification title..."
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>

            {/* Body */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block font-semibold">Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)}
                placeholder="Write your notification message..."
                rows={4}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none" />
            </div>

            {/* Link */}
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block font-semibold">Link (optional)</label>
              <input value={link} onChange={e => setLink(e.target.value)}
                placeholder="/auctions/weekly-jackpot"
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary" />
            </div>

            {/* Preview */}
            {title && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block font-semibold">Preview</label>
                <div className="bg-background border border-border-active rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">🔔</span>
                    <div>
                      <div className="font-display font-bold text-sm">{title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{body}</div>
                      {link && <div className="text-[10px] text-primary mt-1">→ {link}</div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Send */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              disabled={sending || !title || !body}
              className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60"
            >
              {sending ? 'Sending...' : `Send to ~${recipientCount ?? 0} users`}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Time', 'Type', 'Title', 'Body', 'Link', 'Target'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] text-muted-foreground uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(n => (
                  <tr key={n.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary">
                        {n.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{n.title}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{n.body}</td>
                    <td className="px-4 py-3 text-xs text-primary font-mono">{n.link ?? '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{n.metadata?.target_mode ?? '—'}</td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">
                    {historyLoading ? 'Loading...' : 'No notifications sent yet.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
