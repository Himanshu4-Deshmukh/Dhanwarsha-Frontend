import { Ban, Coins, Eye, ShieldCheck, Trash2, UserCog, Wallet } from 'lucide-react';

type AdminActionsProps = {
  creditAmount: string;
  onCreditAmountChange: (value: string) => void;
  onAddCredits: () => void;
  onShowTransactions: () => void;
  onShowPayments: () => void;
  crediting: boolean;
};

const disabledActionClass =
  'cursor-not-allowed border-white/5 bg-white/[0.03] text-white/25';

export function AdminActions({
  creditAmount,
  onCreditAmountChange,
  onAddCredits,
  onShowTransactions,
  onShowPayments,
  crediting,
}: AdminActionsProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-white/8 bg-white/[0.025] p-4">
      <div>
        <p className="text-sm font-semibold text-white">Admin Actions</p>
        <p className="mt-1 text-xs text-white/35">Use the available controls below to review activity and manage wallet credits.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
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
        <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Wallet Controls</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="number"
            min={1}
            value={creditAmount}
            onChange={(e) => onCreditAmountChange(e.target.value)}
            placeholder="Enter credits"
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={onAddCredits}
            disabled={crediting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-semibold text-[hsl(220,20%,7%)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Coins className="h-4 w-4" />
            {crediting ? 'Crediting...' : 'Add Credits'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-white/8 bg-white/[0.015] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/35">Needs Backend Support</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${disabledActionClass}`}
          >
            <Ban className="h-3.5 w-3.5" />
            Block / Unblock
          </button>
          <button
            type="button"
            disabled
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${disabledActionClass}`}
          >
            <UserCog className="h-3.5 w-3.5" />
            Change Role
          </button>
          <button
            type="button"
            disabled
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${disabledActionClass}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Deduct Credits
          </button>
          <button
            type="button"
            disabled
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${disabledActionClass}`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
