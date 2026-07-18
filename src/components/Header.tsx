import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Wallet, Clock } from "lucide-react";
import { api } from "@/lib/api";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchBalance = async () => {
      try {
        const res = await api.getBalance();
        if (!cancelled) setBalance(res.balance);
      } catch {
        // no-op
      }
    };
    fetchBalance();
    const id = setInterval(fetchBalance, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const isWalletActive = location.pathname === "/wallet";
  const isHistoryActive = location.pathname === "/history";

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[hsl(220,18%,8%)]/95 backdrop-blur-md safe-top">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img
            src="/logo.jpeg"
            alt="DhanWarsha"
            className="h-8 w-8 rounded-lg object-cover"
          />
          <span className="text-base font-bold text-white font-display">
            DhanWarsha
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/wallet")}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 transition-colors ${
              isWalletActive
                ? "border-primary/40 bg-primary/15"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Wallet className={`h-4 w-4 ${isWalletActive ? "text-primary" : "text-white/60"}`} />
            <span className={`text-xs font-bold ${isWalletActive ? "text-primary" : "text-white/70"}`}>
              {balance ?? 0}
            </span>
          </button>

          <button
            onClick={() => navigate("/history")}
            className={`flex items-center justify-center rounded-full border p-2 transition-colors ${
              isHistoryActive
                ? "border-primary/40 bg-primary/15"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
          >
            <Clock className={`h-4 w-4 ${isHistoryActive ? "text-primary" : "text-white/60"}`} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
