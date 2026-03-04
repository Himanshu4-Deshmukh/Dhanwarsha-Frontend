// import { useState, useEffect, useCallback } from "react";
// import { api } from "@/lib/api";
// import { useAuth } from "@/lib/auth";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Coins,
//   Clock,
//   Trophy,
//   Loader2,
//   Hash,
//   Target,
//   Zap,
//   X,
//   ChevronRight,
//   Star,
// } from "lucide-react";
// import { toast } from "sonner";

// const HomePage = () => {
//   const { user } = useAuth();
//   const [balance, setBalance] = useState<number | null>(null);
//   const [activeSlot, setActiveSlot] = useState<any>(null);
//   const [allSlots, setAllSlots] = useState<any[]>([]);
//   const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [betting, setBetting] = useState(false);
//   const [timeLeft, setTimeLeft] = useState("");
//   const [betConfirmOpen, setBetConfirmOpen] = useState(false);
//   const [myBets, setMyBets] = useState<any[]>([]);

//   const fetchData = useCallback(async () => {
//     try {
//       const [walletRes, slotRes, slotsRes, betsRes] = await Promise.all([
//         api.getBalance(),
//         api.getActiveSlot().catch(() => null),
//         api.getSlots().catch(() => []),
//         api.getMyBets().catch(() => []),
//       ]);
//       setBalance(walletRes.balance);
//       setActiveSlot(slotRes);
//       setAllSlots(slotsRes);
//       setMyBets(betsRes.slice(0, 3));
//     } catch {
//       // silent
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 10000);
//     return () => clearInterval(interval);
//   }, [fetchData]);

//   useEffect(() => {
//     if (!activeSlot?.endTime) return;
//     const update = () => {
//       const diff = new Date(activeSlot.endTime).getTime() - Date.now();
//       if (diff <= 0) {
//         setTimeLeft("CLOSING");
//         return;
//       }
//       const m = Math.floor(diff / 60000);
//       const s = Math.floor((diff % 60000) / 1000);
//       setTimeLeft(
//         `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`,
//       );
//     };
//     update();
//     const interval = setInterval(update, 1000);
//     return () => clearInterval(interval);
//   }, [activeSlot]);

//   const handleNumberClick = (num: number) => {
//     setSelectedNumber(num);
//     setBetConfirmOpen(true);
//   };

//   const placeBet = async () => {
//     if (selectedNumber === null || !activeSlot) return;
//     setBetting(true);
//     try {
//       await api.placeBet(activeSlot._id, selectedNumber);
//       toast.success(`🎯 Bet placed on #${selectedNumber}!`, {
//         description: `${activeSlot.betAmount} coins deducted. Win ${activeSlot.winAmount} coins!`,
//       });
//       setBetConfirmOpen(false);
//       setSelectedNumber(null);
//       fetchData();
//     } catch (err: any) {
//       toast.error(err.message || "Failed to place bet");
//     } finally {
//       setBetting(false);
//     }
//   };

//   // Get bets for active slot
//   const activeBets = activeSlot
//     ? myBets.filter((b) => {
//         const bSlotId = typeof b.slotId === "object" ? b.slotId?._id : b.slotId;
//         return bSlotId === activeSlot._id;
//       })
//     : [];

//   if (loading) {
//     return (
//       <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
//         <motion.div
//           animate={{ rotate: 360 }}
//           transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
//           className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold"
//         >
//           <Target className="h-8 w-8 text-[hsl(220,20%,7%)]" />
//         </motion.div>
//         <p className="text-sm text-white/40">Loading game...</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 p-4 pb-28">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-xs text-white/40">Welcome back 👋</p>
//           <h1 className="text-xl font-bold text-white font-display">
//             {user?.name || "Player"}
//           </h1>
//         </div>
//         <motion.div
//           whileHover={{ scale: 1.05 }}
//           className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2"
//         >
//           <Coins className="h-4 w-4 text-primary" />
//           <span className="text-sm font-bold text-primary font-display">
//             {balance ?? 0}
//           </span>
//           <span className="text-xs text-white/40">coins</span>
//         </motion.div>
//       </div>

