import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock3,
  Coins,
  Loader2,
  Ticket,
  Trophy,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api, LotteryConfig, LotteryPurchase, LotteryRound } from "@/lib/api";
import type { ReactNode } from "react";

type TabKey = "purchases" | "wins" | "results";

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

const statusLabel: Record<string, string> = {
  UPCOMING: "UPCOMING",
  OPEN: "OPEN",
  CLOSED: "CLOSED",
  RESULT_DECLARED: "RESULT DECLARED",
};

const statusStyles: Record<string, string> = {
  UPCOMING: "border border-amber-500/20 bg-amber-500/10 text-amber-400",
  OPEN: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  CLOSED: "border border-orange-500/20 bg-orange-500/10 text-orange-400",
  RESULT_DECLARED: "border border-primary/20 bg-primary/10 text-primary",
};

const tabStyles: Record<TabKey, string> = {
  purchases: "Purchases",
  wins: "Wins",
  results: "Recent Results",
};

// Deterministic color per ticket number
const TICKET_PALETTES = [
  {
    bg: "from-violet-900/80 to-indigo-900/80",
    accent: "text-violet-300",
    border: "border-violet-500/30",
    dot: "bg-violet-400",
  },
  {
    bg: "from-rose-900/80 to-pink-900/80",
    accent: "text-rose-300",
    border: "border-rose-500/30",
    dot: "bg-rose-400",
  },
  {
    bg: "from-amber-900/80 to-yellow-900/80",
    accent: "text-amber-300",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
  },
  {
    bg: "from-teal-900/80 to-cyan-900/80",
    accent: "text-teal-300",
    border: "border-teal-500/30",
    dot: "bg-teal-400",
  },
  {
    bg: "from-emerald-900/80 to-green-900/80",
    accent: "text-emerald-300",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
  },
  {
    bg: "from-sky-900/80 to-blue-900/80",
    accent: "text-sky-300",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
  },
];

function getPalette(number: string) {
  let hash = 0;
  for (let i = 0; i < number.length; i++)
    hash = (hash * 31 + number.charCodeAt(i)) & 0xffff;
  return TICKET_PALETTES[hash % TICKET_PALETTES.length];
}

function PerforatedLine() {
  return (
    <div
      className="h-px w-full"
      style={{
        backgroundImage:
          "repeating-linear-gradient(to right, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 6px, transparent 6px, transparent 12px)",
      }}
    />
  );
}

