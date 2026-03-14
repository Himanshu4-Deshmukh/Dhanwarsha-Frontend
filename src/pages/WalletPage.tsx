import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  CreditCard,
  Loader2,
  QrCode,
  Smartphone,
  Upload,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

const UPI_ID = 'harshninave58@okaxis';
const UPI_NAME = 'Harsh Sanjay Ninave';
const QR_EXPIRY_SEC = 30;
const ITEMS_PER_PAGE = 5;

const isMobileDevice = () => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android/i.test(ua) || (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
};

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'transactions' | 'payments'>('transactions');
  const [transactionPage, setTransactionPage] = useState(1);
  const [paymentPage, setPaymentPage] = useState(1);
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const [upiLink, setUpiLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [qrCounter, setQrCounter] = useState(QR_EXPIRY_SEC);
  const [isMobile, setIsMobile] = useState(false);
  const [qrAmount, setQrAmount] = useState('');

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  const loadData = async () => {
    try {
      const [wallet, txs, payments] = await Promise.all([
        api.getBalance(),
        api.getTransactions(),
        api.getMyPayments().catch(() => []),
      ]);

      setBalance(wallet.balance);
      setTransactions(txs);
      setPaymentRequests(payments);
    } catch {
      toast.error('Failed to load wallet details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setTransactionPage(1);
  }, [transactions.length]);

  useEffect(() => {
    setPaymentPage(1);
  }, [paymentRequests.length]);

  useEffect(() => {
    if (!showQR) {
      return;
    }

    if (qrCounter <= 0) {
      setShowQR(false);
      setUpiLink('');
      setQrAmount('');
      toast('QR code expired. Generate a new one.');
      return;
    }

    const id = setInterval(() => setQrCounter((count) => count - 1), 1000);
    return () => clearInterval(id);
  }, [showQR, qrCounter]);

  const handleGenerateQR = () => {
    const amount = Number(requestAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount first');
      return;
    }

    const link = `upi://pay?pn=${encodeURIComponent(UPI_NAME)}&am=${amount}&mode=01&pa=${UPI_ID}`;
    setUpiLink(link);
    setQrAmount(String(amount));
    setQrCounter(QR_EXPIRY_SEC);
    setShowQR(true);
  };

  const dismissQR = () => {
    setShowQR(false);
    setUpiLink('');
    setQrAmount('');
  };

  const handleSubmitPaymentRequest = async (e: FormEvent) => {
    e.preventDefault();

    const amount = Number(requestAmount);
    if (!amount || amount < 1) {
      toast.error('Enter a valid amount');
      return;
    }

    if (!paymentScreenshot) {
      toast.error('Please upload a payment screenshot');
      return;
    }

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
      if (screenshotInputRef.current) {
        screenshotInputRef.current.value = '';
      }
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment request');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const statusStyles: Record<string, string> = {
    PENDING: 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400',
    APPROVED: 'border border-green-500/20 bg-green-500/10 text-green-400',
    REJECTED: 'border border-red-500/20 bg-red-500/10 text-red-400',
  };

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - qrCounter / QR_EXPIRY_SEC);
  const timerColor = qrCounter > 15 ? '#4ADE80' : qrCounter > 7 ? '#F5A623' : '#F87171';
  const transactionTotalPages = Math.max(1, Math.ceil(transactions.length / ITEMS_PER_PAGE));
  const paymentTotalPages = Math.max(1, Math.ceil(paymentRequests.length / ITEMS_PER_PAGE));
  const paginatedTransactions = transactions.slice(
    (transactionPage - 1) * ITEMS_PER_PAGE,
    transactionPage * ITEMS_PER_PAGE,
  );
  const paginatedPayments = paymentRequests.slice(
    (paymentPage - 1) * ITEMS_PER_PAGE,
    paymentPage * ITEMS_PER_PAGE,
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-[hsl(42,92%,12%)] via-[hsl(42,60%,9%)] to-[hsl(220,20%,10%)] p-6 text-center shadow-[0_0_20px_rgba(255,200,0,0.1)]">
        <p className="mb-1 text-xs text-white/40">Your Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <span className="font-display text-4xl font-bold text-primary">{balance ?? 0}</span>
        </div>
        <p className="mt-1 text-xs text-white/30">coins</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)]">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-white">Add Money</h2>
        </div>

        <form onSubmit={handleSubmitPaymentRequest} className="space-y-4 p-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary">1</span>
            <span className="text-xs font-medium text-white/50">Enter amount and scan QR to pay</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="number"
              min={1}
              value={requestAmount}
              onChange={(e) => {
                setRequestAmount(e.target.value);
                if (showQR) {
                  dismissQR();
                }
              }}
              placeholder="Enter amount"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
            <button
              type="button"
              onClick={handleGenerateQR}
              className="flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <QrCode className="h-3.5 w-3.5" />
              Generate QR
            </button>
          </div>

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
                  <div className="mb-3 text-center">
                    <p className="text-xs text-white/40">Pay via UPI</p>
                    <p className="text-sm font-semibold text-white">{UPI_NAME}</p>
                    <p className="text-xs text-primary/80">{UPI_ID}</p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <div className="relative rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(245,166,35,0.3)]">
                      <QRCodeSVG value={upiLink} size={160} />

                      {qrCounter <= 5 && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                          <p className="text-2xl font-bold text-red-400">{qrCounter}</p>
                        </div>
                      )}
                    </div>

                    <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1">
                      <span className="text-sm font-bold text-primary">Rs {qrAmount}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <svg width="28" height="28" viewBox="0 0 28 28">
                        <circle cx="14" cy="14" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" />
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
                          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                        />
                      </svg>
                      <p className="text-xs text-white/40">
                        Expires in <span className="font-bold" style={{ color: timerColor }}>{qrCounter}s</span>
                      </p>
                    </div>

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

          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white/50">2</span>
            <span className="text-xs font-medium text-white/50">Upload screenshot and submit</span>
          </div>

          <div>
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
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
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Submit Request
              </>
            )}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,10%)] p-1">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-gradient-gold text-black'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              Transaction History
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payments')}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'payments'
                  ? 'bg-gradient-gold text-black'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              }`}
            >
              Payment Requests
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'transactions' ? (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">TRANSACTION HISTORY</h2>
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-xs text-white/25">No transactions yet</p>
              ) : (
                <div className="space-y-2">
                  {paginatedTransactions.map((tx: any, i: number) => (
                    <div
                      key={tx._id || i}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            tx.amount > 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                          }`}
                        >
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="h-4 w-4 text-green-400" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{tx.type}</p>
                          <p className="text-xs text-white/30">{new Date(tx.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`pl-3 text-sm font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {transactions.length > ITEMS_PER_PAGE && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                  <p className="text-xs text-white/40">
                    Page {transactionPage} of {transactionTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTransactionPage((page) => Math.max(1, page - 1))}
                      disabled={transactionPage === 1}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransactionPage((page) => Math.min(transactionTotalPages, page + 1))}
                      disabled={transactionPage === transactionTotalPages}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <h2 className="mb-3 text-xs font-bold tracking-wider text-white/30">MY PAYMENT REQUESTS</h2>
              {paymentRequests.length === 0 ? (
                <p className="py-6 text-center text-xs text-white/25">No payment requests yet</p>
              ) : (
                <div className="space-y-2">
                  {paginatedPayments.map((payment: any, i: number) => (
                    <div
                      key={payment._id || i}
                      className="flex flex-col gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white">{payment.amount} coins</p>
                        <p className="text-xs text-white/30">{new Date(payment.createdAt).toLocaleString()}</p>
                        {payment.adminRemark && (
                          <p className="mt-1 text-xs text-white/40">Remark: {payment.adminRemark}</p>
                        )}
                      </div>
                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          statusStyles[payment.status] || 'bg-white/5 text-white/40'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {paymentRequests.length > ITEMS_PER_PAGE && (
                <div className="mt-3 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2">
                  <p className="text-xs text-white/40">
                    Page {paymentPage} of {paymentTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentPage((page) => Math.max(1, page - 1))}
                      disabled={paymentPage === 1}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentPage((page) => Math.min(paymentTotalPages, page + 1))}
                      disabled={paymentPage === paymentTotalPages}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WalletPage;
