import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, Trophy, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { motion } from 'framer-motion';

const baseTabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/bets', icon: Trophy, label: 'Bets' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const tabs = user?.role === 'ADMIN'
    ? [...baseTabs, { path: '/admin', icon: ShieldCheck, label: 'Admin' }]
    : baseTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[hsl(220,18%,8%)]/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);

          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5 relative"
            >
              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
              <Icon className={`h-5 w-5 transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