//       {/* Active Slot Banner */}
//       {activeSlot ? (
//         <motion.div
//           initial={{ opacity: 0, y: 10 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(42,92%,25%)] to-[hsl(220,20%,12%)] p-5 border border-primary/30"
//         >
//           {/* Background shimmer */}
//           <div className="absolute inset-0 opacity-10">
//             <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary blur-3xl" />
//           </div>

//           <div className="relative">
//             <div className="mb-3 flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1">
//                   <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-ping absolute" />
//                   <span className="h-1.5 w-1.5 rounded-full bg-green-400 relative" />
//                   <span className="text-xs font-bold text-green-400">LIVE</span>
//                 </div>
//               </div>
//               <div className="flex items-center gap-2 rounded-full bg-black/30 px-3 py-1.5">
//                 <Clock className="h-3.5 w-3.5 text-primary" />
//                 <span className="font-mono text-lg font-bold text-primary">
//                   {timeLeft || "--:--"}
//                 </span>
//               </div>
//             </div>

//             <h2 className="text-lg font-bold text-white font-display">
//               Active Slot — Pick Your Number!
//             </h2>
//             <p className="mt-1 text-sm text-white/50">
//               Bet{" "}
//               <span className="font-bold text-primary">
//                 {activeSlot.betAmount} coins
//               </span>{" "}
//               · Win{" "}
//               <span className="font-bold text-green-400">
//                 {activeSlot.winAmount} coins
//               </span>
//             </p>

//             {activeBets.length > 0 && (
//               <div className="mt-3 flex flex-wrap gap-1.5">
//                 <span className="text-xs text-white/40">Your bets:</span>
//                 {activeBets.map((b) => (
//                   <span
//                     key={b._id}
//                     className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary"
//                   >
//                     #{b.number}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>
//         </motion.div>
//       ) : (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="rounded-2xl border border-white/5 bg-white/5 p-8 text-center"
//         >
//           <Clock className="mx-auto mb-3 h-12 w-12 text-white/20" />
//           <p className="font-semibold text-white/60">
//             No active slot right now
//           </p>
//           <p className="mt-1 text-xs text-white/30">
//             Check back soon — new slots open regularly!
//           </p>
//         </motion.div>
//       )}

//       {/* Number Selection Grid */}
//       {activeSlot && (
//         <div>
//           <div className="mb-3 flex items-center justify-between">
//             <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2">
//               <Hash className="h-4 w-4 text-primary" /> Choose a number (0–99)
//             </h3>
//             {selectedNumber !== null && (
//               <button
//                 onClick={() => setSelectedNumber(null)}
//                 className="text-xs text-white/30 hover:text-white"
//               >
//                 Clear
//               </button>
//             )}
//           </div>

//           <div className="grid grid-cols-10 gap-1.5">
//             {Array.from({ length: 100 }, (_, i) => {
//               const isMyBet = activeBets.some((b) => b.number === i);
//               return (
//                 <motion.button
//                   key={i}
//                   whileTap={{ scale: 0.85 }}
//                   onClick={() => handleNumberClick(i)}
//                   className={`aspect-square rounded-lg text-xs font-bold transition-all relative ${
//                     selectedNumber === i
//                       ? "bg-gradient-gold text-[hsl(220,20%,7%)] gold-glow scale-110 z-10 shadow-lg"
//                       : isMyBet
//                         ? "bg-primary/20 text-primary ring-1 ring-primary/40"
//                         : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
//                   }`}
//                 >
//                   {i}
//                   {isMyBet && (
//                     <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
//                   )}
//                 </motion.button>
//               );
//             })}
//           </div>
//           <p className="mt-2 text-center text-xs text-white/20">
//             Tap any number to place a bet · Numbers with a dot are your active
//             bets
//           </p>
//         </div>
//       )}

