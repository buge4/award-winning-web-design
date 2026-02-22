import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/admin/auctions', label: 'Auctions', icon: '📋' },
  { path: '/admin/auctions/create', label: 'Create Auction', icon: '➕' },
  { path: '/admin/users', label: 'Users', icon: '👥' },
  { path: '/admin/finance', label: 'Finance', icon: '💰' },
  { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

const AdminLayout = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setChecking(false); setIsAdmin(false); return; }
    setChecking(true);
    supabase.rpc('get_my_role').then(({ data, error }) => {
      setIsAdmin(!!data && ['admin', 'super_admin'].includes(data));
      setChecking(false);
    });
  }, [user, authLoading]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    if (error) { setLoginError(error.message); setLoginLoading(false); }
    else setLoginLoading(false);
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-card/80 backdrop-blur-xl border border-border-active rounded-2xl p-8">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🛡️</div>
            <div className="font-display font-bold text-xl">Admin Login</div>
            <div className="text-xs text-muted-foreground mt-1">Sign in with an admin account</div>
          </div>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Email</label>
              <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Password</label>
              <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••" />
            </div>
            {loginError && <div className="text-xs text-destructive">{loginError}</div>}
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 gradient-gold text-primary-foreground font-display font-bold text-sm tracking-wider rounded-lg shadow-gold disabled:opacity-60">
              {loginLoading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen pt-16 pb-20 md:pb-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔒</div>
          <div className="text-muted-foreground text-sm">Access denied. You do not have admin privileges.</div>
          <button onClick={() => navigate('/')} className="mt-4 text-xs text-primary hover:underline">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 pb-20 md:pb-0 flex">
      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-card/50 transition-all ${sidebarCollapsed ? 'w-16' : 'w-56'}`}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          {!sidebarCollapsed && <span className="font-display font-bold text-sm">🛡️ Admin</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-muted-foreground hover:text-foreground text-xs">
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>
        <nav className="flex-1 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path) && item.path !== '/admin';
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'text-primary bg-gold-subtle border-r-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border">
        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          {NAV_ITEMS.map(item => {
            const isActive = item.exact 
              ? location.pathname === item.path 
              : location.pathname.startsWith(item.path) && item.path !== '/admin';
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all border ${
                  isActive ? 'text-primary bg-gold-subtle border-gold' : 'text-muted-foreground bg-transparent border-transparent'
                }`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto md:mt-0 mt-12">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
