import { SearchX } from 'lucide-react';
import { motion } from 'framer-motion';
import { UserRow } from './UserRow';
import type { AdminUser } from './types';

type UserTableProps = {
  users: AdminUser[];
  loading: boolean;
  page: number;
  totalPages: number;
  onSelectUser: (user: AdminUser) => void;
  onCreditUser: (user: AdminUser) => void;
  onPageChange: (page: number) => void;
};

function UserTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
      <div className="grid grid-cols-[2fr_repeat(3,1fr)_auto] gap-4 border-b border-white/8 px-5 py-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-4 animate-pulse rounded bg-white/8" />
        ))}
      </div>
      <div className="space-y-3 p-5">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

export function UserTable({
  users,
  loading,
  page,
  totalPages,
  onSelectUser,
  onCreditUser,
  onPageChange,
}: UserTableProps) {
  if (loading) {
    return <UserTableSkeleton />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] shadow-[0_20px_45px_rgba(0,0,0,0.25)]">
      <div className="hidden border-b border-white/8 bg-white/[0.03] md:block">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/35">User</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Role</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Status</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Joined</th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-16 text-center">
                  <SearchX className="mx-auto h-8 w-8 text-white/20" />
                  <p className="mt-3 text-sm text-white/40">No users match the current filters.</p>
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <UserRow
                  key={user._id}
                  user={user}
                  index={index}
                  onSelect={onSelectUser}
                  onCredit={onCreditUser}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-4 md:hidden">
        {users.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-10 text-center">
            <SearchX className="mx-auto h-8 w-8 text-white/20" />
            <p className="mt-3 text-sm text-white/40">No users match the current filters.</p>
          </div>
        ) : (
          users.map((user, index) => {
            const initials = user.name
              ?.split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <motion.button
                key={user._id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => onSelectUser(user)}
                className="w-full rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary via-amber-300 to-yellow-500 text-sm font-bold text-[hsl(220,20%,7%)]">
                      {initials || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="truncate text-xs text-white/35">{user.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'}`}>
                    {user.role}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                    <p className="text-white/30">Status</p>
                    <p className={`mt-1 font-medium ${user.isActive ? 'text-green-300' : 'text-red-300'}`}>
                      {user.isActive ? 'Active' : 'Blocked'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] px-3 py-2">
                    <p className="text-white/30">Joined</p>
                    <p className="mt-1 font-medium text-white/70">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.button>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-white/8 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-white/40">
            Page {page} of {totalPages}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => {
              const nextPage = index + 1;
              return (
                <button
                  key={nextPage}
                  type="button"
                  onClick={() => onPageChange(nextPage)}
                  className={`h-9 min-w-9 rounded-xl px-3 text-xs font-semibold transition-colors ${
                    nextPage === page
                      ? 'bg-gradient-gold text-[hsl(220,20%,7%)]'
                      : 'border border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {nextPage}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
