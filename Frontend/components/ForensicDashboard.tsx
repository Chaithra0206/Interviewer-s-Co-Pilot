/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * ForensicDashboard — Hiring Forensic Dashboard (Digesto-inspired Bento)
 * Premium product-dashboard aesthetic with sidebar navigation,
 * accent-colored stat cards, and polished bento grid.
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
    Fingerprint,
    LayoutDashboard,
    Brain,
    FileText,
    ShieldCheck,
    Activity,
    Settings,
    HelpCircle,
    Search,
    Bell,
    ChevronRight,
    Shield,
    Database,
    Server,
    Layers,
    Package,
    TestTube,
    Lock,
    Target,
    AlertTriangle,
    Copy,
    Check,
    Clock,
    Sparkles,
    Eye,
    TrendingUp,
    Users,
    GitBranch,
    Zap,
    Star,
    Award,
    Sun,
    Moon,
} from "lucide-react";

/* ================================================================== */
/*  DEMO DATA                                                          */
/* ================================================================== */

const CANDIDATE = {
    name: "Sarah Chen",
    role: "Senior Frontend Engineer",
    avatar: "SC",
    reposAnalyzed: 3,
    filesScanned: 221,
    timeElapsed: "14s",
};

const STATS = [
    { label: "Discrepancies", value: "4", sub: "found in audit", accent: "orange" as const },
    { label: "Repos Scanned", value: "3", sub: "repositories", accent: "blue" as const },
    { label: "Files Analyzed", value: "221", sub: "source files", accent: "emerald" as const },
];

const VERDICT_DATA = {
    verdict: "Strong Hire — With Reservations",
    summary:
        "Candidate demonstrates genuine full-stack competence with solid architectural patterns. Resume inflates seniority of real-time systems expertise. Code quality is production-grade but lacks testing discipline.",
    status: "hired" as const,
};

const JD_ALIGNMENT = {
    score: 78,
    breakdown: [
        { area: "Frontend", score: 92, icon: <Layers className="w-3 h-3" /> },
        { area: "Backend", score: 85, icon: <Server className="w-3 h-3" /> },
        { area: "DevOps", score: 58, icon: <Package className="w-3 h-3" /> },
        { area: "Testing", score: 44, icon: <TestTube className="w-3 h-3" /> },
    ],
};

interface MicroCard {
    domain: string;
    method: string;
    quality: number;
}

const TECH_DNA: MicroCard[] = [
    { domain: "Auth", method: "JWT + bcrypt + OAuth2", quality: 88 },
    { domain: "State", method: "React Context API", quality: 72 },
    { domain: "API", method: "Express REST + Mongoose", quality: 85 },
    { domain: "Security", method: "CORS + httpOnly cookies", quality: 68 },
    { domain: "Testing", method: "No test framework found", quality: 12 },
    { domain: "DevOps", method: "Docker multi-stage", quality: 76 },
];

interface TraceEntry {
    agent: string;
    message: string;
    timestamp: string;
    type: "info" | "warning" | "success";
}

const FORENSIC_TRACE: TraceEntry[] = [
    { agent: "Scout", message: "Crawling repo tree… 221 files indexed.", timestamp: "00:00", type: "info" },
    { agent: "Scout", message: "Found JWT auth — bcrypt hashing confirmed.", timestamp: "00:02", type: "success" },
    { agent: "Scout", message: "React Context for state — no Redux/Zustand.", timestamp: "00:03", type: "info" },
    { agent: "Judge", message: "Resume: 'Expert React' — only class components in 2/8 files.", timestamp: "00:05", type: "warning" },
    { agent: "Scout", message: "Socket.IO real-time — in-memory presence store.", timestamp: "00:06", type: "warning" },
    { agent: "Scout", message: "Docker multi-stage build. Non-root user.", timestamp: "00:08", type: "success" },
    { agent: "Judge", message: "ZERO test files. Resume: 'TDD practitioner' — CONTRADICTION.", timestamp: "00:09", type: "warning" },
    { agent: "Scout", message: "Mongoose schemas with indexes. Missing: validation.", timestamp: "00:11", type: "info" },
    { agent: "Judge", message: "Code quality: Production-grade. Maturity: Mid-level.", timestamp: "00:13", type: "success" },
];

const PRESSURE_QUESTIONS = [
    "Your resume says 'TDD practitioner,' but we found zero test files. Explain your testing strategy.",
    "You're using an in-memory presence store for Socket.IO. How would you scale to 3 instances?",
    "Why React Context over Zustand/Redux? At what scale does ChatContext cause re-render issues?",
    "Your JWT stores refresh tokens in DB. What if an attacker gets MongoDB read access?",
    "No rate-limiting on any API routes. How would you implement it for /api/v1/users/login?",
];

