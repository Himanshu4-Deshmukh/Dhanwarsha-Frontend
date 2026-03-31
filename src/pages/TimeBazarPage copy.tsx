// import { useCallback, useEffect, useMemo, useState } from "react";
// import { Loader2, Sparkles } from "lucide-react";
// import { toast } from "sonner";
// import { api, LiveDrawBet, LiveDrawInfo, TimeBazarResult } from "@/lib/api";

// const GAME_TYPES: Array<{ key: "open" | "close"; label: string }> = [
//   { key: "open", label: "Open" },
//   { key: "close", label: "Close" },
// ];

// const formatTimestamp = (value?: string) =>
//   value
//     ? new Intl.DateTimeFormat("en-IN", {
//         day: "numeric",
//         month: "short",
//         hour: "numeric",
//         minute: "2-digit",
//         hour12: true,
//       }).format(new Date(value))
//     : "--";

// const PLAY_OPTIONS = [
//   { key: "single-digit", label: "Single Digit" },
//   { key: "single-patti", label: "Single Patti" },
//   { key: "double-patti", label: "Double Patti" },
//   { key: "triple-patti", label: "Triple Patti" },
// ];

// const TimeBazarPage = () => {
//   const [latestResults, setLatestResults] = useState<TimeBazarResult[]>([]);
//   const [history, setHistory] = useState<TimeBazarResult[]>([]);
//   const [liveDraws, setLiveDraws] = useState<LiveDrawInfo[]>([]);
//   const [selectedGameKey, setSelectedGameKey] = useState<string | null>(null);
//   const [gameType, setGameType] = useState<"open" | "close">("open");
//   const [activePlay, setActivePlay] = useState(PLAY_OPTIONS[0].key);
//   const [liveBets, setLiveBets] = useState<LiveDrawBet[]>([]);
//   const [digitInputs, setDigitInputs] = useState<Record<string, string>>({});
//   const [pattiNumber, setPattiNumber] = useState("");
//   const [pattiPoints, setPattiPoints] = useState("");
//   const [bidEntries, setBidEntries] = useState<
//     { type: string; label: string; number: string; points: number }[]
//   >([]);
//   const [placingLiveBet, setPlacingLiveBet] = useState(false);
//   const [latestLoading, setLatestLoading] = useState(true);
//   const [liveDrawsLoading, setLiveDrawsLoading] = useState(true);
//   const [historyLoading, setHistoryLoading] = useState(false);
//   const [betsLoading, setBetsLoading] = useState(false);

//   const loadLatest = useCallback(async () => {
//     setLatestLoading(true);
//     try {
//       const results = await api.getTimeBazarLatest();
//       setLatestResults(results ?? []);
//     } catch (error) {
//       console.error("Failed to load Time Bazar results", error);
//     } finally {
//       setLatestLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadLatest();
//     const interval = setInterval(loadLatest, 60000);
//     return () => clearInterval(interval);
//   }, [loadLatest]);

//   const loadLiveDraws = useCallback(async () => {
//     setLiveDrawsLoading(true);
//     try {
//       const draws = await api.getLiveDraws();
//       setLiveDraws(draws ?? []);
//     } catch (error) {
//       console.error("Failed to load live draws", error);
//     } finally {
//       setLiveDrawsLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadLiveDraws();
//     const interval = setInterval(loadLiveDraws, 60000);
//     return () => clearInterval(interval);
//   }, [loadLiveDraws]);

//   useEffect(() => {
//     if (!liveDraws.length) return;
//     if (!selectedGameKey || !liveDraws.some((draw) => draw.gameKey === selectedGameKey)) {
//       setSelectedGameKey(liveDraws[0].gameKey);
//     }
//   }, [liveDraws, selectedGameKey]);

//   const loadLiveBets = useCallback(async () => {
//     if (!selectedGameKey) {
//       setLiveBets([]);
//       return;
//     }

//     setBetsLoading(true);
//     try {
//       const bets = await api.getMyLiveDrawBets(selectedGameKey);
//       setLiveBets(bets ?? []);
//     } catch (error) {
//       console.error("Failed to load live draw bets", error);
//     } finally {
//       setBetsLoading(false);
//     }
//   }, [selectedGameKey]);

//   useEffect(() => {
//     loadLiveBets();
//   }, [loadLiveBets]);

//   const addBidEntry = (entry: {
//     type: string;
//     label: string;
//     number: string;
//     points: number;
//   }) => {
//     setBidEntries((prev) => [...prev, entry]);
//   };

//   const handleAddDigit = (digit: number) => {
//     const raw = digitInputs[digit] ?? "";
//     const amount = Number(raw);
//     if (!amount || amount <= 0) {
//       toast.error("Enter a valid amount before adding a digit.");
//       return;
//     }

