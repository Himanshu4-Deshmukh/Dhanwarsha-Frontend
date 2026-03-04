import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { TrendingUp, Loader2, Search } from 'lucide-react';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  WON: { bg: 'bg-green-500/10', text: 'text-green-400' },
  LOST: { bg: 'bg-red-500/10', text: 'text-red-400' },
};

export default function AdminBets() {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    api.admin.getAllBets()
      .then(setBets)
      .catch(() => toast.error('Failed to load bets'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = bets.filter(b => {
    const matchSearch =
      b.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      String(b.number).includes(search);
    const matchStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: bets.length,
    won: bets.filter(b => b.status === 'WON').length,
    lost: bets.filter(b => b.status === 'LOST').length,
    pending: bets.filter(b => b.status === 'PENDING').length,
    totalAmount: bets.reduce((s, b) => s + (b.amount || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white font-display">All Bets</h1>
        <p className="mt-1 text-sm text-white/40">View all bets placed across all slots</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Bets', value: stats.total, color: 'text-white' },
          { label: 'Won', value: stats.won, color: 'text-green-400' },
          { label: 'Lost', value: stats.lost, color: 'text-red-400' },
          { label: 'Coins Bet', value: stats.totalAmount, color: 'text-primary' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/5 p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="mt-0.5 text-xs text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search user or number..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'PENDING', 'WON', 'LOST'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                statusFilter === f
                  ? 'bg-primary text-[hsl(220,20%,7%)]'
                  : 'border border-white/10 bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/5 bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Slot</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wide">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-white/30">
                      <TrendingUp className="mx-auto mb-2 h-8 w-8 opacity-30" />
                      No bets found
                    </td>
                  </tr>
                ) : (
                  filtered.map((bet, i) => {
                    const sc = STATUS_COLORS[bet.status] || { bg: 'bg-white/5', text: 'text-white/40' };
                    return (
                      <motion.tr
                        key={bet._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                              {bet.userId?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-white/80">{bet.userId?.name || 'User'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
                            {bet.number}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-white/80">{bet.amount}</span>
                          <span className="ml-1 text-xs text-white/30">coins</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                            {bet.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">
                          {bet.slotId?._id?.slice(-6) || bet.slotId?.slice(-6) || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">
                          {new Date(bet.createdAt).toLocaleString()}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-white/5 px-4 py-2.5 text-right text-xs text-white/30">
            Showing {filtered.length} of {bets.length} bets
          </div>
        </div>
      )}
    </div>
  );
}
