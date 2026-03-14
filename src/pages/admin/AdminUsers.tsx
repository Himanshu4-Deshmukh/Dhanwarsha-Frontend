import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  Search,
  ShieldAlert,
  Users as UsersIcon,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { UserDetailsModal } from "@/components/admin/users/UserDetailsModal";
import { UserTable } from "@/components/admin/users/UserTable";
import type {
  AdminUser,
  AdminUserProfile,
  AdminUsersListResponse,
  SelectedUserDetails,
  UserAnalytics,
  UserModalTab,
  UserRole,
  UserRoleFilter,
  UserStatusFilter,
} from "@/components/admin/users/types";

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

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const selected =
    options.find((option) => option.value === value) || options[0];

  return (
    <div ref={wrapperRef} className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm text-white transition-all ${
            open
              ? "border-primary/70 bg-[hsl(220,18%,14%)] shadow-[0_0_0_1px_rgba(245,166,35,0.35)]"
              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
          }`}
        >
          <span>{selected.label}</span>
          <ChevronDown
            className={`h-4 w-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
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
                      ? "bg-primary/15 text-primary"
                      : "text-white/70 hover:bg-white/[0.05] hover:text-white"
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

const roleOptions: FilterSelectOption<UserRoleFilter>[] = [
  { label: "All Roles", value: "ALL" },
  { label: "Admin", value: "ADMIN" },
  { label: "User", value: "USER" },
];

const statusOptions: FilterSelectOption<UserStatusFilter>[] = [
  { label: "All Statuses", value: "ALL" },
  { label: "Active", value: "ACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
];

const emptyUsersMeta: AdminUsersListResponse["meta"] = {
  page: 1,
  limit: USERS_PER_PAGE,
  total: 0,
  totalPages: 1,
};

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersMeta, setUsersMeta] =
    useState<AdminUsersListResponse["meta"]>(emptyUsersMeta);
  const [analytics, setAnalytics] = useState<UserAnalytics>({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalCreditsDistributed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<AdminUserProfile | null>(null);
  const [modalTab, setModalTab] = useState<UserModalTab>("overview");
  const [creditAmount, setCreditAmount] = useState("");
  const [roleDraft, setRoleDraft] = useState<UserRole>("USER");
  const [loadingAction, setLoadingAction] = useState<
    "block" | "role" | "credit" | "deduct" | "delete" | null
  >(null);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, roleFilter, statusFilter]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [allUsers, transactions] = await Promise.all([
        api.admin.getAllUsers(),
        api.admin.getAllTransactions(),
      ]);

      // Apply filters
      let filteredUsers = allUsers.filter((user: any) => {
        const matchesSearch =
          !deferredSearch ||
          user.name?.toLowerCase().includes(deferredSearch.toLowerCase()) ||
          user.email?.toLowerCase().includes(deferredSearch.toLowerCase());
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus =
          statusFilter === "ALL" || user.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      });

      // Pagination
      const total = filteredUsers.length;
      const totalPages = Math.ceil(total / USERS_PER_PAGE);
      const startIndex = (page - 1) * USERS_PER_PAGE;
      const paginatedUsers = filteredUsers.slice(
        startIndex,
        startIndex + USERS_PER_PAGE,
      );

      setUsers(paginatedUsers);
      setUsersMeta({
        page,
        limit: USERS_PER_PAGE,
        total,
        totalPages,
      });
      setAnalytics({
        totalUsers: allUsers.length,
        activeUsers: allUsers.filter((u: any) => u.status === "ACTIVE").length,
        blockedUsers: allUsers.filter((u: any) => u.status === "BLOCKED")
          .length,
        totalCreditsDistributed: transactions.reduce(
          (sum: number, transaction: { type?: string; amount: number }) => {
            const isAdminCredit = transaction.type
              ?.toUpperCase()
              .includes("CREDIT");
            return isAdminCredit && transaction.amount > 0
              ? sum + transaction.amount
              : sum;
          },
          0,
        ),
      });
    } catch {
      toast.error("Failed to load admin user data");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, page, roleFilter, statusFilter]);

  const refreshSelectedUser = useCallback(async (userId: string) => {
    const profile = await api.admin.getUserById(userId);
    setSelectedUserProfile(profile);
    setRoleDraft(profile.role);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedUser = selectedUserProfile;

  const selectedUserTransactions = selectedUserProfile?.transactions ?? [];
  const selectedUserPayments = selectedUserProfile?.paymentRequests ?? [];

  const selectedUserDetails = useMemo<SelectedUserDetails | null>(() => {
    if (!selectedUserProfile) return null;

    const lastLoginLabel = selectedUserProfile.lastLogin
      ? new Date(selectedUserProfile.lastLogin).toLocaleString()
      : selectedUserProfile.updatedAt
        ? new Date(selectedUserProfile.updatedAt).toLocaleString()
        : "Not available";

    return {
      totalCredits: selectedUserProfile.credits ?? 0,
      totalTransactions: selectedUserTransactions.length,
      totalPaymentRequests: selectedUserPayments.length,
      lastLoginLabel,
    };
  }, [
    selectedUserPayments.length,
    selectedUserProfile,
    selectedUserTransactions.length,
  ]);

  const openUserModal = async (user: AdminUser) => {
    setSelectedUserId(user._id);
    setSelectedUserProfile(null);
    setModalTab("overview");
    setCreditAmount("");
    setRoleDraft(user.role);

    try {
      await refreshSelectedUser(user._id);
    } catch (err: any) {
      toast.error(err.message || "Failed to load user details");
      setSelectedUserId(null);
    }
  };

  const handleCreditUser = async () => {
    if (!selectedUserId || !selectedUser) return;
    const amount = parseInt(creditAmount, 10);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoadingAction("credit");
    try {
      await api.admin.creditWallet(selectedUserId, amount);
      toast.success(`Credited ${amount} coins to ${selectedUser.name}`);
      setCreditAmount("");
      await Promise.all([loadData(), refreshSelectedUser(selectedUserId)]);
    } catch (err: any) {
      toast.error(err.message || "Failed to credit wallet");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeductCredits = async () => {
    if (!selectedUserId || !selectedUser) return;
    const amount = parseInt(creditAmount, 10);

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setLoadingAction("deduct");
    try {
      await api.admin.deductWallet(selectedUserId, amount);
      toast.success(`Deducted ${amount} coins from ${selectedUser.name}`);
      setCreditAmount("");
      await Promise.all([loadData(), refreshSelectedUser(selectedUserId)]);
    } catch (err: any) {
      toast.error(err.message || "Failed to deduct wallet");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleToggleBlock = async () => {
    if (!selectedUserId || !selectedUser) return;

    setLoadingAction("block");
    try {
      await api.admin.updateUserStatus(selectedUserId, !selectedUser.isActive);
      toast.success(
        `${selectedUser.name} has been ${selectedUser.isActive ? "blocked" : "unblocked"}`,
      );
      await Promise.all([loadData(), refreshSelectedUser(selectedUserId)]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user status");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedUserId || !selectedUser) return;

    if (roleDraft === selectedUser.role) {
      toast.error("Select a different role");
      return;
    }

    setLoadingAction("role");
    try {
      await api.admin.updateUserRole(selectedUserId, roleDraft);
      toast.success(`${selectedUser.name} is now ${roleDraft}`);
      await Promise.all([loadData(), refreshSelectedUser(selectedUserId)]);
    } catch (err: any) {
      toast.error(err.message || "Failed to update user role");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedUserId || !selectedUser) return;

    const confirmed = window.confirm(
      `Delete ${selectedUser.name}'s account? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setLoadingAction("delete");
    try {
      await api.admin.deleteUser(selectedUserId);
      toast.success(`${selectedUser.name}'s account was deleted`);
      setSelectedUserId(null);
      setSelectedUserProfile(null);
      setCreditAmount("");
      await loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user account");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-2xl font-bold text-white">Users</h1>
        <p className="text-sm text-white/40">
          Monitor accounts, wallet activity, and payment request trends.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: analytics.totalUsers,
            icon: UsersIcon,
            color: "text-white",
            bg: "bg-white/[0.03]",
          },
          {
            label: "Active Users",
            value: analytics.activeUsers,
            icon: UsersIcon,
            color: "text-green-300",
            bg: "bg-green-500/10",
          },
          {
            label: "Blocked Users",
            value: analytics.blockedUsers,
            icon: ShieldAlert,
            color: "text-red-300",
            bg: "bg-red-500/10",
          },
          {
            label: "Credits Distributed",
            value: analytics.totalCreditsDistributed,
            icon: Wallet,
            color: "text-primary",
            bg: "bg-primary/10",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] p-5 shadow-[0_20px_45px_rgba(0,0,0,0.25)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                  {card.label}
                </p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {card.value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.bg}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/8 bg-[hsl(220,18%,10%)] p-4 shadow-[0_20px_45px_rgba(0,0,0,0.25)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
              Search Users
            </label>
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

          <FilterSelect
            label="Role Filter"
            value={roleFilter}
            options={roleOptions}
            onChange={setRoleFilter}
          />

          <FilterSelect
            label="Status Filter"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <UserTable
        users={users}
        loading={loading}
        page={usersMeta.page}
        totalPages={usersMeta.totalPages}
        onSelectUser={openUserModal}
        onCreditUser={openUserModal}
        onPageChange={setPage}
      />

      <UserDetailsModal
        open={Boolean(selectedUserId && selectedUserProfile)}
        user={selectedUser}
        details={selectedUserDetails}
        transactions={selectedUserTransactions}
        paymentRequests={selectedUserPayments}
        activeTab={modalTab}
        creditAmount={creditAmount}
        roleDraft={roleDraft}
        loadingAction={loadingAction}
        onClose={() => {
          setSelectedUserId(null);
          setSelectedUserProfile(null);
          setCreditAmount("");
          setLoadingAction(null);
        }}
        onTabChange={setModalTab}
        onCreditAmountChange={setCreditAmount}
        onRoleDraftChange={setRoleDraft}
        onAddCredits={handleCreditUser}
        onDeductCredits={handleDeductCredits}
        onToggleBlock={handleToggleBlock}
        onChangeRole={handleChangeRole}
        onDeleteAccount={handleDeleteAccount}
      />
    </div>
  );
}