//     addBidEntry({
//       type: "Single Digit",
//       label: `${digit}`,
//       number: digit.toString().padStart(2, "0"),
//       points: amount,
//     });
//     setDigitInputs((prev) => ({ ...prev, [digit]: "" }));
//   };

//   const handleAddPatti = (type: string) => {
//     const number = pattiNumber.trim();
//     const amount = Number(pattiPoints);
//     if (!number || !/^\d{2}$/.test(number)) {
//       toast.error("Enter a two-digit number.");
//       return;
//     }
//     if (!amount || amount <= 0) {
//       toast.error("Enter points before adding.");
//       return;
//     }

//     addBidEntry({
//       type,
//       label: number,
//       number: number.padStart(2, "0"),
//       points: amount,
//     });
//     setPattiNumber("");
//     setPattiPoints("");
//   };

//   const totalPoints = bidEntries.reduce((sum, entry) => sum + entry.points, 0);
//   const totalBids = bidEntries.length;

//   useEffect(() => {
//     if (!latestResults.length) {
//       return;
//     }

//     if (!selectedGameKey) {
//       setSelectedGameKey(latestResults[0].gameKey);
//     }
//   }, [latestResults, selectedGameKey]);

//   const selectedDraw = useMemo(() => {
//     if (!liveDraws.length) return null;
//     if (selectedGameKey) {
//       return liveDraws.find((draw) => draw.gameKey === selectedGameKey) ?? liveDraws[0];
//     }
//     return liveDraws[0];
//   }, [liveDraws, selectedGameKey]);

//   const selectedResult = useMemo(() => {
//     if (!latestResults.length) return null;
//     const activeKey = selectedGameKey ?? selectedDraw?.gameKey;
//     if (!activeKey) return null;
//     return latestResults.find((item) => item.gameKey === activeKey) ?? null;
//   }, [latestResults, selectedGameKey, selectedDraw]);

//   const handleSubmitEntries = useCallback(async () => {
//     if (!selectedDraw) return;
//     if (!bidEntries.length) {
//       toast.error("Add at least one bid before submitting.");
//       return;
//     }

//     setPlacingLiveBet(true);
//     try {
//       for (const entry of bidEntries) {
//         await api.placeLiveDrawBet(selectedDraw.gameKey, entry.number, entry.points);
//       }
//       toast.success("Bets placed");
//       setBidEntries([]);
//       await Promise.all([loadLiveBets(), loadLatest()]);
//     } catch (error: any) {
//       toast.error(error?.message || "Failed to submit bets.");
//     } finally {
//       setPlacingLiveBet(false);
//     }
//   }, [selectedDraw, bidEntries, loadLiveBets, loadLatest]);

//   useEffect(() => {
//     const gameKey = selectedGameKey ?? selectedDraw?.gameKey ?? selectedResult?.gameKey;
//     if (!gameKey) {
//       setHistory([]);
//       return;
//     }

//     let active = true;
//     setHistoryLoading(true);
//     setHistory([]);

//     api
//       .getTimeBazarHistory(gameKey, 6)
//       .then((data) => {
//         if (!active) return;
//         setHistory(data ?? []);
//       })
//       .catch((error) => {
//         console.error("Failed to load Time Bazar history", error);
//       })
//       .finally(() => {
//         if (active) {
//           setHistoryLoading(false);
//         }
//       });

//     return () => {
//       active = false;
//     };
//   }, [selectedGameKey, selectedDraw?.gameKey, selectedResult?.gameKey, selectedResult?.fetchedAt]);

//   const displayNumber = useMemo(() => {
//     if (!selectedResult) return "";
//     const openValue = selectedResult.openNumber?.trim();
//     const closeValue = selectedResult.closeNumber?.trim();
//     const fallback = selectedResult.rawNumber?.trim();
//     if (gameType === "open") {
//       return openValue || fallback || "";
//     }
//     return closeValue || openValue || fallback || "";
//   }, [gameType, selectedResult]);

//   const digits = useMemo(() => {
//     const sanitized = displayNumber.replace(/[^0-9]/g, "");
//     return sanitized ? sanitized.split("") : [];
//   }, [displayNumber]);

//   const singleDigitsLabel = digits.length ? digits : ["?", "?", "?"];
//   const jodiValue = digits.length >= 2 ? digits.slice(-2).join("") : digits[0] ?? "--";
//   const singlePanaValue = displayNumber || "--";
//   const doublePanaValue = digits.length
//     ? `${digits[digits.length - 1]}${digits[digits.length - 1]}`
//     : "--";

