// import { useState, useEffect, useRef, type FormEvent } from 'react';
// import { api } from '@/lib/api';
// import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Upload, CreditCard } from 'lucide-react';
// import { motion } from 'framer-motion';
// import { toast } from 'sonner';

// const WalletPage = () => {
//   const [balance, setBalance] = useState<number | null>(null);
//   const [transactions, setTransactions] = useState<any[]>([]);
//   const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
//   const [requestAmount, setRequestAmount] = useState('');
//   const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
//   const [submittingPayment, setSubmittingPayment] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const screenshotInputRef = useRef<HTMLInputElement>(null);

//   const loadData = async () => {
//     try {
//       const [w, t, p] = await Promise.all([
//         api.getBalance(),
//         api.getTransactions(),
//         api.getMyPayments().catch(() => []),
//       ]);
//       setBalance(w.balance);
//       setTransactions(t);
//       setPaymentRequests(p);
//     } catch {
//       toast.error('Failed to load wallet details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const handleSubmitPaymentRequest = async (e: FormEvent) => {
//     e.preventDefault();

//     const amount = Number(requestAmount);
//     if (!amount || amount < 1) {
//       toast.error('Enter a valid amount');
//       return;
//     }
//     if (!paymentScreenshot) {
//       toast.error('Please upload a payment screenshot');
//       return;
//     }

//     setSubmittingPayment(true);
//     try {
//       const uploadResponse = await api.uploadPaymentScreenshot(paymentScreenshot);
//       await api.requestPayment(amount, uploadResponse.screenshotUrl);

//       toast.success('Payment request submitted');
//       setRequestAmount('');
//       setPaymentScreenshot(null);
//       if (screenshotInputRef.current) screenshotInputRef.current.value = '';
//       await loadData();
//     } catch (err: any) {
//       toast.error(err?.message || 'Failed to submit payment request');
//     } finally {
//       setSubmittingPayment(false);
//     }
//   };

//   const statusStyles: Record<string, string> = {
//     PENDING: 'bg-yellow-500/10 text-yellow-400',
//     APPROVED: 'bg-green-500/10 text-green-400',
//     REJECTED: 'bg-red-500/10 text-red-400',
//   };

//   if (loading) {
//     return (
//       <div className="flex h-[80vh] items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 p-4 pb-24">
//       {/* Balance Card */}
//       <motion.div
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="rounded-xl border border-border bg-gradient-card p-6 text-center card-glow"
//       >
//         <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
//         <div className="flex items-center justify-center gap-2">
//           <Coins className="h-6 w-6 text-primary" />
//           <span className="text-3xl font-bold text-gradient-gold font-display">{balance ?? 0}</span>
//         </div>
//         <p className="mt-1 text-xs text-muted-foreground">coins</p>
//       </motion.div>

//       {/* Add Money Request */}
//       <motion.form
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         onSubmit={handleSubmitPaymentRequest}
//         className="rounded-xl border border-border bg-card p-4"
//       >
//         <div className="mb-3 flex items-center gap-2">
//           <CreditCard className="h-4 w-4 text-primary" />
//           <h2 className="text-sm font-semibold">Add Money Request</h2>
//         </div>

//         <div className="space-y-3">
//           <div>
//             <label className="mb-1 block text-xs text-muted-foreground">Amount</label>
//             <input
//               type="number"
//               min={1}
//               value={requestAmount}
//               onChange={(e) => setRequestAmount(e.target.value)}
//               placeholder="Enter amount"
//               className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block text-xs text-muted-foreground">Payment Screenshot</label>
//             <input
//               ref={screenshotInputRef}
//               type="file"
//               accept="image/*"
//               onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
//               className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={submittingPayment}
//             className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-70"
//           >
//             {submittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
//             {submittingPayment ? 'Submitting...' : 'Submit Request'}
//           </button>
//         </div>
//       </motion.form>

