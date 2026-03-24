import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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
} from 'lucide-react';

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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  CLOSED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  RESULT_DECLARED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  UPCOMING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
};

export default function AdminSlots() {
  const [todaySlots, setTodaySlots] = useState<SlotRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [exposure, setExposure] = useState<Record<string, any>>({});
  const [winningInputs, setWinningInputs] = useState<Record<string, string>>({});
  const [amountInputs, setAmountInputs] = useState<Record<string, { betAmount: string; winAmount: string }>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [updatingAmounts, setUpdatingAmounts] = useState<Record<string, boolean>>({});

  const fetchSlots = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      const todayData = await api.getTodaySlots();
      const sortedToday = [...todayData].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      );

      setTodaySlots(sortedToday);

      const nextAmounts = sortedToday
        .filter((slot) => !slot.isPlaceholder)
        .reduce((acc: Record<string, { betAmount: string; winAmount: string }>, slot) => {
          acc[slot._id] = {
            betAmount: String(slot.betAmount ?? 10),
            winAmount: String(slot.winAmount ?? 95),
          };
          return acc;
        }, {});

      setAmountInputs(nextAmounts);
    } catch {
      if (!silent) {
        toast.error('Failed to fetch slots');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(() => fetchSlots(true), 15000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  const fetchExposure = async (slotId: string) => {
    try {
      const data = await api.getSlotExposure(slotId);
      setExposure((prev) => ({ ...prev, [slotId]: data }));
    } catch {
      toast.error('Failed to load exposure');
    }
  };

  const toggleExpand = (slot: SlotRecord) => {
    if (slot.isPlaceholder) {
      return;
    }

    if (expandedSlot === slot._id) {
      setExpandedSlot(null);
      return;
    }

    setExpandedSlot(slot._id);
    fetchExposure(slot._id);
  };

  const setWinningNumber = async (slotId: string) => {
    const num = parseInt(winningInputs[slotId] ?? '', 10);
    if (isNaN(num) || num < 0 || num > 99) {
      toast.error('Enter a valid number (0-99)');
      return;
    }

    setSubmitting((prev) => ({ ...prev, [slotId]: true }));
    try {
      await api.setWinningNumber(slotId, String(num).padStart(2, '0'));
      toast.success(`Winning number ${num} set`);
      await fetchSlots(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to set winning number');
    } finally {
      setSubmitting((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const updateSlotAmounts = async (slotId: string) => {
    const inputs = amountInputs[slotId];
    const betAmount = parseInt(inputs?.betAmount || '', 10);
    const winAmount = parseInt(inputs?.winAmount || '', 10);

    if (isNaN(betAmount) || betAmount < 1) {
      toast.error('Bet amount must be at least 1');
      return;
    }

    if (isNaN(winAmount) || winAmount < 1) {
      toast.error('Win amount must be at least 1');
      return;
    }

    setUpdatingAmounts((prev) => ({ ...prev, [slotId]: true }));
    try {
      await api.updateSlotAmounts(slotId, betAmount, winAmount);
      toast.success(`Updated amounts to ${betAmount}-${winAmount}`);
      await fetchSlots(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update slot amounts');
    } finally {
      setUpdatingAmounts((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const renderSlotCard = (slot: SlotRecord, index: number) => {
    const sc = STATUS_COLORS[slot.status] || STATUS_COLORS.CLOSED;
    const isExpanded = expandedSlot === slot._id;
    const slotExposure = exposure[slot._id];
    const canExpand = !slot.isPlaceholder;

    return (
      <motion.div
        key={slot._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="overflow-hidden rounded-xl border border-white/5 bg-white/5"
      >
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className={`flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 ${sc.bg}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${slot.status === 'OPEN' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-semibold ${sc.text}`}>{slot.status}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {slot.windowLabel || `${new Date(slot.startTime).toLocaleString()} -> ${new Date(slot.endTime).toLocaleTimeString()}`}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" /> Bet: {slot.betAmount ?? '--'}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-green-400" /> Win: {slot.winAmount ?? '--'}
              </span>
              {slot.winningNumber !== undefined && slot.winningNumber !== null && (
                <span className="flex items-center gap-1 text-primary">
                  <Target className="h-3 w-3" /> Winner: #{String(slot.winningNumber).padStart(2, '0')}
                </span>
              )}
            </div>
          </div>

          {canExpand && (
            <button
              onClick={() => toggleExpand(slot)}
              className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/60 transition-colors hover:text-white sm:ml-auto sm:w-auto sm:justify-start sm:py-1.5"
            >
              <Eye className="h-3.5 w-3.5" />
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isExpanded && canExpand && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
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
                      value={amountInputs[slot._id]?.betAmount ?? ''}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({
                          ...prev,
                          [slot._id]: {
                            betAmount: e.target.value,
                            winAmount: prev[slot._id]?.winAmount ?? String(slot.winAmount ?? 95),
                          },
                        }))
                      }
                      placeholder="Bet amount"
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      type="number"
                      min={1}
                      value={amountInputs[slot._id]?.winAmount ?? ''}
                      onChange={(e) =>
                        setAmountInputs((prev) => ({
                          ...prev,
                          [slot._id]: {
                            betAmount: prev[slot._id]?.betAmount ?? String(slot.betAmount ?? 10),
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
                      {updatingAmounts[slot._id] ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/40">Amounts can be updated before slot start time.</p>
                </div>

                {slot.status === 'OPEN' && (
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
                        value={winningInputs[slot._id] || ''}
                        onChange={(e) => setWinningInputs((prev) => ({ ...prev, [slot._id]: e.target.value }))}
                        placeholder="0 - 99"
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => setWinningNumber(slot._id)}
                        disabled={submitting[slot._id]}
                        className="gold-glow rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-50"
                      >
                        {submitting[slot._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
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
                    <button onClick={() => fetchExposure(slot._id)} className="w-fit text-xs text-primary hover:underline">
                      Refresh
                    </button>
                  </div>
                  {slotExposure ? (
                    <ExposureGrid exposure={slotExposure} winningNumber={slot.winningNumber ?? undefined} />
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
          <h1 className="font-display text-2xl font-bold text-white">Today Slots</h1>
          <p className="mt-1 text-sm text-white/40">
            Only these fixed windows are shown: 9 AM-12 PM, 1 PM-4 PM, 5 PM-8 PM, 9 PM-12 AM.
          </p>
        </div>
        <button
          onClick={() => fetchSlots()}
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
      ) : (
        <section className="space-y-3">
          {todaySlots.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-white/5 py-10 text-center">
              <Clock className="mx-auto mb-3 h-8 w-8 text-white/20" />
              <p className="text-white/40">No slots found for today.</p>
            </div>
          ) : (
            <div className="space-y-3">{todaySlots.map((slot, i) => renderSlotCard(slot, i))}</div>
          )}
        </section>
      )}
    </div>
  );
}

function ExposureGrid({ exposure, winningNumber }: { exposure: Record<string, any>; winningNumber?: number | null }) {
  const maxAmount = Math.max(...Object.values(exposure).map((v: any) => v.totalAmount || 0), 1);

  return (
    <div className="grid grid-cols-5 gap-2 min-[420px]:grid-cols-6 sm:grid-cols-10">
      {Array.from({ length: 100 }, (_, i) => {
        const data = exposure[i] || { count: 0, totalAmount: 0 };
        const isWinner = winningNumber !== undefined && winningNumber !== null && Number(winningNumber) === i;

        const riskPercentage = (data.totalAmount / maxAmount) * 100;
        const isHighRisk = riskPercentage > 80 && data.totalAmount > 0;
        const isMediumRisk = riskPercentage > 20 && riskPercentage <= 80;

        let containerClasses = "bg-white/5 text-white/20 border-white/5";
        let specialIcon = null;

        if (isWinner) {
          if (isHighRisk) {
            containerClasses = "bg-gradient-to-t from-red-600 to-amber-400 text-white border-yellow-300 z-30 animate-fire ring-2 ring-white/50";
            specialIcon = <div className="absolute -top-10 text-[58px]">🔥</div>;
          } else {
            containerClasses = "bg-primary/40 text-primary border-primary ring-2 ring-primary/50 z-20 scale-110 shadow-lg";
            specialIcon = <Trophy className="absolute -top-2 h-3 w-3 fill-primary stroke-black" />;
          }
        }
        else if (isHighRisk) {
          containerClasses = "border-red-500 text-red-500 z-10 animate-red-alert ring-1 ring-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";
          specialIcon = <div className="absolute -top-2 text-[7px] font-black bg-red-600 text-white px-1 rounded-full">DANGER</div>;
        }
        else if (isMediumRisk) {
          containerClasses = "bg-amber-500/20 text-amber-500 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
          specialIcon = <div className="absolute -top-2 text-[7px] font-black bg-amber-600 text-white px-1 rounded-full">HIGH</div>;
        }
        else if (data.count > 0) {
          containerClasses = "bg-blue-500/10 text-blue-300 border-blue-500/20";
        }

        return (
          <div
            key={i}
            className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border transition-all duration-300 font-black ${containerClasses}`}
          >
            {specialIcon}
            <span className={`text-[14px] ${isWinner ? 'scale-125' : ''}`}>
              {String(i).padStart(2, '0')}
            </span>
            {data.count > 0 && (
              <span className={`mt-0.5 text-[11px] ${isWinner || isHighRisk || isMediumRisk ? 'text-white' : 'opacity-60'}`}>
                {data.totalAmount}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