//   const hasLinks = Boolean(selectedResult?.jodiLink || selectedResult?.panelLink);
//   const isWaitingForData = (latestLoading || liveDrawsLoading) && !selectedDraw;
//   const latestTimestamp =
//     selectedResult?.fetchedAt ??
//     selectedDraw?.latestResult?.fetchedAt ??
//     selectedDraw?.startTime;

//   if (isWaitingForData) {
//     return (
//       <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//         <span className="text-sm text-white/60">Fetching draw results...</span>
//       </div>
//     );
//   }

//   if (!selectedDraw) {
//     return (
//       <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
//         <p className="text-sm text-white/60">Time Bazar data is not available yet.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-5 px-4 pb-28 pt-6">
//       <div className="space-y-3 rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
//         <div className="flex flex-wrap items-center justify-between gap-3">
//           <div>
//             <p className="text-xs uppercase tracking-[0.4em] text-white/50">Live draws</p>
//             <h1 className="text-2xl font-bold text-white">
//               {selectedDraw?.gameName ?? selectedResult?.gameName ?? "Live draw"}
//             </h1>
//             <p className="text-xs text-white/40">{selectedDraw?.status}</p>
//           </div>
//           <Sparkles className="h-8 w-8 rounded-2xl bg-white/10 p-1 text-white" />
//         </div>

//         <div className="flex flex-wrap gap-2">
//           {liveDraws.map((draw) => {
//             const active = draw.gameKey === selectedDraw?.gameKey;
//             return (
//               <button
//                 key={draw.gameKey}
//                 type="button"
//                 onClick={() => setSelectedGameKey(draw.gameKey)}
//                 className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
//                   active
//                     ? "border-primary bg-primary/20 text-primary"
//                     : "border-white/20 text-white/60"
//                 }`}
//               >
//                 {draw.gameName}
//               </button>
//             );
//           })}
//         </div>

//         <p className="text-xs text-white/60">
//           Updated {formatTimestamp(latestTimestamp)}
//         </p>

//         <div className="grid gap-3 md:grid-cols-2">
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="flex items-center justify-between text-xs text-white/60">
//               <span>Open</span>
//               <span>{selectedResult?.openTime ?? selectedResult?.timeWindow ?? "--"}</span>
//             </div>
//             <p className="mt-3 text-3xl font-bold text-white">{selectedResult?.openNumber || "--"}</p>
//             <p className="text-xs text-white/40">Raw: {selectedResult?.rawNumber || "---"}</p>
//           </div>
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="flex items-center justify-between text-xs text-white/60">
//               <span>Close</span>
//               <span>{selectedResult?.closeTime ?? "--"}</span>
//             </div>
//             <p className="mt-3 text-3xl font-bold text-white">{selectedResult?.closeNumber || "--"}</p>
//             <p className="text-xs text-white/40">
//               Toggle to {selectedResult?.closeNumber ? "view close" : "see open"}
//             </p>
//           </div>
//         </div>

//         <div className="mt-5 rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-4">
//           <div className="flex items-center justify-between">
//             <p className="text-sm font-semibold text-white">Game type</p>
//             <div className="flex gap-2">
//               {GAME_TYPES.map((type) => (
//                 <button
//                   key={type.key}
//                   type="button"
//                   onClick={() => setGameType(type.key)}
//                   className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
//                     gameType === type.key
//                       ? "border-primary bg-primary/20 text-primary"
//                       : "border-white/20 text-white/60"
//                   }`}
//                 >
//                   {type.label}
//                 </button>
//               ))}
//             </div>
//           </div>
//           <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/50">
//             <span>Live reading adjusts to the selected game.</span>
//             <span>Auto-refreshes every minute.</span>
//           </div>
//         </div>

