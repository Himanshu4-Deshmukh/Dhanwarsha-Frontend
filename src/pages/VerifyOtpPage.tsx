import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Props = {
  mobileNumber: string;
  otpRef: string;
  action: "login" | "register";
  name?: string;
  referralCode?: string;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
};

const RESEND_TIMER = 120;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function VerifyOtpPage({
  mobileNumber,
  action,
  onVerify,
  onResend,
  onBack,
}: Props) {
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(RESEND_TIMER);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setIsVerifying(true);
    try {
      await onVerify(otp);
      toast.success(action === "login" ? "Welcome back!" : "Account created!");
    } catch {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    setIsResending(true);
    try {
      await onResend();
      setOtp("");
      setTimer(RESEND_TIMER);
      toast.success("OTP resent to your WhatsApp");
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gradient-gold font-display">
            DhanWarsha
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the OTP sent to your WhatsApp
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <div className="mb-4 rounded-lg border border-border bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground">OTP sent to</p>
            <p className="text-sm font-semibold text-foreground">{mobileNumber}</p>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Enter 6-digit OTP
            </label>
            <div className="flex justify-between gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="tel"
                  maxLength={1}
                  value={otp[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const newOtp =
                      otp.substring(0, i) + val + otp.substring(i + 1);
                    setOtp(newOtp);
                    if (val && i < 5) {
                      const next = document.getElementById(`otp-${i + 1}`);
                      next?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[i] && i > 0) {
                      const prev = document.getElementById(`otp-${i - 1}`);
                      prev?.focus();
                    }
                  }}
                  id={`otp-${i}`}
                  className="h-12 w-full rounded-xl border border-border bg-muted text-center text-lg font-bold text-foreground outline-none focus:ring-2 focus:ring-ring"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || otp.length !== 6}
              className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 gold-glow"
            >
              {isVerifying ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onBack}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Change number
              </button>
              <div className="flex items-center gap-2">
                {timer > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Resend in {formatTime(timer)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={timer > 0 || isResending}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                    timer > 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  {isResending ? "Sending..." : "Resend OTP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