//       {/* Payment Requests */}
//       <div>
//         <h2 className="mb-3 text-sm font-semibold text-muted-foreground">My Payment Requests</h2>
//         {paymentRequests.length === 0 ? (
//           <p className="text-center text-xs text-muted-foreground py-6">No payment requests yet</p>
//         ) : (
//           <div className="space-y-2">
//             {paymentRequests.map((payment: any, i: number) => (
//               <motion.div
//                 key={payment._id || i}
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: i * 0.03 }}
//                 className="rounded-lg border border-border bg-card p-3"
//               >
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-semibold">{payment.amount} coins</p>
//                     <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</p>
//                   </div>
//                   <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[payment.status] || 'bg-muted text-muted-foreground'}`}>
//                     {payment.status}
//                   </span>
//                 </div>
//                 {payment.adminRemark && (
//                   <p className="mt-2 text-xs text-muted-foreground">Remark: {payment.adminRemark}</p>
//                 )}
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Transactions */}
//       <div>
//         <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Transaction History</h2>
//         {transactions.length === 0 ? (
//           <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>
//         ) : (
//           <div className="space-y-2">
//             {transactions.map((tx: any, i: number) => (
//               <motion.div
//                 key={tx._id || i}
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: i * 0.03 }}
//                 className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className={`rounded-full p-2 ${tx.amount > 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
//                     {tx.amount > 0 ? (
//                       <ArrowDownLeft className="h-4 w-4 text-success" />
//                     ) : (
//                       <ArrowUpRight className="h-4 w-4 text-destructive" />
//                     )}
//                   </div>
//                   <div>
//                     <p className="text-sm font-medium">{tx.type}</p>
//                     <p className="text-xs text-muted-foreground">
//                       {new Date(tx.createdAt).toLocaleDateString()}
//                     </p>
//                   </div>
//                 </div>
//                 <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
//                   {tx.amount > 0 ? '+' : ''}{tx.amount}
//                 </span>
//               </motion.div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default WalletPage;
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Upload, CreditCard, QrCode, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

// ── UPI config — update these as needed ──────────────────────────────────────
const UPI_ID = 'harshninave58@okaxis';
const UPI_NAME = 'Harsh Sanjay Ninave';
const QR_EXPIRY_SEC = 30;
// ─────────────────────────────────────────────────────────────────────────────

