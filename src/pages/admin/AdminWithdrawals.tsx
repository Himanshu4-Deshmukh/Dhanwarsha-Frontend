import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowUpFromLine,
    Loader2,
    CheckCircle,
    XCircle,
    Eye,
    X,
    Copy,
} from 'lucide-react';

export default function AdminWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
    const [viewItem, setViewItem] = useState<any | null>(null);
    const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

    const fetchWithdrawals = async () => {
        try {
            const data = await api.admin.getAllWithdrawals();
            setWithdrawals(data);
        } catch {
            toast.error('Failed to load withdrawals');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchWithdrawals(); }, []);

    const filtered = withdrawals.filter((w) => filter === 'ALL' || w.status === filter);

    const handleApprove = async (id: string) => {
        setSubmitting((prev) => ({ ...prev, [id]: true }));
        try {
            await api.admin.approveWithdrawal(id, remarkInputs[id] || 'Approved');
            toast.success('Withdrawal approved');
            fetchWithdrawals();
            setViewItem(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve');
        } finally {
            setSubmitting((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleReject = async (id: string) => {
        setSubmitting((prev) => ({ ...prev, [`${id}_r`]: true }));
        try {
            await api.admin.rejectWithdrawal(id, remarkInputs[id] || 'Rejected');
            toast.success('Withdrawal rejected — coins refunded to user');
            fetchWithdrawals();
            setViewItem(null);
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject');
        } finally {
            setSubmitting((prev) => ({ ...prev, [`${id}_r`]: false }));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
    };

    const statusConfig: Record<string, { bg: string; text: string; border: string }> = {
        PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20' },
        APPROVED: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
        REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
    };

    const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white font-display">Withdrawals</h1>
                <p className="mt-1 text-sm text-white/40">
                    Review and process user withdrawal requests
                </p>
            </div>

            {/* Summary chips */}
            {pendingCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <p className="text-sm text-primary font-medium">
                        {pendingCount} pending withdrawal{pendingCount > 1 ? 's' : ''} require your attention
                    </p>
                </div>
            )}

            {/* Filter tabs */}
            <div className="flex flex-wrap gap-2">
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === f
                                ? 'bg-primary text-[hsl(220,20%,7%)]'
                                : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'
                            }`}
                    >
                        {f}
                        {f !== 'ALL' && (
                            <span className="ml-1.5 rounded-full bg-white/10 px-1.5 text-xs">
                                {withdrawals.filter((w) => w.status === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Detail modal */}
            <AnimatePresence>
                {viewItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                        onClick={(e) => e.target === e.currentTarget && setViewItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-5"
                        >
                            {/* Modal header */}
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-white font-display">Withdrawal Request</h2>
                                <button onClick={() => setViewItem(null)}>
                                    <X className="h-5 w-5 text-white/40" />
                                </button>
                            </div>

                            {/* User row */}
                            <div className="mb-4 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                                    {viewItem.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{viewItem.userId?.name || 'User'}</p>
                                    <p className="truncate text-xs text-white/40">{viewItem.userId?.email}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusConfig[viewItem.status]?.bg} ${statusConfig[viewItem.status]?.text} ${statusConfig[viewItem.status]?.border}`}>
                                    {viewItem.status}
                                </span>
                            </div>

                            {/* Amount + date */}
                            <div className="mb-4 grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="mb-1 text-xs text-white/40">Amount</p>
                                    <p className="text-2xl font-bold text-primary font-display">{viewItem.amount}</p>
                                    <p className="text-xs text-white/30">coins</p>
                                </div>
                                <div className="rounded-xl bg-white/5 p-3">
                                    <p className="mb-1 text-xs text-white/40">Requested</p>
                                    <p className="text-sm font-medium text-white">
                                        {new Date(viewItem.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-white/30">
                                        {new Date(viewItem.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>

                            {/* UPI ID — most important for admin */}
                            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
                                <p className="mb-1.5 text-xs font-medium text-white/50">Send payment to this UPI ID</p>
                                <div className="flex items-center justify-between gap-2">
                                    <p className="font-mono text-base font-bold text-primary">{viewItem.upiId}</p>
                                    <button
                                        onClick={() => copyToClipboard(viewItem.upiId)}
                                        className="rounded-lg bg-primary/15 p-1.5 text-primary hover:bg-primary/25 transition-colors"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Admin remark if already reviewed */}
                            {viewItem.status !== 'PENDING' && viewItem.adminRemark && (
                                <div className="mb-4 rounded-xl bg-white/5 p-3">
                                    <p className="mb-1 text-xs text-white/40">Admin remark</p>
                                    <p className="text-sm text-white/70">{viewItem.adminRemark}</p>
                                </div>
                            )}

                            {/* Refund note */}
                            {viewItem.status === 'PENDING' && (
                                <p className="mb-3 text-xs text-white/30">
                                    Rejecting will automatically refund {viewItem.amount} coins to the user's wallet.
                                </p>
                            )}

                            {/* Actions — only when PENDING */}
                            {viewItem.status === 'PENDING' && (
                                <>
                                    <div className="mb-3">
                                        <label className="mb-1.5 block text-xs font-medium text-white/50">
                                            Remark (optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={remarkInputs[viewItem._id] || ''}
                                            onChange={(e) =>
                                                setRemarkInputs((prev) => ({ ...prev, [viewItem._id]: e.target.value }))
                                            }
                                            placeholder="e.g. Payment sent via PhonePe"
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleReject(viewItem._id)}
                                            disabled={submitting[`${viewItem._id}_r`]}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                        >
                                            {submitting[`${viewItem._id}_r`]
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <><XCircle className="h-4 w-4" /> Reject &amp; Refund</>
                                            }
                                        </button>
                                        <button
                                            onClick={() => handleApprove(viewItem._id)}
                                            disabled={submitting[viewItem._id]}
                                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                        >
                                            {submitting[viewItem._id]
                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                : <><CheckCircle className="h-4 w-4" /> Approve</>
                                            }
                                        </button>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Table / list */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-white/5">
                    {/* Desktop table */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full text-sm">
                            <thead className="border-b border-white/5 bg-white/5">
                                <tr>
                                    {['User', 'Amount', 'UPI ID', 'Status', 'Date', 'Actions'].map((h) => (
                                        <th
                                            key={h}
                                            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white/40 ${h === 'Actions' ? 'text-right' : 'text-left'}`}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-white/30">
                                            <ArrowUpFromLine className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                            No withdrawals found
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map((w, i) => {
                                        const sc = statusConfig[w.status] || { bg: 'bg-white/5', text: 'text-white/40', border: '' };
                                        return (
                                            <tr key={w._id} className="transition-colors hover:bg-white/5">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                                            {w.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white/80">{w.userId?.name || 'User'}</p>
                                                            <p className="text-xs text-white/30">{w.userId?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-primary">{w.amount}</span>
                                                    <span className="ml-1 text-xs text-white/30">coins</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-white/60">{w.upiId}</span>
                                                        <button
                                                            onClick={() => copyToClipboard(w.upiId)}
                                                            className="text-white/30 hover:text-primary transition-colors"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-white/40">
                                                    {new Date(w.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setViewItem(w)}
                                                            className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 hover:text-white transition-colors"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        {w.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleReject(w._id)}
                                                                    disabled={submitting[`${w._id}_r`]}
                                                                    className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                                >
                                                                    <XCircle className="h-3.5 w-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApprove(w._id)}
                                                                    disabled={submitting[w._id]}
                                                                    className="rounded-lg bg-green-500/10 p-1.5 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="divide-y divide-white/5 md:hidden">
                        {filtered.length === 0 ? (
                            <div className="py-10 text-center text-white/30">
                                <ArrowUpFromLine className="mx-auto mb-2 h-8 w-8 opacity-30" />
                                No withdrawals found
                            </div>
                        ) : (
                            filtered.map((w) => {
                                const sc = statusConfig[w.status] || { bg: 'bg-white/5', text: 'text-white/40', border: '' };
                                return (
                                    <div key={w._id} className="space-y-3 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                                                    {w.userId?.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-white/80">{w.userId?.name || 'User'}</p>
                                                    <p className="truncate text-xs text-white/30">{w.userId?.email}</p>
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                                                {w.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-xs">
                                            <div className="rounded-xl bg-white/5 p-3">
                                                <p className="text-white/30">Amount</p>
                                                <p className="mt-1 text-lg font-bold text-primary">
                                                    {w.amount} <span className="text-xs font-normal text-white/30">coins</span>
                                                </p>
                                            </div>
                                            <div className="rounded-xl bg-white/5 p-3">
                                                <p className="text-white/30">Date</p>
                                                <p className="mt-1 text-sm text-white/70">
                                                    {new Date(w.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        {/* UPI on mobile */}
                                        <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/5 px-3 py-2">
                                            <p className="font-mono text-xs text-primary">{w.upiId}</p>
                                            <button onClick={() => copyToClipboard(w.upiId)}>
                                                <Copy className="h-3.5 w-3.5 text-primary" />
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setViewItem(w)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:text-white transition-colors"
                                            >
                                                <Eye className="h-3.5 w-3.5" /> View
                                            </button>
                                            {w.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleReject(w._id)}
                                                        disabled={submitting[`${w._id}_r`]}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(w._id)}
                                                        disabled={submitting[w._id]}
                                                        className="inline-flex items-center gap-2 rounded-xl bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                                    >
                                                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}