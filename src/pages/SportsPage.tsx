import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Lock,
    CheckCircle2,
    Coins,
    Loader2,
    Shield,
    Zap,
    RefreshCw,
    Trophy,
    XCircle,
    AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

type Sport = 'cricket' | 'football';
type MatchStatus = 'upcoming' | 'live' | 'completed';
type BetOutcome = 'team_a' | 'team_b' | 'tie' | 'draw';

interface CricketMatch {
    id: string;
    teamA: string;
    teamB: string;
    matchType: string;       // T20 / ODI / Test
    venue: string;
    startsAt: string;
    status: MatchStatus;
    score?: {
        teamA?: string;        // e.g. "145/3 (16.2)"
        teamB?: string;
    };
    winner?: string;         // teamA name | teamB name | "Tie" — populated on completion
    // Raw field from API — adapt based on which API you use:
    // e.g. CricAPI: match.ms === "live", match.winner, match.t1, match.t2
}

interface FootballMatch {
    id: string;
    teamA: string;
    teamB: string;
    league: string;
    venue: string;
    startsAt: string;
    status: MatchStatus;
    score?: {
        teamA?: number;
        teamB?: number;
    };
    winner?: string;         // teamA name | teamB name | "Draw"
}

interface UserBet {
    matchId: string;
    sport: Sport;
    outcome: BetOutcome;
    amount: number;
    multiplier: number;
    status: 'pending' | 'won' | 'lost';
    payout?: number;
}

// ─── API adapter layer ─────────────────────────────────────────────────────────
// Replace these functions with real API calls. All transformation
// from raw API shape → CricketMatch / FootballMatch happens here.

async function fetchCricketMatches(): Promise<CricketMatch[]> {
    // TODO: replace with real call e.g.:
    // const res = await fetch(`https://api.cricapi.com/v1/matches?apikey=${KEY}&offset=0`);
    // const data = await res.json();
    // return data.data.map(adaptCricApiMatch);

    // ── Mock data ──
    await new Promise((r) => setTimeout(r, 800));
    return [
        {
            id: 'c1',
            teamA: 'India',
            teamB: 'Australia',
            matchType: 'T20',
            venue: 'Wankhede Stadium, Mumbai',
            startsAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            status: 'upcoming',
        },
        {
            id: 'c2',
            teamA: 'England',
            teamB: 'South Africa',
            matchType: 'ODI',
            venue: "Lord's, London",
            startsAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'live',
            score: { teamA: '187/4 (34.2)', teamB: '152/6 (30.0)' },
        },
        {
            id: 'c3',
            teamA: 'Pakistan',
            teamB: 'New Zealand',
            matchType: 'T20',
            venue: 'Gaddafi Stadium, Lahore',
            startsAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            score: { teamA: '189/4', teamB: '174/8' },
            winner: 'Pakistan',
        },
    ];
}

async function fetchFootballMatches(): Promise<FootballMatch[]> {
    // TODO: replace with real call e.g.:
    // const res = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`, { headers });
    // return data.response.map(adaptFootballApiMatch);

    await new Promise((r) => setTimeout(r, 800));
    return [
        {
            id: 'f1',
            teamA: 'Real Madrid',
            teamB: 'Barcelona',
            league: 'La Liga',
            venue: 'Santiago Bernabéu',
            startsAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            status: 'upcoming',
        },
        {
            id: 'f2',
            teamA: 'Man City',
            teamB: 'Arsenal',
            league: 'Premier League',
            venue: 'Etihad Stadium',
            startsAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            status: 'live',
            score: { teamA: 1, teamB: 1 },
        },
        {
            id: 'f3',
            teamA: 'Bayern Munich',
            teamB: 'Dortmund',
            league: 'Bundesliga',
            venue: 'Allianz Arena',
            startsAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            score: { teamA: 3, teamB: 1 },
            winner: 'Bayern Munich',
        },
    ];
}