const isMobileDevice = () => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android/i.test(ua) || (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
};

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  // QR state
  const [upiLink, setUpiLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCounter, setQrCounter] = useState(QR_EXPIRY_SEC);
  const [isMobile, setIsMobile] = useState(false);
  const [qrAmount, setQrAmount] = useState('');   // amount locked in QR

  // ── init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const loadData = async () => {
    try {
      const [w, t, p] = await Promise.all([
        api.getBalance(),
        api.getTransactions(),
        api.getMyPayments().catch(() => []),
      ]);
      setBalance(w.balance);
      setTransactions(t);
      setPaymentRequests(p);
    } catch {
      toast.error('Failed to load wallet details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── QR countdown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!showQR) return;
    if (qrCounter <= 0) {
      setShowQR(false);
      setUpiLink('');
      setQrAmount('');
      toast('QR code expired. Generate a new one.');
      return;
    }
    const id = setInterval(() => setQrCounter((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [showQR, qrCounter]);

  // ── generate QR ───────────────────────────────────────────────────────────
  const handleGenerateQR = () => {
    const amt = Number(requestAmount);
    if (!amt || amt < 1) {
      toast.error('Enter a valid amount first');
      return;
    }
    const link = `upi://pay?pn=${encodeURIComponent(UPI_NAME)}&am=${amt}&mode=01&pa=${UPI_ID}`;
    setUpiLink(link);
    setQrAmount(String(amt));
    setQrCounter(QR_EXPIRY_SEC);
    setShowQR(true);
  };

  const dismissQR = () => {
    setShowQR(false);
    setUpiLink('');
    setQrAmount('');
  };

  // ── submit payment request ────────────────────────────────────────────────
  const handleSubmitPaymentRequest = async (e: FormEvent) => {
    e.preventDefault();
    const amount = Number(requestAmount);
    if (!amount || amount < 1) { toast.error('Enter a valid amount'); return; }
    if (!paymentScreenshot) { toast.error('Please upload a payment screenshot'); return; }

    setSubmittingPayment(true);
    try {
      const uploadResponse = await api.uploadPaymentScreenshot(paymentScreenshot);
      await api.requestPayment(amount, uploadResponse.screenshotUrl);

      toast.success('Payment request submitted');
      setRequestAmount('');
      setPaymentScreenshot(null);
      setShowQR(false);
      setUpiLink('');
      setQrAmount('');
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment request');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    APPROVED: 'bg-green-500/10  text-green-400  border border-green-500/20',
    REJECTED: 'bg-red-500/10    text-red-400    border border-red-500/20',
  };

  // ── countdown ring ────────────────────────────────────────────────────────
  const radius = 10;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - qrCounter / QR_EXPIRY_SEC);
  const timerColor = qrCounter > 15 ? '#4ADE80' : qrCounter > 7 ? '#F5A623' : '#F87171';

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
          <span className="text-4xl font-bold text-primary font-display">{balance ?? 0}</span>
        </div>
        <p className="mt-1 text-xs text-white/30">coins</p>
      </div>

      {/* ── Add Money card ── */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)]">

        {/* card header */}
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-white">Add Money</h2>
        </div>

        <form onSubmit={handleSubmitPaymentRequest} className="p-4 space-y-4">

          {/* Step 1 label */}
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</span>
            <span className="text-xs font-medium text-white/50">Enter amount &amp; scan QR to pay</span>
          </div>

          {/* Amount row */}
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={requestAmount}
              onChange={(e) => {
                setRequestAmount(e.target.value);
                if (showQR) dismissQR();          // reset QR if amount changes
              }}
              placeholder="Enter amount"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
            <button
              type="button"
              onClick={handleGenerateQR}
              className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 whitespace-nowrap"
            >
              <QrCode className="h-3.5 w-3.5" />
              Generate QR
            </button>
          </div>

          {/* QR panel */}
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="rounded-xl border border-primary/20 bg-black/30 p-4">

                  {/* UPI info */}
                  <div className="mb-3 text-center">
                    <p className="text-xs text-white/40">Pay via UPI</p>
                    <p className="text-sm font-semibold text-white">{UPI_NAME}</p>
                    <p className="text-xs text-primary/80">{UPI_ID}</p>
                  </div>

                  {/* QR + timer */}
                  <div className="flex flex-col items-center gap-3">

                    {/* QR code — white bg needed for scanners */}
                    <div className="relative rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(245,166,35,0.3)]">
                      <QRCodeSVG value={upiLink} size={160} />

                      {/* expiry overlay when nearly expired */}
                      {qrCounter <= 5 && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                          <p className="text-2xl font-bold text-red-400">{qrCounter}</p>
                        </div>
                      )}
                    </div>

                    {/* amount chip */}
                    <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1">
                      <span className="text-sm font-bold text-primary">₹{qrAmount}</span>
                    </div>

                    {/* countdown ring + text */}
                    <div className="flex items-center gap-2">
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
                        <circle
                          cx="14" cy="14" r={radius}
                          fill="none"
                          stroke={timerColor}
                          strokeWidth="2.5"
                          strokeDasharray={circ}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 14 14)"
                          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                        />
                      </svg>
                      <p className="text-xs text-white/40">
                        Expires in <span className="font-bold" style={{ color: timerColor }}>{qrCounter}s</span>
                      </p>
                    </div>

                    {/* Pay Now — mobile deep link */}
                    {isMobile && (
                      <a
                        href={upiLink}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-black"
                      >
                        <Smartphone className="h-4 w-4" />
                        Pay Now with UPI
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2 label */}
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/50">2</span>
            <span className="text-xs font-medium text-white/50">Upload screenshot &amp; submit</span>
          </div>

          {/* Screenshot upload */}
          <div>
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
              className="block w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/60
                file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-1
                file:text-xs file:font-semibold file:text-primary cursor-pointer"
            />
            {paymentScreenshot && (
              <p className="mt-1.5 text-xs text-green-400">
                ✓ {paymentScreenshot.name}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submittingPayment}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-3 text-sm font-bold text-black disabled:opacity-60 transition-opacity hover:opacity-90"
          >
            {submittingPayment
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
              : <><Upload className="h-4 w-4" /> Submit Request</>
            }
          </button>
        </form>
      </div>

      {/* ── Payment requests ── */}
      <div>
        <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">MY PAYMENT REQUESTS</h2>
        {paymentRequests.length === 0 ? (
          <p className="py-6 text-center text-xs text-white/25">No payment requests yet</p>
        ) : (
          <div className="space-y-2">
            {paymentRequests.map((payment: any, i: number) => (
              <div
                key={payment._id || i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{payment.amount} coins</p>
                  <p className="text-xs text-white/30">{new Date(payment.createdAt).toLocaleString()}</p>
                  {payment.adminRemark && (
                    <p className="mt-1 text-xs text-white/40">Remark: {payment.adminRemark}</p>
                  )}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[payment.status] || 'bg-white/5 text-white/40'}`}>
                  {payment.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Transaction history ── */}
      <div>
        <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">TRANSACTION HISTORY</h2>
        {transactions.length === 0 ? (
          <p className="py-8 text-center text-xs text-white/25">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any, i: number) => (
              <div
                key={tx._id || i}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                    }`}>
                    {tx.amount > 0
                      ? <ArrowDownLeft className="h-4 w-4 text-green-400" />
                      : <ArrowUpRight className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{tx.type}</p>
                    <p className="text-xs text-white/30">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default WalletPage;