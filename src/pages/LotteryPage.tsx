import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock3, Coins, Loader2, Ticket, Trophy, Sparkles } from "lucide-react";
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

// Perforated edge using SVG dashes
function PerforatedLine({ vertical = false }: { vertical?: boolean }) {
  if (vertical) {
    return (
      <div
        className="w-px self-stretch"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.25) 0px, rgba(255,255,255,0.25) 6px, transparent 6px, transparent 12px)",
        }}
      />
    );
  }
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
  compact?: boolean;
}) {
  const palette = getPalette(entry.number);
  const hot = entry.purchaseCount > 4;

  return (
    <button
      type="button"
      disabled={!canPurchase}
      onClick={onSelect}
      className={`relative w-full text-left transition-all duration-200 focus:outline-none ${
        !canPurchase
          ? "cursor-not-allowed opacity-40"
          : "hover:scale-[1.02] active:scale-[0.98]"
      }`}
    >
      {/* Outer ticket shell */}
      <div
        className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${palette.bg} ${palette.border} ${
          isSelected
            ? "ring-2 ring-white/60 ring-offset-1 ring-offset-black/50"
            : ""
        }`}
      >
        {/* Subtle noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: "100px",
          }}
        />

        {/* TOP HALF: main number area */}
        <div className="px-4 pt-4 pb-3">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${palette.dot}`} />
              <span className="text-[9px] font-bold uppercase tracking-[0.35em] text-white/40">
                Lucky
              </span>
            </div>
            {hot && (
              <span className="rounded-full border border-orange-500/30 bg-orange-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-300">
                Hot
              </span>
            )}
            {isSelected && (
              <span className="rounded-full border border-white/30 bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                Selected
              </span>
            )}
          </div>

          {/* Big number */}
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35 mb-1">
                Ticket No.
              </p>
              <p
                className={`font-mono text-3xl font-black tracking-[0.15em] ${palette.accent}`}
              >
                {entry.number}
              </p>
            </div>
            <div className="text-right pb-0.5">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                Win
              </p>
              <p className="font-mono text-base font-bold text-white">
                ₹{winAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Perforated tear line */}
        <div className="relative flex items-center px-2">
          {/* Left notch */}
          <div className="absolute -left-3 h-6 w-6 rounded-full bg-black/60" />
          <PerforatedLine />
          {/* Right notch */}
          <div className="absolute -right-3 h-6 w-6 rounded-full bg-black/60" />
        </div>

        {/* BOTTOM HALF: stub */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                Price
              </p>
              <p className="font-mono text-sm font-bold text-white">
                ₹{ticketPrice}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                Sold
              </p>
              <p className="font-mono text-sm font-bold text-white/70">
                {entry.purchaseCount}
              </p>
            </div>
            <div className="text-right">
              {/* Barcode decoration */}
              <div className="flex items-end gap-[2px] h-7">
                {Array.from({ length: 18 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-white/20 rounded-[1px]"
                    style={{
                      width: i % 3 === 0 ? "3px" : "1.5px",
                      height: `${40 + ((i * 7 + 11) % 60)}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

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
      if (
        round?.numbers?.length &&
        !round.numbers.some((item) => item.number === selectedNumber)
      ) {
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

  const selectedTicket = useMemo(
    () => numbers.find((entry) => entry.number === selectedNumber),
    [numbers, selectedNumber],
  );

  const ticketPrice = todayRound?.ticketPrice ?? config?.ticketPrice ?? 100;
  const winAmount = todayRound?.winAmount ?? config?.winAmount ?? 5000;
  const canPurchase = todayRound?.status === "OPEN";
  const walletCanCover = balance >= ticketPrice;

  const handleBuy = async () => {
    if (!selectedNumber) {
      toast.error("Choose a lottery number first");
      return;
    }
    if (!todayRound) {
      toast.error("Lottery round is not ready yet");
      return;
    }
    setBuying(true);
    try {
      await api.buyLotteryTicket(selectedNumber);
      toast.success(`Ticket ${selectedNumber} purchased`);
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
    <div className="space-y-4 p-4 pb-28">
      {/* Header card */}
      {/* <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-[hsl(42,88%,12%)] via-[hsl(220,20%,9%)] to-[hsl(220,20%,7%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">
              Daily lottery
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Lucky Lottery
            </h1>
            <p className="mt-2 max-w-md text-sm text-white/55">
              Pick one of the daily 6-digit entries, pay from your wallet, and
              wait for the 10 PM result.
            </p>
          </div>
          <div
            className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-semibold ${statusStyles[todayRound?.status || "UPCOMING"]}`}
          >
            {statusLabel[todayRound?.status || "UPCOMING"]}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <InfoCard
            icon={Ticket}
            label="Ticket price"
            value={`${ticketPrice} Rs`}
          />
          <InfoCard
            icon={Trophy}
            label="Winning amount"
            value={`${winAmount} Rs`}
          />
          <InfoCard
            icon={Clock3}
            label="Result time"
            value={formatDateTime(todayRound?.resultDeclarationTime)}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            Open: {formatDateTime(todayRound?.openTime)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
            Close: {formatDateTime(todayRound?.closeTime)}
          </span>
        
        </div>
      </div> */}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(42,88%,12%)] via-[hsl(220,20%,9%)] to-[hsl(220,20%,7%)] p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
              Daily lottery
            </p>
            <h1 className="mt-0.5 text-lg font-semibold text-white">
              Lucky Lottery
            </h1>
            <p className="mt-1 text-xs text-white/50 leading-snug whitespace-nowrap">
              Pick a lottery number and wait for the 10 PM result.
            </p>
          </div>

          <div
            className={`shrink-0 rounded-xl px-2 py-1 text-[10px] font-semibold ${statusStyles[todayRound?.status || "UPCOMING"]}`}
          >
            {statusLabel[todayRound?.status || "UPCOMING"]}
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <InfoCard
            icon={Ticket}
            label="Price"
            value={`${ticketPrice} Rs`}
            compact
          />
          <InfoCard
            icon={Trophy}
            label="Win"
            value={`${winAmount} Rs`}
            compact
          />
          <InfoCard
            icon={Clock3}
            label="Result"
            value={formatDateTime(todayRound?.resultDeclarationTime)}
            compact
          />
        </div>

        {/* Time Chips */}
        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] text-white/50">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Open: {formatDateTime(todayRound?.openTime)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
            Close: {formatDateTime(todayRound?.closeTime)}
          </span>
        </div>
      </div>

      {/* Result declared banner */}
      {todayRound?.status === "RESULT_DECLARED" && todayRound.winningNumber && (
        <div className="rounded-3xl border border-primary/20 bg-primary/10 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
            Result declared
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-white/60">Winning number</p>
              <p className="font-mono text-2xl font-bold text-primary">
                {todayRound.winningNumber}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
              <p className="text-xs text-white/45">Declared at</p>
              <p className="text-sm font-semibold text-white">
                {formatDateTime(todayRound.declaredAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ticket selection grid */}
      <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] p-3">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/35">
              Choose ticket
            </p>
            <h2 className="mt-0.5 text-sm font-semibold text-white">
              100 numbers daily
            </h2>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/55">
            <Sparkles className="h-3 w-3 text-primary" />
            {canPurchase ? "Open" : "Closed"}
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {numbers.map((entry) => (
            <LotteryTicketCard
              key={entry.number}
              entry={entry}
              isSelected={selectedNumber === entry.number}
              canPurchase={canPurchase}
              ticketPrice={ticketPrice}
              winAmount={winAmount}
              onSelect={() => setSelectedNumber(entry.number)}
              compact
            />
          ))}
        </div>

        {/* Purchase Summary */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/35">
                Summary
              </p>
              <h3 className="mt-0.5 font-mono text-base font-semibold text-white">
                {selectedTicket?.number || "------"}
              </h3>
              <p className="mt-0.5 text-xs text-white/50">
                {selectedTicket
                  ? `${ticketPrice} Rs selected`
                  : "Select a ticket"}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5 text-[10px] text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {todayRound?.totalPurchases ?? 0} buys
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">
                {todayRound?.totalSales ?? 0} Rs
              </span>
            </div>
          </div>

          {/* Button */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={
                !selectedNumber || !canPurchase || buying || !walletCanCover
              }
              onClick={handleBuy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-primary to-emerald-500 px-3 py-2 text-xs font-semibold text-black transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buying ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Buying
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5" /> Buy
                </>
              )}
            </button>

            <p className="text-[10px] text-white/45">
              {walletCanCover ? "Balance ok" : "Low balance"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-4">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          {(Object.keys(tabStyles) as TabKey[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${
                activeTab === tab
                  ? "bg-primary text-black"
                  : "text-white/55 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tabStyles[tab]}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "purchases" && (
            <motion.div
              key="purchases"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 space-y-3"
            >
              <HistoryList
                title="My lottery purchases"
                emptyText="No lottery tickets purchased yet."
                items={purchases}
                renderItem={(item) => (
                  <>
                    <ListHeader
                      title={item.dateKey || formatDateTime(item.createdAt)}
                      rightLabel={item.status}
                    />
                    <ListBody
                      leftTitle={item.number}
                      leftSubtitle={`Paid ${item.amount} Rs`}
                      rightValue={item.payout ? `+${item.payout}` : "-"}
                      rightTone={
                        item.status === "WON"
                          ? "success"
                          : item.status === "LOST"
                            ? "danger"
                            : "normal"
                      }
                    />
                  </>
                )}
              />
            </motion.div>
          )}

          {activeTab === "wins" && (
            <motion.div
              key="wins"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 space-y-3"
            >
              <HistoryList
                title="Winning tickets"
                emptyText="No lottery wins yet."
                items={wins}
                renderItem={(item) => (
                  <>
                    <ListHeader
                      title={item.dateKey || formatDateTime(item.createdAt)}
                      rightLabel="WON"
                    />
                    <ListBody
                      leftTitle={item.number}
                      leftSubtitle={`Ticket ${item.amount} Rs`}
                      rightValue={`+${item.payout || winAmount}`}
                      rightTone="success"
                    />
                  </>
                )}
              />
            </motion.div>
          )}

          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4 space-y-3"
            >
              <HistoryList
                title="Recent lottery rounds"
                emptyText="No lottery rounds yet."
                items={history}
                renderItem={(item) => (
                  <>
                    <ListHeader title={item.dateKey} rightLabel={item.status} />
                    <ListBody
                      leftTitle={
                        item.status === "RESULT_DECLARED" && item.winningNumber
                          ? item.winningNumber
                          : "Pending"
                      }
                      leftSubtitle={`Sales ${item.totalSales} Rs`}
                      rightValue={`${item.totalPurchases} buys`}
                      rightTone={
                        item.status === "RESULT_DECLARED" ? "success" : "normal"
                      }
                    />
                  </>
                )}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: any;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/5 ${compact ? "p-2" : "p-3"}`}
    >
      <div className="flex items-center gap-1.5 text-white/55">
        <Icon className={`${compact ? "h-3 w-3" : "h-4 w-4"} text-primary`} />
        <p
          className={`${compact ? "text-[9px]" : "text-[10px]"} uppercase tracking-[0.25em]`}
        >
          {label}
        </p>
      </div>
      <p
        className={`${compact ? "mt-1 text-xs" : "mt-2 text-sm"} font-semibold text-white`}
      >
        {value}
      </p>
    </div>
  );
}

function HistoryList({
  title,
  emptyText,
  items,
  renderItem,
}: {
  title: string;
  emptyText: string;
  items: any[];
  renderItem: (item: any) => ReactNode;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.3em] text-white/35">
          {title}
        </p>
        <p className="text-xs text-white/35">{items.length} items</p>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/40">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              {renderItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ListHeader({
  title,
  rightLabel,
}: {
  title: string;
  rightLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{title}</p>
      </div>
      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold tracking-[0.2em] text-white/55">
        {rightLabel}
      </span>
    </div>
  );
}

function ListBody({
  leftTitle,
  leftSubtitle,
  rightValue,
  rightTone,
}: {
  leftTitle: string;
  leftSubtitle: string;
  rightValue: string;
  rightTone: "normal" | "success" | "danger";
}) {
  const toneClass =
    rightTone === "success"
      ? "text-emerald-400"
      : rightTone === "danger"
        ? "text-red-400"
        : "text-primary";
  return (
    <div className="mt-3 flex items-center justify-between gap-3">
      <div>
        <p className="font-mono text-lg font-bold text-white">{leftTitle}</p>
        <p className="text-xs text-white/40">{leftSubtitle}</p>
      </div>
      <p className={`text-lg font-bold ${toneClass}`}>{rightValue}</p>
    </div>
  );
}