interface RadarAxis {
    label: string;
    value: number;
}

const BEHAVIORAL_DNA: RadarAxis[] = [
    { label: "Honesty", value: 0.65 },
    { label: "Seniority", value: 0.72 },
    { label: "Accountability", value: 0.58 },
    { label: "Adaptability", value: 0.85 },
    { label: "Expertise", value: 0.78 },
];

const NAV_ITEMS = [
    { icon: <LayoutDashboard className="w-[18px] h-[18px]" />, label: "Dashboard", active: true },
    { icon: <Brain className="w-[18px] h-[18px]" />, label: "AI Analysis", active: false },
    { icon: <FileText className="w-[18px] h-[18px]" />, label: "Resume", active: false },
    { icon: <GitBranch className="w-[18px] h-[18px]" />, label: "Repositories", active: false },
    { icon: <ShieldCheck className="w-[18px] h-[18px]" />, label: "Audit Trail", active: false },
    { icon: <Activity className="w-[18px] h-[18px]" />, label: "Reports", active: false },
];

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function ForensicDashboard() {
    const gridRef = useRef<HTMLDivElement>(null);
    const [isDark, setIsDark] = useState(true);

    // Toggle dark/light class on <html>
    useEffect(() => {
        const html = document.documentElement;
        if (isDark) {
            html.classList.add("dark");
        } else {
            html.classList.remove("dark");
        }
    }, [isDark]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".bento-tile", {
                y: 24,
                opacity: 0,
                duration: 0.5,
                stagger: 0.06,
                ease: "power3.out",
            });
        }, gridRef);

        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#09090B] flex relative overflow-hidden">

            {/* ─── Sidebar ─── */}
            <aside className="w-[220px] relative z-10 bg-white/15 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.8] border-r border-white/20 dark:border-white/[0.06] flex flex-col py-5 px-3 flex-shrink-0">
                {/* Logo */}
                <div className="flex items-center gap-2.5 px-3 mb-8">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center shadow-md shadow-blue-500/20">
                        <Fingerprint className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight">
                        Forensics
                    </span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.label}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 ${item.active
                                ? "bg-[#3B82F6]/10 dark:bg-electric-blue/10 text-[#3B82F6] dark:text-electric-blue"
                                : "text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-obsidian-hover"
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Bottom */}
                <div className="space-y-0.5 pt-4 border-t border-zinc-100 dark:border-obsidian-border">
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-obsidian-hover transition-all">
                        <Settings className="w-[18px] h-[18px]" />
                        Settings
                    </button>
                    <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-obsidian-hover transition-all">
                        <HelpCircle className="w-[18px] h-[18px]" />
                        Help
                    </button>
                </div>
            </aside>

            {/* ─── Main Content ─── */}
            <main className="flex-1 overflow-y-auto">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-white/15 dark:bg-white/[0.02] backdrop-blur-2xl backdrop-saturate-[1.8] border-b border-white/15 dark:border-white/[0.05] px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/20 dark:bg-white/[0.04] border border-white/20 dark:border-white/[0.08] rounded-xl w-64 backdrop-blur-xl">
                            <Search className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[12px] text-zinc-400">Search candidates…</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        {/* Theme Toggle */}
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="relative w-8 h-8 rounded-xl bg-white/20 dark:bg-white/[0.04] border border-white/20 dark:border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all duration-300 backdrop-blur-sm group"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <Sun className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
                            ) : (
                                <Moon className="w-4 h-4 group-hover:-rotate-12 transition-transform duration-300" />
                            )}
                        </button>
                        <button className="relative w-8 h-8 rounded-xl bg-white/20 dark:bg-white/[0.04] border border-white/20 dark:border-white/[0.06] flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors backdrop-blur-sm">
                            <Bell className="w-4 h-4" />
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#3B82F6]" />
                        </button>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white text-[11px] font-bold">
                            {CANDIDATE.avatar}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div ref={gridRef} className="px-6 py-5 space-y-4">
                    {/* Hero Greeting */}
                    <div className="bento-tile flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                                Hello, Interviewer 👋
                            </h1>
                            <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-0.5">
                                Forensic analysis complete for <span className="font-semibold text-zinc-700 dark:text-zinc-300">{CANDIDATE.name}</span> — {CANDIDATE.role}
                            </p>
                        </div>
                        <span className="px-3 py-1.5 rounded-xl bg-savage-emerald/10 border border-savage-emerald/20 text-savage-emerald text-[11px] font-bold uppercase tracking-wider">
                            Analysis Complete
                        </span>
                    </div>

                    {/* Row 1: Stat Cards + JD Gauge */}
                    <div className="grid grid-cols-4 gap-3">
                        {STATS.map((stat) => (
                            <StatCard key={stat.label} {...stat} />
                        ))}
                        <div className="bento-tile">
                            <JDGaugeMini data={JD_ALIGNMENT} />
                        </div>
                    </div>

                    {/* Row 2: Verdict (wide) + Radar Chart */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2 bento-tile">
                            <VerdictCard data={VERDICT_DATA} />
                        </div>
                        <div className="bento-tile">
                            <BehavioralRadar axes={BEHAVIORAL_DNA} />
                        </div>
                    </div>

                    {/* Row 3: Technical DNA (wide) */}
                    <div className="bento-tile">
                        <TechDNAGrid cards={TECH_DNA} />
                    </div>

                    {/* Row 4: Questions + Timeline */}
                    <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3 bento-tile">
                            <QuestionsCard questions={PRESSURE_QUESTIONS} />
                        </div>
                        <div className="col-span-2 bento-tile">
                            <TimelineCard entries={FORENSIC_TRACE} />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ================================================================== */
/*  STAT CARD                                                          */
/* ================================================================== */

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "orange" | "blue" | "emerald" }) {
    const colors = {
        orange: {
            bg: "bg-gradient-to-br from-[#FF6B35] to-[#FF8F65]",
            shadow: "shadow-orange-500/20",
        },
        blue: {
            bg: "bg-gradient-to-br from-[#3B82F6] to-[#60A5FA]",
            shadow: "shadow-blue-500/20",
        },
        emerald: {
            bg: "bg-gradient-to-br from-[#10B981] to-[#34D399]",
            shadow: "shadow-emerald-500/20",
        },
    };
    const c = colors[accent];

    return (
        <div className={`bento-tile rounded-2xl ${c.bg} p-5 shadow-lg ${c.shadow} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default backdrop-blur-sm border border-white/25 shadow-[0_4px_30px_rgba(0,0,0,0.08)]`}>
            <p className="text-white/70 text-[11px] font-semibold uppercase tracking-wider mb-2">{label}</p>
            <p className="text-4xl font-black text-white leading-none mb-1">{value}</p>
            <p className="text-white/60 text-[11px] font-medium">{sub}</p>
        </div>
    );
}

