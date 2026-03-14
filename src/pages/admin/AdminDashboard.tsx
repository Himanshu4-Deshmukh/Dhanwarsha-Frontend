import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Users, Layers, TrendingUp, CreditCard, Trophy,
  ArrowUpRight, Loader2, Clock, CheckCircle, XCircle, Coins
} from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [users, bets, payments, txns] = await Promise.all([
          api.admin.getAllUsers({ page: 1, limit: 1 }),
          api.admin.getAllBets(),
          api.admin.getAllPaymentRequests(),
          api.admin.getAllTransactions(),
        ]);

        const totalBetAmount = bets.reduce((s: number, b: any) => s + (b.amount || 0), 0);
        const wonBets = bets.filter((b: any) => b.status === 'WON');
        const totalPayout = wonBets.length * 95;

        setStats({
          users: users.meta.total,
          totalBets: bets.length,
          pendingPayments: payments.filter((p: any) => p.status === 'PENDING').length,
          profit: totalBetAmount - totalPayout,
          totalBetAmount,
          txns: txns.length,
        });

        setRecentBets(bets.slice(0, 5));
        setRecentPayments(payments.filter((p: any) => p.status === 'PENDING').slice(0, 5));
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats?.users ?? 0, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', link: '/admin/users' },
    { label: 'Total Bets', value: stats?.totalBets ?? 0, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-500/10', link: '/admin/bets' },
    { label: 'Pending Payments', value: stats?.pendingPayments ?? 0, icon: CreditCard, color: 'text-yellow-400', bg: 'bg-yellow-500/10', link: '/admin/payments' },
    { label: 'House Profit', value: `${stats?.profit ?? 0} coins`, icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white font-display">Dashboard</h1>
        <p className="mt-1 text-sm text-white/40">Welcome back, Admin. Here's an overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/5 bg-white/5 p-5 hover:border-primary/20 transition-colors"
          >
            {card.link ? (
              <Link to={card.link} className="block">
                <StatCardContent card={card} />
              </Link>
            ) : (
              <StatCardContent card={card} />
            )}
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* Recent Bets */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white/80">Recent Bets</h2>
            <Link to="/admin/bets" className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentBets.length === 0 ? (
              <p className="text-center text-xs text-white/30 py-4">No bets yet</p>
            ) : (
              recentBets.map((bet: any) => (
                <div key={bet._id} className="flex flex-col gap-3 rounded-lg bg-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 text-xs font-bold text-primary">
                      #{bet.number}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/80">{bet.userId?.name || 'User'}</p>
                      <p className="text-xs text-white/30">{bet.amount} coins</p>
                    </div>
                  </div>
                  <BetStatusBadge status={bet.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Payments */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white/80">Pending Payments</h2>
            <Link to="/admin/payments" className="flex shrink-0 items-center gap-1 text-xs text-primary hover:underline">
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPayments.length === 0 ? (
              <p className="py-4 text-center text-xs text-white/30">No pending payments</p>
            ) : (
              recentPayments.map((pay: any) => (
                <div key={pay._id} className="flex flex-col gap-3 rounded-lg bg-white/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-500/20 text-xs font-bold text-yellow-400">
                      <Coins className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/80">{pay.userId?.name || 'User'}</p>
                      <p className="text-xs text-white/30">{pay.amount} coins requested</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400">PENDING</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCardContent({ card }: { card: any }) {
  return (
    <>
      <div className={`mb-3 inline-flex rounded-lg p-2 ${card.bg}`}>
        <card.icon className={`h-5 w-5 ${card.color}`} />
      </div>
      <p className="text-2xl font-bold text-white font-display">{card.value}</p>
      <p className="mt-0.5 text-xs text-white/40">{card.label}</p>
    </>
  );
}

function BetStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-400',
    WON: 'bg-green-500/10 text-green-400',
    LOST: 'bg-red-500/10 text-red-400',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors[status] || 'bg-white/10 text-white/40'}`}>
      {status}
    </span>
  );
}
