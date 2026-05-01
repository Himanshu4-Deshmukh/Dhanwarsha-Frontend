import { motion } from 'framer-motion';
import { Trophy, Bell } from 'lucide-react';

const SportsPage = () => {
    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-6 pb-24 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="flex flex-col items-center gap-6"
            >
                {/* Icon */}
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                    <Trophy className="h-10 w-10 text-primary" />
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        !
                    </span>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold font-display tracking-tight">Sports Betting</h1>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                        We're working hard to bring you live sports betting. Stay tuned — it's coming very soon!
                    </p>
                </div>

                {/* Coming soon badge */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-primary"
                >
                    Coming Soon
                </motion.div>

                {/* Notify hint */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-xs text-muted-foreground"
                >
                    <Bell className="h-4 w-4 shrink-0 text-primary" />
                    <span>You'll be notified once Sports goes live.</span>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default SportsPage;