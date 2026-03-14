import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Loader2, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
  PENDING: 'bg-primary/10 text-primary',
  WON: 'bg-success/10 text-success',
  LOST: 'bg-destructive/10 text-destructive',
};

const BetsPage = () => {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.getMyBets().then(setBets).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalPages = Math.max(1, Math.ceil(bets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedBets = bets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 pb-24">
      <h1 className="text-lg font-bold font-display">My Bets</h1>

      {bets.length === 0 ? (
        <div className="py-12 text-center">
          <Trophy className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No bets yet. Place your first bet!</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {paginatedBets.map((bet: any, i: number) => (
              <motion.div
                key={bet._id || i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary font-display font-bold text-primary">
                    {bet.number}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Number #{bet.number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(bet.createdAt).toLocaleDateString()} · {bet.amount} coins
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[bet.status] || ''}`}>
                  {bet.status}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BetsPage;
