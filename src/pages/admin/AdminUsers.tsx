import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, ShieldAlert, Users as UsersIcon, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { UserDetailsModal } from '@/components/admin/users/UserDetailsModal';
import { UserTable } from '@/components/admin/users/UserTable';
import type {
  AdminPaymentRequest,
  AdminTransaction,
  AdminUser,
  SelectedUserDetails,
  UserAnalytics,
  UserModalTab,
  UserRoleFilter,
  UserStatusFilter,
} from '@/components/admin/users/types';

const USERS_PER_PAGE = 8;

type FilterSelectOption<T extends string> = {
  label: string;
  value: T;
};

type FilterSelectProps<T extends string> = {
  label: string;
  value: T;
  options: FilterSelectOption<T>[];
  onChange: Dispatch<SetStateAction<T>> | ((value: T) => void);
};

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selected = options.find((option) => option.value === value) || options[0];

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm text-white transition-all ${
            open
              ? 'border-primary/70 bg-[hsl(220,18%,14%)] shadow-[0_0_0_1px_rgba(245,166,35,0.35)]'
              : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
          }`}
        >
          <span>{selected.label}</span>
          <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,18%,12%)] p-2 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
            {options.map((option) => {
              const active = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    active
                      ? 'bg-primary/15 text-primary'
                      : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span>{option.label}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const getRelatedUserId = (record: { userId?: string; user?: { _id?: string; id?: string } | string }) => {
  if (record.userId) return record.userId;
  if (typeof record.user === 'string') return record.user;
  return record.user?._id || record.user?.id || '';
};

const roleOptions: FilterSelectOption<UserRoleFilter>[] = [
  { label: 'All Roles', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

const statusOptions: FilterSelectOption<UserStatusFilter>[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Blocked', value: 'BLOCKED' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<AdminPaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalTab, setModalTab] = useState<UserModalTab>('overview');
  const [creditAmount, setCreditAmount] = useState('');
  const [crediting, setCrediting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [nextUsers, nextTransactions, nextPayments] = await Promise.all([
        api.admin.getAllUsers(),
        api.admin.getAllTransactions(),
        api.admin.getAllPaymentRequests(),
      ]);

      setUsers(nextUsers);
      setTransactions(nextTransactions);
      setPaymentRequests(nextPayments);
    } catch {
      toast.error('Failed to load admin user data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const analytics = useMemo<UserAnalytics>(() => {
    const totalCreditsDistributed = transactions.reduce((sum, transaction) => {
      const isAdminCredit = transaction.type?.toUpperCase().includes('CREDIT');
      if (isAdminCredit && transaction.amount > 0) {
        return sum + transaction.amount;
      }
      return sum;
    }, 0);

    return {
      totalUsers: users.length,
      activeUsers: users.filter((user) => user.isActive).length,
      blockedUsers: users.filter((user) => !user.isActive).length,
      totalCreditsDistributed,
    };
  }, [transactions, users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' ? user.isActive : !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, search, statusFilter, users]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, filteredUsers.length]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  const selectedUser = useMemo(
    () => users.find((user) => user._id === selectedUserId) || null,
    [selectedUserId, users],
  );

  const selectedUserTransactions = useMemo(() => {
    if (!selectedUserId) return [];
    return transactions
      .filter((transaction) => getRelatedUserId(transaction) === selectedUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedUserId, transactions]);

  const selectedUserPayments = useMemo(() => {
    if (!selectedUserId) return [];
    return paymentRequests
      .filter((payment) => getRelatedUserId(payment) === selectedUserId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [paymentRequests, selectedUserId]);

  const selectedUserDetails = useMemo<SelectedUserDetails | null>(() => {
    if (!selectedUser) return null;

    const totalCredits = selectedUserTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
    const lastLoginLabel = selectedUser.lastLogin
      ? new Date(selectedUser.lastLogin).toLocaleString()
      : selectedUser.updatedAt
        ? new Date(selectedUser.updatedAt).toLocaleString()
        : 'Not available';

    return {
      totalCredits,
      totalTransactions: selectedUserTransactions.length,
      totalPaymentRequests: selectedUserPayments.length,
      lastLoginLabel,
    };
  }, [selectedUser, selectedUserPayments.length, selectedUserTransactions]);

  const openUserModal = (user: AdminUser) => {
    setSelectedUserId(user._id);
    setModalTab('overview');
    setCreditAmount('');
  };

  const handleCreditUser = async () => {
    if (!selectedUser) return;
    const amount = parseInt(creditAmount, 10);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setCrediting(true);
    try {
      await api.admin.creditWallet(selectedUser._id, amount);
      toast.success(`Credited ${amount} coins to ${selectedUser.name}`);
      setCreditAmount('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to credit wallet');
    } finally {
      setCrediting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-white/40">Monitor accounts, wallet activity, and payment request trends.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Total Users',
            value: analytics.totalUsers,
            icon: UsersIcon,
            color: 'text-white',
            bg: 'bg-white/[0.03]',
          },
          {
            label: 'Active Users',
            value: analytics.activeUsers,
            icon: UsersIcon,
            color: 'text-green-300',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Blocked Users',
            value: analytics.blockedUsers,
            icon: ShieldAlert,
            color: 'text-red-300',
            bg: 'bg-red-500/10',
          },
          {
            label: 'Credits Distributed',
            value: analytics.totalCreditsDistributed,
            icon: Wallet,
            color: 'text-primary',
            bg: 'bg-primary/10',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">{card.label}</p>
                <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.25)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">Search Users</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <FilterSelect label="Role Filter" value={roleFilter} options={roleOptions} onChange={setRoleFilter} />

          <FilterSelect label="Status Filter" value={statusFilter} options={statusOptions} onChange={setStatusFilter} />
        </div>
      </div>

      <UserTable
        users={paginatedUsers}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onSelectUser={openUserModal}
        onCreditUser={openUserModal}
        onPageChange={setPage}
      />

      <UserDetailsModal
        open={Boolean(selectedUser)}
        user={selectedUser}
        details={selectedUserDetails}
        transactions={selectedUserTransactions}
        paymentRequests={selectedUserPayments}
        activeTab={modalTab}
        creditAmount={creditAmount}
        crediting={crediting}
        onClose={() => {
          setSelectedUserId(null);
          setCreditAmount('');
        }}
        onTabChange={setModalTab}
        onCreditAmountChange={setCreditAmount}
        onAddCredits={handleCreditUser}
      />
    </div>
  );
}
