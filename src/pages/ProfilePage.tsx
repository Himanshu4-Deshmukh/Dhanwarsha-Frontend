import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  LogOut,
  Mail,
  Shield,
  ChevronRight,
  ShieldCheck,
  Trophy,
  Wallet,
} from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const quickLinks = [
    {
      icon: Trophy,
      label: 'My Bets',
      description: 'View your bet history & results',
      path: '/bets',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
    },
    {
      icon: Wallet,
      label: 'Wallet',
      description: 'Balance, deposits & withdrawals',
      path: '/wallet',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
    },
  ];

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-lg font-bold font-display">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-gradient-card p-5 card-glow"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
            <span className="text-xl font-bold text-primary font-display">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-bold font-display text-base">{user?.name}</h2>
            <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3 w-3" />
              {user?.role}
            </span>
          </div>
        </div>

        {/* Info rows */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm truncate">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2.5">
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm capitalize">{user?.role?.toLowerCase()}</span>
            {user?.role === 'ADMIN' && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
                Admin
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick links — Bets & Wallet */}
      <div className="space-y-2">
        {quickLinks.map(({ icon: Icon, label, description, path, color, bg }, i) => (
          <motion.button
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => navigate(path)}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5 text-left transition-colors hover:bg-secondary/50 active:scale-[0.98]"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          </motion.button>
        ))}
      </div>

      {user?.role === 'ADMIN' && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          onClick={() => navigate('/admin')}
          className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5" />
            Go to Admin Panel
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </motion.button>
      )}

      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20 active:scale-[0.98]"
      >
        <LogOut className="mr-2 inline h-4 w-4" />
        Logout
      </button>
    </div>
  );
};

export default ProfilePage;
