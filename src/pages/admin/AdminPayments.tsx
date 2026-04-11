import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";

// const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
const API_BASE =
  import.meta.env.VITE_API_URL || "https://dhanwarsha.adonservice.in/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

const resolveScreenshotUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState({ upiId: "", upiName: "" });
  const [savingConfig, setSavingConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");
  const [viewPayment, setViewPayment] = useState<any | null>(null);
  const [remarkInputs, setRemarkInputs] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const PAYMENTS_PER_PAGE = 5;

  const fetchPayments = async () => {
    try {
      const data = await api.admin.getAllPaymentRequests();
      setPayments(data);
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentConfig = async () => {
    try {
      const data = await api.admin.getPaymentConfig();
      setPaymentConfig({
        upiId: data?.upiId ?? "",
        upiName: data?.upiName ?? "",
      });
    } catch {
      toast.error("Failed to load payment UPI settings");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPaymentConfig();
  }, []);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filter]);

  const filtered = payments.filter(
    (p) => filter === "ALL" || p.status === filter,
  );
  const totalPages = Math.ceil(filtered.length / PAYMENTS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * PAYMENTS_PER_PAGE, page * PAYMENTS_PER_PAGE);

  const handleApprove = async (id: string) => {
    setSubmitting((prev) => ({ ...prev, [id]: true }));
    try {
      await api.admin.approvePayment(id, remarkInputs[id] || "Approved");
      toast.success("Payment approved!");
      fetchPayments();
      setViewPayment(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to approve");
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleReject = async (id: string) => {
    setSubmitting((prev) => ({ ...prev, [`${id}_r`]: true }));
    try {
      await api.admin.rejectPayment(id, remarkInputs[id] || "Rejected");
      toast.success("Payment rejected");
      fetchPayments();
      setViewPayment(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to reject");
    } finally {
      setSubmitting((prev) => ({ ...prev, [`${id}_r`]: false }));
    }
  };

  const handleSavePaymentConfig = async () => {
    if (!paymentConfig.upiId.trim()) {
      toast.error("Enter a valid UPI ID");
      return;
    }

    setSavingConfig(true);
    try {
      const saved = await api.admin.updatePaymentConfig(
        paymentConfig.upiId.trim(),
        paymentConfig.upiName.trim(),
      );
      setPaymentConfig({
        upiId: saved.upiId ?? "",
        upiName: saved.upiName ?? "",
      });
      toast.success("Payment UPI updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update payment UPI");
    } finally {
      setSavingConfig(false);
    }
  };

  const statusConfig: Record<string, { bg: string; text: string }> = {
    PENDING: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
    APPROVED: { bg: "bg-green-500/10", text: "text-green-400" },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">
          Payment Requests
        </h1>
        <p className="mt-1 text-sm text-white/40">
          Review and manage user deposit requests
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white">Deposit UPI Settings</h2>
            <p className="mt-1 text-sm text-white/40">
              Wallet QR payments will use this UPI ID and display name.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              UPI Display Name
            </label>
            <input
              type="text"
              value={paymentConfig.upiName}
              onChange={(e) =>
                setPaymentConfig((prev) => ({ ...prev, upiName: e.target.value }))
              }
              placeholder="Dhanwarsha Payments"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/50">
              UPI ID
            </label>
            <input
              type="text"
              value={paymentConfig.upiId}
              onChange={(e) =>
                setPaymentConfig((prev) => ({ ...prev, upiId: e.target.value }))
              }
              placeholder="merchant@okaxis"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSavePaymentConfig}
            disabled={savingConfig}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save UPI
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              filter === f
                ? "bg-primary text-[hsl(220,20%,7%)]"
                : "border border-white/10 bg-white/5 text-white/50 hover:text-white"
            }`}
          >
            {f}
            {f !== "ALL" && (
              <span className="ml-1.5 rounded-full bg-white/10 px-1.5 text-xs">
                {payments.filter((p) => p.status === f).length}
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
            onClick={(e) =>
              e.target === e.currentTarget && setViewPayment(null)
            }
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-4 sm:p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-display">
                  Payment Request
                </h2>
                <button onClick={() => setViewPayment(null)}>
                  <X className="h-5 w-5 text-white/40" />
                </button>
              </div>

              {/* User info */}
              <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                  {viewPayment.userId?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {viewPayment.userId?.name || "User"}
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {viewPayment.userId?.email}
                  </p>
                </div>
                <div className="ml-auto shrink-0">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusConfig[viewPayment.status]?.bg} ${statusConfig[viewPayment.status]?.text}`}
                  >
                    {viewPayment.status}
                  </span>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 mb-1">Amount</p>
                  <p className="text-xl font-bold text-primary font-display">
                    {viewPayment.amount}
                  </p>
                  <p className="text-xs text-white/30">coins</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="text-xs text-white/40 mb-1">Date</p>
                  <p className="text-sm font-medium text-white">
                    {new Date(viewPayment.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-white/30">
                    {new Date(viewPayment.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Screenshot */}
              {viewPayment.screenshotUrl && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium text-white/50">
                    Payment Screenshot
                  </p>
                  <img
                    src={resolveScreenshotUrl(viewPayment.screenshotUrl)}
                    alt="Payment proof"
                    className="mb-2 h-44 w-full rounded-lg border border-white/10 object-cover"
                  />
                  <a
                    href={resolveScreenshotUrl(viewPayment.screenshotUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-primary hover:bg-white/10 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Screenshot
                  </a>
                </div>
              )}

              {viewPayment.status === "PENDING" && (
                <>
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-medium text-white/50">
                      Remark (optional)
                    </label>
                    <input
                      type="text"
                      value={remarkInputs[viewPayment._id] || ""}
                      onChange={(e) =>
                        setRemarkInputs((prev) => ({
                          ...prev,
                          [viewPayment._id]: e.target.value,
                        }))
                      }
                      placeholder="Add a remark..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => handleReject(viewPayment._id)}
                      disabled={submitting[`${viewPayment._id}_r`]}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-red-500/10 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {submitting[`${viewPayment._id}_r`] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <XCircle className="h-4 w-4" /> Reject
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleApprove(viewPayment._id)}
                      disabled={submitting[viewPayment._id]}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500/10 py-2.5 text-sm font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      {submitting[viewPayment._id] ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" /> Approve
                        </>
                      )}
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
        <div className="overflow-hidden rounded-xl border border-white/5">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">
                    User
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-white/30">
                      <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      No payments found
                    </td>
                  </tr>
                ) : (
                  paginated.map((pay, i) => {
                    const sc = statusConfig[pay.status] || {
                      bg: "bg-white/5",
                      text: "text-white/40",
                    };
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
                              {pay.userId?.name?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-white/80">
                                {pay.userId?.name || "User"}
                              </p>
                              <p className="text-xs text-white/30">
                                {pay.userId?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-primary">
                            {pay.amount}
                          </span>
                          <span className="ml-1 text-xs text-white/30">
                            coins
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}
                          >
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
                            {pay.status === "PENDING" && (
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

          {/* Mobile cards */}
          <div className="divide-y divide-white/5 md:hidden">
            {paginated.length === 0 ? (
              <div className="py-10 text-center text-white/30">
                <CreditCard className="mx-auto mb-2 h-8 w-8 opacity-30" />
                No payments found
              </div>
            ) : (
              paginated.map((pay, i) => {
                const sc = statusConfig[pay.status] || {
                  bg: "bg-white/5",
                  text: "text-white/40",
                };
                return (
                  <motion.div
                    key={pay._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="space-y-3 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {pay.userId?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white/80">
                            {pay.userId?.name || "User"}
                          </p>
                          <p className="truncate text-xs text-white/30">
                            {pay.userId?.email}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}
                      >
                        {pay.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg bg-white/5 p-3">
                        <p className="text-white/30">Amount</p>
                        <p className="mt-1 text-lg font-bold text-primary">
                          {pay.amount}{" "}
                          <span className="text-xs font-normal text-white/30">
                            coins
                          </span>
                        </p>
                      </div>
                      <div className="rounded-lg bg-white/5 p-3">
                        <p className="text-white/30">Date</p>
                        <p className="mt-1 text-sm text-white/70">
                          {new Date(pay.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setViewPayment(pay)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition-colors hover:text-white"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                      {pay.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleReject(pay._id)}
                            disabled={submitting[`${pay._id}_r`]}
                            className="inline-flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                          <button
                            onClick={() => handleApprove(pay._id)}
                            disabled={submitting[pay._id]}
                            className="inline-flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-400 transition-colors hover:bg-green-500/20 disabled:opacity-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-white/8 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-white/40">
                Page {page} of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, page - 1))}
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
                      onClick={() => setPage(nextPage)}
                      className={`h-9 min-w-9 rounded-xl px-3 text-xs font-semibold transition-colors ${
                        nextPage === page
                          ? "bg-primary text-[hsl(220,20%,7%)]"
                          : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {nextPage}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
