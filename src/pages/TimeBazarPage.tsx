// export default TimeBazarPage;

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Coins,
  Hash,
  Layers,
  Loader2,
  Sparkles,
  Trophy,
} from "lucide-react";
import { toast } from "sonner";
import { api, LiveDrawBet, LiveDrawInfo, TimeBazarResult } from "@/lib/api";

// ── Original constants (unchanged) ──────────────────────────────────────────

const GAME_TYPES = [
  { key: "open", label: "Open" },
  { key: "close", label: "Close" },
  { key: "jodi", label: "Jodi" },
] as const;

const BIDS_PER_PAGE = 5;

const betTypeColors: Record<string, string> = {
  open: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  close: "bg-purple-500/15  text-purple-400  border border-purple-500/25",
  jodi: "bg-amber-500/15   text-amber-400   border border-amber-500/25",
};

const statusColors: Record<string, string> = {
  PENDING: "border border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
  WON: "border border-green-500/20  bg-green-500/10  text-green-400",
  LOST: "border border-red-500/20    bg-red-500/10    text-red-400",
  RUNNING: "border border-blue-500/20   bg-blue-500/10   text-blue-400",
};

const formatTimestamp = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const addMinutes = (timeStr: string | undefined, mins: number): string => {
  if (!timeStr) return "--";
  // Try parsing as ISO first
  let date = new Date(timeStr);
  if (isNaN(date.getTime())) {
    // Try parsing "HH:MM AM/PM" format
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "--";
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    date = new Date();
    date.setHours(hours, minutes, 0, 0);
  }
  date.setMinutes(date.getMinutes() + mins);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatClockTime = (value?: string) => {
  if (!value) return "--";

  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  return value;
};

const normalizeBetStatus = (value?: string) => {
  const status = (value ?? "PENDING").toUpperCase();
  if (status === "WIN") return "WON";
  if (status === "LOSS") return "LOST";
  return status;
};

const getDrawDisplayStatus = (value?: string) => {
  const status = (value ?? "").toUpperCase();

  if (["OPEN", "LIVE", "RUNNING"].includes(status)) return "LIVE";
  if (["UPCOMING", "NOT_STARTED"].includes(status)) return "UPCOMING";
  if (["RESULT_DECLARED", "RESULTED"].includes(status))
    return "RESULT DECLARED";
  if (["CLOSED", "CLOSED_FOR_TODAY"].includes(status)) return "CLOSED";

  return status || "UPCOMING";
};

const isDrawOpenForBetting = (value?: string) =>
  (value ?? "").toUpperCase() === "OPEN";

const isDrawUpcoming = (value?: string) =>
  ["UPCOMING", "NOT_STARTED"].includes((value ?? "").toUpperCase());

const isDrawClosed = (value?: string) =>
  ["RESULT_DECLARED", "RESULTED", "CLOSED", "CLOSED_FOR_TODAY"].includes(
    (value ?? "").toUpperCase(),
  );

// ── Modal stage (navigation only) ────────────────────────────────────────────

type ModalStage = "window" | "betting";

// ── TimeBazarPage ─────────────────────────────────────────────────────────────

const TimeBazarPage = () => {
  const [latestResults, setLatestResults] = useState<TimeBazarResult[]>([]);
  const [history, setHistory] = useState<TimeBazarResult[]>([]);
  const [liveDraws, setLiveDraws] = useState<LiveDrawInfo[]>([]);
  const [selectedGameKey, setSelectedGameKey] = useState<string | null>(null);
  const [gameType, setGameType] = useState<"open" | "close" | "jodi">("open");
  const [liveBets, setLiveBets] = useState<LiveDrawBet[]>([]);
  const [digitInputs, setDigitInputs] = useState<Record<string, string>>({});
  const [pattiNumber, setPattiNumber] = useState("");
  const [pattiPoints, setPattiPoints] = useState("");
  const [selectedSingleDigit, setSelectedSingleDigit] = useState(0);
  const [bidEntries, setBidEntries] = useState<
    { type: string; label: string; number: string; points: number }[]
  >([]);
  const [placingLiveBet, setPlacingLiveBet] = useState(false);
  const [latestLoading, setLatestLoading] = useState(true);
  const [liveDrawsLoading, setLiveDrawsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betsLoading, setBetsLoading] = useState(false);

  // ── All my bets (for history section) ────────────────────────────────────
  const [allMyBets, setAllMyBets] = useState<LiveDrawBet[]>([]);
  const [allBetsLoading, setAllBetsLoading] = useState(false);
  const [bidsPage, setBidsPage] = useState(1);
  const [bidsExpanded, setBidsExpanded] = useState(false);

  const [modalStage, setModalStage] = useState<ModalStage>("window");
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [infoModalDraw, setInfoModalDraw] = useState<LiveDrawInfo | null>(null);
  const lastOpenedGameKeyRef = useRef<string | null>(null);

  const isJodi = gameType === "jodi";

  const digitRange = isJodi
    ? Array.from({ length: 100 }, (_, i) => i)
    : Array.from({ length: 10 }, (_, i) => i);

  const loadLatest = useCallback(async (silent = false) => {
    if (!silent) {
      setLatestLoading(true);
    }
    try {
      const results = await api.getTimeBazarLatest();
      setLatestResults(results ?? []);
    } catch (error) {
      console.error("Failed to load Time Bazar results", error);
    } finally {
      if (!silent) {
        setLatestLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadLatest();
    const interval = setInterval(() => loadLatest(true), 60000);
    return () => clearInterval(interval);
  }, [loadLatest]);

  const loadLiveDraws = useCallback(async (silent = false) => {
    if (!silent) {
      setLiveDrawsLoading(true);
    }
    try {
      const draws = await api.getLiveDraws();
      setLiveDraws(draws ?? []);
    } catch (error) {
      console.error("Failed to load live draws", error);
    } finally {
      if (!silent) {
        setLiveDrawsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadLiveDraws();
    const interval = setInterval(() => loadLiveDraws(true), 60000);
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

  const loadAllMyBets = useCallback(async () => {
    setAllBetsLoading(true);
    try {
      const bets = await api.getMyLiveDrawBets();
      setAllMyBets(bets ?? []);
    } catch (error) {
      console.error("Failed to load all my bets", error);
    } finally {
      setAllBetsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllMyBets();
  }, [loadAllMyBets]);

  const openPlayModal = (gameKey: string) => {
    const draw = liveDraws.find((d) => d.gameKey === gameKey);
    if (!isDrawOpenForBetting(draw?.status)) {
      setInfoModalDraw(draw ?? null);
      setInfoModalOpen(true);
      return;
    }

    const isNewGame = lastOpenedGameKeyRef.current !== gameKey;
    if (isNewGame) {
      setModalStage("window");
      setGameType("open");
      setDigitInputs({});
      setPattiNumber("");
      setPattiPoints("");
      setBidEntries([]);
      setSelectedSingleDigit(0);
    }
    setSelectedGameKey(gameKey);
    setIsPlayModalOpen(true);
    lastOpenedGameKeyRef.current = gameKey;
  };

  const closePlayModal = useCallback(() => {
    setModalStage("window");
    setGameType("open");
    setDigitInputs({});
    setPattiNumber("");
    setPattiPoints("");
    setBidEntries([]);
    setSelectedSingleDigit(0);
    setIsPlayModalOpen(false);
  }, []);

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

  // ── NEW: Submit a single digit bet immediately ────────────────────────────
  const handleAddAndSubmitDigit = async (digit: number) => {
    const raw = digitInputs[digit] ?? "";
    const amount = Number(raw);
    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount before submitting.");
      return;
    }
    if (!selectedDraw) return;
    setPlacingLiveBet(true);
    try {
      const number = digit.toString().padStart(2, "0");
      await api.placeLiveDrawBet(
        selectedDraw.gameKey,
        number,
        amount,
        gameType,
      );
      toast.success("Bet placed");
      setDigitInputs((prev) => ({ ...prev, [digit]: "" }));
      await Promise.all([loadLiveBets(), loadLatest(), loadAllMyBets()]);
    } catch (error: any) {
      toast.error(error?.message || "Failed to submit bet.");
    } finally {
      setPlacingLiveBet(false);
    }
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

  useEffect(() => {
    if (!latestResults.length) return;
    if (!selectedGameKey) {
      setSelectedGameKey(latestResults[0].gameKey);
    }
  }, [latestResults, selectedGameKey]);

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

  const handleCancelBets = useCallback(() => {
    setBidEntries([]);
    setDigitInputs({});
    setPattiNumber("");
    setPattiPoints("");
    setModalStage("window");
    setSelectedSingleDigit(0);
  }, []);

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

  const numberRange = useMemo(() => {
    if (selectedDraw?.numberRange) {
      return selectedDraw.numberRange;
    }
    return { start: 0, end: 99 };
  }, [selectedDraw?.numberRange?.start, selectedDraw?.numberRange?.end]);

  const numberOptions = useMemo(() => {
    const start = numberRange.start;
    const end = numberRange.end;
    if (end < start) return [];
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [numberRange.start, numberRange.end]);

  const isWaitingForData = (latestLoading || liveDrawsLoading) && !selectedDraw;

  // ── Bids history pagination ───────────────────────────────────────────────
  const sortedBets = useMemo(
    () =>
      [...allMyBets].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [allMyBets],
  );
  const bidsTotalPages = Math.max(
    1,
    Math.ceil(sortedBets.length / BIDS_PER_PAGE),
  );
  const paginatedBets = sortedBets.slice(
    (bidsPage - 1) * BIDS_PER_PAGE,
    bidsPage * BIDS_PER_PAGE,
  );
  const latestTimestamp =
    selectedResult?.fetchedAt ??
    selectedDraw?.latestResult?.fetchedAt ??
    selectedDraw?.startTime;
  const modalGameName =
    selectedDraw?.gameName ?? selectedResult?.gameName ?? "Time Bazar";
  const modalStatusLabel = getDrawDisplayStatus(selectedDraw?.status);
  const modalOpenTime = selectedResult?.openTime ?? selectedDraw?.startTime;
  const modalCloseTime = selectedResult?.closeTime ?? selectedDraw?.endTime;
  const selectedGameTypeLabel =
    GAME_TYPES.find((type) => type.key === gameType)?.label ?? "";
  const showPlayModal = isPlayModalOpen && (selectedDraw || selectedResult);

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

  // ── Screen: Home (game cards) ─────────────────────────────────────────────

  return (
    <>
      <div className="space-y-4 px-4 pb-28 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/50">
              Live draws
            </p>
            <h1 className="text-2xl font-bold text-white">Time Bazar</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBidsExpanded(true);
                setBidsPage(1);
              }}
              className="relative flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <Trophy className="h-3.5 w-3.5 text-primary" />
              Bids History
              {allMyBets.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">
                  {allMyBets.length > 99 ? "99+" : allMyBets.length}
                </span>
              )}
            </button>
            {/* <Sparkles className="h-8 w-8 rounded-2xl bg-white/10 p-1 text-white" /> */}
          </div>
        </div>

        {liveDraws.map((draw) => {
          const result = latestResults.find((r) => r.gameKey === draw.gameKey);
          const isToday = (dateStr?: string) => {
            if (!dateStr) return false;

            const date = new Date(dateStr);
            const now = new Date();

            return (
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth() &&
              date.getDate() === now.getDate()
            );
          };

          const isLiveStatus = ["OPEN", "LIVE", "RUNNING"].includes(
            draw.status?.toUpperCase(),
          );

          const latestRaw =
            result?.rawNumber ?? draw.latestResult?.rawNumber ?? null;

          const latestFetchedAt =
            result?.fetchedAt ?? draw.latestResult?.fetchedAt;

          let rawNumber = "***-**-***";

          if (!isLiveStatus) {
            rawNumber = latestRaw || "***-**-***";
          } else {
            if (/^\d{3}-\d{2}-\d{3}$/.test(latestRaw)) {
              rawNumber = latestRaw; // full result
            } else if (/^\d{3}-\d$/.test(latestRaw)) {
              rawNumber = `${latestRaw}*-***`; // partial result
            } else {
              rawNumber = "***-**-***";
            }
          }
          const openTime =
            result?.openTime ?? formatClockTime(draw.startTime) ?? "--";
          const closeTime =
            result?.closeTime ?? formatClockTime(draw.endTime) ?? "--";
          let status = getDrawDisplayStatus(draw.status);

          if (isLiveStatus && /^\d{3}-\d$/.test(latestRaw)) {
            status = "RUNNING FOR CLOSE";
          }
          const closed = isDrawClosed(draw.status);
          const upcoming = isDrawUpcoming(draw.status);
          const canBet = isDrawOpenForBetting(draw.status);

          return (
            <div
              key={draw.gameKey}
              className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  {(() => {
                    const isClosed = closed;
                    const isUpcoming = upcoming;

                    if (isUpcoming) {
                      const opensAt =
                        result?.openTime ?? formatClockTime(draw.startTime);
                      return (
                        <>
                          <p className="text-xs uppercase tracking-[0.2em] text-amber-400/80">
                            ⏳ Opens at {opensAt}
                          </p>
                          <h2 className="text-xl font-bold text-white">
                            {draw.gameName}
                          </h2>
                          <p className="mt-1 text-sm text-white/40">
                            Bidding starts at {opensAt}
                          </p>
                        </>
                      );
                    }

                    if (isClosed) {
                      return (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-red-400" />
                            <p className="text-xs uppercase tracking-[0.1em] text-red-400">
                              {status}
                            </p>
                          </div>
                          <h2 className="text-xl font-bold text-white">
                            {draw.gameName}
                          </h2>
                          <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-white">
                            {rawNumber}
                          </p>
                        </>
                      );
                    }

                    // Running
                    return (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                          <p className="text-xs uppercase tracking-[0.1em] text-white/50">
                            {status}
                          </p>
                        </div>
                        <h2 className="text-xl font-bold text-white">
                          {draw.gameName}
                        </h2>
                        <p className="mt-1 font-mono text-2xl font-bold tracking-wide text-white">
                          {rawNumber}
                        </p>
                      </>
                    );
                  })()}
                </div>

                {(() => {
                  return (
                    <button
                      type="button"
                      onClick={() => openPlayModal(draw.gameKey)}
                      className={`flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                        canBet
                          ? "border-white/20 bg-gradient-to-r from-primary to-emerald-500 text-white"
                          : "border-white/10 bg-white/10 text-white/60"
                      }`}
                    >
                      <span className="text-xs">▶</span> Play
                    </button>
                  );
                })()}
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
                  onClick={() => openPlayModal(result.gameKey)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  <span className="text-xs">▶</span> Play
                </button>
              </div>
              <div className="mt-4 flex gap-3 border-t border-white/10 pt-3 text-xs text-white/50">
                <span>
                  OPEN BIDS:{" "}
                  <span className="text-white/80">
                    {result.openTime ?? "--"}
                  </span>
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

      {/* ── Bids History bottom sheet ──────────────────────────────────── */}
      {bidsExpanded && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setBidsExpanded(false)}
          />
          {/* Sheet */}
          <div className="relative w-full max-w-lg rounded-t-[32px] border border-white/10 bg-[hsl(220,20%,8%)] pb-safe shadow-[0_-20px_60px_rgba(0,0,0,0.6)]">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <h2 className="text-base font-bold text-white">
                  My Bids History
                </h2>
                {allMyBets.length > 0 && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {allMyBets.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setBidsExpanded(false)}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/60"
              >
                Close
              </button>
            </div>

            {/* Scrollable content */}
            <div className="max-h-[70vh] overflow-y-auto px-4 pb-6">
              {allBetsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : sortedBets.length === 0 ? (
                <p className="py-12 text-center text-xs text-white/25">
                  No bids placed yet
                </p>
              ) : (
                <div className="space-y-2">
                  {paginatedBets.map((bet, i) => {
                    const betType = (bet as any).betType ?? "open";
                    const btLabel =
                      betType.charAt(0).toUpperCase() + betType.slice(1);
                    const btColor =
                      betTypeColors[betType] ?? betTypeColors["open"];
                    const status = normalizeBetStatus(bet.status);
                    const stColor =
                      statusColors[status] ?? "bg-white/5 text-white/40";
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
                      <div
                        key={bet._id || i}
                        className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,20%,11%)] p-4"
                      >
                        {/* Top row */}
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

                        {/* Detail chips */}
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
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {sortedBets.length > BIDS_PER_PAGE && (
                    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                      <p className="text-xs text-white/40">
                        Page {bidsPage} of {bidsTotalPages}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setBidsPage((p) => Math.max(1, p - 1))}
                          disabled={bidsPage === 1}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setBidsPage((p) => Math.min(bidsTotalPages, p + 1))
                          }
                          disabled={bidsPage === bidsTotalPages}
                          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPlayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:items-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={closePlayModal}
          />
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/10 bg-[hsl(220,20%,10%)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.8)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  {modalStage === "window" ? "Time window" : "Bidding"}
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {modalGameName}
                </h2>
                {modalStage === "betting" && (
                  <p className="text-xs text-white/50">
                    {selectedGameTypeLabel}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={closePlayModal}
                className="rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/70"
              >
                Close
              </button>
            </div>

            {/* ── Stage: window ── */}
            {modalStage === "window" ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Choose a window
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GAME_TYPES.map((type) => {
                    const time =
                      type.key === "open" ? modalOpenTime : modalCloseTime;
                    const isOpenDeclared =
                      type.key === "open" && !!selectedResult?.openNumber?.trim();
                    return (
                      <button
                        key={type.key}
                        type="button"
                        disabled={isOpenDeclared}
                        onClick={() => {
                          if (isOpenDeclared) return;
                          setGameType(type.key);
                          setModalStage("betting");
                        }}
                        className={`rounded-3xl border p-5 text-left transition ${isOpenDeclared
                          ? "cursor-not-allowed border-white/5 bg-white/5 opacity-40"
                          : gameType === type.key
                            ? "border-primary bg-primary/10 text-white"
                            : "border-white/10 text-white/70"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {type.label}
                          </span>
                          <span className="text-xs text-white/60">
                            {formatTimestamp(time)}
                          </span>
                        </div>
                        <p className="text-xs text-white/50">
                          {type.key === "open"
                            ? "Open bids window"
                            : "Close bids window"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── Stage: betting ── */
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setModalStage("window")}
                    className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/70"
                  >
                    ← Back
                  </button>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    {modalStatusLabel}
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  {/* ── REMOVED: Game type toggle (was here) ── */}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                        Choose number
                      </p>
                      <span className="text-xs text-white/50">
                        {gameType === "jodi" ? "00 - 99" : "0 - 9"}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                      {digitRange.map((num) => {
                        const value =
                          gameType === "jodi"
                            ? String(num).padStart(2, "0")
                            : String(num);
                        const active = selectedSingleDigit === num;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSelectedSingleDigit(num)}
                            className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                              active
                                ? "border-primary bg-primary/20 text-primary"
                                : "border-white/20 text-white/60 hover:border-white hover:text-white"
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Input row: number | amount | Add, with submit below ── */}
                    <div className="space-y-3 rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-white">
                          {gameType === "jodi"
                            ? String(selectedSingleDigit).padStart(2, "0")
                            : selectedSingleDigit}
                        </span>

                        <input
                          type="number"
                          min={0}
                          placeholder="Enter amount"
                          value={digitInputs[selectedSingleDigit] ?? ""}
                          onChange={(event) =>
                            setDigitInputs((prev) => ({
                              ...prev,
                              [selectedSingleDigit]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-sm font-semibold text-white outline-none focus:border-primary"
                        />

                        <button
                          type="button"
                          onClick={() => handleAddDigit(selectedSingleDigit)}
                          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/20"
                        >
                          Add
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleAddAndSubmitDigit(selectedSingleDigit)
                        }
                        disabled={placingLiveBet}
                        className="w-full rounded-full bg-gradient-to-r from-primary to-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-40"
                      >
                        {placingLiveBet ? "..." : "Submit"}
                      </button>
                    </div>
                  </div>

                  {/* Pending bids */}
                  {bidEntries.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-3 text-sm text-white/60">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                          Pending bids
                        </p>
                        <button
                          type="button"
                          onClick={handleCancelBets}
                          className="text-xs text-white/40 hover:text-white/70 transition"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-2">
                        {bidEntries.map((entry, idx) => (
                          <div
                            key={`${entry.number}-${idx}`}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="text-white">{entry.label}</p>
                              <p className="text-xs text-white/50">
                                {entry.type}
                              </p>
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
                {/* ── REMOVED: Bottom submit bar (was here) ── */}
              </div>
            )}
          </div>
        </div>
      )}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setInfoModalOpen(false)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] shadow-[0_30px_80px_rgba(0,0,0,0.8)]">
            {/* Close */}
            <button
              type="button"
              onClick={() => setInfoModalOpen(false)}
              className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 text-xs text-white/50 hover:text-white transition"
            >
              ✕
            </button>

            {/* Header */}
            <div className="px-6 pt-8 pb-5 text-center">
              <p className="text-xs uppercase tracking-[0.4em] text-white/40 mb-1">
                Matka King
              </p>
              <h2 className="text-xl font-extrabold uppercase tracking-wide text-white">
                {infoModalDraw?.gameName ?? "Matka King"}
              </h2>
              <div
                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
                  isDrawUpcoming(infoModalDraw?.status)
                    ? "border border-amber-500/30 bg-amber-500/10 text-amber-400"
                    : "border border-red-500/30 bg-red-500/10 text-red-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isDrawUpcoming(infoModalDraw?.status)
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
                <p className="text-xs font-semibold">
                  {getDrawDisplayStatus(infoModalDraw?.status)}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Table */}
            <div className="mx-4 my-5 overflow-hidden rounded-2xl border border-white/10">
              {(() => {
                const result = latestResults.find(
                  (r) => r.gameKey === infoModalDraw?.gameKey,
                );
                const openBidTime =
                  result?.openTime ?? formatClockTime(infoModalDraw?.startTime);
                const closeBidTime =
                  result?.closeTime ?? formatClockTime(infoModalDraw?.endTime);
                const openResultTime = addMinutes(openBidTime, 10);
                const closeResultTime = addMinutes(closeBidTime, 10);
                const resultNumber =
                  result?.rawNumber ??
                  infoModalDraw?.latestResult?.rawNumber ??
                  null;

                const rows = [
                  { label: "Open Bid Last Time", value: openBidTime },
                  { label: "Open Result Time", value: openResultTime },
                  { label: "Close Bid Last Time", value: closeBidTime },
                  { label: "Close Result Time", value: closeResultTime },
                  ...(resultNumber
                    ? [{ label: "Result", value: resultNumber }]
                    : []),
                ];

                return rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-4 py-3 ${
                      i < rows.length - 1 ? "border-b border-white/[0.06]" : ""
                    } ${i % 2 === 0 ? "bg-white/[0.03]" : "bg-transparent"}`}
                  >
                    <span className="text-sm text-white/50">{row.label}</span>
                    <span
                      className={`text-sm font-bold ${
                        row.label === "Result"
                          ? "font-mono tracking-widest text-primary"
                          : "text-white"
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ));
              })()}
            </div>

            {/* OK Button */}
            <div className="px-6 pb-7">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="w-full rounded-full bg-gradient-to-r from-primary to-emerald-500 py-3 text-sm font-bold text-white transition hover:opacity-90"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TimeBazarPage;
