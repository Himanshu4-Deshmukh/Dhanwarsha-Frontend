import { useEffect, useRef, useState } from 'react';
import { Ban, Check, ChevronDown, Coins, Eye, ShieldCheck, Sparkles, Trash2, UserCog, Wallet } from 'lucide-react';
import type { UserRole } from './types';

type AdminActionsProps = {
  currentRole: UserRole;
  currentStatus: boolean;
  roleDraft: UserRole;
  creditAmount: string;
  onCreditAmountChange: (value: string) => void;
  onRoleDraftChange: (value: UserRole) => void;
  onAddCredits: () => void;
  onDeductCredits: () => void;
  onToggleBlock: () => void;
  onChangeRole: () => void;
  onDeleteAccount: () => void;
  onShowTransactions: () => void;
  onShowPayments: () => void;
  loadingAction?: 'block' | 'role' | 'credit' | 'deduct' | 'delete' | null;
};

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

export function AdminActions({
  currentRole,
  currentStatus,
  roleDraft,
  creditAmount,
  onCreditAmountChange,
  onRoleDraftChange,
  onAddCredits,
  onDeductCredits,
  onToggleBlock,
  onChangeRole,
  onDeleteAccount,
  onShowTransactions,
  onShowPayments,
  loadingAction,
}: AdminActionsProps) {
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!roleMenuRef.current?.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedRole = roleOptions.find((option) => option.value === roleDraft) ?? roleOptions[1];

  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Admin Actions</p>
        <p className="mt-1 text-xs text-white/35">Use the controls below to manage user access, role, and wallet activity.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={onToggleBlock}
          disabled={loadingAction === 'block'}
          className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
            currentStatus
              ? 'border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20'
              : 'border-green-500/20 bg-green-500/10 text-green-300 hover:bg-green-500/20'
          } disabled:opacity-50`}
        >
          <Ban className="h-3.5 w-3.5" />
          {loadingAction === 'block' ? 'Saving...' : currentStatus ? 'Block User' : 'Unblock User'}
        </button>
        <button
          type="button"
          onClick={onShowTransactions}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Eye className="h-3.5 w-3.5" />
          View Transactions
        </button>
        <button
          type="button"
          onClick={onShowPayments}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Wallet className="h-3.5 w-3.5" />
          View Payments
        </button>
      </div>

      <div className="rounded-xl border border-white/8 bg-[hsl(220,18%,11%)] p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Role Management</p>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${roleDraft === 'ADMIN' ? 'bg-purple-500/15 text-purple-300' : 'bg-blue-500/15 text-blue-300'}`}>
            {roleDraft}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div ref={roleMenuRef} className="relative flex-1">
            <button
              type="button"
              onClick={() => setRoleMenuOpen((prev) => !prev)}
              className={`flex h-11 w-full items-center gap-3 rounded-xl border pl-3 pr-3 text-left transition-all ${
                roleMenuOpen
                  ? 'border-primary/70 bg-[hsl(220,18%,14%)] shadow-[0_0_0_1px_rgba(245,166,35,0.35)]'
                  : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] hover:bg-white/[0.05]'
              }`}
            >
              <div className="rounded-lg bg-white/[0.06] p-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{selectedRole.label}</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-white/40 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {roleMenuOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,18%,12%)] p-2 shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                {roleOptions.map((option) => {
                  const active = option.value === roleDraft;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onRoleDraftChange(option.value);
                        setRoleMenuOpen(false);
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
          <button
            type="button"
            onClick={onChangeRole}
            disabled={loadingAction === 'role' || roleDraft === currentRole}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-300 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
          >
            <UserCog className="h-4 w-4" />
            {loadingAction === 'role' ? 'Saving...' : 'Change Role'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/8 bg-[hsl(220,18%,11%)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Wallet Controls</p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="number"
            min={1}
            value={creditAmount}
            onChange={(e) => onCreditAmountChange(e.target.value)}
            placeholder="Enter credits"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onAddCredits}
              disabled={loadingAction === 'credit'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-[hsl(220,20%,7%)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Coins className="h-4 w-4" />
              {loadingAction === 'credit' ? 'Crediting...' : 'Add Credits'}
            </button>
            <button
              type="button"
              onClick={onDeductCredits}
              disabled={loadingAction === 'deduct'}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 disabled:opacity-50"
            >
              <ShieldCheck className="h-4 w-4" />
              {loadingAction === 'deduct' ? 'Deducting...' : 'Deduct Credits'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.04] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-200/80">Danger Zone</p>
        <button
          type="button"
          onClick={onDeleteAccount}
          disabled={loadingAction === 'delete'}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {loadingAction === 'delete' ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
}
