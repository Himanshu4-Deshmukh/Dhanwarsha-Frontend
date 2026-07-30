import { useState } from "react";

type Props = {
  isLoading?: boolean;
  otpRequired: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onSendOtp: (mobileNumber: string) => Promise<void>;
};

export default function LoginForm({ isLoading, otpRequired, onLogin, onSendOtp }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpRequired) {
      if (mobileNumber.length !== 10) return;
      await onSendOtp(mobileNumber);
    } else {
      await onLogin(email, password);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {otpRequired ? (
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="Enter your 10-digit number"
            value={mobileNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 10);
              setMobileNumber(val);
            }}
            className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            inputMode="numeric"
            required
          />
        </div>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>
        </>
      )}

      <button
        type="submit"
        disabled={isLoading || (otpRequired && mobileNumber.length !== 10)}
        className="w-full rounded-xl bg-gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50 gold-glow"
      >
        {isLoading ? "Please wait..." : otpRequired ? "Send OTP" : "Login"}
      </button>
    </form>
  );
}
