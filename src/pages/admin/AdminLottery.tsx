import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Coins,
  Loader2,
  Ticket,
  Trophy,
  Sparkles,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { api, LotteryConfig, LotteryRound } from "@/lib/api";

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

export default function AdminLottery() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [declaring, setDeclaring] = useState(false);
  const [ticketPrice, setTicketPrice] = useState("100");
  const [winAmount, setWinAmount] = useState("5000");
  const [todayRound, setTodayRound] = useState<LotteryRound | null>(null);
  const [config, setConfig] = useState<LotteryConfig | null>(null);
  const [selectedNumber, setSelectedNumber] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [round, lotteryConfig] = await Promise.all([
        api.admin.getLotteryToday(),
        api.getLotteryConfig(),
      ]);

      setTodayRound(round);
      setConfig(lotteryConfig);
      setTicketPrice(String(lotteryConfig.ticketPrice ?? 100));
      setWinAmount(String(lotteryConfig.winAmount ?? 5000));
      setSelectedNumber(round.winningNumber || "");
    } catch (error) {
      console.error("Failed to load lottery admin page", error);
      toast.error("Unable to load lottery admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const canDeclare = useMemo(() => !!todayRound?._id, [todayRound?._id]);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.admin.updateLotteryConfig(Number(ticketPrice), Number(winAmount));
      toast.success("Lottery config updated");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update lottery config");
    } finally {
      setSaving(false);
    }
  };

  const saveWinningNumber = async () => {
    if (!todayRound?._id) {
      toast.error("Today lottery round is not ready");
      return;
    }
    if (!selectedNumber) {
      toast.error("Select a 6-digit number first");
      return;
    }

    try {
      const normalized = selectedNumber.padStart(6, "0");
      await api.admin.preselectLotteryWinningNumber(todayRound._id, normalized);
      toast.success("Winning number saved");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save winning number");
    }
  };

  const declareResult = async () => {
    if (!todayRound?._id) {
      toast.error("Today lottery round is not ready");
      return;
    }

    setDeclaring(true);
    try {
      const normalized = selectedNumber ? selectedNumber.padStart(6, "0") : undefined;
      await api.admin.declareLotteryResult(
        todayRound._id,
        normalized,
      );
      toast.success("Lottery result declared");
      await loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to declare result");
    } finally {
      setDeclaring(false);
    }
  };

  const numbers = todayRound?.numbers ?? [];
  const topLowNumbers = [...numbers]
    .sort((a, b) => a.purchaseCount - b.purchaseCount)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex h-[55vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Lottery control
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Daily lottery administration
            </h1>
            <p className="mt-2 text-sm text-white/50">
              Update the daily ticket price and winning amount, then preselect
              or declare the winning number for today's round.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            {todayRound?.status || "UPCOMING"}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <InfoCard icon={Coins} label="Ticket price" value={`${todayRound?.ticketPrice ?? config?.ticketPrice ?? 100} Rs`} />
          <InfoCard icon={Trophy} label="Winning amount" value={`${todayRound?.winAmount ?? config?.winAmount ?? 5000} Rs`} />
          <InfoCard icon={Ticket} label="Sold tickets" value={`${todayRound?.totalPurchases ?? 0}`} />
          <InfoCard icon={Clock3} label="Declare at" value={formatDateTime(todayRound?.resultDeclarationTime)} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-white">Daily config</h2>
          </div>
          <div className="space-y-3">
            <Field
              label="Ticket price"
              value={ticketPrice}
              onChange={setTicketPrice}
              prefix="Rs"
            />
            <Field
              label="Winning amount"
              value={winAmount}
              onChange={setWinAmount}
              prefix="Rs"
            />
            <button
              type="button"
              onClick={saveConfig}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 px-4 py-3 text-sm font-bold text-black transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" /> Save config
                </>
              )}
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Preselect winning number
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                maxLength={6}
                value={selectedNumber}
                onChange={(e) =>
                  setSelectedNumber(
                    e.target.value.replace(/[^0-9]/g, "").slice(0, 6),
                  )
                }
                className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-primary/40"
                placeholder="000123"
              />
              <button
                type="button"
                onClick={saveWinningNumber}
                disabled={!selectedNumber || !canDeclare}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save number
              </button>
            </div>
            <button
              type="button"
              onClick={declareResult}
              disabled={declaring || !canDeclare}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {declaring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Declaring
                </>
              ) : (
                <>
                  <Hash className="h-4 w-4" /> Declare result
                </>
              )}
            </button>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/35">
              Lottery timing
            </p>
            <div className="mt-3 space-y-2 text-sm text-white/65">
              <TimingRow label="Open" value={formatDateTime(todayRound?.openTime)} />
              <TimingRow label="Close" value={formatDateTime(todayRound?.closeTime)} />
              <TimingRow label="Result" value={formatDateTime(todayRound?.resultDeclarationTime)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                  Today numbers
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  {todayRound?.dateKey || "Today's round"}
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/50">
                {todayRound?.totalSales ?? 0} Rs sold
              </div>
            </div>

            <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10">
              {numbers.map((entry) => {
                const isSelected = entry.number === selectedNumber;
                const isWinning = todayRound?.winningNumber === entry.number;
                return (
                  <button
                    key={entry.number}
                    type="button"
                    onClick={() => setSelectedNumber(entry.number)}
                    className={`rounded-2xl border px-2 py-3 text-left transition ${
                      isWinning
                        ? "border-primary bg-primary/15 text-primary"
                        : isSelected
                          ? "border-white/30 bg-white/10 text-white"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <p className="font-mono text-sm font-semibold">{entry.number}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-white/35">
                      {entry.purchaseCount} sold
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/35">
                  Low purchase numbers
                </p>
                <h2 className="mt-1 text-lg font-bold text-white">
                  Useful for auto selection
                </h2>
              </div>
              <div className="text-xs text-white/45">
                {topLowNumbers.length} candidates
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              {topLowNumbers.map((entry) => (
                <div
                  key={entry.number}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                >
                  <p className="font-mono text-sm font-bold text-white">
                    {entry.number}
                  </p>
                  <p className="text-xs text-white/40">
                    {entry.purchaseCount} purchases
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[hsl(220,20%,8%)] p-5">
            <p className="text-xs uppercase tracking-[0.35em] text-white/35">
              Winning summary
            </p>
            {todayRound?.winningNumber ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3">
                  <p className="text-xs text-primary/70">Winning number</p>
                  <p className="font-mono text-2xl font-bold text-primary">
                    {todayRound.winningNumber}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/55">
                  <p>Mode: {todayRound.resultMode || "MANUAL"}</p>
                  <p className="mt-1">
                    Declared: {formatDateTime(todayRound.declaredAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-white/45">
                No winning number has been declared yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-white/55">
        <Icon className="h-4 w-4 text-primary" />
        <p className="text-[10px] uppercase tracking-[0.3em]">{label}</p>
      </div>
      <p className="mt-2 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-white/45">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 px-3 py-2.5">
        <span className="text-xs text-white/35">{prefix}</span>
        <input
          type="number"
          min={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-white outline-none"
        />
      </div>
    </div>
  );
}

function TimingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-white/45">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
