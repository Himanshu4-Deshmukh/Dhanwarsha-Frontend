import { useState, useEffect, useRef, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Upload, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    loadData();
  }, []);

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
      if (screenshotInputRef.current) screenshotInputRef.current.value = '';
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment request');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const statusStyles: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400',
    APPROVED: 'bg-green-500/10 text-green-400',
    REJECTED: 'bg-red-500/10 text-red-400',
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-border bg-gradient-card p-6 text-center card-glow"
      >
        <p className="text-xs text-muted-foreground mb-1">Your Balance</p>
        <div className="flex items-center justify-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <span className="text-3xl font-bold text-gradient-gold font-display">{balance ?? 0}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">coins</p>
      </motion.div>

      {/* Add Money Request */}
      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmitPaymentRequest}
        className="rounded-xl border border-border bg-card p-4"
      >
        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Add Money Request</h2>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Amount</label>
            <input
              type="number"
              min={1}
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Payment Screenshot</label>
            <input
              ref={screenshotInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
              className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary/15 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
            />
          </div>

          <button
            type="submit"
            disabled={submittingPayment}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[hsl(220,20%,7%)] disabled:opacity-70"
          >
            {submittingPayment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {submittingPayment ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </motion.form>

      {/* Payment Requests */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">My Payment Requests</h2>
        {paymentRequests.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-6">No payment requests yet</p>
        ) : (
          <div className="space-y-2">
            {paymentRequests.map((payment: any, i: number) => (
              <motion.div
                key={payment._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{payment.amount} coins</p>
                    <p className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[payment.status] || 'bg-muted text-muted-foreground'}`}>
                    {payment.status}
                  </span>
                </div>
                {payment.adminRemark && (
                  <p className="mt-2 text-xs text-muted-foreground">Remark: {payment.adminRemark}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-8">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx: any, i: number) => (
              <motion.div
                key={tx._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${tx.amount > 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {tx.amount > 0 ? (
                      <ArrowDownLeft className="h-4 w-4 text-success" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletPage;