//       {/* Recent Slots (non-active) */}
//       {allSlots
//         .filter((s) => s.status !== "OPEN" || s._id !== activeSlot?._id)
//         .slice(0, 3).length > 0 && (
//         <div>
//           <h3 className="mb-3 text-sm font-semibold text-white/40 flex items-center gap-2">
//             <Trophy className="h-4 w-4 text-primary" /> Recent Results
//           </h3>
//           <div className="space-y-2">
//             {allSlots
//               .filter((s) => s.status === "RESULT_DECLARED")
//               .slice(0, 3)
//               .map((slot) => (
//                 <div
//                   key={slot._id}
//                   className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3"
//                 >
//                   <div>
//                     <p className="text-xs text-white/40">
//                       {new Date(slot.startTime).toLocaleDateString()} ·{" "}
//                       {new Date(slot.startTime).toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </p>
//                     <p className="text-sm font-medium text-white/70">
//                       Slot ended
//                     </p>
//                   </div>
//                   {slot.winningNumber !== undefined &&
//                     slot.winningNumber !== null && (
//                       <div className="flex flex-col items-center">
//                         <span className="text-xs text-white/30 mb-1">
//                           Winner
//                         </span>
//                         <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold text-sm font-bold text-[hsl(220,20%,7%)] gold-glow font-display">
//                           {slot.winningNumber}
//                         </div>
//                       </div>
//                     )}
//                 </div>
//               ))}
//           </div>
//         </div>
//       )}

//       {/* Bet Confirmation Modal */}
//       <AnimatePresence>
//         {betConfirmOpen && selectedNumber !== null && activeSlot && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
//             onClick={(e) => {
//               if (e.target === e.currentTarget) {
//                 setBetConfirmOpen(false);
//                 setSelectedNumber(null);
//               }
//             }}
//           >
//             <motion.div
//               initial={{ y: 80, opacity: 0 }}
//               animate={{ y: 0, opacity: 1 }}
//               exit={{ y: 80, opacity: 0 }}
//               className="w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6 mb-4"
//             >
//               <div className="mb-5 flex items-center justify-between">
//                 <h2 className="text-lg font-bold text-white font-display">
//                   Confirm Bet
//                 </h2>
//                 <button
//                   onClick={() => {
//                     setBetConfirmOpen(false);
//                     setSelectedNumber(null);
//                   }}
//                   className="text-white/30 hover:text-white"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               </div>

//               {/* Number showcase */}
//               <div className="mb-5 flex flex-col items-center">
//                 <motion.div
//                   initial={{ scale: 0.5 }}
//                   animate={{ scale: 1 }}
//                   className="mb-3 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-gold gold-glow"
//                 >
//                   <span className="text-4xl font-bold text-[hsl(220,20%,7%)] font-display">
//                     {selectedNumber}
//                   </span>
//                 </motion.div>
//                 <p className="text-sm text-white/50">Your selected number</p>
//               </div>

//               {/* Bet details */}
//               <div className="mb-5 grid grid-cols-2 gap-3">
//                 <div className="rounded-xl bg-white/5 p-3 text-center">
//                   <Coins className="mx-auto mb-1 h-4 w-4 text-white/40" />
//                   <p className="text-lg font-bold text-white font-display">
//                     {activeSlot.betAmount}
//                   </p>
//                   <p className="text-xs text-white/30">coins to bet</p>
//                 </div>
//                 <div className="rounded-xl bg-green-500/10 p-3 text-center">
//                   <Trophy className="mx-auto mb-1 h-4 w-4 text-green-400" />
//                   <p className="text-lg font-bold text-green-400 font-display">
//                     {activeSlot.winAmount}
//                   </p>
//                   <p className="text-xs text-white/30">coins if won</p>
//                 </div>
//               </div>

