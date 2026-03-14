import { Coins } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AdminUser } from './types';

type UserRowProps = {
  user: AdminUser;
  index: number;
  onSelect: (user: AdminUser) => void;
  onCredit: (user: AdminUser) => void;
};

const roleStyles: Record<string, string> = {
  ADMIN: 'bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/20',
  USER: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20',
};

export function UserRow({ user, index, onSelect, onCredit }: UserRowProps) {
  const initials = user.name
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group cursor-pointer border-b border-white/5 transition-colors hover:bg-white/[0.04]"
      onClick={() => onSelect(user)}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary via-amber-300 to-yellow-500 text-sm font-bold text-[hsl(220,20%,7%)] shadow-[0_8px_24px_rgba(245,166,35,0.25)]">
            {initials || 'U'}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-xs text-white/35">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${roleStyles[user.role] || roleStyles.USER}`}>
          {user.role}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-2.5 py-1">
          <span className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={`text-xs font-medium ${user.isActive ? 'text-green-300' : 'text-red-300'}`}>
            {user.isActive ? 'Active' : 'Blocked'}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-xs text-white/45">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-5 py-4 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCredit(user);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 transition-all hover:bg-green-500/20 hover:text-green-200"
        >
          <Coins className="h-3.5 w-3.5" />
          Credit
        </button>
      </td>
    </motion.tr>
  );
}
