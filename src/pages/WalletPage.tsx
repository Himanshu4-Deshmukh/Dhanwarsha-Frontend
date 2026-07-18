// export default WalletPage;
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import {
  ArrowUpFromLine,
  Coins,
  CreditCard,
  Info,
  Loader2,
  QrCode,
  Smartphone,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const QR_EXPIRY_SEC = 30;
const MIN_WITHDRAWAL = 1000;

const isMobileDevice = () => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (
    /android/i.test(ua) ||
    (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream)
  );
};

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);

  // Add money
  const [requestAmount, setRequestAmount] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [upiLink, setUpiLink] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [qrCounter, setQrCounter] = useState(QR_EXPIRY_SEC);
  const [qrAmount, setQrAmount] = useState("");
  const [paymentConfig, setPaymentConfig] = useState<{
    upiId: string;
    upiName: string;
  }>({
    upiId: "",
    upiName: "",
  });
  const [isMobile, setIsMobile] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const loadData = async () => {
    try {
      const [wallet, paymentConfig] = await Promise.all([
        api.getBalance(),
        api.getPaymentConfig().catch(() => ({ upiId: "", upiName: "" })),
      ]);
      setBalance(wallet.balance);
      setPaymentConfig(paymentConfig);
    } catch {
      toast.error("Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── QR countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showQR) return;
    if (qrCounter <= 0) {
      setShowQR(false);
      setUpiLink("");
      setQrAmount("");
      toast("QR code expired. Generate a new one.");
      return;
    }
    const id = setInterval(() => setQrCounter((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [showQR, qrCounter]);

  const handleGenerateQR = () => {
    const amount = Number(requestAmount);
    if (!amount || amount < 1) {
      toast.error("Enter a valid amount first");
      return;
    }
    if (!paymentConfig.upiId.trim()) {
      toast.error("Payment UPI is not configured yet. Please contact admin.");
      return;
    }
    const upiName = paymentConfig.upiName.trim() || "Dhanwarsha Payments";
    const link = `upi://pay?pn=${encodeURIComponent(upiName)}&am=${amount}&mode=01&pa=${paymentConfig.upiId.trim()}`;
    setUpiLink(link);
    setQrAmount(String(amount));
    setQrCounter(QR_EXPIRY_SEC);
    setShowQR(true);
  };

  const dismissQR = () => {
    setShowQR(false);
    setUpiLink("");
    setQrAmount("");
  };

  const handleSubmitPaymentRequest = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(requestAmount);
    if (!amount || amount < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!paymentScreenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    setSubmittingPayment(true);
    try {
      const uploadResponse =
        await api.uploadPaymentScreenshot(paymentScreenshot);
      await api.requestPayment(amount, uploadResponse.screenshotUrl);
      toast.success("Payment request submitted");
      setRequestAmount("");
      setPaymentScreenshot(null);
      setShowQR(false);
      setUpiLink("");
      setQrAmount("");
      if (screenshotInputRef.current) screenshotInputRef.current.value = "";
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit payment request");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL} coins`);
      return;
    }
    if (!withdrawUpi.trim()) {
      toast.error("Enter your UPI ID");
      return;
    }
    if (balance !== null && amount > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setSubmittingWithdraw(true);
    try {
      await api.createWithdrawal(amount, withdrawUpi.trim());
      toast.success("Withdrawal request submitted — coins debited");
      setWithdrawOpen(false);
      setWithdrawAmount("");
      setWithdrawUpi("");
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit withdrawal");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - qrCounter / QR_EXPIRY_SEC);
  const timerColor =
    qrCounter > 15 ? "#4ADE80" : qrCounter > 7 ? "#F5A623" : "#F87171";

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* ── Balance card ── */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-[hsl(42,92%,12%)] via-[hsl(42,60%,9%)] to-[hsl(220,20%,10%)] p-6 text-center shadow-[0_0_20px_rgba(255,200,0,0.1)]">
        <p className="mb-1 text-xs text-white/40">Your Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <span className="font-display text-4xl font-bold text-primary">
            {balance ?? 0}
          </span>
        </div>
        <p className="mt-1 text-xs text-white/30">coins</p>

        <button
          onClick={() => setWithdrawOpen(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
        >
          <ArrowUpFromLine className="h-4 w-4" />
          Withdraw Coins
        </button>
      </div>

      {/* ── Add Money ── */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)]">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-white">Add Money</h2>
        </div>

        <form onSubmit={handleSubmitPaymentRequest} className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">
              1
            </span>
            <span className="text-xs font-medium text-white/50">
              Enter amount and scan QR to pay
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min={1}
              value={requestAmount}
              onChange={(e) => {
                setRequestAmount(e.target.value);
                if (showQR) dismissQR();
              }}
              placeholder="Enter amount"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleGenerateQR}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <QrCode className="h-3.5 w-3.5" /> Generate QR
            </button>
          </div>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-primary/20 bg-black/30 p-4">
                  <div className="mb-3 text-center">
                    <p className="text-xs text-white/40">Pay via UPI</p>
                    <p className="text-sm font-semibold text-white">
                      {paymentConfig.upiName || "Dhanwarsha Payments"}
                    </p>
                    <p className="text-xs text-primary/80">
                      {paymentConfig.upiId || "UPI not configured"}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(245,166,35,0.3)]">
                      <QRCodeSVG value={upiLink} size={160} />
                      {qrCounter <= 5 && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                          <p className="text-2xl font-bold text-red-400">
                            {qrCounter}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1">
                      <span className="text-sm font-bold text-primary">
                        Rs {qrAmount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle
                          cx="14"
                          cy="14"
                          r={radius}
                          fill="none"
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="2.5"
                        />
                        <circle
                          cx="14"
                          cy="14"
                          r={radius}
                          fill="none"
                          stroke={timerColor}
                          strokeWidth="2.5"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 14 14)"
                          style={{
                            transition:
                              "stroke-dashoffset 1s linear, stroke 0.5s",
                          }}
                        />
                      </svg>
                      <p className="text-xs text-white/40">
                        Expires in{" "}
                        <span
                          className="font-bold"
                          style={{ color: timerColor }}
                        >
                          {qrCounter}s
                        </span>
                      </p>
                    </div>
                    {isMobile && (
                      <a
                        href={upiLink}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-black"
                      >
                        <Smartphone className="h-4 w-4" /> Pay Now with UPI
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/50">
              2
            </span>
            <span className="text-xs font-medium text-white/50">
              Upload screenshot and submit
            </span>
          </div>

          <div>
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPaymentScreenshot(e.target.files?.[0] || null)
              }
              className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
            />
            {paymentScreenshot && (
              <p className="mt-1.5 text-xs text-green-400">
                Selected: {paymentScreenshot.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submittingPayment}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submittingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" /> Submit Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* ── Withdraw bottom sheet ── */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setWithdrawOpen(false);
            }}
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mb-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-6"
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-white">
                    Withdraw Coins
                  </h2>
                </div>
                <button onClick={() => setWithdrawOpen(false)}>
                  <X className="h-5 w-5 text-white/40" />
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] text-white/40">Min. withdrawal</p>
                  <p className="mt-1 text-base font-bold text-primary">
                    {MIN_WITHDRAWAL} coins
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] text-white/40">Available</p>
                  <p className="mt-1 text-base font-bold text-white">
                    {balance ?? 0} coins
                  </p>
                </div>
                <div className="col-span-2 rounded-xl bg-white/5 p-3">
                  <p className="text-[10px] text-white/40">Processing time</p>
                  <p className="mt-1 text-sm font-medium text-white">
                    24 – 48 hours after approval
                  </p>
                </div>
              </div>

              <div className="mb-4 flex gap-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                <p className="text-xs text-yellow-400/80">
                  Coins are <strong>debited immediately</strong>. If your
                  request is rejected, they will be automatically refunded.
                </p>
              </div>

              <form onSubmit={handleWithdraw} className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Amount
                  </label>
                  <input
                    type="number"
                    min={MIN_WITHDRAWAL}
                    max={balance ?? undefined}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder={`Min. ${MIN_WITHDRAWAL} coins`}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/50">
                    Your UPI ID
                  </label>
                  <input
                    type="text"
                    value={withdrawUpi}
                    onChange={(e) => setWithdrawUpi(e.target.value)}
                    placeholder="yourname@upi"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingWithdraw}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {submittingWithdraw ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowUpFromLine className="h-4 w-4" /> Request Withdrawal
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletPage;