//               <p className="mb-4 text-center text-xs text-white/30">
//                 Current balance:{" "}
//                 <span className="text-primary font-semibold">
//                   {balance} coins
//                 </span>
//               </p>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => {
//                     setBetConfirmOpen(false);
//                     setSelectedNumber(null);
//                   }}
//                   className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-medium text-white/60 hover:text-white"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={placeBet}
//                   disabled={betting}
//                   className="flex-1 rounded-xl bg-gradient-gold py-3 text-sm font-bold text-[hsl(220,20%,7%)] gold-glow disabled:opacity-50 flex items-center justify-center gap-2"
//                 >
//                   {betting ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     <>
//                       <Zap className="h-4 w-4" /> Place Bet
//                     </>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default HomePage;
import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Clock,
  Trophy,
  Loader2,
  Hash,
  Target,
  Zap,
  X,
} from "lucide-react";
import { toast } from "sonner";

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

  // ================= FETCH =================
  const fetchData = useCallback(async () => {
    try {
      const [walletRes, slotsRes, betsRes] = await Promise.all([
        api.getBalance(),
        api.getSlots(),
        api.getMyBets().catch(() => []),
      ]);

      setBalance(walletRes.balance);
      setAllSlots(slotsRes);
      setMyBets(betsRes.slice(0, 20));
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // ================= COUNTDOWN =================
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

  // ================= PLACE BET =================
  const placeBet = async () => {
    if (selectedNumber === null || !selectedSlot) return;

    setBetting(true);
    try {
      await api.placeBet(selectedSlot._id, selectedNumber);

      toast.success(`🎯 Bet placed on #${selectedNumber}!`, {
        description: `${selectedSlot.betAmount} coins deducted. Win ${selectedSlot.winAmount} coins!`,
      });

      setBetConfirmOpen(false);
      setSelectedNumber(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to place bet");
    } finally {
      setBetting(false);
    }
  };

  const openSlots = allSlots.filter((s) => s.status === "OPEN");

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
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40">Welcome back 👋</p>
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
          <span className="text-xs text-white/40">coins</span>
        </motion.div>
      </div>

      {/* ================= MULTIPLE SLOT CARDS ================= */}
      {openSlots.map((slot) => {
        const isSelected = selectedSlot?._id === slot._id;

        return (
          <motion.div
            key={slot._id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(42,92%,25%)] to-[hsl(220,20%,12%)] p-5 border border-primary/30"
          >
            <div
              className="cursor-pointer"
              onClick={() => setSelectedSlot(isSelected ? null : slot)}
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <span className="text-xs font-bold text-green-400">
                      LIVE
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
                Pick Your Number!
              </h2>

              <p className="mt-1 text-sm text-white/50">
                Bet{" "}
                <span className="font-bold text-primary">
                  {slot.betAmount} coins
                </span>{" "}
                · Win{" "}
                <span className="font-bold text-green-400">
                  {slot.winAmount} coins
                </span>
              </p>
            </div>

            {/* ================= NUMBER GRID ================= */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="grid grid-cols-10 gap-1.5">
                    {Array.from({ length: 100 }, (_, i) => {
                      const isMyBet = activeBets.some((b) => b.number === i);

                      return (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.85 }}
                          onClick={() => {
                            setSelectedNumber(i);
                            setBetConfirmOpen(true);
                          }}
                          className={`aspect-square rounded-lg text-xs font-bold transition-all relative ${
                            isMyBet
                              ? "bg-primary/20 text-primary ring-1 ring-primary/40"
                              : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {i}
                          {isMyBet && (
                            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* ================= CONFIRM MODAL ================= */}
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
              className="w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6 mb-4"
            >
              <h2 className="text-lg font-bold text-white mb-5">Confirm Bet</h2>

              <div className="text-center mb-5">
                <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-gradient-gold gold-glow">
                  <span className="text-3xl font-bold text-black">
                    {selectedNumber}
                  </span>
                </div>
              </div>

              <p className="text-sm text-white/50 text-center mb-4">
                Cost: {selectedSlot.betAmount} coins
              </p>

              <button
                onClick={placeBet}
                disabled={betting}
                className="w-full rounded-xl bg-gradient-gold py-3 font-bold text-black"
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
