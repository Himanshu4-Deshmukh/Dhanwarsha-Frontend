import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Plus, Loader2, Clock, CheckCircle, BarChart2,
  ChevronDown, ChevronUp, Hash, Trophy, Coins, X,
  Target, Eye, RefreshCw
} from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  OPEN: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  CLOSED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  RESULT_DECLARED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
};

export default function AdminSlots() {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [exposure, setExposure] = useState<Record<string, any>>({});
  const [winningInputs, setWinningInputs] = useState<Record<string, string>>({});
  const [amountInputs, setAmountInputs] = useState<Record<string, { betAmount: string; winAmount: string }>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [updatingAmounts, setUpdatingAmounts] = useState<Record<string, boolean>>({});

  // Local datetime string for inputs
  const toLocalDatetimeString = (date: Date) => {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  const now = new Date();
  const quickStart = toLocalDatetimeString(now);
  const quickEnd = toLocalDatetimeString(new Date(now.getTime() + 15 * 60 * 1000));

  // Create form
  const [form, setForm] = useState({
    startTime: quickStart,
    endTime: quickEnd,
    betAmount: 10,
    winAmount: 95,
  });

  const fetchSlots = useCallback(async () => {
    try {
      const data = await api.getSlots();
      setSlots(data);
      const nextAmounts = data.reduce(
        (acc: Record<string, { betAmount: string; winAmount: string }>, slot: any) => {
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
      toast.error('Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    const interval = setInterval(fetchSlots, 15000);
    return () => clearInterval(interval);
  }, [fetchSlots]);

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error('Invalid start or end time. Use the format YYYY-MM-DDTHH:MM.');
      return;
    }

    if (startDate >= endDate) {
      toast.error('End time must be after start time.');
      return;
    }

    // Proceed if valid
    try {
      await api.createSlot({
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        betAmount: form.betAmount,
        winAmount: form.winAmount,
      });
      toast.success('Slot created!');
      setShowCreate(false);
      fetchSlots();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create slot');
    }
  };

  const fetchExposure = async (slotId: string) => {
    try {
      const data = await api.getSlotExposure(slotId);
      setExposure(prev => ({ ...prev, [slotId]: data }));
    } catch {
      toast.error('Failed to load exposure');
    }
  };

  const toggleExpand = (slotId: string) => {
    if (expandedSlot === slotId) {
      setExpandedSlot(null);
    } else {
      setExpandedSlot(slotId);
      fetchExposure(slotId);
    }
  };

  const setWinningNumber = async (slotId: string) => {
    const num = parseInt(winningInputs[slotId]);
    if (isNaN(num) || num < 0 || num > 99) {
      toast.error('Enter a valid number (0-99)');
      return;
    }
    setSubmitting(prev => ({ ...prev, [slotId]: true }));
    try {
      await api.setWinningNumber(slotId, num);
      toast.success(`Winning number ${num} set!`);
      fetchSlots();
    } catch (err: any) {
      toast.error(err.message || 'Failed to set winning number');
    } finally {
      setSubmitting(prev => ({ ...prev, [slotId]: false }));
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
      await fetchSlots();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update slot amounts');
    } finally {
      setUpdatingAmounts((prev) => ({ ...prev, [slotId]: false }));
    }
  };

  const groupedSlots: [string, typeof slots][] = Object.entries(
    slots.reduce<Record<string, typeof slots>>((acc, slot) => {
      const date = new Date(slot.startTime).toDateString();

      if (!acc[date]) acc[date] = [];
      acc[date].push(slot);

      return acc;
    }, {})
  ).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">Slots</h1>
          <p className="mt-1 text-sm text-white/40">Manage betting slots and declare results</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSlots}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] hover:opacity-90 transition-opacity gold-glow"
          >
            <Plus className="h-4 w-4" /> New Slot
          </button>
        </div>
      </div>

      {/* Create Slot Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md mx-4 rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white font-display">Create New Slot</h2>
                <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={createSlot} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Start Time</label>
                    <input
                      type="datetime-local"
                      value={form.startTime || quickStart}
                      onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">End Time</label>
                    <input
                      type="datetime-local"
                      value={form.endTime || quickEnd}
                      onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Bet Amount (coins)</label>
                    <input
                      type="number"
                      value={form.betAmount}
                      onChange={e => setForm(f => ({ ...f, betAmount: +e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/50">Win Amount (coins)</label>
                    <input
                      type="number"
                      value={form.winAmount}
                      onChange={e => setForm(f => ({ ...f, winAmount: +e.target.value }))}
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      min={1}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 rounded-lg border border-white/10 py-2.5 text-sm text-white/60 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-gradient-gold py-2.5 text-sm font-semibold text-[hsl(220,20%,7%)] gold-glow"
                  >
                    Create Slot
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slots List */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-white/5 py-16 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-white/20" />
          <p className="text-white/40">No slots yet. Create your first slot!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSlots.map(([date, daySlots]) => (
            <div key={date} className="space-y-3">

              {/* Date Header */}
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <h2 className="text-sm font-semibold text-white/60">
                  {new Date(date).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </h2>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Slots for this date */}
              {daySlots.map((slot, i) => {
                const sc = STATUS_COLORS[slot.status] || STATUS_COLORS.CLOSED;
                const isExpanded = expandedSlot === slot._id;
                const slotExposure = exposure[slot._id];

                return (
                  <motion.div
                    key={slot._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-white/5 bg-white/5 overflow-hidden"
                  >
                    {/* Slot Header */}
                    <div className="flex items-center gap-4 p-4">
                      <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${sc.bg}`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${slot.status === 'OPEN' ? 'animate-pulse' : ''}`} />
                        <span className={`text-xs font-semibold ${sc.text}`}>{slot.status}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">
                          {new Date(slot.startTime).toLocaleString()} → {new Date(slot.endTime).toLocaleTimeString()}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-white/40">
                          <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Bet: {slot.betAmount}</span>
                          <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-green-400" /> Win: {slot.winAmount}</span>
                          {slot.winningNumber !== undefined && slot.winningNumber !== null && (
                            <span className="flex items-center gap-1 text-primary">
                              <Target className="h-3 w-3" /> Winner: #{slot.winningNumber}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(slot._id)}
                        className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/60 hover:text-white transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </div>

                    {/* Expanded Panel */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5"
                        >
                          <div className="p-4 space-y-4">
                            {/* Update Bet/Win Amounts */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                              <h3 className="mb-3 text-sm font-semibold text-white/80 flex items-center gap-2">
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
                                  className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] gold-glow disabled:opacity-50"
                                >
                                  {updatingAmounts[slot._id] ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Update'}
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-white/40">
                                Amounts can be updated before slot start time.
                              </p>
                            </div>

                            {/* Set Winning Number */}
                            {slot.status === 'OPEN' && (
                              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                <h3 className="mb-3 text-sm font-semibold text-primary flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Set Winning Number
                                </h3>
                                <div className="flex gap-3">
                                  <input
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={winningInputs[slot._id] || ''}
                                    onChange={e => setWinningInputs(prev => ({ ...prev, [slot._id]: e.target.value }))}
                                    placeholder="0 – 99"
                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
                                  />
                                  <button
                                    onClick={() => setWinningNumber(slot._id)}
                                    disabled={submitting[slot._id]}
                                    className="rounded-lg bg-gradient-gold px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] gold-glow disabled:opacity-50"
                                  >
                                    {submitting[slot._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set'}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Bet Exposure Grid */}
                            <div>
                              <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                  <BarChart2 className="h-4 w-4" />
                                  Bet Exposure (0–99)
                                </h3>
                                <button
                                  onClick={() => fetchExposure(slot._id)}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Refresh
                                </button>
                              </div>
                              {slotExposure ? (
                                <ExposureGrid exposure={slotExposure} winningNumber={slot.winningNumber} />
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
              })}
            </div>
          ))}
        </div>

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
            className={`relative aspect-square rounded text-center flex flex-col items-center justify-center cursor-default transition-all ${isWinner
                ? 'ring-2 ring-primary bg-primary/20'
                : data.count > 0
                  ? 'bg-red-500/20 hover:bg-red-500/30'
                  : 'bg-white/5'
              }`}
            style={data.count > 0 && !isWinner ? { opacity: 0.5 + intensity * 0.5 } : {}}
          >
            <span className={`text-[9px] font-bold leading-none ${isWinner ? 'text-primary' : data.count > 0 ? 'text-red-400' : 'text-white/20'}`}>
              {i}
            </span>
            {data.count > 0 && (
              <span className="text-[7px] text-white/40 leading-none mt-0.5">{data.count}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
