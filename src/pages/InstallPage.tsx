import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Share2,
  Smartphone,
} from "lucide-react";
import { usePwaInstall } from "@/lib/pwa-install";

const InstallPage = () => {
  const { canInstall, install, isInstalled, isInstalling, isIos } =
    usePwaInstall();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInstalled) {
      navigate("/auth", { replace: true });
    }
  }, [isInstalled, navigate]);

  const handleInstall = async () => {
    await install();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-5rem] top-[-4rem] h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-5rem] right-[-4rem] h-60 w-60 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-lg flex-col justify-center"
      >
        <div className="rounded-[2rem] border border-border bg-gradient-card p-6 shadow-2xl card-glow">
          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold gold-glow">
              <Smartphone className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-primary/80">
                PWA Install
              </p>
              <h1 className="text-3xl font-bold text-gradient-gold">
                Install DhanWarsha
              </h1>
            </div>
          </div>

          <p className="mb-6 text-sm leading-6 text-muted-foreground">
            Add the app to your home screen for a faster, full-screen experience
            with one-tap access.
          </p>

          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Download className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Quick install</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isInstalled
                    ? "The app is already installed on this device."
                    : canInstall
                      ? "This browser is ready. Tap the button below to install the app."
                      : isIos
                        ? "On iPhone or iPad, use Safari's Share menu and choose Add to Home Screen."
                        : "If the install button is unavailable, open this site in Chrome or Edge and use the browser install option."}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstall}
            disabled={!canInstall || isInstalling || isInstalled}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold px-4 py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isInstalled ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Installed
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                {isInstalling ? "Opening install prompt..." : "Install App"}
              </>
            )}
          </button>

          <div className="space-y-3 rounded-2xl border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Manual steps</p>
            <p>
              1. Open this website in your mobile browser or desktop Chrome/Edge.
            </p>
            <p>
              2. Look for the install icon in the address bar or browser menu.
            </p>
            {isIos && (
              <p className="flex items-center gap-2">
                3. In Safari, tap <Share2 className="h-4 w-4 text-primary" /> and
                choose Add to Home Screen.
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Login
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Open App
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default InstallPage;
