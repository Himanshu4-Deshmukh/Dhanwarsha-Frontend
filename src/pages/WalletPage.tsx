import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const WalletPage = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [w, t] = await Promise.all([api.getBalance(), api.getTransactions()]);
        setBalance(w.balance);
        setTransactions(t);
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
