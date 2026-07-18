import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  ArrowDownLeft,
  ArrowUpFromLine,
  ArrowUpRight,
  Clock3,
  Coins,
  Loader2,
  MessageSquareText,
  Trophy,
  Hash,
  CalendarDays,
  Layers,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const ITEMS_PER_PAGE = 5;

const statusStyles: Record<string, string> = {
  PENDING: "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  APPROVED: "border border-green-500/20  bg-green-500/10  text-green-400",
  REJECTED: "border border-red-500/20    bg-red-500/10    text-red-400",
  WON: "border border-green-500/20  bg-green-500/10  text-green-400",
  LOST: "border border-red-500/20    bg-red-500/10    text-red-400",
  RUNNING: "border border-blue-500/20   bg-blue-500/10   text-blue-400",
};

const gameTypeColors: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  close: "bg-purple-500/15  text-purple-400  border border-purple-500/20",
  jodi: "bg-amber-500/15   text-amber-400   border border-amber-500/20",
};

const normalizeBetStatus = (value?: string) => {
  const status = (value ?? "PENDING").toUpperCase();
  if (status === "WIN") return "WON";
  if (status === "LOSS") return "LOST";
  return status;
};

const HistoryPage = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
  const [bidsHistory, setBidsHistory] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<
    "transactions" | "payments" | "withdrawals" | "bids"
  >("transactions");

  const [transactionPage, setTransactionPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);
  const [bidsPage, setBidsPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [txs, payments, withdrawals, bids] = await Promise.all([
        api.getTransactions(),
        api.getMyPayments().catch(() => []),
        api.getMyWithdrawals().catch(() => []),
        api.getMyLiveDrawBets().catch(() => []),
      ]);
      setTransactions(txs);
      setPaymentRequests(payments);
      setWithdrawalRequests(withdrawals);
      setBidsHistory(
        (bids ?? []).sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setTransactionPage(1);
  }, [transactions.length]);
  useEffect(() => {
    setPaymentPage(1);
  }, [paymentRequests.length]);
  useEffect(() => {
    setWithdrawalPage(1);
  }, [withdrawalRequests.length]);
  useEffect(() => {
    setBidsPage(1);
  }, [bidsHistory.length]);

  const transactionTotalPages = Math.max(
    1,
    Math.ceil(transactions.length / ITEMS_PER_PAGE),
  );
  const paymentTotalPages = Math.max(
    1,
    Math.ceil(paymentRequests.length / ITEMS_PER_PAGE),
  );
  const withdrawalTotalPages = Math.max(
    1,
    Math.ceil(withdrawalRequests.length / ITEMS_PER_PAGE),
  );
  const bidsTotalPages = Math.max(
    1,
    Math.ceil(bidsHistory.length / ITEMS_PER_PAGE),
  );

  const paginatedTransactions = transactions.slice(
    (transactionPage - 1) * ITEMS_PER_PAGE,
    transactionPage * ITEMS_PER_PAGE,
  );
  const paginatedPayments = paymentRequests.slice(
    (paymentPage - 1) * ITEMS_PER_PAGE,
    paymentPage * ITEMS_PER_PAGE,
  );
  const paginatedWithdrawals = withdrawalRequests.slice(
    (withdrawalPage - 1) * ITEMS_PER_PAGE,
    withdrawalPage * ITEMS_PER_PAGE,
  );
  const paginatedBids = bidsHistory.slice(
    (bidsPage - 1) * ITEMS_PER_PAGE,
    bidsPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-28">
      <h1 className="text-lg font-bold text-white font-display">History</h1>

      {/* ── Tabs ── */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-1">
          <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {(
              [
                { key: "transactions", label: "Transactions" },
                { key: "payments", label: "Payments" },
                { key: "withdrawals", label: "Withdrawals" },
                { key: "bids", label: "Bids History" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`rounded-xl px-2 py-3 text-xs font-semibold transition-colors sm:text-sm ${
                  activeTab === key
                    ? "bg-gradient-gold text-black"
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Transactions tab ── */}
          {activeTab === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">
                TRANSACTION HISTORY
              </h2>
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/25">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-2">
                  {paginatedTransactions.map((tx: any, i: number) => (
                    <div
                      key={tx._id || i}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${tx.amount > 0 ? "bg-green-500/10" : "bg-red-500/10"}`}
                        >
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">
                            {tx.type}
                          </p>
                          <p className="text-xs text-white/30">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`pl-3 text-sm font-bold ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}
                      >
                        {tx.amount > 0 ? "+" : ""}
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <Pagination
                page={transactionPage}
                total={transactionTotalPages}
                onPrev={() => setTransactionPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  setTransactionPage((p) =>
                    Math.min(transactionTotalPages, p + 1),
                  )
                }
                show={transactions.length > ITEMS_PER_PAGE}
              />
            </motion.div>
          )}

          {/* ── Payments tab ── */}
          {activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">
                MY PAYMENT REQUESTS
              </h2>
              {paymentRequests.length === 0 ? (
                <p className="py-6 text-center text-xs text-white/25">
                  No payment requests yet
                </p>
              ) : (
                <div className="space-y-2">
                  {paginatedPayments.map((payment: any, i: number) => (
                    <motion.div
                      key={payment._id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.008, y: -1 }}
                      className="overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-[hsl(220,18%,13%)] via-[hsl(220,18%,11%)] to-[hsl(220,20%,9%)] px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgba(245,166,35,0.08),0_12px_26px_rgba(245,166,35,0.05)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                              <Coins className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-lg font-bold leading-none text-white sm:text-xl">
                                {payment.amount}{" "}
                                <span className="text-sm font-semibold text-primary/90">
                                  coins
                                </span>
                              </p>
                              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45">
                                <Clock3 className="h-3.5 w-3.5 text-white/35" />
                                <span className="truncate">
                                  {new Date(payment.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="sm:pl-3">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${statusStyles[payment.status] || "bg-white/5 text-white/40"}`}
                          >
                            {payment.status}
                          </span>
                        </div>
                      </div>
                      <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <div className="flex items-start gap-2 text-xs text-white/55">
                        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
                        <p className="leading-relaxed">
                          <span className="mr-1 font-medium text-white/70">
                            Remark:
                          </span>
                          {payment.adminRemark || "No remark available"}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
              <Pagination
                page={paymentPage}
                total={paymentTotalPages}
                onPrev={() => setPaymentPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  setPaymentPage((p) => Math.min(paymentTotalPages, p + 1))
                }
                show={paymentRequests.length > ITEMS_PER_PAGE}
              />
            </motion.div>
          )}

          {/* ── Withdrawals tab ── */}
          {activeTab === "withdrawals" && (
            <motion.div
              key="withdrawals"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">
                MY WITHDRAWAL REQUESTS
              </h2>
              {withdrawalRequests.length === 0 ? (
                <p className="py-6 text-center text-xs text-white/25">
                  No withdrawal requests yet
                </p>
              ) : (
                <div className="space-y-2">
                  {paginatedWithdrawals.map((wd: any, i: number) => (
                    <motion.div
                      key={wd._id || i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.008, y: -1 }}
                      className="overflow-hidden rounded-xl border border-white/8 bg-gradient-to-br from-[hsl(220,18%,13%)] via-[hsl(220,18%,11%)] to-[hsl(220,20%,9%)] px-4 py-3 shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgba(245,166,35,0.08),0_12px_26px_rgba(245,166,35,0.05)]"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
                              <ArrowUpFromLine className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-lg font-bold leading-none text-white sm:text-xl">
                                {wd.amount}{" "}
                                <span className="text-sm font-semibold text-primary/90">
                                  coins
                                </span>
                              </p>
                              <p className="mt-0.5 truncate font-mono text-xs text-white/40">
                                {wd.upiId}
                              </p>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                                <Clock3 className="h-3.5 w-3.5 text-white/35" />
                                <span className="truncate">
                                  {new Date(wd.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="sm:pl-3">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[10px] font-bold tracking-[0.14em] ${statusStyles[wd.status] || "bg-white/5 text-white/40"}`}
                          >
                            {wd.status}
                          </span>
                        </div>
                      </div>
                      <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                      <div className="flex items-start gap-2 text-xs text-white/55">
                        <MessageSquareText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/35" />
                        <p className="leading-relaxed">
                          <span className="mr-1 font-medium text-white/70">
                            Remark:
                          </span>
                          {wd.adminRemark || "Pending review"}
                        </p>
                      </div>
                      {wd.status === "REJECTED" && (
                        <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                          <p className="text-xs text-red-400">
                            {wd.amount} coins have been refunded to your wallet.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
              <Pagination
                page={withdrawalPage}
                total={withdrawalTotalPages}
                onPrev={() => setWithdrawalPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  setWithdrawalPage((p) =>
                    Math.min(withdrawalTotalPages, p + 1),
                  )
                }
                show={withdrawalRequests.length > ITEMS_PER_PAGE}
              />
            </motion.div>
          )}

          {/* ── Bids History tab ── */}
          {activeTab === "bids" && (
            <motion.div
              key="bids"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">
                MY BIDS HISTORY
              </h2>
              {bidsHistory.length === 0 ? (
                <div className="py-12 text-center">
                  <Trophy className="mx-auto mb-2 h-10 w-10 text-white/20" />
                  <p className="text-xs text-white/25">No bids placed yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedBids.map((bet: any, i: number) => {
                    const betType = (
                      bet.betType ??
                      bet.type ??
                      "open"
                    ).toLowerCase();
                    const btLabel =
                      betType.charAt(0).toUpperCase() + betType.slice(1);
                    const btColor =
                      gameTypeColors[betType] ?? gameTypeColors["open"];
                    const status = normalizeBetStatus(bet.status);
                    const stColor =
                      statusStyles[status] ?? "bg-white/5 text-white/40";
                    const bidDate = bet.createdAt
                      ? new Date(bet.createdAt)
                      : null;
                    const dateStr = bidDate
                      ? bidDate.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "--";
                    const timeStr = bidDate
                      ? bidDate.toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : "--";

                    return (
                      <motion.div
                        key={bet._id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,20%,11%)] p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold capitalize text-white">
                              {bet.gameKey?.replace(/-/g, " ") ?? "Game"}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="flex items-center gap-1 text-[11px] text-white/40">
                                <CalendarDays className="h-3 w-3" /> {dateStr}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-white/40">
                                <Clock3 className="h-3 w-3" /> {timeStr}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] ${stColor}`}
                          >
                            {status}
                          </span>
                        </div>

                        <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                            <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/35">
                              <Layers className="h-3 w-3" /> Slot
                            </p>
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${btColor}`}
                            >
                              {btLabel}
                            </span>
                          </div>

                          <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                            <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/35">
                              <Hash className="h-3 w-3" /> Number
                            </p>
                            <p className="font-mono text-base font-bold text-white">
                              {bet.number ?? "--"}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                            <p className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/35">
                              <Coins className="h-3 w-3" />
                              {status === "WON" ? "Won" : "Bid Amount"}
                            </p>
                            {status === "WON" ? (
                              <p className="text-base font-bold text-green-400">
                                +{bet.payout ?? bet.amount}
                              </p>
                            ) : (
                              <p
                                className={`text-base font-bold ${status === "LOST" ? "text-red-400" : "text-primary"}`}
                              >
                                {status === "LOST"
                                  ? `-${bet.amount}`
                                  : bet.amount}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
              <Pagination
                page={bidsPage}
                total={bidsTotalPages}
                onPrev={() => setBidsPage((p) => Math.max(1, p - 1))}
                onNext={() =>
                  setBidsPage((p) => Math.min(bidsTotalPages, p + 1))
                }
                show={bidsHistory.length > ITEMS_PER_PAGE}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function Pagination({
  page,
  total,
  onPrev,
  onNext,
  show,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  show: boolean;
}) {
  if (!show) return null;
  return (
    <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
      <p className="text-xs text-white/40">
        Page {page} of {total}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 1}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={page === total}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default HistoryPage;
