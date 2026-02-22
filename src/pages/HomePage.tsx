import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Clock, Trophy, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const HomePage = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [activeSlot, setActiveSlot] = useState<any>(null);
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [betting, setBetting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [lastResult, setLastResult] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [walletRes, slotRes] = await Promise.all([
        api.getBalance(),
        api.getActiveSlot().catch(() => null),
      ]);
      setBalance(walletRes.balance);
      setActiveSlot(slotRes);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (!activeSlot?.endTime) return;
    const update = () => {
      const diff = new Date(activeSlot.endTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeSlot]);

  const placeBet = async () => {
    if (selectedNumber === null || !activeSlot) return;
    setBetting(true);
    try {
      await api.placeBet(activeSlot._id, selectedNumber);
      toast.success(`Bet placed on ${selectedNumber}!`);
      setSelectedNumber(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to place bet');
    } finally {
      setBetting(false);
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
    <div className="space-y-4 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h1 className="text-lg font-bold font-display">{user?.name || 'Player'}</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-primary">{balance ?? 0}</span>
        </div>
      </div>

      {/* Active Slot Card */}
      {activeSlot ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-gradient-card p-4 card-glow"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1">
              <Clock className="h-3 w-3 text-primary" />
              <span className="text-sm font-mono font-bold text-primary">{timeLeft}</span>
            </div>
          </div>
          <h2 className="text-sm text-muted-foreground">Active Slot</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Bet <span className="text-primary font-semibold">{activeSlot.betAmount} coins</span> · Win <span className="text-success font-semibold">{activeSlot.winAmount} coins</span>
          </p>
        </motion.div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No active slot right now</p>
          <p className="text-xs text-muted-foreground mt-1">Check back soon!</p>
        </div>
      )}

      {/* Number Grid */}
      {activeSlot && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Pick a Number (0-99)</h3>
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 100 }, (_, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedNumber(i)}
                className={`aspect-square rounded-lg text-xs font-bold transition-all ${
                  selectedNumber === i
                    ? 'bg-primary text-primary-foreground gold-glow scale-110 z-10'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                }`}
              >
                {i}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Place Bet */}
      <AnimatePresence>
        {selectedNumber !== null && activeSlot && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 z-30"
          >
            <button
              onClick={placeBet}
              disabled={betting}
              className="w-full rounded-xl bg-gradient-gold py-3.5 text-sm font-bold text-primary-foreground gold-glow transition-all hover:opacity-90 disabled:opacity-50"
            >
              {betting ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                <>Bet 10 coins on #{selectedNumber}</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HomePage;
