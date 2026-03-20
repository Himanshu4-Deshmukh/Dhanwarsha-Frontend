import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Clock,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Trophy,
  Coins,
  Target,
  Eye,
  RefreshCw,
} from "lucide-react";

type SlotRecord = {
  _id: string;
  startTime: string;
  endTime: string;
  status: string;
  betAmount: number | null;
  winAmount: number | null;
  winningNumber?: number | null;
  isPlaceholder?: boolean;
  windowLabel?: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    OPEN: {
      bg: "bg-green-500/10",
      text: "text-green-400",
      dot: "bg-green-400",
    },
    CLOSED: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-400" },
    RESULT_DECLARED: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-400",
    },
  };

export default function AdminPastSlots() {
  const [pastSlots, setPastSlots] = useState<SlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [exposure, setExposure] = useState<Record<string, any>>({});
  const [winningInputs, setWinningInputs] = useState<Record<string, string>>(
    {},
  );
  const [amountInputs, setAmountInputs] = useState<
    Record<string, { betAmount: string; winAmount: string }>
  >({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [updatingAmounts, setUpdatingAmounts] = useState<
    Record<string, boolean>
  >({});

  const fetchPastSlots = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const [todayData, allData] = await Promise.all([
        api.getTodaySlots(),
        api.getSlots(),
      ]);
      const todayIds = new Set(
        todayData.filter((slot) => !slot.isPlaceholder).map((slot) => slot._id),
      );

      const nonToday = allData
        .filter((slot) => !todayIds.has(slot._id))
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );

      setPastSlots([...nonToday]);

      const nextAmounts = nonToday.reduce(
        (
          acc: Record<string, { betAmount: string; winAmount: string }>,
          slot,
        ) => {
          acc[slot._id] = {
            betAmount: String(slot.betAmount ?? 10),
            winAmount: String(slot.winAmount ?? 95),
          };
          return acc;
        },
        {},
      );

      setAmountInputs(nextAmounts);
    } catch {
      if (!silent) {
        toast.error("Failed to fetch past slots");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPastSlots();
    const interval = setInterval(() => fetchPastSlots(true), 15000);
    return () => clearInterval(interval);
  }, [fetchPastSlots]);

  const fetchExposure = async (slotId: string) => {
    try {
      const data = await api.getSlotExposure(slotId);
      setExposure((prev) => ({ ...prev, [slotId]: data }));
    } catch {
      toast.error("Failed to load exposure");
    }
  };

  const toggleExpand = (slotId: string) => {
    if (expandedSlot === slotId) {
      setExpandedSlot(null);
      return;
    }

    setExpandedSlot(slotId);
    fetchExposure(slotId);
  };

  const setWinningNumber = async (slotId: string) => {
    const num = parseInt(winningInputs[slotId] ?? "", 10);
    if (isNaN(num) || num < 0 || num > 99) {
      toast.error("Enter a valid number (0-99)");
      return;
    }

    setSubmitting((prev) => ({ ...prev, [slotId]: true }));
    try {
      await api.setWinningNumber(slotId, num);
      toast.success(`Winning number ${num} set`);
      await fetchPastSlots(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to set winning number");
    } finally {
      setSubmitting((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const updateSlotAmounts = async (slotId: string) => {
    const inputs = amountInputs[slotId];
    const betAmount = parseInt(inputs?.betAmount || "", 10);
    const winAmount = parseInt(inputs?.winAmount || "", 10);

    if (isNaN(betAmount) || betAmount < 1) {
      toast.error("Bet amount must be at least 1");
      return;
    }

    if (isNaN(winAmount) || winAmount < 1) {
      toast.error("Win amount must be at least 1");
      return;
    }

    setUpdatingAmounts((prev) => ({ ...prev, [slotId]: true }));
    try {
      await api.updateSlotAmounts(slotId, betAmount, winAmount);
      toast.success(`Updated amounts to ${betAmount}-${winAmount}`);
      await fetchPastSlots(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to update slot amounts");
    } finally {
      setUpdatingAmounts((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const groupedPastSlots = useMemo<[string, SlotRecord[]][]>(() => {
    return Object.entries(
      pastSlots.reduce<Record<string, SlotRecord[]>>((acc, slot) => {
        const date = new Date(slot.startTime).toDateString();
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
      }, {}),
    ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [pastSlots]);

  const totalPages = Math.max(groupedPastSlots.length, 1);
  const currentPage = Math.min(page, totalPages);
  const visibleDayGroup = groupedPastSlots[currentPage - 1] ?? null;

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const renderSlotCard = (slot: SlotRecord, index: number) => {
    const sc = STATUS_COLORS[slot.status] || STATUS_COLORS.CLOSED;
    const isExpanded = expandedSlot === slot._id;
    const slotExposure = exposure[slot._id];

    return (
      <motion.div
        key={slot._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="overflow-hidden rounded-xl border border-white/5 bg-white/5"
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div
            className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 ${sc.bg}`}
          >
            <div
              className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${slot.status === "OPEN" ? "animate-pulse" : ""}`}
            />
            <span className={`text-xs font-semibold ${sc.text}`}>
              {slot.status}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {slot.windowLabel ||
                `${new Date(slot.startTime).toLocaleString()} -> ${new Date(slot.endTime).toLocaleTimeString()}`}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" /> Bet: {slot.betAmount ?? "--"}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-green-400" /> Win:{" "}
                {slot.winAmount ?? "--"}
              </span>
              {slot.winningNumber !== undefined &&
                slot.winningNumber !== null && (
                  <span className="flex items-center gap-1 text-primary">
                    <Target className="h-3 w-3" /> Winner: #{String(slot.winningNumber).padStart(2, '0')}
                  </span>
                )}
            </div>
          </div>

          <button
            onClick={() => toggleExpand(slot._id)}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white sm:ml-auto sm:w-auto sm:justify-start sm:py-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-white/5"
            >
              <div className="space-y-4 p-4">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
                    <Coins className="h-4 w-4" />
                    Update Bet and Win Amounts
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="number"
                      min={1}
                      value={amountInputs[slot._id]?.betAmount ?? ""}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({
                          ...prev,
                          [slot._id]: {
                            betAmount: e.target.value,
                            winAmount:
                              prev[slot._id]?.winAmount ??
                              String(slot.winAmount ?? 95),
                          },
                        }))
                      }
                      placeholder="Bet amount"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      min={1}
                      value={amountInputs[slot._id]?.winAmount ?? ""}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({
                          ...prev,
                          [slot._id]: {
                            betAmount:
                              prev[slot._id]?.betAmount ??
                              String(slot.betAmount ?? 10),
                            winAmount: e.target.value,
                          },
                        }))
                      }
                      placeholder="Win amount"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateSlotAmounts(slot._id)}
                      disabled={updatingAmounts[slot._id]}
                      className="gold-glow rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-50"
                    >
                      {updatingAmounts[slot._id] ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                      ) : (
                        "Update"
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    Amounts can be updated before slot start time.
                  </p>
                </div>

                {slot.status === "OPEN" && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="h-4 w-4" />
                      Set Winning Number
                    </h3>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="number"
                        min={0}
                        max={99}
                        value={winningInputs[slot._id] || ""}
                        onChange={(e) =>
                          setWinningInputs((prev) => ({
                            ...prev,
                            [slot._id]: e.target.value,
                          }))
                        }
                        placeholder="0 - 99"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => setWinningNumber(slot._id)}
                        disabled={submitting[slot._id]}
                        className="gold-glow rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-50"
                      >
                        {submitting[slot._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set"
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white/80">
                      <BarChart2 className="h-4 w-4" />
                      Bet Exposure (0-99)
                    </h3>
                    <button
                      onClick={() => fetchExposure(slot._id)}
                      className="w-fit text-xs text-primary hover:underline"
                    >
                      Refresh
                    </button>
                  </div>
                  {slotExposure ? (
                    <ExposureGrid
                      exposure={slotExposure}
                      winningNumber={slot.winningNumber ?? undefined}
                    />
                  ) : (
                    <div className="flex h-10 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Past Slots
          </h1>
          <p className="mt-1 text-sm text-white/40">
            Page 1 shows yesterday&apos;s slots. Older dates continue on later
            pages.
          </p>
        </div>
        <button
          onClick={() => fetchPastSlots()}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:text-white sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : groupedPastSlots.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/5 py-10 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-white/20" />
          <p className="text-white/40">No past slots yet.</p>
        </div>
      ) : visibleDayGroup ? (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="rounded-xl border border-white/5 bg-white/5 p-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-white/40">
                  {new Date(visibleDayGroup[0]).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="mt-1 text-xs text-white/35">
                  {currentPage === 1
                    ? "Yesterday's slots"
                    : `Past slots page ${currentPage}`}
                </p>
              </div>
            </div>

            {visibleDayGroup[1].map((slot, i) => renderSlotCard(slot, i))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-xs text-white/40">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
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
                        nextPage === currentPage
                          ? "bg-gradient-gold text-[hsl(220,20%,7%)]"
                          : "border border-white/10 text-white/60 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {nextPage}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ExposureGrid({
  exposure,
  winningNumber,
}: {
  exposure: Record<string, any>;
  winningNumber?: number;
}) {
  const max = Math.max(
    ...Object.values(exposure).map((v: any) => v.totalAmount || 0),
    1,
  );

  return (
    <div className="grid grid-cols-5 gap-1 min-[420px]:grid-cols-6 sm:grid-cols-10">
      {Array.from({ length: 100 }, (_, i) => {
        const data = exposure[i] || { count: 0, totalAmount: 0 };
        const intensity = data.totalAmount / max;
        const isWinner = winningNumber === i;

        return (
          <div
            key={i}
            title={`#${String(i).padStart(2, '0')}: ${data.count} bets, ${data.totalAmount} coins`}
            className={`relative flex aspect-square cursor-default flex-col items-center justify-center rounded text-center transition-all ${
              isWinner
                ? "bg-primary/20 ring-2 ring-primary"
                : data.count > 0
                  ? "bg-red-500/20 hover:bg-red-500/30"
                  : "bg-white/5"
            }`}
            style={
              data.count > 0 && !isWinner
                ? { opacity: 0.5 + intensity * 0.5 }
                : {}
            }
          >
            <span
              className={`text-[9px] font-bold leading-none ${
                isWinner
                  ? "text-primary"
                  : data.count > 0
                    ? "text-red-400"
                    : "text-white/20"
              }`}
            >
              {String(i).padStart(2, '0')}
            </span>
            {data.count > 0 && (
              <span className="mt-0.5 text-[7px] leading-none text-white/40">
                {data.count}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