// When you wire real API: call your backend endpoint which stores the bet
// and later auto-settles when winner is detected on next poll.
async function placeBet(_bet: Omit<UserBet, 'status' | 'payout'>): Promise<void> {
    // TODO: await api.placeSportsBet(bet)
    await new Promise((r) => setTimeout(r, 700));
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const CRICKET_MULTIPLIERS: Record<BetOutcome, number> = {
    team_a: 1.9,
    team_b: 1.9,
    tie: 5.0,
    draw: 1.0, // unused in cricket
};

const FOOTBALL_MULTIPLIERS: Record<BetOutcome, number> = {
    team_a: 2.0,
    draw: 3.2,
    team_b: 2.0,
    tie: 1.0, // unused in football
};

function formatTime(iso: string) {
    return new Intl.DateTimeFormat('en-IN', {
        day: 'numeric', month: 'short',
        hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
}

const statusConfig = {
    upcoming: { label: 'Upcoming', color: 'border-amber-500/20 bg-amber-500/10 text-amber-400' },
    live: { label: '● Live', color: 'border-red-500/20 bg-red-500/10 text-red-400' },
    completed: { label: 'Ended', color: 'border-white/10 bg-white/5 text-white/40' },
};

// ─── Bet Sheet ─────────────────────────────────────────────────────────────────

function BetSheet({
    teamA,
    teamB,
    outcome,
    multiplier,
    sport,
    onConfirm,
    onDismiss,
}: {
    teamA: string;
    teamB: string;
    outcome: BetOutcome;
    multiplier: number;
    sport: Sport;
    onConfirm: (amount: number) => Promise<void>;
    onDismiss: () => void;
}) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const presets = [50, 100, 200, 500];
    const parsed = parseFloat(amount) || 0;
    const payout = parsed > 0 ? (parsed * multiplier).toFixed(0) : '—';

    const outcomeLabel: Record<BetOutcome, string> = {
        team_a: teamA,
        team_b: teamB,
        tie: 'Tie',
        draw: 'Draw',
    };

    const handleConfirm = async () => {
        if (!parsed || parsed <= 0) return;
        setLoading(true);
        try {
            await onConfirm(parsed);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onDismiss}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
                key="sheet"
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg"
            >
                <div className="rounded-t-3xl border-t border-x border-white/10 bg-[hsl(220,20%,7%)] px-5 pt-4 pb-8">
                    <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

                    <div className="mb-4">
                        <p className="text-[9px] uppercase tracking-[0.35em] text-white/30">Betting on</p>
                        <p className="mt-1 text-lg font-bold text-white">{outcomeLabel[outcome]}</p>
                        <p className="text-xs text-white/40">
                            {teamA} vs {teamB} · <span className="text-primary font-semibold">{multiplier}x</span> payout
                        </p>
                    </div>

                    {/* Presets */}
                    <div className="mb-3 grid grid-cols-4 gap-2">
                        {presets.map((p) => (
                            <button
                                key={p}
                                onClick={() => setAmount(String(p))}
                                className={`rounded-xl border py-2 text-xs font-semibold transition ${amount === String(p)
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                            >
                                ₹{p}
                            </button>
                        ))}
                    </div>

                    {/* Custom input */}
                    <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                        <span className="text-sm font-bold text-white/40">₹</span>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Custom amount"
                            className="flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25"
                        />
                    </div>

                    {/* Payout preview */}
                    <div className="mb-4 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5">
                        <span className="text-xs text-white/40">Potential win</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">₹{payout}</span>
                    </div>

                    <button
                        onClick={handleConfirm}
                        disabled={!parsed || parsed <= 0 || loading}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-emerald-500 py-3.5 text-sm font-bold text-black transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                    >
                        {loading
                            ? <><Loader2 className="h-4 w-4 animate-spin" /> Placing…</>
                            : <><Coins className="h-4 w-4" /> Place Bet · ₹{parsed || 0}</>}
                    </button>
                </div>
            </motion.div>
        </>
    );
}

// ─── Cricket Match Card ────────────────────────────────────────────────────────

function CricketMatchCard({
    match,
    userBet,
    onBet,
}: {
    match: CricketMatch;
    userBet?: UserBet;
    onBet: (outcome: BetOutcome) => void;
}) {
    const canBet = match.status === 'upcoming' && !userBet;
    const status = statusConfig[match.status];
    const mults = CRICKET_MULTIPLIERS;

    const outcomeOptions: { outcome: BetOutcome; label: string; sub: string }[] = [
        { outcome: 'team_a', label: match.teamA, sub: `${mults.team_a}x` },
        { outcome: 'team_b', label: match.teamB, sub: `${mults.team_b}x` },
        { outcome: 'tie', label: 'Tie', sub: `${mults.tie}x` },
    ];

    const getWinningOutcome = (): BetOutcome | null => {
        if (!match.winner) return null;
        if (match.winner === match.teamA) return 'team_a';
        if (match.winner === match.teamB) return 'team_b';
        if (match.winner === 'Tie') return 'tie';
        return null;
    };

    const winningOutcome = getWinningOutcome();

    return (
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/30">{match.matchType}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-[9px] text-white/25 truncate">{match.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{match.teamA}</span>
                        <span className="text-[10px] text-white/30">vs</span>
                        <span className="text-sm font-bold text-white">{match.teamB}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-white/35">
                        <Clock className="h-3 w-3" />
                        {formatTime(match.startsAt)}
                    </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold ${status.color}`}>
                    {status.label}
                </span>
            </div>

            {/* Live scores */}
            {match.status === 'live' && match.score && (
                <div className="mx-4 mb-3 flex gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2">
                    <div className="flex-1">
                        <p className="text-[9px] text-white/30 mb-0.5">{match.teamA}</p>
                        <p className="font-mono text-xs font-bold text-white">{match.score.teamA ?? '—'}</p>
                    </div>
                    <div className="w-px bg-white/10" />
                    <div className="flex-1 text-right">
                        <p className="text-[9px] text-white/30 mb-0.5">{match.teamB}</p>
                        <p className="font-mono text-xs font-bold text-white">{match.score.teamB ?? '—'}</p>
                    </div>
                </div>
            )}

            {/* Completed result */}
            {match.status === 'completed' && match.winner && (
                <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-300">
                        {match.winner === 'Tie' ? 'Match Tied' : `${match.winner} won`}
                    </p>
                    {match.score && (
                        <p className="ml-auto text-[10px] text-white/30">
                            {match.score.teamA} · {match.score.teamB}
                        </p>
                    )}
                </div>
            )}

            <div className="h-px bg-white/5 mx-4" />

            {/* User's existing bet */}
            {userBet && (
                <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/30">Your bet</p>
                        <p className="text-xs font-bold text-white mt-0.5">
                            {userBet.outcome === 'team_a' ? match.teamA
                                : userBet.outcome === 'team_b' ? match.teamB
                                    : 'Tie'} · ₹{userBet.amount}
                        </p>
                    </div>
                    {userBet.status === 'won' && (
                        <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-bold">+₹{userBet.payout}</span>
                        </div>
                    )}
                    {userBet.status === 'lost' && (
                        <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    {userBet.status === 'pending' && (
                        <span className="text-[9px] text-amber-400 border border-amber-500/20 bg-amber-500/10 rounded-full px-2 py-0.5">Pending</span>
                    )}
                </div>
            )}

            {/* Bet options */}
            <div className="grid grid-cols-3 gap-2 p-3">
                {outcomeOptions.map(({ outcome, label, sub }) => {
                    const isWinner = winningOutcome === outcome;
                    const isUserPick = userBet?.outcome === outcome;
                    return (
                        <button
                            key={outcome}
                            disabled={!canBet}
                            onClick={() => canBet && onBet(outcome)}
                            className={`relative flex flex-col items-center rounded-xl border py-3 px-2 text-center transition ${isWinner
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : isUserPick
                                        ? 'border-primary/30 bg-primary/8'
                                        : canBet
                                            ? 'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/5 active:scale-95'
                                            : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {isWinner && <CheckCircle2 className="absolute top-1.5 right-1.5 h-3 w-3 text-emerald-400" />}
                            <p className={`text-xs font-bold leading-tight ${isWinner ? 'text-emerald-300' : 'text-white'}`}>
                                {label}
                            </p>
                            <div className={`mt-2 rounded-lg px-2 py-0.5 text-[10px] font-black ${isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'
                                }`}>
                                {sub}
                            </div>
                            {canBet && <p className="mt-1 text-[8px] text-white/25">Tap to bet</p>}
                            {match.status === 'live' && !userBet && (
                                <p className="mt-1 text-[8px] text-white/25">Betting closed</p>
                            )}
                        </button>
                    );
                })}
            </div>

            {match.status === 'live' && (
                <div className="flex items-center justify-center gap-1.5 border-t border-white/5 py-2 text-[10px] text-white/30">
                    <Lock className="h-3 w-3" /> Betting locked · match in progress
                </div>
            )}
        </div>
    );
}

// ─── Football Match Card ───────────────────────────────────────────────────────

function FootballMatchCard({
    match,
    userBet,
    onBet,
}: {
    match: FootballMatch;
    userBet?: UserBet;
    onBet: (outcome: BetOutcome) => void;
}) {
    const canBet = match.status === 'upcoming' && !userBet;
    const status = statusConfig[match.status];
    const mults = FOOTBALL_MULTIPLIERS;

    const outcomeOptions: { outcome: BetOutcome; label: string; sub: string }[] = [
        { outcome: 'team_a', label: match.teamA, sub: `${mults.team_a}x` },
        { outcome: 'draw', label: 'Draw', sub: `${mults.draw}x` },
        { outcome: 'team_b', label: match.teamB, sub: `${mults.team_b}x` },
    ];

    const getWinningOutcome = (): BetOutcome | null => {
        if (!match.winner) return null;
        if (match.winner === match.teamA) return 'team_a';
        if (match.winner === match.teamB) return 'team_b';
        if (match.winner === 'Draw') return 'draw';
        return null;
    };

    const winningOutcome = getWinningOutcome();

    return (
        <div className="rounded-2xl border border-white/10 bg-[hsl(220,20%,8%)] overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] uppercase tracking-[0.3em] text-white/30">{match.league}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-[9px] text-white/25 truncate">{match.venue}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{match.teamA}</span>
                        <span className="text-[10px] text-white/30">vs</span>
                        <span className="text-sm font-bold text-white">{match.teamB}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-white/35">
                        <Clock className="h-3 w-3" />
                        {formatTime(match.startsAt)}
                    </div>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-bold ${status.color}`}>
                    {status.label}
                </span>
            </div>

            {/* Live score */}
            {match.status === 'live' && match.score && (
                <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5">
                    <p className="flex-1 text-sm font-bold text-white">{match.teamA}</p>
                    <p className="font-mono text-lg font-black text-white">
                        {match.score.teamA ?? 0} — {match.score.teamB ?? 0}
                    </p>
                    <p className="flex-1 text-right text-sm font-bold text-white">{match.teamB}</p>
                </div>
            )}

            {/* Completed */}
            {match.status === 'completed' && match.winner && (
                <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-300">
                        {match.winner === 'Draw' ? 'Match Drawn' : `${match.winner} won`}
                    </p>
                    {match.score && (
                        <p className="ml-auto text-[10px] text-white/30">
                            {match.score.teamA} — {match.score.teamB}
                        </p>
                    )}
                </div>
            )}

            <div className="h-px bg-white/5 mx-4" />

            {userBet && (
                <div className="mx-4 mt-3 flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5">
                    <div>
                        <p className="text-[9px] uppercase tracking-widest text-white/30">Your bet</p>
                        <p className="text-xs font-bold text-white mt-0.5">
                            {userBet.outcome === 'team_a' ? match.teamA
                                : userBet.outcome === 'team_b' ? match.teamB
                                    : 'Draw'} · ₹{userBet.amount}
                        </p>
                    </div>
                    {userBet.status === 'won' && (
                        <div className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-xs font-bold">+₹{userBet.payout}</span>
                        </div>
                    )}
                    {userBet.status === 'lost' && <XCircle className="h-4 w-4 text-red-400" />}
                    {userBet.status === 'pending' && (
                        <span className="text-[9px] text-amber-400 border border-amber-500/20 bg-amber-500/10 rounded-full px-2 py-0.5">Pending</span>
                    )}
                </div>
            )}

            <div className="grid grid-cols-3 gap-2 p-3">
                {outcomeOptions.map(({ outcome, label, sub }) => {
                    const isWinner = winningOutcome === outcome;
                    const isUserPick = userBet?.outcome === outcome;
                    return (
                        <button
                            key={outcome}
                            disabled={!canBet}
                            onClick={() => canBet && onBet(outcome)}
                            className={`relative flex flex-col items-center rounded-xl border py-3 px-2 text-center transition ${isWinner
                                    ? 'border-emerald-500/30 bg-emerald-500/10'
                                    : isUserPick
                                        ? 'border-primary/30 bg-primary/8'
                                        : canBet
                                            ? 'border-white/10 bg-white/5 hover:border-primary/30 hover:bg-primary/5 active:scale-95'
                                            : 'border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed'
                                }`}
                        >
                            {isWinner && <CheckCircle2 className="absolute top-1.5 right-1.5 h-3 w-3 text-emerald-400" />}
                            <p className={`text-xs font-bold leading-tight ${isWinner ? 'text-emerald-300' : 'text-white'}`}>
                                {label}
                            </p>
                            <div className={`mt-2 rounded-lg px-2 py-0.5 text-[10px] font-black ${isWinner ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/10 text-primary'
                                }`}>
                                {sub}
                            </div>
                            {canBet && <p className="mt-1 text-[8px] text-white/25">Tap to bet</p>}
                        </button>
                    );
                })}
            </div>

            {match.status === 'live' && (
                <div className="flex items-center justify-center gap-1.5 border-t border-white/5 py-2 text-[10px] text-white/30">
                    <Lock className="h-3 w-3" /> Betting locked · match in progress
                </div>
            )}
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const SportPage = () => {
    const [sport, setSport] = useState<Sport>('cricket');
    const [cricketMatches, setCricketMatches] = useState<CricketMatch[]>([]);
    const [footballMatches, setFootballMatches] = useState<FootballMatch[]>([]);
    const [userBets, setUserBets] = useState<UserBet[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [betTarget, setBetTarget] = useState<{
        matchId: string;
        teamA: string;
        teamB: string;
        outcome: BetOutcome;
        multiplier: number;
    } | null>(null);

    const loadMatches = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        try {
            const [cricket, football] = await Promise.all([
                fetchCricketMatches(),
                fetchFootballMatches(),
            ]);
            setCricketMatches(cricket);
            setFootballMatches(football);
        } catch {
            toast.error('Failed to load matches');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadMatches();
        // Poll every 30s to catch live score + status updates
        const id = setInterval(() => loadMatches(true), 30_000);
        return () => clearInterval(id);
    }, [loadMatches]);

    const handleBet = (
        matchId: string,
        teamA: string,
        teamB: string,
        outcome: BetOutcome,
    ) => {
        const mults = sport === 'cricket' ? CRICKET_MULTIPLIERS : FOOTBALL_MULTIPLIERS;
        setBetTarget({ matchId, teamA, teamB, outcome, multiplier: mults[outcome] });
    };

    const handleConfirmBet = async (amount: number) => {
        if (!betTarget) return;
        const bet: Omit<UserBet, 'status' | 'payout'> = {
            matchId: betTarget.matchId,
            sport,
            outcome: betTarget.outcome,
            amount,
            multiplier: betTarget.multiplier,
        };
        try {
            await placeBet(bet);
            // Optimistically add to local state until real API wired
            setUserBets((prev) => [...prev, { ...bet, status: 'pending' }]);
            toast.success('Bet placed successfully!');
            setBetTarget(null);
        } catch {
            toast.error('Failed to place bet');
        }
    };

    const getUserBet = (matchId: string) =>
        userBets.find((b) => b.matchId === matchId);

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
        );
    }

    const currentMatches = sport === 'cricket' ? cricketMatches : footballMatches;
    const openCount = currentMatches.filter((m) => m.status === 'upcoming').length;
    const liveCount = currentMatches.filter((m) => m.status === 'live').length;

    return (
        <>
            <div className="space-y-4 p-4 pb-28">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold font-display">Sports</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {liveCount > 0 ? `${liveCount} live` : 'No live matches'} · {openCount} open for betting
                        </p>
                    </div>
                    <button
                        onClick={() => loadMatches(true)}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] text-white/50 transition hover:bg-white/10 disabled:opacity-40"
                    >
                        <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Sport chips */}
                <div className="flex gap-2">
                    {(['cricket', 'football'] as Sport[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSport(s)}
                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${sport === s
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-white/10 bg-white/5 text-white/50 hover:text-white'
                                }`}
                        >
                            {s === 'cricket' ? '🏏' : '⚽'} {s}
                        </button>
                    ))}
                </div>

                {/* Info strip */}
                <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-3.5 py-2.5 text-xs text-white/35">
                    <Shield className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                    {sport === 'cricket'
                        ? 'Bet before match starts. Win/Loss/Tie settled after result is declared.'
                        : 'Bet before kick-off. Win/Draw/Loss settled at full-time.'}
                </div>

                {/* Zap — live indicator */}
                {liveCount > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3.5 py-2.5">
                        <Zap className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <p className="text-xs text-red-300 font-medium">
                            {liveCount} match{liveCount > 1 ? 'es' : ''} in progress · scores update every 30s
                        </p>
                    </div>
                )}

                {/* Match list */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={sport}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.18 }}
                        className="space-y-3"
                    >
                        {currentMatches.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-16 text-center">
                                <AlertCircle className="h-8 w-8 text-white/20" />
                                <p className="text-sm text-white/30">No matches available right now</p>
                            </div>
                        ) : sport === 'cricket' ? (
                            cricketMatches.map((match) => (
                                <CricketMatchCard
                                    key={match.id}
                                    match={match}
                                    userBet={getUserBet(match.id)}
                                    onBet={(outcome) => handleBet(match.id, match.teamA, match.teamB, outcome)}
                                />
                            ))
                        ) : (
                            footballMatches.map((match) => (
                                <FootballMatchCard
                                    key={match.id}
                                    match={match}
                                    userBet={getUserBet(match.id)}
                                    onBet={(outcome) => handleBet(match.id, match.teamA, match.teamB, outcome)}
                                />
                            ))
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bet sheet */}
            <AnimatePresence>
                {betTarget && (
                    <BetSheet
                        teamA={betTarget.teamA}
                        teamB={betTarget.teamB}
                        outcome={betTarget.outcome}
                        multiplier={betTarget.multiplier}
                        sport={sport}
                        onConfirm={handleConfirmBet}
                        onDismiss={() => setBetTarget(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default SportPage;