//         <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
//           <div className="grid gap-3 sm:grid-cols-2">
//             {PLAY_OPTIONS.map((option) => {
//               const active = option.key === activePlay;
//               return (
//                 <button
//                   key={option.key}
//                   type="button"
//                   onClick={() => setActivePlay(option.key)}
//                   className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
//                     active
//                       ? "border-primary bg-primary/10 text-primary"
//                       : "border-white/20 bg-white/10 text-white/80"
//                   }`}
//                 >
//                   <span className="text-sm font-semibold">{option.label}</span>
//                   <span className="text-xs text-white/40">Tap</span>
//                 </button>
//               );
//             })}
//           </div>
//           {activePlay === "single-digit" && (
//             <div className="mt-4 grid gap-2 sm:grid-cols-2">
//               {Array.from({ length: 10 }, (_, index) => index).map((digit) => (
//                 <div
//                   key={digit}
//                   className="flex items-center justify-between rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] px-3 py-3"
//                 >
//                   <span className="text-lg font-bold text-white">{digit}</span>
//                   <input
//                     type="number"
//                     min={0}
//                     placeholder="Enter amount"
//                     value={digitInputs[digit] ?? ""}
//                     onChange={(event) =>
//                       setDigitInputs((prev) => ({
//                         ...prev,
//                         [digit]: event.target.value,
//                       }))
//                     }
//                     className="w-1/2 rounded-lg border border-white/10 bg-[#0f1620] px-2 py-1 text-sm font-semibold text-white"
//                   />
//                   <button
//                     type="button"
//                     onClick={() => handleAddDigit(digit)}
//                     className="ml-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
//                   >
//                     Add
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//           {activePlay !== "single-digit" && (
//             <div className="mt-4 space-y-3">
//               <label className="block text-xs font-semibold uppercase text-white/50">
//                 Enter Number
//                 <input
//                   type="text"
//                   maxLength={2}
//                   value={pattiNumber}
//                   onChange={(event) =>
//                     setPattiNumber(event.target.value.replace(/[^0-9]/g, ""))
//                   }
//                   className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-base font-semibold text-white outline-none focus:border-primary"
//                 />
//               </label>
//               <label className="block text-xs font-semibold uppercase text-white/50">
//                 Enter Points
//                 <input
//                   type="number"
//                   min={0}
//                   value={pattiPoints}
//                   onChange={(event) => setPattiPoints(event.target.value)}
//                   className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-base font-semibold text-white outline-none focus:border-primary"
//                 />
//               </label>
//               <button
//                 type="button"
//                 onClick={() =>
//                   handleAddPatti(
//                     PLAY_OPTIONS.find((option) => option.key === activePlay)?.label ??
//                       "Patti",
//                   )
//                 }
//                 className="w-full rounded-2xl border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
//               >
//                 Add{" "}
//                 {PLAY_OPTIONS.find((option) => option.key === activePlay)?.label ?? "Patti"}
//               </button>
//             </div>
//           )}
//           {bidEntries.length > 0 && (
//             <div className="mt-4 rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-3 text-sm text-white/60">
//               <p className="text-xs uppercase tracking-[0.3em] text-white/40">Pending bids</p>
//               <div className="mt-2 space-y-2">
//                 {bidEntries.map((entry, idx) => (
//                   <div
//                     key={`${entry.number}-${idx}`}
//                     className="flex items-center justify-between"
//                   >
//                     <div>
//                       <p className="text-white">{entry.label}</p>
//                       <p className="text-xs text-white/50">{entry.type}</p>
//                     </div>
//                     <span className="text-sm font-semibold text-white">{entry.points}</span>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-4 text-sm text-white">
//           <div>
//             <p className="text-xs uppercase tracking-[0.3em] text-white/40">Total bids</p>
//             <p className="text-lg font-bold text-white">{totalBids}</p>
//           </div>
//           <div>
//             <p className="text-xs uppercase tracking-[0.3em] text-white/40">Total points</p>
//             <p className="text-lg font-bold text-white">{totalPoints}</p>
//           </div>
//           <button
//             type="button"
//             onClick={handleSubmitEntries}
//             disabled={!bidEntries.length || placingLiveBet}
//             className="rounded-2xl border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
//           >
//             {placingLiveBet ? "Submitting..." : "Submit"}
//           </button>
//         </div>

//         <div className="grid gap-3 md:grid-cols-2">
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
//               Single digit
//             </div>
//             <div className="mt-3 flex flex-wrap gap-2">
//               {singleDigitsLabel.map((digit, index) => (
//                 <span
//                   key={`${digit}-${index}`}
//                   className="rounded-full border border-white/20 px-3 py-1 text-lg font-semibold text-white"
//                 >
//                   {digit}
//                 </span>
//               ))}
//             </div>
//             <p className="mt-3 text-xs text-white/50">Derived from {gameType} digits.</p>
//           </div>
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Jodi digit</div>
//             <p className="mt-3 text-3xl font-bold text-white">{jodiValue}</p>
//             <p className="text-xs text-white/50">Last two digits of {gameType} result</p>
//           </div>
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Single pana</div>
//             <p className="mt-3 text-3xl font-bold text-white">{singlePanaValue}</p>
//             <p className="text-xs text-white/50">Complete {gameType} number</p>
//           </div>
//           <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
//             <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Double pana</div>
//             <p className="mt-3 text-3xl font-bold text-white">{doublePanaValue}</p>
//             <p className="text-xs text-white/50">Duplicate of the last digit</p>
//           </div>
//         </div>

