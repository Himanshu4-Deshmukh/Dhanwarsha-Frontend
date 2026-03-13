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
  windowKey?: string;
  windowLabel?: string;
  createdAt?: string;
  updatedAt?: string;
};

type FixedSlotWindow = {
  key: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

const FIXED_SLOT_WINDOWS: FixedSlotWindow[] = [
  { key: 'morning', label: 'Morning', startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
  { key: 'afternoon', label: 'Afternoon', startHour: 13, startMinute: 0, endHour: 16, endMinute: 0 },
  { key: 'evening', label: 'Evening', startHour: 17, startMinute: 0, endHour: 20, endMinute: 0 },
  { key: 'night', label: 'Night', startHour: 21, startMinute: 0, endHour: 24, endMinute: 0 },
];

const RESULT_DELAY_MS = 5 * 60 * 1000;

const buildWindowDate = (baseDate: Date, window: FixedSlotWindow, forEnd = false) => {
  const next = new Date(baseDate);
  next.setHours(forEnd ? window.endHour : window.startHour, forEnd ? window.endMinute : window.startMinute, 0, 0);
  return next;
};

const formatWindowTime = (date: Date) => date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const getWindowKeyFromTimes = (start: Date, end: Date, useUtc = false) => {
  const startHour = useUtc ? start.getUTCHours() : start.getHours();
  const startMinute = useUtc ? start.getUTCMinutes() : start.getMinutes();
  const rawEndHour = useUtc ? end.getUTCHours() : end.getHours();
  const endMinute = useUtc ? end.getUTCMinutes() : end.getMinutes();
  const endHour = rawEndHour === 0 && endMinute === 0 && end.getTime() > start.getTime() ? 24 : rawEndHour;

  const matchedWindow = FIXED_SLOT_WINDOWS.find(
    (window) =>
      window.startHour === startHour &&
      window.startMinute === startMinute &&
      window.endHour === endHour &&
      window.endMinute === endMinute,
  );

  return matchedWindow?.key ?? null;
};

const toEffectiveStatus = (slot: SlotRecord, nowMs: number) => {
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  const resultVisible = nowMs >= end + RESULT_DELAY_MS;

  if (slot.status === 'RESULT_DECLARED' && resultVisible) {
    return 'RESULT_DECLARED';
  }

  if (nowMs < start) {
    return 'UPCOMING';
  }

  if (nowMs >= end) {
    return 'CLOSED';
  }

  return 'OPEN';
};

const normalizeTodaySlots = (slots: SlotRecord[]): SlotRecord[] => {
  const sorted = [...slots].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const slotsByWindow: Record<string, SlotRecord[]> = {};
  const unmatched: SlotRecord[] = [];

  for (const slot of sorted) {
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    const key = slot.windowKey || getWindowKeyFromTimes(start, end, false) || getWindowKeyFromTimes(start, end, true);

    if (!key) {
      unmatched.push(slot);
      continue;
    }

    if (!slotsByWindow[key]) {
      slotsByWindow[key] = [];
    }
    slotsByWindow[key].push(slot);
  }

  const fallbackQueue = [...unmatched];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayKey = today.toISOString().slice(0, 10);

  return FIXED_SLOT_WINDOWS.map((window) => {
    const matched = (slotsByWindow[window.key] || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime(),
      )[0];
    const fallback = fallbackQueue.shift();
    const slot = matched || fallback;

    const windowStart = buildWindowDate(today, window, false);
    const windowEnd = buildWindowDate(today, window, true);
    const windowLabel = `${window.label} (${formatWindowTime(windowStart)} - ${formatWindowTime(windowEnd)})`;

    if (slot) {
      return {
        ...slot,
        windowKey: window.key,
        windowLabel,
        isPlaceholder: false,
      };
    }

    return {
      _id: `placeholder-${window.key}-${dayKey}`,
      startTime: windowStart.toISOString(),
      endTime: windowEnd.toISOString(),
      status: 'UPCOMING',
      betAmount: null,
      winAmount: null,
      winningNumber: null,
      isPlaceholder: true,
      windowKey: window.key,
      windowLabel,
    };
  });
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
      const normalizedToday = normalizeTodaySlots(todayData);

      setTodaySlots(normalizedToday);

      const nextAmounts = normalizedToday
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
      await api.setWinningNumber(slotId, num);
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
    const nowMs = Date.now();
    const start = new Date(slot.startTime).getTime();
    const end = new Date(slot.endTime).getTime();
    const effectiveStatus = toEffectiveStatus(slot, nowMs);
    const sc = STATUS_COLORS[effectiveStatus] || STATUS_COLORS.CLOSED;
    const isExpanded = expandedSlot === slot._id;
    const slotExposure = exposure[slot._id];
    const canExpand = !slot.isPlaceholder;
    const canUpdateAmounts = !slot.isPlaceholder && nowMs < start;
    const canSetWinning = !slot.isPlaceholder && slot.status !== 'RESULT_DECLARED' && nowMs < end;

    return (
      <motion.div
        key={slot._id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        className="overflow-hidden rounded-xl border border-white/5 bg-white/5"
      >
        <div className="flex items-center gap-4 p-4">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${sc.bg}`}>
            <div className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${effectiveStatus === 'OPEN' ? 'animate-pulse' : ''}`} />
            <span className={`text-xs font-semibold ${sc.text}`}>{effectiveStatus}</span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">
              {slot.windowLabel || `${new Date(slot.startTime).toLocaleString()} -> ${new Date(slot.endTime).toLocaleTimeString()}`}
            </p>
            <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
              <span className="flex items-center gap-1">
                <Coins className="h-3 w-3" /> Bet: {slot.betAmount ?? '--'}
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3 text-green-400" /> Win: {slot.winAmount ?? '--'}
              </span>
              {slot.winningNumber !== undefined && slot.winningNumber !== null && (
                <span className="flex items-center gap-1 text-primary">
                  <Target className="h-3 w-3" /> Winner: #{slot.winningNumber}
                </span>
              )}
            </div>
          </div>

          {canExpand && (
            <button
              onClick={() => toggleExpand(slot)}
              className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 transition-colors hover:text-white"
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
                      disabled={updatingAmounts[slot._id] || !canUpdateAmounts}
                      className="gold-glow rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-50"
                    >
                      {updatingAmounts[slot._id] ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Update'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/40">Amounts can be updated before slot start time.</p>
                </div>

                {canSetWinning && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="h-4 w-4" />
                      Set Winning Number
                    </h3>
                    <div className="flex gap-3">
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
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-white/80">
                      <BarChart2 className="h-4 w-4" />
                      Bet Exposure (0-99)
                    </h3>
                    <button onClick={() => fetchExposure(slot._id)} className="text-xs text-primary hover:underline">
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Today Slots</h1>
          <p className="mt-1 text-sm text-white/40">
            Only these fixed windows are shown: 9 AM-12 PM, 1 PM-4 PM, 5 PM-8 PM, 9 PM-12 AM.
          </p>
        </div>
        <button
          onClick={() => fetchSlots()}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:text-white"
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

function ExposureGrid({ exposure, winningNumber }: { exposure: Record<string, any>; winningNumber?: number }) {
  const max = Math.max(...Object.values(exposure).map((v: any) => v.totalAmount || 0), 1);

  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 100 }, (_, i) => {
        const data = exposure[i] || { count: 0, totalAmount: 0 };
        const intensity = data.totalAmount / max;
        const isWinner = winningNumber === i;

        return (
          <div
            key={i}
            title={`#${i}: ${data.count} bets, ${data.totalAmount} coins`}
            className={`relative flex aspect-square cursor-default flex-col items-center justify-center rounded text-center transition-all ${
              isWinner
                ? 'bg-primary/20 ring-2 ring-primary'
                : data.count > 0
                  ? 'bg-red-500/20 hover:bg-red-500/30'
                  : 'bg-white/5'
            }`}
            style={data.count > 0 && !isWinner ? { opacity: 0.5 + intensity * 0.5 } : {}}
          >
            <span
              className={`text-[9px] font-bold leading-none ${
                isWinner ? 'text-primary' : data.count > 0 ? 'text-red-400' : 'text-white/20'
              }`}
            >
              {i}
            </span>
            {data.count > 0 && <span className="mt-0.5 text-[7px] leading-none text-white/40">{data.count}</span>}
          </div>
        );
      })}
    </div>
  );
}
