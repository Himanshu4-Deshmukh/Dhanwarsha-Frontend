import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

// ── Modal stage (navigation only) ────────────────────────────────────────────

type ModalStage = "window" | "betting";

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
  const [selectedSingleDigit, setSelectedSingleDigit] = useState(0);
  const [bidEntries, setBidEntries] = useState<
    { type: string; label: string; number: string; points: number }[]
  >([]);
  const [placingLiveBet, setPlacingLiveBet] = useState(false);
  const [latestLoading, setLatestLoading] = useState(true);
  const [liveDrawsLoading, setLiveDrawsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [betsLoading, setBetsLoading] = useState(false);

  const [modalStage, setModalStage] = useState<ModalStage>("window");
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const lastOpenedGameKeyRef = useRef<string | null>(null);

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

  const handleSelectPlayType = useCallback(
    (playKey: string) => {
      if (activePlay === playKey) return;
      setActivePlay(playKey);
      setDigitInputs({});
      setPattiNumber("");
      setPattiPoints("");
      setBidEntries([]);
      setSelectedSingleDigit(0);
    },
    [activePlay],
  );

  const openPlayModal = (gameKey: string) => {
    const isNewGame = lastOpenedGameKeyRef.current !== gameKey;
    if (isNewGame) {
      setModalStage("window");
      setGameType("open");
      setActivePlay(PLAY_OPTIONS[0].key);
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
    setIsPlayModalOpen(false);
  }, []);

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

  const handleCancelBets = useCallback(() => {
    setBidEntries([]);
    setDigitInputs({});
    setPattiNumber("");
    setPattiPoints("");
    setModalStage("window");
    setSelectedSingleDigit(0);
  }, []);

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

  const hasLinks = Boolean(
    selectedResult?.jodiLink || selectedResult?.panelLink,
  );
  const isWaitingForData = (latestLoading || liveDrawsLoading) && !selectedDraw;
  const latestTimestamp =
    selectedResult?.fetchedAt ??
    selectedDraw?.latestResult?.fetchedAt ??
    selectedDraw?.startTime;
  const modalGameName =
    selectedDraw?.gameName ?? selectedResult?.gameName ?? "Time Bazar";
  const modalStatusLabel =
    selectedDraw?.status ?? selectedResult?.timeWindow ?? "Running for today";
  const modalOpenTime = selectedResult?.openTime ?? selectedDraw?.startTime;
  const modalCloseTime = selectedResult?.closeTime ?? selectedDraw?.endTime;
  const activePlayLabel =
    PLAY_OPTIONS.find((option) => option.key === activePlay)?.label ?? "";
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
          <Sparkles className="h-8 w-8 rounded-2xl bg-white/10 p-1 text-white" />
        </div>

        {liveDraws.map((draw) => {
          const result = latestResults.find((r) => r.gameKey === draw.gameKey);
          const rawNumber =
            result?.rawNumber ?? draw.latestResult?.rawNumber ?? "***-**-***";
          const openTime = result?.openTime ?? draw.startTime ?? "--";
          const closeTime = result?.closeTime ?? "--";
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
                  onClick={() => openPlayModal(draw.gameKey)}
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
                    {selectedGameTypeLabel} · {activePlayLabel}
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
            {modalStage === "window" ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                  Choose a window
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {GAME_TYPES.map((type) => {
                    const time =
                      type.key === "open" ? modalOpenTime : modalCloseTime;
                    return (
                      <button
                        key={type.key}
                        type="button"
                        onClick={() => {
                          setGameType(type.key);
                          setModalStage("betting");
                        }}
                        className={`rounded-3xl border p-5 text-left transition ${
                          gameType === type.key
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
                <div className="space-y-3">
                  <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                    Play options
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {PLAY_OPTIONS.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleSelectPlayType(option.key)}
                        className={`rounded-3xl border px-4 py-3 text-sm font-semibold transition ${
                          activePlay === option.key
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-white/10 text-white/80"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-[hsl(220,20%,10%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  {/* Game type toggle */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      Game type
                    </p>
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                            Choose digit
                          </p>
                          <span className="text-xs text-white/50">
                            Selected{" "}
                            {String(selectedSingleDigit).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {Array.from({ length: 10 }, (_, index) => {
                            const value = String(index).padStart(2, "0");
                            const active = selectedSingleDigit === index;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedSingleDigit(index)}
                                className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                  active
                                    ? "border-primary bg-primary/20 text-primary"
                                    : "border-white/20 text-white/60 hover:border-white/60 hover:text-white"
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] px-4 py-3">
                        <span className="text-2xl font-bold text-white">
                          {String(selectedSingleDigit).padStart(2, "0")}
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
                          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Patti inputs */}
                  {activePlay !== "single-digit" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs uppercase tracking-[0.4em] text-white/50">
                            Choose number
                          </p>
                          <span className="text-xs text-white/50">
                            Range {numberRange.start}-{numberRange.end}
                          </span>
                        </div>
                        <div className="max-h-44 overflow-y-auto rounded-2xl border border-white/10 bg-[hsl(220,20%,6%)] p-2">
                          <div className="grid grid-cols-10 gap-2">
                            {numberOptions.map((num) => {
                              const value = String(num).padStart(2, "0");
                              const selected = value === pattiNumber;
                              return (
                                <button
                                  key={`${value}-${num}`}
                                  type="button"
                                  onClick={() => setPattiNumber(value)}
                                  className={`rounded-lg border px-2 py-1 text-xs font-semibold transition ${
                                    selected
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-white/10 text-white/60 hover:border-white/40 hover:text-white"
                                  }`}
                                >
                                  {value}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <label className="block text-xs font-semibold uppercase text-white/50">
                        Enter Number
                        <input
                          type="text"
                          maxLength={2}
                          value={pattiNumber}
                          onChange={(event) =>
                            setPattiNumber(
                              event.target.value.replace(/[^0-9]/g, ""),
                            )
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
                          onChange={(event) =>
                            setPattiPoints(event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border border-white/10 bg-[#0f1620] px-3 py-2 text-base font-semibold text-white outline-none focus:border-primary"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          handleAddPatti(
                            PLAY_OPTIONS.find(
                              (option) => option.key === activePlay,
                            )?.label ?? "Patti",
                          )
                        }
                        className="w-full rounded-2xl border border-white/20 bg-gradient-to-r from-primary to-emerald-500 px-4 py-2 text-sm font-semibold text-white"
                      >
                        Add{" "}
                        {PLAY_OPTIONS.find(
                          (option) => option.key === activePlay,
                        )?.label ?? "Patti"}
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
                    <p className="text-lg font-bold text-white">
                      {totalPoints}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelBets}
                      className="rounded-2xl border border-white/20 px-5 py-2 text-xs font-semibold text-white transition hover:border-white/40"
                    >
                      Cancel
                    </button>
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
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TimeBazarPage;
