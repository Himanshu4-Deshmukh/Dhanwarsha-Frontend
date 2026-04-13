import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock, Loader2, Target } from "lucide-react";
import { toast } from "sonner";

type FixedSlotWindow = {
  key: string;
  label: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
};

const FIXED_SLOT_WINDOWS: FixedSlotWindow[] = [
  {
    key: "morning",
    label: "Morning",
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
  },
  {
    key: "afternoon",
    label: "Afternoon",
    startHour: 13,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
  },
  {
    key: "evening",
    label: "Evening",
    startHour: 17,
    startMinute: 0,
    endHour: 20,
    endMinute: 0,
  },
  {
    key: "night",
    label: "Night",
    startHour: 21,
    startMinute: 0,
    endHour: 24,
    endMinute: 0,
  },
];

const RESULT_DELAY_MS = 5 * 60 * 1000;

const HomePage = () => {
  const { user } = useAuth();

  const [balance, setBalance] = useState<number | null>(null);
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [betConfirmOpen, setBetConfirmOpen] = useState(false);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [customBetAmount, setCustomBetAmount] = useState<number>(10);

  const buildWindowDate = useCallback(
    (baseDate: Date, window: FixedSlotWindow, forEnd = false) => {
      const next = new Date(baseDate);
      next.setHours(
        forEnd ? window.endHour : window.startHour,
        forEnd ? window.endMinute : window.startMinute,
        0,
        0,
      );
      return next;
    },
    [],
  );

  const formatWindowTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }, []);

  const getWindowKeyFromTimes = useCallback(
    (start: Date, end: Date, useUtc = false) => {
      const startHour = useUtc ? start.getUTCHours() : start.getHours();
      const startMinute = useUtc ? start.getUTCMinutes() : start.getMinutes();
      const rawEndHour = useUtc ? end.getUTCHours() : end.getHours();
      const endMinute = useUtc ? end.getUTCMinutes() : end.getMinutes();
      const endHour =
        rawEndHour === 0 && endMinute === 0 && end.getTime() > start.getTime()
          ? 24
          : rawEndHour;

      const matchedWindow = FIXED_SLOT_WINDOWS.find(
        (window) =>
          window.startHour === startHour &&
          window.startMinute === startMinute &&
          window.endHour === endHour &&
          window.endMinute === endMinute,
      );

      return matchedWindow?.key ?? null;
    },
    [],
  );

  const isLiveSlot = useCallback((slot: any) => {
    const now = Date.now();
    const start = new Date(slot.startTime).getTime();
    const end = new Date(slot.endTime).getTime();
    return slot.status === "OPEN" && now >= start && now < end;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, slotsRes, betsRes] = await Promise.all([
        api.getBalance(),
        api.getTodaySlots(),
        api.getMyBets().catch(() => []),
      ]);

      setBalance(walletRes.balance);
      setAllSlots(slotsRes);
      setMyBets(betsRes.slice(0, 20));
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // const slots = useMemo(() => {
  //   return allSlots.map((slot) => ({
  //     ...slot,
  //     displayLabel: slot.windowLabel,
  //     isPlaceholder: !!slot.isPlaceholder,
  //   }));
  // }, [allSlots]);

  const slots = useMemo(() => {
    return [...allSlots]
      .sort(
        (a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      )
      .map((slot) => ({
        ...slot,
        displayLabel: slot.windowLabel,
        isPlaceholder: !!slot.isPlaceholder,
      }));
  }, [allSlots]);

  useEffect(() => {
    if (!selectedSlot) return;

    const latestSlot = allSlots.find((slot) => slot._id === selectedSlot._id);
    if (!latestSlot || !isLiveSlot(latestSlot)) {
      setSelectedSlot(null);
      setBetConfirmOpen(false);
      setSelectedNumber(null);
    }
  }, [allSlots, isLiveSlot, selectedSlot]);

  useEffect(() => {
    if (!selectedSlot?.endTime) return;

    const update = () => {
      const diff = new Date(selectedSlot.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("CLOSING");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
      );
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [selectedSlot]);

  const placeBet = async () => {
    if (selectedNumber === null || !selectedSlot) return;

    if (customBetAmount <= 0) {
      toast.error("Bet amount must be greater than 0");
      return;
    }

    setBetting(true);
    try {
      await api.placeBet(
        selectedSlot._id,
        String(selectedNumber).padStart(2, "0"),
        customBetAmount,
      );

      const multiplier =
        (selectedSlot.winAmount || 900) / (selectedSlot.betAmount || 10);
      const winEstimate = customBetAmount * multiplier;

      toast.success(
        `Bet placed on #${String(selectedNumber).padStart(2, "0")}`,
        {
          description: `${customBetAmount} rupees deducted. Win ${winEstimate} rupees.`,
        },
      );

      setBetConfirmOpen(false);
      setSelectedNumber(null);
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          "Failed to place bet. Make sure your balance is sufficient.",
      );
    } finally {
      setBetting(false);
    }
  };

  const activeBets = selectedSlot
    ? myBets.filter((b) => {
        const bSlotId = typeof b.slotId === "object" ? b.slotId?._id : b.slotId;
        return bSlotId === selectedSlot._id;
      })
    : [];

  if (loading) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold"
        >
          <Target className="h-8 w-8 text-[hsl(220,20%,7%)]" />
        </motion.div>
        <p className="text-sm text-white/40">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40">Welcome back</p>
          <h1 className="text-xl font-bold text-white font-display">
            {user?.name || "Player"}
          </h1>
        </div>
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2"
        >
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary font-display">
            {balance ?? 0}
          </span>
          <span className="text-xs text-white/40">rupees</span>
        </motion.div>
      </div>

      {slots.map((slot) => {
        const isSelected = selectedSlot?._id === slot._id;
        const now = Date.now();
        const start = new Date(slot.startTime).getTime();
        const end = new Date(slot.endTime).getTime();

        const isLive = slot.status === "OPEN" && now >= start && now < end;
        const isUpcoming = now < start;
        const isResult =
          slot.status === "RESULT_DECLARED" && now >= end + RESULT_DELAY_MS;
        const isClosed = !isLive && !isUpcoming && !isResult;

        const isDisabled = !isLive || slot.isPlaceholder;

        return (
          <motion.div
            key={slot._id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
              isLive
                ? "border-primary/40 bg-gradient-to-br from-[hsl(42,92%,25%)] to-[hsl(220,20%,12%)] shadow-[0_0_20px_rgba(255,200,0,0.2)]"
                : isUpcoming
                  ? "border-yellow-500/30 bg-[hsl(220,20%,12%)]"
                  : isClosed
                    ? "border-red-500/30 bg-[hsl(220,20%,10%)] opacity-70"
                    : "border-blue-500/30 bg-[hsl(220,20%,10%)] opacity-70"
            }`}
          >
            <div
              className={isLive ? "cursor-pointer" : "cursor-not-allowed"}
              onClick={() => {
                if (isLive && !slot.isPlaceholder) {
                  setSelectedSlot(isSelected ? null : slot);
                }
              }}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
                      isLive
                        ? "bg-green-500/20 text-green-400"
                        : isUpcoming
                          ? "bg-yellow-500/20 text-yellow-400"
                          : isClosed
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isLive
                          ? "bg-green-400"
                          : isUpcoming
                            ? "bg-yellow-400"
                            : isClosed
                              ? "bg-red-400"
                              : "bg-blue-400"
                      }`}
                    />

                    <span className="text-xs font-bold">
                      {isLive && "LIVE"}
                      {isUpcoming && "UPCOMING"}
                      {isClosed && "CLOSED"}
                      {isResult && "RESULT"}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span className="font-mono text-lg font-bold text-primary">
                      {timeLeft || "--:--"}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-lg font-bold text-white font-display">
                {slot.windowLabel}
              </h2>

              <div className="mt-1 text-sm text-white/50">
                Bet{" "}
                <span className="font-bold text-primary">
                  {slot.betAmount ?? "--"} rupees
                </span>{" "}
                · Win{" "}
                <span className="font-bold text-green-400">
                  {slot.winAmount ?? "--"} rupees
                </span>
                {isResult &&
                  slot.winningNumber !== null &&
                  slot.winningNumber !== undefined && (
                    <p className="mt-1 text-xs font-bold text-primary">
                      Winning Number: #
                      {String(slot.winningNumber).padStart(2, "0")}
                    </p>
                  )}
                {isUpcoming && (
                  <p className="mt-1 text-xs text-yellow-400">
                    Starts at{" "}
                    {new Date(slot.startTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {isClosed && !isResult && (
                  <p className="mt-1 text-xs text-red-400">
                    Result will be declared in 5 minutes after close.
                  </p>
                )}
              </div>
            </div>

            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="grid grid-cols-10 gap-1.5">
                    {Array.from(
                      {
                        length:
                          selectedSlot.numberRange.end -
                          selectedSlot.numberRange.start +
                          1,
                      },
                      (_, i) => {
                        const num = selectedSlot.numberRange.start + i;
                        const isMyBet = activeBets.some(
                          (b) => Number(b.number) === num,
                        );
                        return (
                          <motion.button
                            key={num}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => {
                              setSelectedNumber(num);
                              setCustomBetAmount(selectedSlot.betAmount || 10);
                              setBetConfirmOpen(true);
                            }}
                            disabled={isDisabled}
                            className={`relative aspect-square rounded-lg text-xs font-bold transition-all ${
                              isDisabled
                                ? "cursor-not-allowed bg-white/5 text-white/20"
                                : isMyBet
                                  ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {String(num).padStart(2, "0")}
                            {isMyBet && (
                              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                            )}
                          </motion.button>
                        );
                      },
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {betConfirmOpen && selectedSlot && selectedNumber !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setBetConfirmOpen(false);
                setSelectedNumber(null);
              }
            }}
          >
            <motion.div
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              exit={{ y: 80 }}
              className="mb-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6"
            >
              <h2 className="mb-5 text-lg font-bold text-white">Confirm Bet</h2>

              <div className="mb-5 text-center">
                <div className="gold-glow mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-gold">
                  <span className="text-3xl font-bold text-black">
                    {String(selectedNumber).padStart(2, "0")}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-2 block text-sm text-white/70">
                  Bet Amount
                </label>
                <input
                  type="number"
                  min={selectedSlot.betAmount || 10}
                  step={selectedSlot.betAmount || 10}
                  value={customBetAmount}
                  onChange={(e) => setCustomBetAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-white/10 bg-black/30 p-3 text-white outline-none focus:border-primary/50"
                  placeholder={`Multiple of ${selectedSlot.betAmount || 10}`}
                />
              </div>

              <p className="mb-4 text-center text-sm text-white/50">
                Cost: {customBetAmount} rupees
                <br />
                Win:{" "}
                {customBetAmount *
                  ((selectedSlot.winAmount || 900) /
                    (selectedSlot.betAmount || 10))}{" "}
                rupees
              </p>

              <button
                onClick={placeBet}
                disabled={betting || customBetAmount <= 0}
                className="w-full rounded-xl bg-gradient-gold py-3 font-bold text-black disabled:opacity-50"
              >
                {betting ? "Placing..." : "Place Bet"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
