import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Loader2, CheckCircle, XCircle, Eye, X, ExternalLink } from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [viewPayment, setViewPayment] = useState<any | null>(null);
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  const fetchPayments = async () => {
    try {
      const data = await api.admin.getAllPaymentRequests();
      setPayments(data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const filtered = payments.filter(p => filter === 'ALL' || p.status === filter);

  const handleApprove = async (id: string) => {
    setSubmitting(prev => ({ ...prev, [id]: true }));
    try {
      await api.admin.approvePayment(id, remarkInputs[id] || 'Approved');
      toast.success('Payment approved!');
      fetchPayments();
      setViewPayment(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setSubmitting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setSubmitting(prev => ({ ...prev, [`${id}_r`]: true }));
    try {
      await api.admin.rejectPayment(id, remarkInputs[id] || 'Rejected');
      toast.success('Payment rejected');
      fetchPayments();
      setViewPayment(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setSubmitting(prev => ({ ...prev, [`${id}_r`]: false }));
    }
  };

  const statusConfig: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    APPROVED: { bg: 'bg-green-500/10', text: 'text-green-400' },
    REJECTED: { bg: 'bg-red-500/10', text: 'text-red-400' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">Payment Requests</h1>
        <p className="mt-1 text-sm text-white/40">Review and manage user deposit requests</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? 'bg-primary text-[hsl(220,20%,7%)]'
                : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            {f}
            {f !== 'ALL' && (
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 text-xs">
                {payments.filter(p => p.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {viewPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            onClick={e => e.target === e.currentTarget && setViewPayment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-display">Payment Request</h2>
                <button onClick={() => setViewPayment(null)}><X className="h-5 w-5 text-white/40" /></button>
              </div>

              {/* User info */}
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {viewPayment.userId?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{viewPayment.userId?.name || 'User'}</p>
                  <p className="text-xs text-white/40">{viewPayment.userId?.email}</p>
                </div>
                <div className="ml-auto">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[viewPayment.status]?.bg} ${statusConfig[viewPayment.status]?.text}`}>
                    {viewPayment.status}
                  </span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 mb-1">Amount</p>
                  <p className="text-xl font-bold text-primary font-display">{viewPayment.amount}</p>
                  <p className="text-xs text-white/30">coins</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 mb-1">Date</p>
                  <p className="text-sm font-medium text-white">{new Date(viewPayment.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-white/30">{new Date(viewPayment.createdAt).toLocaleTimeString()}</p>
                </div>
              </div>

              {/* Screenshot */}
              {viewPayment.screenshotUrl && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-white/50">Payment Screenshot</p>
                  <a
                    href={viewPayment.screenshotUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-primary hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Screenshot
                  </a>
                </div>
              )}

              {viewPayment.status === 'PENDING' && (
                <>
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Remark (optional)</label>
                    <input
                      type="text"
                      value={remarkInputs[viewPayment._id] || ''}
                      onChange={e => setRemarkInputs(prev => ({ ...prev, [viewPayment._id]: e.target.value }))}
                      placeholder="Add a remark..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleReject(viewPayment._id)}
                      disabled={submitting[`${viewPayment._id}_r`]}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {submitting[`${viewPayment._id}_r`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><XCircle className="h-4 w-4" /> Reject</>}
                    </button>
                    <button
                      onClick={() => handleApprove(viewPayment._id)}
                      disabled={submitting[viewPayment._id]}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      {submitting[viewPayment._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" /> Approve</>}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-white/30">
                      <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((pay, i) => {
                    const sc = statusConfig[pay.status] || { bg: 'bg-white/5', text: 'text-white/40' };
                    return (
                      <motion.tr
                        key={pay._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                              {pay.userId?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-white/80">{pay.userId?.name || 'User'}</p>
                              <p className="text-xs text-white/30">{pay.userId?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary">{pay.amount}</span>
                          <span className="ml-1 text-xs text-white/30">coins</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            {pay.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">
                          {new Date(pay.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setViewPayment(pay)}
                              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 hover:text-white transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {pay.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleReject(pay._id)}
                                  disabled={submitting[`${pay._id}_r`]}
                                  className="rounded-lg bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleApprove(pay._id)}
                                  disabled={submitting[pay._id]}
                                  className="rounded-lg bg-green-500/10 p-1.5 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
