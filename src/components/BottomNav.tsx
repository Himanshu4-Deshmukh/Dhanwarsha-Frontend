import { NavLink, useLocation } from 'react-router-dom';
import { Home, Wallet, Trophy, User } from 'lucide-react';

const tabs = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
  { path: '/bets', icon: Trophy, label: 'Bets' },
  { path: '/profile', icon: User, label: 'Profile' },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-bottom">
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-1 flex-col items-center gap-0.5 py-2.5"
            >
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
