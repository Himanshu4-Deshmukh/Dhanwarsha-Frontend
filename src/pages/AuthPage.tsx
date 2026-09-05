import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import VerifyOtpPage from "./VerifyOtpPage";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpFlow, setOtpFlow] = useState<{
    mobileNumber: string;
    otpRef: string;
    action: "login" | "register";
    name?: string;
    referralCode?: string;
  } | null>(null);
  const { login, signup, user, authConfig, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "ADMIN" ? "/admin" : "/home", { replace: true });
    }
  }, [navigate, user]);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err && typeof err === "object" && "response" in err) {
      const data = (err as { response: { data: { message?: string } } }).response?.data;
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message[0];
    }
    if (err instanceof Error) return err.message;
    return fallback;
  };

  const handleLogin = async (email: string, password: string) => {
    setError("");
    setLoading(true);
    try {
      const role = await login(email, password);
      navigate(role === "ADMIN" ? "/admin" : "/home");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (name: string, email: string, password: string) => {
    setError("");
    setLoading(true);
    try {
      await signup(name, email, password);
      navigate("/home");
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtpLogin = useCallback(async (mobileNumber: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp({ mobileNumber, action: "login" });
      if (res.success && res.otpRef) {
        setOtpFlow({ mobileNumber, otpRef: res.otpRef, action: "login" });
        toast.success("OTP sent to your WhatsApp");
      } else if (res.message === "notexists") {
        setError("No account found with this number");
      } else if (res.message) {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  }, [sendOtp]);

  const handleSendOtpRegister = useCallback(async (mobileNumber: string, name: string, referralCode?: string) => {
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp({ mobileNumber, action: "register", name, referralCode });
      if (res.success && res.otpRef) {
        setOtpFlow({ mobileNumber, otpRef: res.otpRef, action: "register", name, referralCode });
        toast.success("OTP sent to your WhatsApp");
      } else if (res.message === "exists") {
        setError("Account already exists with this number");
      } else if (res.message) {
        setError(res.message);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  }, [sendOtp]);

  const handleOtpVerify = useCallback(async (otp: string) => {
    if (!otpFlow) return;
    await verifyOtp({
      otpRef: otpFlow.otpRef,
      otp,
      mobileNumber: otpFlow.mobileNumber,
      action: otpFlow.action,
      name: otpFlow.name,
      referralCode: otpFlow.referralCode,
    });
  }, [otpFlow, verifyOtp]);

  const handleResendOtp = useCallback(async () => {
    if (!otpFlow) return;
    const res = await sendOtp({
      mobileNumber: otpFlow.mobileNumber,
      action: otpFlow.action,
      name: otpFlow.name,
      referralCode: otpFlow.referralCode,
    });
    if (res.success && res.otpRef) {
      setOtpFlow((prev) => prev ? { ...prev, otpRef: res.otpRef! } : null);
    } else {
      throw new Error(res.message);
    }
  }, [otpFlow, sendOtp]);

  if (user) {
    return null;
  }

  if (otpFlow) {
    return (
      <VerifyOtpPage
        mobileNumber={otpFlow.mobileNumber}
        otpRef={otpFlow.otpRef}
        action={otpFlow.action}
        name={otpFlow.name}
        referralCode={otpFlow.referralCode}
        onVerify={handleOtpVerify}
        onResend={handleResendOtp}
        onBack={() => setOtpFlow(null)}
      />
    );
  }

  const otpRequired = authConfig.otpRequired;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm relative"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center"
          >
            <img
              src="/logo.jpeg"
              alt="DhanWarsha Logo"
              className="h-16 w-16 object-contain"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-gradient-gold font-display">
            DhanWarsha
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick your number. Win big.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 card-glow">
          <div className="mb-6 flex rounded-xl bg-secondary p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${isLogin
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${!isLogin
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
            </motion.p>
          )}

          {isLogin ? (
            <LoginForm
              isLoading={loading}
              otpRequired={otpRequired}
              onLogin={handleLogin}
              onSendOtp={handleSendOtpLogin}
            />
          ) : (
            <SignupForm
              isLoading={loading}
              otpRequired={otpRequired}
              onSignup={handleSignup}
              onSendOtp={handleSendOtpRegister}
            />
          )}

          <div className="mt-6 text-center">
            <Link
              to="/install"
              className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
            >
              Install the app without logging in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