//         {hasLinks && (
//           <div className="mt-5 flex flex-wrap gap-3">
//             {selectedResult?.jodiLink && (
//               <a
//                 href={selectedResult.jodiLink}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold text-primary"
//               >
//                 Jodi chart
//               </a>
//             )}
//             {selectedResult?.panelLink && (
//               <a
//                 href={selectedResult.panelLink}
//                 target="_blank"
//                 rel="noreferrer"
//                 className="rounded-2xl border border-white/20 px-4 py-2 text-xs font-semibold text-primary"
//               >
//                 Panel chart
//               </a>
//             )}
//           </div>
//         )}
//       </div>

//       <section className="space-y-3">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-xs uppercase tracking-[0.3em] text-white/50">Recent draws</p>
//             <h2 className="text-lg font-bold text-white">
//               {selectedDraw?.gameName ?? "Live draw"} history
//             </h2>
//           </div>
//           <p className="text-xs text-white/50">Showing {history.length} entries</p>
//         </div>
//         <div className="space-y-2">
//           {historyLoading && (
//             <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/40">
//               Loading history...
//             </div>
//           )}
//           {!historyLoading && history.length === 0 && (
//             <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/40">
//               No previous results yet.
//             </div>
//           )}
//           {history.map((entry) => (
//             <article
//               key={entry._id}
//               className="rounded-2xl border border-white/10 bg-white/5 p-4"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-lg font-semibold text-white">{entry.rawNumber}</p>
//                   <p className="text-xs text-white/50">{entry.timeWindow || "--"}</p>
//                 </div>
//                 <p className="text-xs text-white/50">{formatTimestamp(entry.fetchedAt)}</p>
//               </div>
//               <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/60">
//                 <span>Open: {entry.openNumber || "--"}</span>
//                 <span>Close: {entry.closeNumber || "--"}</span>
//               </div>
//             </article>
//           ))}
//         </div>
//       </section>

//       <section className="space-y-3">
//         <div className="flex items-center justify-between">
//           <div>
//             <p className="text-xs uppercase tracking-[0.3em] text-white/50">Your bets</p>
//             <h2 className="text-lg font-bold text-white">
//               My {selectedDraw?.gameName ?? "draw"} bets
//             </h2>
//           </div>
//           <p className="text-xs text-white/50">
//             {betsLoading ? "Loading..." : `${liveBets.length} entries`}
//           </p>
//         </div>
//         {betsLoading && (
//           <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/40">
//             Loading your bets...
//           </div>
//         )}
//         {!betsLoading && liveBets.length === 0 && (
//           <div className="rounded-2xl border border-dashed border-white/20 p-4 text-sm text-white/40">
//             You haven’t placed any bets yet.
//           </div>
//         )}
//         <div className="space-y-2">
//           {liveBets.map((bet) => (
//             <article
//               key={bet._id}
//               className="rounded-2xl border border-white/10 bg-white/5 p-4"
//             >
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-lg font-semibold text-white">#{bet.number}</p>
//                   <p className="text-xs text-white/50">
//                     {formatTimestamp(bet.createdAt)}
//                   </p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-xs uppercase tracking-[0.2em] text-white/50">
//                     {bet.status}
//                   </p>
//                   <p className="text-sm text-white">
//                     {bet.amount} coins
//                   </p>
//                 </div>
//               </div>
//               {bet.payout && (
//                 <p className="mt-2 text-xs text-green-400">Payout: {bet.payout}</p>
//               )}
//             </article>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// };

// export default TimeBazarPage;

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api, LiveDrawBet, LiveDrawInfo, TimeBazarResult } from "@/lib/api";

// ── Original constants (unchanged) ──────────────────────────────────────────

const GAME_TYPES: Array<{ key: "open" | "close"; label: string }> = [
  { key: "open", label: "Open" },
  { key: "close", label: "Close" },
];

const formatTimestamp = (value?: string) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(value))
    : "--";

const PLAY_OPTIONS = [
  { key: "single-digit", label: "Single Digit" },
  { key: "single-patti", label: "Single Patti" },
  { key: "double-patti", label: "Double Patti" },
  { key: "triple-patti", label: "Triple Patti" },
];

// ── Screen type (navigation only) ────────────────────────────────────────────

type Screen = "home" | "play-types" | "betting";

// ── TimeBazarPage ─────────────────────────────────────────────────────────────