function LotteryTicketCard({
  entry,
  isSelected,
  canPurchase,
  ticketPrice,
  winAmount,
  onSelect,
}: {
  entry: { number: string; purchaseCount: number };
  isSelected: boolean;
  canPurchase: boolean;
  ticketPrice: number;
  winAmount: number;
  onSelect: () => void;
}) {
  const palette = getPalette(entry.number);
  const hot = entry.purchaseCount > 4;

  return (
    <button
      type="button"
      disabled={!canPurchase}
      onClick={onSelect}
      className={`relative w-full text-left transition-all duration-200 focus:outline-none ${!canPurchase
          ? "cursor-not-allowed opacity-40"
          : "hover:scale-[1.02] active:scale-[0.98]"
        }`}
    >
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${palette.bg} ${palette.border} ${isSelected ? "ring-2 ring-white/70 ring-offset-1 ring-offset-black/50 shadow-lg shadow-white/10" : ""
          }`}
      >
        {/* Noise texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "100px",
          }}
        />

        {/* Top half */}
        <div className="px-2.5 pt-2.5 pb-1.5">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <div className={`h-1.5 w-1.5 rounded-full ${palette.dot}`} />
              <span className="text-[8px] font-bold uppercase tracking-[0.3em] text-white/40">Lucky</span>
            </div>
            <div className="flex items-center gap-1">
              {hot && (
                <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-orange-300">
                  Hot
                </span>
              )}
              {isSelected && (
                <span className="rounded-full border border-white/40 bg-white/20 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-white">
                  ✓
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[7px] uppercase tracking-[0.25em] text-white/30">Ticket No.</p>
            <p className={`font-mono text-xl font-black tracking-[0.1em] ${palette.accent}`}>
              {entry.number}
            </p>
          </div>
        </div>

        {/* Tear line */}
        <div className="relative flex items-center px-2">
          <div className="absolute -left-2 h-4 w-4 rounded-full bg-black/60" />
          <PerforatedLine />
          <div className="absolute -right-2 h-4 w-4 rounded-full bg-black/60" />
        </div>

        {/* Stub */}
        <div className="px-2.5 py-1.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[7px] uppercase tracking-[0.2em] text-white/30">Price</p>
              <p className="font-mono text-xs font-bold text-white">₹{ticketPrice}</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <p className="text-[7px] uppercase tracking-[0.2em] text-white/30">Sold</p>
              <p className="font-mono text-xs font-bold text-white/60">{entry.purchaseCount}</p>
            </div>
            {/* Mini barcode */}
            <div className="flex items-end gap-[1.5px] h-4">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className="bg-white/20 rounded-[1px]"
                  style={{
                    width: i % 3 === 0 ? "2.5px" : "1px",
                    height: `${40 + ((i * 7 + 11) % 60)}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

// ── Bottom Sheet Purchase Panel ────────────────────────────────────────────────
function PurchaseSheet({
  ticket,
  ticketPrice,
  winAmount,
  walletCanCover,
  buying,
  onBuy,
  onDismiss,
}: {
  ticket: { number: string; purchaseCount: number } | null;
  ticketPrice: number;
  winAmount: number;
  walletCanCover: boolean;
  buying: boolean;
  onBuy: () => void;
  onDismiss: () => void;
}) {
  const palette = ticket ? getPalette(ticket.number) : TICKET_PALETTES[0];

  return (
    <AnimatePresence>
      {ticket && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onDismiss}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
          >
            <div className="rounded-t-3xl border-t border-x border-white/10 bg-[hsl(220,20%,7%)] px-5 pt-4 pb-8 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
              {/* Handle */}
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

              {/* Dismiss */}
              <button
                type="button"
                onClick={onDismiss}
                className="absolute top-4 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Content */}
              <div className="flex items-center gap-4">
                {/* Ticket preview chip */}
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border bg-gradient-to-br ${palette.bg} ${palette.border}`}>
                  <span className={`font-mono text-sm font-black ${palette.accent}`}>
                    {ticket.number.slice(-3)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase tracking-[0.35em] text-white/35 mb-0.5">Selected ticket</p>
                  <p className={`font-mono text-xl font-black tracking-wider ${palette.accent}`}>
                    {ticket.number}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Win <span className="text-white/70 font-semibold">₹{winAmount.toLocaleString()}</span>
                    {" · "}
                    {ticket.purchaseCount} sold
                  </p>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">Cost</p>
                  <p className="font-mono text-lg font-bold text-white">₹{ticketPrice}</p>
                </div>
              </div>

              {/* Buy button */}
              <button
                type="button"
                disabled={buying || !walletCanCover}
                onClick={onBuy}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 py-3.5 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
              >
                {buying ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Purchasing…</>
                ) : (
                  <><Coins className="h-4 w-4" /> Buy for ₹{ticketPrice}</>
                )}
              </button>

              {!walletCanCover && (
                <p className="mt-2 text-center text-xs text-red-400/70">Insufficient wallet balance</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function LotteryPage() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [config, setConfig] = useState<LotteryConfig | null>(null);
  const [todayRound, setTodayRound] = useState<LotteryRound | null>(null);
  const [history, setHistory] = useState<LotteryRound[]>([]);
  const [purchases, setPurchases] = useState<LotteryPurchase[]>([]);
  const [wins, setWins] = useState<LotteryPurchase[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("purchases");
  const [selectedNumber, setSelectedNumber] = useState("");
  const [buying, setBuying] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [wallet, lotteryConfig, round, recentHistory, myPurchases, myWins] =
        await Promise.all([
          api.getBalance(),
          api.getLotteryConfig(),
          api.getLotteryToday(),
          api.getLotteryHistory(6).catch(() => []),
          api.getMyLotteryPurchases(50).catch(() => []),
          api.getMyLotteryWins(50).catch(() => []),
        ]);
      setBalance(wallet.balance ?? 0);
      setConfig(lotteryConfig);
      setTodayRound(round);
      setHistory(recentHistory ?? []);
      setPurchases(myPurchases ?? []);
      setWins(myWins ?? []);
      if (round?.numbers?.length && !round.numbers.some((item) => item.number === selectedNumber)) {
        setSelectedNumber("");
      }
    } catch (error) {
      console.error("Failed to load lottery page", error);
      if (!silent) toast.error("Unable to load lottery data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const id = setInterval(() => loadData(true), 30000);
    return () => clearInterval(id);
  }, []);

  const numbers = useMemo(() => todayRound?.numbers ?? [], [todayRound]);
  const selectedTicket = useMemo(() => numbers.find((e) => e.number === selectedNumber) ?? null, [numbers, selectedNumber]);
  const purchasedNumbers = useMemo(
    () => new Set(purchases.map((p) => p.number)),
    [purchases],
  );

  const ticketPrice = todayRound?.ticketPrice ?? config?.ticketPrice ?? 100;
  const winAmount = todayRound?.winAmount ?? config?.winAmount ?? 5000;
  const canPurchase = todayRound?.status === "OPEN";
  const walletCanCover = balance >= ticketPrice;

  const handleBuy = async () => {
    if (!selectedNumber || !todayRound) return;
    setBuying(true);
    try {
      await api.buyLotteryTicket(selectedNumber);
      toast.success(`Ticket ${selectedNumber} purchased!`);
      setSelectedNumber("");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to buy ticket");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 p-4 pb-32">

        {/* ── Compact header card ── */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(42,88%,10%)] via-[hsl(220,20%,9%)] to-[hsl(220,20%,7%)] p-3.5">
          <div className="flex items-center justify-between gap-3">
            {/* Left */}
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-wide text-white/35">Daily Lottery</p>
              <h1 className="mt-0.5 text-base font-bold text-white leading-tight">Lucky Lottery</h1>
            </div>
            {/* Status badge */}
            <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-bold tracking-wide ${statusStyles[todayRound?.status || "UPCOMING"]}`}>
              {statusLabel[todayRound?.status || "UPCOMING"]}
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
              <Ticket className="h-3 w-3 text-primary" />
              <span className="text-xs font-semibold text-white">₹{ticketPrice}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
              <Trophy className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-semibold text-white">₹{winAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5">
              <Clock3 className="h-3 w-3 text-sky-400" />
              <span className="text-xs font-semibold text-white">{formatDateTime(todayRound?.resultDeclarationTime)}</span>
            </div>
          </div>

          {/* Open / Close chips */}
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[9px] text-white/40">
              Open {formatDateTime(todayRound?.openTime)}
            </span>
            <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[9px] text-white/40">
              Close {formatDateTime(todayRound?.closeTime)}
            </span>
          </div>
        </div>

        {/* ── Result declared banner ── */}
        {todayRound?.status === "RESULT_DECLARED" && todayRound.winningNumber && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
            <p className="text-[9px] uppercase tracking-[0.3em] text-primary/60">Result declared</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-white/50">Winning number</p>
                <p className="font-mono text-2xl font-bold text-primary">{todayRound.winningNumber}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                <p className="text-[9px] text-white/40">Declared at</p>
                <p className="text-xs font-semibold text-white">{formatDateTime(todayRound.declaredAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Ticket grid ── */}
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wide text-white/30">Choose ticket</p>
              <h2 className="mt-0.5 text-sm font-semibold text-white">100 numbers daily</h2>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/50">
              <Sparkles className="h-3 w-3 text-primary" />
              {canPurchase ? "Open" : "Closed"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {numbers.map((entry) => (
              <LotteryTicketCard
                key={entry.number}
                entry={entry}
                isSelected={selectedNumber === entry.number}
                canPurchase={canPurchase && !purchasedNumbers.has(entry.number)}
                ticketPrice={ticketPrice}
                winAmount={winAmount}
                onSelect={() =>
                  setSelectedNumber((prev) => (prev === entry.number ? "" : entry.number))
                }
              />
            ))}
          </div>

          {canPurchase && (
            <p className="mt-3 text-center text-[10px] text-white/30">
              Tap a ticket to select · tap again to deselect
            </p>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-4">
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-white/5 p-1">
            {(Object.keys(tabStyles) as TabKey[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${activeTab === tab
                  ? "bg-primary text-black"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
                  }`}
              >
                {tabStyles[tab]}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "purchases" && (
              <motion.div key="purchases" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4">
                <HistoryList
                  title="My purchases"
                  emptyText="No lottery tickets purchased yet."
                  items={purchases}
                  renderItem={(item) => (
                    <>
                      <ListHeader title={item.dateKey || formatDateTime(item.createdAt)} rightLabel={item.status} />
                      <ListBody leftTitle={item.number} leftSubtitle={`Paid ₹${item.amount}`} rightValue={item.payout ? `+₹${item.payout}` : "–"} rightTone={item.status === "WON" ? "success" : item.status === "LOST" ? "danger" : "normal"} />
                    </>
                  )}
                />
              </motion.div>
            )}
            {activeTab === "wins" && (
              <motion.div key="wins" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4">
                <HistoryList
                  title="Winning tickets"
                  emptyText="No lottery wins yet."
                  items={wins}
                  renderItem={(item) => (
                    <>
                      <ListHeader title={item.dateKey || formatDateTime(item.createdAt)} rightLabel="WON" />
                      <ListBody leftTitle={item.number} leftSubtitle={`Ticket ₹${item.amount}`} rightValue={`+₹${item.payout || winAmount}`} rightTone="success" />
                    </>
                  )}
                />
              </motion.div>
            )}
            {activeTab === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4">
                <HistoryList
                  title="Recent rounds"
                  emptyText="No lottery rounds yet."
                  items={history}
                  renderItem={(item) => (
                    <>
                      <ListHeader title={item.dateKey} rightLabel={item.status} />
                      <ListBody leftTitle={item.status === "RESULT_DECLARED" && item.winningNumber ? item.winningNumber : "Pending"} leftSubtitle={`Sales ₹${item.totalSales}`} rightValue={`${item.totalPurchases} buys`} rightTone={item.status === "RESULT_DECLARED" ? "success" : "normal"} />
                    </>
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Bottom sheet ── */}
      <PurchaseSheet
        ticket={selectedTicket}
        ticketPrice={ticketPrice}
        winAmount={winAmount}
        walletCanCover={walletCanCover}
        buying={buying}
        onBuy={handleBuy}
        onDismiss={() => setSelectedNumber("")}
      />
    </>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function InfoCard({ icon: Icon, label, value, compact = false }: { icon: any; label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 ${compact ? "p-2" : "p-3"}`}>
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-primary`} />
        <p className={`${compact ? "text-[9px]" : "text-[10px]"} uppercase tracking-[0.25em]`}>{label}</p>
      </div>
      <p className={`${compact ? "mt-1 text-xs" : "mt-2 text-sm"} font-semibold text-white`}>{value}</p>
    </div>
  );
}

function HistoryList({ title, emptyText, items, renderItem }: { title: string; emptyText: string; items: any[]; renderItem: (item: any) => ReactNode }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">{title}</p>
        <p className="text-xs text-white/30">{items.length} items</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListHeader({ title, rightLabel }: { title: string; rightLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="truncate text-sm font-semibold text-white">{title}</p>
      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] text-white/50">
        {rightLabel}
      </span>
    </div>
  );
}

function ListBody({ leftTitle, leftSubtitle, rightValue, rightTone }: { leftTitle: string; leftSubtitle: string; rightValue: string; rightTone: "normal" | "success" | "danger" }) {
  const toneClass = rightTone === "success" ? "text-emerald-400" : rightTone === "danger" ? "text-red-400" : "text-primary";
  return (
    <div className="mt-2.5 flex items-center justify-between gap-3">
      <div>
        <p className="font-mono text-lg font-bold text-white">{leftTitle}</p>
        <p className="text-xs text-white/40">{leftSubtitle}</p>
      </div>
      <p className={`text-lg font-bold ${toneClass}`}>{rightValue}</p>
    </div>
  );
}
