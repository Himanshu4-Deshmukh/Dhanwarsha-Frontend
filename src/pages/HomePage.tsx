import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Clock, Loader2, Target, Play } from "lucide-react";
import { toast } from "sonner";

/* ✅ NEW */
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
  const [playModalOpen, setPlayModalOpen] = useState(false); // ✅ NEW
  const [myBets, setMyBets] = useState<any[]>([]);
  const [customBetAmount, setCustomBetAmount] = useState<number>(10);

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const slots = useMemo(() => {
    return [...allSlots].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
  }, [allSlots]);

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

      toast.success(`Bet placed on #${selectedNumber}`);
      setBetConfirmOpen(false);
      setSelectedNumber(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to place bet");
    } finally {
      setBetting(false);
    }
  };

  if (loading) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="space-y-4 p-4 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-white font-bold">
          {user?.name || "Player"}
        </h1>
        <div className="text-primary font-bold">
          ₹{balance ?? 0}
        </div>
      </div>

      {slots.map((slot) => {
        const now = Date.now();
        const start = new Date(slot.startTime).getTime();
        const end = new Date(slot.endTime).getTime();

        const isLive = slot.status === "OPEN" && now >= start && now < end;
        const isUpcoming = now < start;
        const isResult =
          slot.status === "RESULT_DECLARED" && now >= end + RESULT_DELAY_MS;
        const isClosed = !isLive && !isUpcoming && !isResult;

        return (
          <div key={slot._id} className="p-4 rounded-xl bg-black/40 border">
            {/* Chip */}
            <div className="mb-2 text-xs font-bold flex items-center gap-2">
              {isLive && "LIVE"}

              {/* ✅ UPDATED */}
              {isUpcoming && (
                <>
                  UPCOMING
                  <span className="text-[10px]">
                    {new Date(slot.startTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </>
              )}

              {isClosed && "CLOSED"}
              {isResult && "RESULT"}
            </div>

            {/* Title + Play */}
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">
                {slot.windowLabel}
              </h2>

              {/* ✅ MOVED BUTTON */}
              <motion.button
                whileTap={isLive ? { scale: 0.9 } : {}}
                whileHover={isLive ? { scale: 1.05 } : {}}
                disabled={!isLive}
                onClick={() => {
                  setSelectedSlot(slot);
                  setPlayModalOpen(true);
                }}
                className="p-2 rounded-full bg-gradient-gold text-black"
              >
                <Play className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        );
      })}

      {/* ✅ CENTER MODAL */}
      <AnimatePresence>
        {playModalOpen && selectedSlot && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setPlayModalOpen(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-5"
            >
              <h2 className="mb-4 text-lg font-bold text-white">
                Select Number
              </h2>

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

                    return (
                      <button
                        key={num}
                        onClick={() => {
                          setSelectedNumber(num);
                          setPlayModalOpen(false);
                          setBetConfirmOpen(true);
                        }}
                        className="aspect-square rounded-lg bg-white/5 text-xs font-bold text-white/60 hover:bg-white/10"
                      >
                        {String(num).padStart(2, "0")}
                      </button>
                    );
                  },
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORIGINAL BET MODAL untouched */}
      <AnimatePresence>
        {betConfirmOpen && selectedNumber !== null && (
          <div className="fixed inset-0 bg-black/60 flex items-end p-4">
            <div className="bg-black p-4 rounded-xl w-full">
              <h2 className="text-white mb-3">Confirm Bet</h2>

              <input
                type="number"
                value={customBetAmount}
                onChange={(e) =>
                  setCustomBetAmount(Number(e.target.value))
                }
                className="w-full p-2 mb-3"
              />

              <button
                onClick={placeBet}
                className="w-full bg-yellow-400 p-2 rounded"
              >
                Place Bet
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;