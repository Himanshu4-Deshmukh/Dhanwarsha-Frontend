import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  Layers,
  History,
  CreditCard,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Coins,
  ChevronRight,
  Dice1,
  ArrowUpFromLine,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";

const POLL_INTERVAL_MS = 30_000;

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true, dotKey: null },
  { to: "/admin/slots", label: "Today Slots", icon: Layers, end: false, dotKey: null },
  { to: "/admin/past-slots", label: "Past Slots", icon: History, end: false, dotKey: null },
  { to: "/admin/users", label: "Users", icon: Users, end: false, dotKey: null },
  { to: "/admin/payments", label: "Payments", icon: CreditCard, end: false, dotKey: null },
  { to: "/admin/bets", label: "All Bets", icon: TrendingUp, end: false, dotKey: null },
  { to: "/admin/withdrawals", label: "Withdrawals", icon: ArrowUpFromLine, end: false, dotKey: "withdrawals" },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  // Poll pending withdrawal count for the notification dot
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.admin.getPendingWithdrawalCount();
        setPendingWithdrawals(data.withdrawals ?? 0);
      } catch {
        // silently fail — don't interrupt the layout if this errors
      }
    };

    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const getDotCount = (dotKey: string | null): number => {
    if (dotKey === "withdrawals") return pendingWithdrawals;
    return 0;
  };

  return (
    <div className="flex min-h-screen w-full bg-[hsl(220,20%,5%)]">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-[hsl(220,20%,8%)] transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-gold">
            <Dice1 className="h-5 w-5 text-[hsl(220,20%,7%)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-gradient-gold font-display">DhanWarsha</p>
            <p className="text-xs text-white/40">Admin Panel</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden">
            <X className="h-4 w-4 text-white/40" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const dotCount = getDotCount(item.dotKey);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${isActive
                    ? "bg-primary/15 text-primary"
                    : "text-white/50 hover:bg-white/5 hover:text-white/80"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      {/* Notification dot */}
                      {dotCount > 0 && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">
                          {dotCount > 9 ? "9+" : dotCount}
                        </span>
                      )}
                    </span>

                    <span className="flex-1">{item.label}</span>

                    {/* Unreviewed label when not active */}
                    {dotCount > 0 && !isActive && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                        {dotCount} new
                      </span>
                    )}

                    {isActive && (
                      <ChevronRight className="ml-auto h-3 w-3 text-primary" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-white/5 px-3 py-4">
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-gold text-xs font-bold text-[hsl(220,20%,7%)]">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-white/80">{user?.name}</p>
              <p className="truncate text-xs text-white/40">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/50 transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-[hsl(220,20%,8%)]/80 px-3 py-3 backdrop-blur-md sm:px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-white/50 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white sm:hidden">Admin Panel</p>
            <p className="hidden text-sm font-semibold text-white/80 sm:block">DhanWarsha Admin</p>
          </div>

          {/* Pending withdrawals chip in topbar */}
          {pendingWithdrawals > 0 && (
            <button
              onClick={() => navigate("/admin/withdrawals")}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              {pendingWithdrawals} withdrawal{pendingWithdrawals > 1 ? "s" : ""} pending
            </button>
          )}

          {!pendingWithdrawals && (
            <div className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Coins className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-white/60">Admin</span>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