const TimeBazarPage = () => {
  // All original state (unchanged)
  const [latestResults, setLatestResults] = useState<TimeBazarResult[]>([]);
  const [history, setHistory] = useState<TimeBazarResult[]>([]);
  const [liveDraws, setLiveDraws] = useState<LiveDrawInfo[]>([]);
  const [selectedGameKey, setSelectedGameKey] = useState<string | null>(null);
  const [gameType, setGameType] = useState<"open" | "close">("open");
  const [activePlay, setActivePlay] = useState(PLAY_OPTIONS[0].key);
  const [liveBets, setLiveBets] = useState<LiveDrawBet[]>([]);
  const [digitInputs, setDigitInputs] = useState<Record<string, string>>({});
  const [pattiNumber, setPattiNumber] = useState("");
  const [pattiPoints, setPattiPoints] = useState("");
  const [bidEntries, setBidEntries] = useState<
    { type: string; label: string; number: string; points: number }[]
  >([]);
  const [placingLiveBet, setPlacingLiveBet] = useState(false);
  const [latestLoading, setLatestLoading] = useState(true);
  const [liveDrawsLoading, setLiveDrawsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betsLoading, setBetsLoading] = useState(false);

  // Navigation state
  const [screen, setScreen] = useState<Screen>("home");

  // All original data-loading hooks (unchanged)

  const loadLatest = useCallback(async () => {
    setLatestLoading(true);
    try {
      const results = await api.getTimeBazarLatest();
      setLatestResults(results ?? []);
    } catch (error) {
      console.error("Failed to load Time Bazar results", error);
    } finally {
      setLatestLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLatest();
    const interval = setInterval(loadLatest, 60000);
    return () => clearInterval(interval);
  }, [loadLatest]);

  const loadLiveDraws = useCallback(async () => {
    setLiveDrawsLoading(true);
    try {
      const draws = await api.getLiveDraws();
      setLiveDraws(draws ?? []);
    } catch (error) {
      console.error("Failed to load live draws", error);
    } finally {
      setLiveDrawsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLiveDraws();
    const interval = setInterval(loadLiveDraws, 60000);
    return () => clearInterval(interval);
  }, [loadLiveDraws]);

  useEffect(() => {
    if (!liveDraws.length) return;
    if (
      !selectedGameKey ||
      !liveDraws.some((draw) => draw.gameKey === selectedGameKey)
    ) {
      setSelectedGameKey(liveDraws[0].gameKey);
    }
  }, [liveDraws, selectedGameKey]);

  const loadLiveBets = useCallback(async () => {
    if (!selectedGameKey) {
      setLiveBets([]);
      return;
    }
    setBetsLoading(true);
    try {
      const bets = await api.getMyLiveDrawBets(selectedGameKey);
      setLiveBets(bets ?? []);
    } catch (error) {
      console.error("Failed to load live draw bets", error);
    } finally {
      setBetsLoading(false);
    }
  }, [selectedGameKey]);

  useEffect(() => {
    loadLiveBets();
  }, [loadLiveBets]);

  // All original bid helpers (unchanged)

  const addBidEntry = (entry: {
    type: string;
    label: string;
    number: string;
    points: number;
  }) => {
    setBidEntries((prev) => [...prev, entry]);
  };

  const handleAddDigit = (digit: number) => {
    const raw = digitInputs[digit] ?? "";
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount before adding a digit.");
      return;
    }
    addBidEntry({
      type: "Single Digit",
      label: `${digit}`,
      number: digit.toString().padStart(2, "0"),
      points: amount,
    });
    setDigitInputs((prev) => ({ ...prev, [digit]: "" }));
  };

  const handleAddPatti = (type: string) => {
    const number = pattiNumber.trim();
    const amount = Number(pattiPoints);
    if (!number || !/^\d{2}$/.test(number)) {
      toast.error("Enter a two-digit number.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Enter points before adding.");
      return;
    }
    addBidEntry({
      type,
      label: number,
      number: number.padStart(2, "0"),
      points: amount,
    });
    setPattiNumber("");
    setPattiPoints("");
  };

  const totalPoints = bidEntries.reduce((sum, entry) => sum + entry.points, 0);
  const totalBids = bidEntries.length;

  useEffect(() => {
    if (!latestResults.length) return;
    if (!selectedGameKey) {
      setSelectedGameKey(latestResults[0].gameKey);
    }
  }, [latestResults, selectedGameKey]);

  // All original derived/memoized values (unchanged)

  const selectedDraw = useMemo(() => {
    if (!liveDraws.length) return null;
    if (selectedGameKey) {
      return (
        liveDraws.find((draw) => draw.gameKey === selectedGameKey) ??
        liveDraws[0]
      );
    }
    return liveDraws[0];
  }, [liveDraws, selectedGameKey]);

  const selectedResult = useMemo(() => {
    if (!latestResults.length) return null;
    const activeKey = selectedGameKey ?? selectedDraw?.gameKey;
    if (!activeKey) return null;
    return latestResults.find((item) => item.gameKey === activeKey) ?? null;
  }, [latestResults, selectedGameKey, selectedDraw]);

  const handleSubmitEntries = useCallback(async () => {
    if (!selectedDraw) return;
    if (!bidEntries.length) {
      toast.error("Add at least one bid before submitting.");
      return;
    }
    setPlacingLiveBet(true);
    try {
      for (const entry of bidEntries) {
        await api.placeLiveDrawBet(
          selectedDraw.gameKey,
          entry.number,
          entry.points,
        );
      }
      toast.success("Bets placed");
      setBidEntries([]);
      await Promise.all([loadLiveBets(), loadLatest()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit bets.");
    } finally {
      setPlacingLiveBet(false);
    }
  }, [selectedDraw, bidEntries, loadLiveBets, loadLatest]);

  useEffect(() => {
    const gameKey =
      selectedGameKey ?? selectedDraw?.gameKey ?? selectedResult?.gameKey;
    if (!gameKey) {
      setHistory([]);
      return;
    }
    let active = true;
    setHistoryLoading(true);
    setHistory([]);
    api
      .getTimeBazarHistory(gameKey, 6)
      .then((data) => {
        if (!active) return;
        setHistory(data ?? []);
      })
      .catch((error) => {
        console.error("Failed to load Time Bazar history", error);
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    selectedGameKey,
    selectedDraw?.gameKey,
    selectedResult?.gameKey,
    selectedResult?.fetchedAt,
  ]);

  const displayNumber = useMemo(() => {
    if (!selectedResult) return "";
    const openValue = selectedResult.openNumber?.trim();
    const closeValue = selectedResult.closeNumber?.trim();
    const fallback = selectedResult.rawNumber?.trim();
    if (gameType === "open") return openValue || fallback || "";
    return closeValue || openValue || fallback || "";
  }, [gameType, selectedResult]);

  const digits = useMemo(() => {
    const sanitized = displayNumber.replace(/[^0-9]/g, "");
    return sanitized ? sanitized.split("") : [];
  }, [displayNumber]);

  const singleDigitsLabel = digits.length ? digits : ["?", "?", "?"];
  const jodiValue =
    digits.length >= 2 ? digits.slice(-2).join("") : (digits[0] ?? "--");
  const singlePanaValue = displayNumber || "--";
  const doublePanaValue = digits.length
    ? `${digits[digits.length - 1]}${digits[digits.length - 1]}`
    : "--";

  const hasLinks = Boolean(
    selectedResult?.jodiLink || selectedResult?.panelLink,
  );
  const isWaitingForData = (latestLoading || liveDrawsLoading) && !selectedDraw;
  const latestTimestamp =
    selectedResult?.fetchedAt ??
    selectedDraw?.latestResult?.fetchedAt ??
    selectedDraw?.startTime;

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isWaitingForData) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-white/60">Fetching draw results...</span>
      </div>
    );
  }

  if (!selectedDraw) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-3">
        <p className="text-sm text-white/60">
          Time Bazar data is not available yet.
        </p>
      </div>
    );
  }

  // ── Screen: Play Type Selection ────────────────────────────────────────────

  if (screen === "play-types") {
    return (
      <div className="space-y-5 px-4 pb-28 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen("home")}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70"
          >
            ← Back
          </button>
          <h1 className="text-xl font-bold text-white">
            {selectedDraw.gameName}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {PLAY_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setActivePlay(option.key);
                setScreen("betting");
              }}
              className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-6 text-center text-sm font-semibold text-white transition hover:border-primary hover:bg-primary/10"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Screen: Betting ────────────────────────────────────────────────────────

  if (screen === "betting") {
    return (
      <div className="space-y-5 px-4 pb-28 pt-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setScreen("play-types")}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70"
          >
            ← Back
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              {selectedDraw.gameName}
            </p>
            <h1 className="text-xl font-bold text-white">
              {PLAY_OPTIONS.find((o) => o.key === activePlay)?.label}
            </h1>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
          {/* Game type toggle */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Game type</p>
            <div className="flex gap-2">
              {GAME_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setGameType(type.key)}
                  className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                    gameType === type.key
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-white/20 text-white/60"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Single digit inputs */}
          {activePlay === "single-digit" && (
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 10 }, (_, index) => index).map((digit) => (
                <div
                  key={digit}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] px-3 py-3"
                >
                  <span className="text-lg font-bold text-white">{digit}</span>
                  <input
                    type="number"
                    min={0}
                    placeholder="Enter amount"
                    value={digitInputs[digit] ?? ""}
                    onChange={(event) =>
                      setDigitInputs((prev) => ({
                        ...prev,
                        [digit]: event.target.value,
                      }))
                    }
                    className="w-1/2 rounded-lg border border-white/10 bg-[#0f1620] px-2 py-1 text-sm font-semibold text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddDigit(digit)}
                    className="ml-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Patti inputs */}
          {activePlay !== "single-digit" && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase text-white/50">
                Enter Number
                <input
                  type="text"
                  maxLength={2}
                  value={pattiNumber}
                  onChange={(event) =>
                    setPattiNumber(event.target.value.replace(/[^0-9]/g, ""))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-base font-semibold text-white outline-none focus:border-primary"
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-white/50">
                Enter Points
                <input
                  type="number"
                  min={0}
                  value={pattiPoints}
                  onChange={(event) => setPattiPoints(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-base font-semibold text-white outline-none focus:border-primary"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  handleAddPatti(
                    PLAY_OPTIONS.find((option) => option.key === activePlay)
                      ?.label ?? "Patti",
                  )
                }
                className="w-full rounded-2xl border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Add{" "}
                {PLAY_OPTIONS.find((option) => option.key === activePlay)
                  ?.label ?? "Patti"}
              </button>
            </div>
          )}

          {/* Pending bids */}
          {bidEntries.length > 0 && (
            <div className="mt-4 rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-3 text-sm text-white/60">
              <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                Pending bids
              </p>
              <div className="mt-2 space-y-2">
                {bidEntries.map((entry, idx) => (
                  <div
                    key={`${entry.number}-${idx}`}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white">{entry.label}</p>
                      <p className="text-xs text-white/50">{entry.type}</p>
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {entry.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit bar */}
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-4 text-sm text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Total bids
            </p>
            <p className="text-lg font-bold text-white">{totalBids}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Total points
            </p>
            <p className="text-lg font-bold text-white">{totalPoints}</p>
          </div>
          <button
            type="button"
            onClick={handleSubmitEntries}
            disabled={!bidEntries.length || placingLiveBet}
            className="rounded-2xl border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-5 py-2 text-xs font-semibold text-white transition disabled:opacity-40"
          >
            {placingLiveBet ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    );
  }

  // ── Screen: Home (game cards) ─────────────────────────────────────────────

  return (
    <div className="space-y-4 px-4 pb-28 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
            Live draws
          </p>
          <h1 className="text-2xl font-bold text-white">Time Bazar</h1>
        </div>
        <Sparkles className="h-8 w-8 rounded-2xl bg-white/10 p-1 text-white" />
      </div>

      {liveDraws.map((draw) => {
        const result = latestResults.find((r) => r.gameKey === draw.gameKey);
        const rawNumber =
          result?.rawNumber ?? draw.latestResult?.rawNumber ?? "***-**-***";
        const openTime =
          result?.openTime ?? draw.latestResult?.openTime ?? "--";
        const closeTime =
          result?.closeTime ?? draw.latestResult?.closeTime ?? "--";
        const status = draw.status ?? "RUNNING FOR TODAY";

        return (
          <div
            key={draw.gameKey}
            className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {status}
                </p>
                <h2 className="text-xl font-bold text-white">
                  {draw.gameName}
                </h2>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-white">
                  {rawNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedGameKey(draw.gameKey);
                  setScreen("play-types");
                }}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <span className="text-xs">▶</span> Play
              </button>
            </div>
            <div className="mt-4 flex gap-3 border-t border-white/10 pt-3 text-xs text-white/50">
              <span>
                OPEN BIDS: <span className="text-white/80">{openTime}</span>
              </span>
              <span className="text-white/20">|</span>
              <span>
                CLOSE BIDS: <span className="text-white/80">{closeTime}</span>
              </span>
            </div>
          </div>
        );
      })}

      {/* Fallback when no liveDraws */}
      {!liveDraws.length &&
        latestResults.map((result) => (
          <div
            key={result._id}
            className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  {result.timeWindow ?? "Running for today"}
                </p>
                <h2 className="text-xl font-bold text-white">
                  {result.gameName}
                </h2>
                <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-white">
                  {result.rawNumber ?? "***-**-***"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedGameKey(result.gameKey);
                  setScreen("play-types");
                }}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                <span className="text-xs">▶</span> Play
              </button>
            </div>
            <div className="mt-4 flex gap-3 border-t border-white/10 pt-3 text-xs text-white/50">
              <span>
                OPEN BIDS:{" "}
                <span className="text-white/80">{result.openTime ?? "--"}</span>
              </span>
              <span className="text-white/20">|</span>
              <span>
                CLOSE BIDS:{" "}
                <span className="text-white/80">
                  {result.closeTime ?? "--"}
                </span>
              </span>
            </div>
          </div>
        ))}
    </div>
  );
};

export default TimeBazarPage;
