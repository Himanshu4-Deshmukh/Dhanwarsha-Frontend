import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, LogOut, Mail, Shield, ChevronRight, ShieldCheck } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-lg font-bold font-display">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-gradient-card p-6 card-glow"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mx-auto ring-2 ring-primary/20">
          <span className="text-2xl font-bold text-primary font-display">
            {user?.name?.charAt(0).toUpperCase()}
          </span>
        </div>
        <h2 className="text-center text-lg font-bold font-display">{user?.name}</h2>
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user?.role}</span>
            {user?.role === 'ADMIN' && (
              <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">Admin</span>
            )}
          </div>
        </div>
      </motion.div>

      {user?.role === 'ADMIN' && (
        <button
          onClick={() => navigate('/admin')}
          className="flex w-full items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4" />
            Go to Admin Panel
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </button>
      )}

      <button
        onClick={handleLogout}
        className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20"
      >
        <LogOut className="mr-2 inline h-4 w-4" />
        Logout
      </button>
    </div>
  );
};

export default ProfilePage;
