import { Coins, CreditCard, History, Mail, Shield, User2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AdminActions } from './AdminActions';
import type {
  AdminPaymentRequest,
  AdminTransaction,
  AdminUser,
  SelectedUserDetails,
  UserModalTab,
  UserRole,
} from './types';

type UserDetailsModalProps = {
  open: boolean;
  user: AdminUser | null;
  details: SelectedUserDetails | null;
  transactions: AdminTransaction[];
  paymentRequests: AdminPaymentRequest[];
  activeTab: UserModalTab;
  creditAmount: string;
  roleDraft: UserRole;
  loadingAction?: 'block' | 'role' | 'credit' | 'deduct' | 'delete' | null;
  onClose: () => void;
  onTabChange: (tab: UserModalTab) => void;
  onCreditAmountChange: (value: string) => void;
  onRoleDraftChange: (value: UserRole) => void;
  onAddCredits: () => void;
  onDeductCredits: () => void;
  onToggleBlock: () => void;
  onChangeRole: () => void;
  onDeleteAccount: () => void;
};

const infoCards = [
  { key: 'role', label: 'Role', icon: Shield },
  { key: 'status', label: 'Account Status', icon: User2 },
  { key: 'joined', label: 'Joined Date', icon: History },
  { key: 'lastLogin', label: 'Last Login', icon: Mail },
] as const;

export function UserDetailsModal({
  open,
  user,
  details,
  transactions,
  paymentRequests,
  activeTab,
  creditAmount,
  roleDraft,
  loadingAction,
  onClose,
  onTabChange,
  onCreditAmountChange,
  onRoleDraftChange,
  onAddCredits,
  onDeductCredits,
  onToggleBlock,
  onChangeRole,
  onDeleteAccount,
}: UserDetailsModalProps) {
  if (!user || !details) {
    return null;
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-3xl border border-white/10 bg-[hsl(220,20%,9%)] shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-[hsl(220,20%,9%)]/95 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <p className="text-lg font-bold text-white">User Details</p>
                <p className="text-xs text-white/35">Detailed admin view with wallet and activity summaries.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-white/10 p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 p-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <div className="rounded-3xl border border-white/8 bg-gradient-to-br from-[hsl(220,18%,14%)] via-[hsl(220,18%,11%)] to-[hsl(220,20%,9%)] p-5">
                  <div className="min-w-0">
                    <p className="text-2xl font-bold text-white">{user.name}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/45">
                      <Mail className="h-4 w-4" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.role === 'ADMIN' ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'}`}>
                        {user.role}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                        {user.isActive ? 'Active' : 'Blocked'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-wide text-white/35">Total Credits</p>
                      <p className="mt-2 text-2xl font-bold text-white">{details.totalCredits}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-wide text-white/35">Total Transactions</p>
                      <p className="mt-2 text-2xl font-bold text-white">{details.totalTransactions}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-wide text-white/35">Payment Requests</p>
                      <p className="mt-2 text-2xl font-bold text-white">{details.totalPaymentRequests}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                      <p className="text-xs uppercase tracking-wide text-white/35">Last Login</p>
                      <p className="mt-2 text-sm font-semibold text-white">{details.lastLoginLabel}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {infoCards.map(({ key, label, icon: Icon }) => {
                      let value = '';
                      if (key === 'role') value = user.role;
                      if (key === 'status') value = user.isActive ? 'Active' : 'Blocked';
                      if (key === 'joined') value = new Date(user.createdAt).toLocaleString();
                      if (key === 'lastLogin') value = details.lastLoginLabel;

                      return (
                        <div key={key} className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] p-4">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/35">
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/[0.025] p-4">
                  <div className="flex flex-wrap gap-2 border-b border-white/8 pb-3">
                    {[
                      { key: 'overview', label: 'Overview' },
                      { key: 'transactions', label: 'Transactions' },
                      { key: 'payments', label: 'Payments' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => onTabChange(tab.key as UserModalTab)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                          activeTab === tab.key
                            ? 'bg-gradient-gold text-[hsl(220,20%,7%)]'
                            : 'bg-white/[0.03] text-white/55 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'overview' && (
                    <div className="grid gap-3 pt-4 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] p-4">
                        <p className="text-xs uppercase tracking-wide text-white/35">Recent Transaction</p>
                        {transactions[0] ? (
                          <>
                            <p className="mt-2 text-sm font-semibold text-white">{transactions[0].type}</p>
                            <p className="mt-1 text-xs text-white/35">{new Date(transactions[0].createdAt).toLocaleString()}</p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-white/45">No transaction history available.</p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] p-4">
                        <p className="text-xs uppercase tracking-wide text-white/35">Recent Payment Request</p>
                        {paymentRequests[0] ? (
                          <>
                            <p className="mt-2 text-sm font-semibold text-white">{paymentRequests[0].amount} coins</p>
                            <p className="mt-1 text-xs text-white/35">{paymentRequests[0].status}</p>
                          </>
                        ) : (
                          <p className="mt-2 text-sm text-white/45">No payment requests found.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'transactions' && (
                    <div className="space-y-3 pt-4">
                      {transactions.length === 0 ? (
                        <p className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] px-4 py-5 text-sm text-white/40">
                          No transactions available for this user.
                        </p>
                      ) : (
                        transactions.slice(0, 6).map((tx) => (
                          <div key={tx._id} className="flex items-center justify-between rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-white">{tx.type}</p>
                              <p className="text-xs text-white/35">{new Date(tx.createdAt).toLocaleString()}</p>
                            </div>
                            <span className={`text-sm font-bold ${tx.amount >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                              {tx.amount >= 0 ? '+' : ''}
                              {tx.amount}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'payments' && (
                    <div className="space-y-3 pt-4">
                      {paymentRequests.length === 0 ? (
                        <p className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] px-4 py-5 text-sm text-white/40">
                          No payment requests available for this user.
                        </p>
                      ) : (
                        paymentRequests.slice(0, 6).map((payment) => (
                          <div key={payment._id} className="rounded-2xl border border-white/8 bg-[hsl(220,18%,11%)] px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-white">{payment.amount} coins</p>
                                <p className="text-xs text-white/35">{new Date(payment.createdAt).toLocaleString()}</p>
                              </div>
                              <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-white/65">
                                {payment.status}
                              </span>
                            </div>
                            {payment.adminRemark && (
                              <p className="mt-2 text-xs text-white/45">{payment.adminRemark}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <AdminActions
                  currentRole={user.role}
                  currentStatus={user.isActive}
                  roleDraft={roleDraft}
                  creditAmount={creditAmount}
                  onCreditAmountChange={onCreditAmountChange}
                  onRoleDraftChange={onRoleDraftChange}
                  onAddCredits={onAddCredits}
                  onDeductCredits={onDeductCredits}
                  onToggleBlock={onToggleBlock}
                  onChangeRole={onChangeRole}
                  onDeleteAccount={onDeleteAccount}
                  onShowTransactions={() => onTabChange('transactions')}
                  onShowPayments={() => onTabChange('payments')}
                  loadingAction={loadingAction}
                />

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/35">
                      <Coins className="h-3.5 w-3.5" />
                      Credit Summary
                    </div>
                    <p className="mt-2 text-lg font-bold text-white">{details.totalCredits} credits moved</p>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-white/35">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment Requests
                    </div>
                    <p className="mt-2 text-lg font-bold text-white">{details.totalPaymentRequests} requests</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
