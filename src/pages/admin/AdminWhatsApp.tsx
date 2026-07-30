import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  Loader2,
  RotateCcw,
} from "lucide-react";

type WAStatus = "disconnected" | "qr_pending" | "connected" | "connecting" | "failed";

const statusConfig: Record<WAStatus, { label: string; color: string; dot: string }> = {
  connected: { label: "Connected", color: "text-emerald-400", dot: "bg-emerald-400" },
  disconnected: { label: "Disconnected", color: "text-white/40", dot: "bg-white/20" },
  qr_pending: { label: "Scan QR Code", color: "text-amber-400", dot: "bg-amber-400" },
  connecting: { label: "Connecting...", color: "text-amber-400", dot: "bg-amber-400" },
  failed: { label: "Failed", color: "text-red-400", dot: "bg-red-400" },
};

export default function AdminWhatsApp() {
  const [status, setStatus] = useState<WAStatus>("disconnected");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.admin.getWhatsAppStatus();
      setStatus(res.data.status as WAStatus);
    } catch {
      // ignore
    }
  }, []);

  const fetchQR = useCallback(async () => {
    try {
      const res = await api.admin.getWhatsAppQR();
      setStatus(res.data.status as WAStatus);
      if (res.data.qr) setQrCode(res.data.qr);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (status === "qr_pending" || status === "connecting") {
      pollRef.current = setInterval(() => {
        fetchQR();
      }, 3000);
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [status, fetchQR]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await api.admin.connectWhatsApp();
      setStatus("connecting");
      toast.success("WhatsApp connecting... Scan the QR code.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await api.admin.disconnectWhatsApp();
      setStatus("disconnected");
      setQrCode(null);
      toast.success("WhatsApp disconnected");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.admin.resetWhatsApp();
      setStatus("connecting");
      setQrCode(null);
      toast.success("WhatsApp reset. Refresh to get new QR.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setLoading(false);
    }
  };

  const cfg = statusConfig[status] || statusConfig.disconnected;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white">WhatsApp Connection</h1>
          <p className="text-xs text-white/40">Manage WhatsApp Web for sending OTPs</p>
        </div>
        <button
          onClick={fetchStatus}
          className="rounded-lg border border-white/10 p-2 text-white/40 hover:bg-white/5 hover:text-white/80"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Status card */}
      <div className="rounded-xl border border-white/5 bg-[hsl(220,20%,8%)] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
            <Smartphone className="h-5 w-5 text-white/60" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
              <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
              {(status === "connecting" || status === "qr_pending") && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
              )}
            </div>
            <p className="mt-0.5 text-xs text-white/40">
              {status === "connected"
                ? "WhatsApp is active and ready to send OTPs"
                : status === "qr_pending"
                  ? "Scan the QR code below with your WhatsApp"
                  : status === "connecting"
                    ? "Initializing WhatsApp client..."
                    : "WhatsApp is not connected"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {status !== "connected" && (
            <button
              onClick={handleConnect}
              disabled={loading || status === "connecting"}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Wifi className="h-4 w-4" />
              Connect
            </button>
          )}
          {status === "connected" && (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-red-400/30 px-4 py-2 text-xs font-semibold text-red-400 transition-colors hover:bg-red-400/10 disabled:opacity-50"
            >
              <WifiOff className="h-4 w-4" />
              Disconnect
            </button>
          )}
          {(status === "connected" || status === "failed") && (
            <button
              onClick={handleReset}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* QR Code */}
      {status === "qr_pending" && qrCode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-white/5 bg-[hsl(220,20%,8%)] p-5 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <QrCode className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-medium text-amber-400">Scan with WhatsApp</span>
          </div>
          <div className="mx-auto inline-block rounded-lg bg-white p-3">
            <img
              src={qrCode}
              alt="WhatsApp QR Code"
              className="h-48 w-48"
            />
          </div>
          <p className="mt-3 text-xs text-white/40">
            Open WhatsApp on your phone → Menu → Linked Devices → Link a Device
          </p>
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}

      {/* Info card */}
      <div className="rounded-xl border border-white/5 bg-[hsl(220,20%,8%)] p-4">
        <h3 className="mb-2 text-xs font-semibold text-white/60 uppercase tracking-wider">How it works</h3>
        <ul className="space-y-2 text-xs text-white/40">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
            Click <strong className="text-white/60">Connect</strong> to start the WhatsApp Web client
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
            A QR code will appear — scan it with your WhatsApp mobile app
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
            Once connected, OTPs will be sent automatically via this WhatsApp number
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-white/20" />
            Use <strong className="text-white/60">Reset</strong> if the session expires or you want to change the linked device
          </li>
        </ul>
      </div>
    </div>
  );
}
