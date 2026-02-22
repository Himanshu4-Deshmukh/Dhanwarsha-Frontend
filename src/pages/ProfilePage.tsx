import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';
import { User, LogOut, Mail, Shield } from 'lucide-react';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-lg font-bold font-display">Profile</h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-gradient-card p-6 card-glow"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-center text-lg font-bold font-display">{user?.name}</h2>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-secondary p-3">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{user?.role}</span>
          </div>
        </div>
      </motion.div>

      <button
        onClick={logout}
        className="w-full rounded-xl border border-destructive/30 bg-destructive/10 py-3 text-sm font-semibold text-destructive transition-all hover:bg-destructive/20"
      >
        <LogOut className="mr-2 inline h-4 w-4" />
        Logout
      </button>
    </div>
  );
};

export default ProfilePage;