/* ================================================================== */
/*  JD GAUGE (Mini)                                                    */
/* ================================================================== */

function JDGaugeMini({ data }: { data: typeof JD_ALIGNMENT }) {
    const gaugeRef = useRef<SVGCircleElement>(null);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (data.score / 100) * circumference;

    useEffect(() => {
        if (gaugeRef.current) {
            gsap.from(gaugeRef.current, {
                strokeDashoffset: circumference,
                duration: 1.2,
                ease: "power3.out",
                delay: 0.6,
            });
        }
    }, [circumference]);

    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] p-5 h-full flex items-center gap-5 hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            {/* Gauge */}
            <div className="relative w-24 h-24 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <circle cx="48" cy="48" r={radius} fill="none" className="stroke-zinc-100 dark:stroke-zinc-800" strokeWidth="7" />
                    <circle
                        ref={gaugeRef}
                        cx="48" cy="48" r={radius}
                        fill="none"
                        className="stroke-[#3B82F6]"
                        strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-zinc-900 dark:text-white">{data.score}</span>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">match</span>
                </div>
            </div>

            {/* Breakdown */}
            <div className="flex-1 space-y-2">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">JD Alignment</p>
                {data.breakdown.map((b) => (
                    <div key={b.area} className="flex items-center gap-2">
                        <span className="text-zinc-400 dark:text-zinc-500">{b.icon}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-500 w-14 font-medium">{b.area}</span>
                        <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${b.score >= 80 ? "bg-[#10B981]" : b.score >= 60 ? "bg-[#3B82F6]" : "bg-[#FF6B35]"
                                    }`}
                                style={{ width: `${b.score}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 w-6 text-right">{b.score}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  VERDICT CARD                                                       */
/* ================================================================== */

function VerdictCard({ data }: { data: typeof VERDICT_DATA }) {
    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] p-6 h-full relative overflow-hidden hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            {/* Subtle gradient overlay */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#10B981]/5 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#10B981]" />
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#10B981]">
                            Hire Recommended
                        </span>
                    </div>
                </div>

                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight mb-3">
                    {data.verdict}
                </h2>

                <p className="text-[12px] leading-relaxed text-zinc-500 font-medium max-w-lg">
                    {data.summary}
                </p>

                {/* Key metrics row */}
                <div className="mt-5 flex gap-4">
                    {[
                        { label: "Code Quality", value: "A-", icon: <Star className="w-3 h-3" /> },
                        { label: "Architecture", value: "B+", icon: <Layers className="w-3 h-3" /> },
                        { label: "Best Practices", value: "B", icon: <Award className="w-3 h-3" /> },
                    ].map((m) => (
                        <div key={m.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 dark:bg-white/[0.03] backdrop-blur-lg border border-white/15 dark:border-white/[0.05]">
                            <span className="text-zinc-400">{m.icon}</span>
                            <div>
                                <p className="text-[9px] text-zinc-400 uppercase tracking-wider font-medium">{m.label}</p>
                                <p className="text-sm font-black text-zinc-900 dark:text-white">{m.value}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/* ================================================================== */
/*  BEHAVIORAL RADAR                                                   */
/* ================================================================== */

function BehavioralRadar({ axes }: { axes: RadarAxis[] }) {
    const n = axes.length;
    const cx = 80, cy = 80, maxR = 50;
    const angleStep = 360 / n;

    function polar(angle: number, r: number) {
        const rad = ((angle - 90) * Math.PI) / 180;
        return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    }

    const levels = [0.25, 0.5, 0.75, 1.0];
    const dataPoints = axes.map((a, i) => polar(i * angleStep, a.value * maxR));
    const dataPoly = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] p-5 h-full flex flex-col items-center justify-center hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-1.5 mb-3">
                <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Behavioral DNA</span>
            </div>

            <svg viewBox="0 0 160 160" className="w-full max-w-[180px]">
                {levels.map((l) => {
                    const pts = Array.from({ length: n }, (_, i) => {
                        const p = polar(i * angleStep, l * maxR);
                        return `${p.x},${p.y}`;
                    }).join(" ");
                    return <polygon key={l} points={pts} fill="none" className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.6" />;
                })}
                {axes.map((_, i) => {
                    const p = polar(i * angleStep, maxR);
                    return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="0.5" />;
                })}
                <polygon points={dataPoly} fill="rgba(139,92,246,0.12)" stroke="#8B5CF6" strokeWidth="1.5" strokeLinejoin="round" />
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#8B5CF6" className="stroke-white dark:stroke-obsidian-surface" strokeWidth="1.5" />
                ))}
                {axes.map((a, i) => {
                    const pos = polar(i * angleStep, maxR + 14);
                    return (
                        <text key={i} x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                            className="fill-zinc-400 dark:fill-zinc-500 text-[6px] font-bold uppercase" style={{ letterSpacing: "0.04em" }}>
                            {a.label}
                        </text>
                    );
                })}
            </svg>

            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
                {axes.map((a) => (
                    <div key={a.label} className="flex items-center gap-1">
                        <span className="text-[8px] text-zinc-400 font-medium">{a.label}</span>
                        <span className="text-[9px] font-bold text-[#8B5CF6]">{Math.round(a.value * 100)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  TECH DNA GRID                                                      */
/* ================================================================== */

function TechDNAGrid({ cards }: { cards: MicroCard[] }) {
    const icons: Record<string, React.ReactNode> = {
        Auth: <Shield className="w-4 h-4" />,
        State: <Layers className="w-4 h-4" />,
        API: <Server className="w-4 h-4" />,
        Security: <Lock className="w-4 h-4" />,
        Testing: <TestTube className="w-4 h-4" />,
        DevOps: <Package className="w-4 h-4" />,
    };

    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] p-5 hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                    <Brain className="w-3.5 h-3.5 text-[#3B82F6]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Technical DNA</span>
                </div>
                <span className="text-[10px] text-zinc-400">6 domains analyzed</span>
            </div>

            <div className="grid grid-cols-6 gap-2.5">
                {cards.map((card) => {
                    const color =
                        card.quality >= 80 ? { text: "text-[#10B981]", bg: "bg-[#10B981]/8", bar: "bg-[#10B981]", border: "border-[#10B981]/15" } :
                            card.quality >= 50 ? { text: "text-[#3B82F6]", bg: "bg-[#3B82F6]/8", bar: "bg-[#3B82F6]", border: "border-[#3B82F6]/15" } :
                                { text: "text-[#FF6B35]", bg: "bg-[#FF6B35]/8", bar: "bg-[#FF6B35]", border: "border-[#FF6B35]/15" };

                    return (
                        <div
                            key={card.domain}
                            className="rounded-xl bg-white/10 dark:bg-white/[0.03] backdrop-blur-xl backdrop-saturate-150 border border-white/20 dark:border-white/[0.06] p-3.5 hover:bg-white/25 dark:hover:bg-white/[0.06] hover:border-white/35 dark:hover:border-white/[0.1] hover:-translate-y-1 transition-all duration-200 group cursor-default"
                        >
                            <div className="flex items-center justify-between mb-2.5">
                                <div className="w-8 h-8 rounded-xl bg-white/15 dark:bg-white/[0.05] border border-white/20 dark:border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                                    {icons[card.domain]}
                                </div>
                                <span className={`text-xs font-black ${color.text} px-2 py-0.5 rounded-lg ${color.bg} border ${color.border}`}>
                                    {card.quality}
                                </span>
                            </div>
                            <h4 className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider mb-0.5">
                                {card.domain}
                            </h4>
                            <p className="text-[10px] text-zinc-400 font-medium leading-snug">{card.method}</p>
                            <div className="mt-2.5 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${color.bar} transition-all duration-1000`} style={{ width: `${card.quality}%` }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  QUESTIONS CARD                                                     */
/* ================================================================== */

function QuestionsCard({ questions }: { questions: string[] }) {
    const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

    const handleCopy = useCallback((text: string, idx: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx(idx);
        setTimeout(() => setCopiedIdx(null), 2000);
    }, []);

    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] p-5 h-full hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            <div className="flex items-center gap-1.5 mb-4">
                <Zap className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Pressure-Test Questions</span>
            </div>

            <ol className="space-y-3">
                {questions.map((q, i) => (
                    <li key={i} className="flex gap-3 group/q">
                        <span className="text-[10px] font-black text-zinc-300 dark:text-zinc-700 mt-0.5 w-5 flex-shrink-0 text-right">
                            {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium flex-1">
                            {q}
                        </p>
                        <button
                            onClick={() => handleCopy(q, i)}
                            className="flex-shrink-0 w-7 h-7 rounded-lg bg-white/15 dark:bg-white/[0.04] border border-white/20 dark:border-white/[0.06] text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/[0.08] transition-all duration-200 flex items-center justify-center opacity-0 group-hover/q:opacity-100"
                            aria-label="Copy question"
                        >
                            {copiedIdx === i ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                        </button>
                    </li>
                ))}
            </ol>
        </div>
    );
}

/* ================================================================== */
/*  TIMELINE CARD                                                      */
/* ================================================================== */

function TimelineCard({ entries }: { entries: TraceEntry[] }) {
    const agentColors: Record<string, string> = {
        Scout: "text-[#3B82F6]",
        Judge: "text-[#FF6B35]",
        Verdict: "text-[#10B981]",
    };
    const dotColors: Record<string, string> = {
        info: "bg-zinc-300 dark:bg-zinc-600",
        warning: "bg-[#FF6B35]",
        success: "bg-[#10B981]",
    };

    return (
        <div className="rounded-2xl bg-white/20 dark:bg-white/[0.03] backdrop-blur-2xl backdrop-saturate-[1.6] border border-white/25 dark:border-white/[0.07] flex flex-col h-full hover:-translate-y-1 hover:bg-white/30 dark:hover:bg-white/[0.05] transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.05)]">
            <div className="px-5 py-3.5 border-b border-white/15 dark:border-white/[0.05] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Reasoning Trace</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-3 space-y-3">
                {entries.map((entry, i) => (
                    <div key={i} className="flex gap-2.5">
                        <div className="flex flex-col items-center pt-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColors[entry.type]} flex-shrink-0`} />
                            {i < entries.length - 1 && <div className="w-px flex-1 bg-zinc-100 dark:bg-zinc-800 mt-1" />}
                        </div>
                        <div className="flex-1 pb-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${agentColors[entry.agent] ?? "text-zinc-400"}`}>
                                    {entry.agent}
                                </span>
                                <span className="text-[8px] text-zinc-300 dark:text-zinc-700 font-mono">{entry.timestamp}</span>
                            </div>
                            <p className="text-[10px] leading-relaxed font-mono text-zinc-500 dark:text-zinc-500 font-medium">
                                {entry.message}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
