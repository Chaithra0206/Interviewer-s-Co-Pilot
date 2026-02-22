"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
    Shield,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Upload,
    FileText,
    Activity,
    TrendingUp,
    Zap,
    BarChart3,
    Eye,
    Fingerprint,
    Skull,
} from "lucide-react";
import Link from "next/link";

/* ================================================================== */
/*  DEMO DATA                                                          */
/* ================================================================== */

const PIPELINE_STATS = [
    { label: "Total Audits", value: 284, suffix: "", icon: <Users className="w-4 h-4" /> },
    { label: "Integrity Rate", value: 73, suffix: "%", icon: <Shield className="w-4 h-4" /> },
    { label: "Time Saved", value: 142, suffix: "hrs", icon: <Clock className="w-4 h-4" /> },
];

const RECENT_AUDITS = [
    { name: "Sarah Chen", role: "Sr. Frontend Engineer", dnaMatch: 94, verdict: "pass" as const },
    { name: "Javier Morales", role: "Backend Developer", dnaMatch: 87, verdict: "pass" as const },
    { name: "Priya Sharma", role: "Full-Stack Engineer", dnaMatch: 42, verdict: "fail" as const },
    { name: "Tom Nakamura", role: "DevOps Engineer", dnaMatch: 91, verdict: "pass" as const },
    { name: "Olga Petrov", role: "ML Engineer", dnaMatch: 38, verdict: "fail" as const },
    { name: "Marcus Johnson", role: "iOS Developer", dnaMatch: 96, verdict: "pass" as const },
    { name: "Lena Schmidt", role: "Security Engineer", dnaMatch: 79, verdict: "pass" as const },
    { name: "Raj Patel", role: "Data Engineer", dnaMatch: 55, verdict: "fail" as const },
];

const RADAR_DATA = [
    { axis: "Frontend", value: 88 },
    { axis: "Backend", value: 72 },
    { axis: "DevOps", value: 54 },
    { axis: "Security", value: 41 },
    { axis: "Testing", value: 63 },
    { axis: "Architecture", value: 77 },
];

const CONTRADICTIONS = [
    { id: 1, text: "Candidate #42 flagged: 2018 React class-components found in 'modern' portfolio", severity: "high" as const, time: "2m ago" },
    { id: 2, text: "Candidate #38 flagged: Resume claims 5yr Kubernetes but repos show Docker Compose only", severity: "high" as const, time: "8m ago" },
    { id: 3, text: "Candidate #51 flagged: Code quality score 34/100 — no tests in any repository", severity: "medium" as const, time: "14m ago" },
    { id: 4, text: "Candidate #27 flagged: GitHub contribution graph appears artificially inflated", severity: "high" as const, time: "21m ago" },
    { id: 5, text: "Candidate #19 flagged: TypeScript claimed but only 12% of codebase typed", severity: "medium" as const, time: "33m ago" },
    { id: 6, text: "Candidate #63 flagged: Architecture patterns inconsistent with claimed seniority", severity: "low" as const, time: "41m ago" },
];

/* ================================================================== */
/*  UTILITY: Count-Up Hook                                             */
/* ================================================================== */

function useCountUp(target: number, duration: number = 2) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const obj = { val: 0 };
        gsap.to(obj, {
            val: target,
            duration,
            ease: "power2.out",
            onUpdate: () => setCount(Math.round(obj.val)),
        });
    }, [target, duration]);

    return { count, ref };
}

/* ================================================================== */
/*  UTILITY: 3D Tilt Effect                                            */
/* ================================================================== */

function useTilt() {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(el, {
            rotateY: x * 8,
            rotateX: -y * 8,
            duration: 0.3,
            ease: "power2.out",
            transformPerspective: 1000,
        });
    }, []);

    const handleMouseLeave = useCallback(() => {
        if (ref.current) {
            gsap.to(ref.current, {
                rotateX: 0,
                rotateY: 0,
                duration: 0.5,
                ease: "power3.out",
            });
        }
    }, []);

    return { ref, handleMouseMove, handleMouseLeave };
}

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function RecruitmentControlCenter() {
    const gridRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".bento-block", {
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.08,
                ease: "power3.out",
            });
        }, gridRef);
        return () => ctx.revert();
    }, []);

    return (
        <div className="min-h-screen bg-white text-slate-900 p-6 font-sans">
            {/* Header */}
            <div className="max-w-[1400px] mx-auto mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center shadow-md shadow-indigo-200">
                            <Fingerprint className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight text-slate-900">Recruitment Control Center</h1>
                            <p className="text-[11px] text-slate-500 font-medium">Hiring Forensics · Live Pipeline</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] text-emerald-600 font-semibold">System Live</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bento Grid */}
            <div ref={gridRef} className="max-w-[1400px] mx-auto grid grid-cols-4 grid-rows-[auto_1fr_auto] gap-4">
                {/* ─── Row 1: Pipeline Stats (3 cards + "mini" 4th slot) ─── */}
                {PIPELINE_STATS.map((stat, i) => (
                    <StatCard key={stat.label} stat={stat} delay={i * 0.15} />
                ))}
                <MiniActivityCard />

                {/* ─── Row 2: Recent Audits (2 cols) + Radar (2 cols) ─── */}
                <div className="col-span-2 row-span-1">
                    <RecentAuditsCard />
                </div>
                <div className="col-span-2 row-span-1">
                    <TalentDNACard />
                </div>

                {/* ─── Row 3: Contradiction Feed (3 cols) + Quick Start (1 col) ─── */}
                <div className="col-span-3">
                    <ContradictionFeed />
                </div>
                <div className="col-span-1">
                    <QuickStartCard />
                </div>
            </div>
        </div>
    );
}

/* ================================================================== */
/*  STAT CARD                                                          */
/* ================================================================== */

function StatCard({ stat, delay }: { stat: typeof PIPELINE_STATS[0]; delay: number }) {
    const { count } = useCountUp(stat.value, 2 + delay);
    const tilt = useTilt();

    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 cursor-default hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">{stat.icon}</span>
                <TrendingUp className="w-3 h-3 text-emerald-600" />
            </div>
            <p className="text-3xl font-black tracking-tight font-mono text-slate-900 mb-1">
                {count}{stat.suffix}
            </p>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
        </div>
    );
}

/* ================================================================== */
/*  MINI ACTIVITY CARD (4th slot in top row)                           */
/* ================================================================== */

function MiniActivityCard() {
    const tilt = useTilt();
    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 cursor-default hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center justify-between mb-3">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span className="text-[9px] text-slate-400 font-mono">LIVE</span>
            </div>
            {/* Mini sparkline bars */}
            <div className="flex items-end gap-[3px] h-8">
                {[35, 55, 40, 70, 50, 85, 60, 90, 45, 75, 65, 80].map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 rounded-sm bg-indigo-200 group-hover:bg-indigo-300 transition-colors"
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-2">Audit Activity</p>
        </div>
    );
}

/* ================================================================== */
/*  RECENT FORENSIC AUDITS                                             */
/* ================================================================== */

function RecentAuditsCard() {
    const tilt = useTilt();

    // Sort candidates by DNA match (highest first) to establish ranks
    const rankedCandidates = [...RECENT_AUDITS].sort((a, b) => b.dnaMatch - a.dnaMatch);

    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 h-full hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recent Forensic Audits</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{rankedCandidates.length} candidates</span>
            </div>

            <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {rankedCandidates.map((candidate, i) => {
                    const matchColor =
                        candidate.dnaMatch >= 80 ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" } :
                            candidate.dnaMatch >= 60 ? { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" } :
                                { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };

                    const rank = i + 1;
                    const rankColor = rank === 1 ? "text-amber-600" : rank === 2 ? "text-slate-500" : rank === 3 ? "text-amber-800" : "text-slate-400";

                    return (
                        <Link
                            key={i}
                            href={`/forensic?name=${encodeURIComponent(candidate.name)}&role=${encodeURIComponent(candidate.role)}`}
                            className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {/* Rank */}
                                <div className={`w-4 text-center text-[11px] font-black font-mono flex-shrink-0 ${rankColor}`}>
                                    #{rank}
                                </div>
                                <div className={`w-8 h-8 rounded-lg ${candidate.verdict === "pass" ? "bg-indigo-50 border-indigo-200" : "bg-red-50 border-red-200"} border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                    <span className="text-[11px] font-bold text-slate-600">
                                        {candidate.name.split(" ").map(n => n[0]).join("")}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-semibold text-slate-700 truncate group-hover:text-indigo-600 transition-colors">{candidate.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{candidate.role}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 flex-shrink-0">
                                {/* DNA Match Pill */}
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${matchColor.bg} ${matchColor.text} border ${matchColor.border} font-mono`}>
                                    {candidate.dnaMatch}%
                                </span>
                                {/* Verdict Icon */}
                                {candidate.verdict === "pass" ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-600 group-hover:scale-110 transition-transform" />
                                )}
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  TALENT DNA INSIGHTS (Radar Chart)                                  */
/* ================================================================== */

function TalentDNACard() {
    const tilt = useTilt();
    const radarRef = useRef<SVGPolygonElement>(null);
    const size = 220;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = 85;
    const levels = 4;

    // Compute polygon points for the radar data
    const dataPoints = RADAR_DATA.map((d, i) => {
        const angle = (Math.PI * 2 * i) / RADAR_DATA.length - Math.PI / 2;
        const r = (d.value / 100) * maxR;
        return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    });
    const dataPoly = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

    // Axis endpoints
    const axisPoints = RADAR_DATA.map((d, i) => {
        const angle = (Math.PI * 2 * i) / RADAR_DATA.length - Math.PI / 2;
        return {
            x: cx + maxR * Math.cos(angle),
            y: cy + maxR * Math.sin(angle),
            labelX: cx + (maxR + 18) * Math.cos(angle),
            labelY: cy + (maxR + 18) * Math.sin(angle),
            label: d.axis,
            value: d.value,
        };
    });

    useEffect(() => {
        if (radarRef.current) {
            const totalLength = 600;
            gsap.fromTo(
                radarRef.current,
                { strokeDasharray: totalLength, strokeDashoffset: totalLength },
                { strokeDashoffset: 0, duration: 2, ease: "power2.out", delay: 0.5 }
            );
        }
    }, []);

    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 h-full hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Talent DNA Insights</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Pool Analysis</span>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Grid levels */}
                    {Array.from({ length: levels }).map((_, i) => {
                        const r = (maxR * (i + 1)) / levels;
                        const pts = RADAR_DATA.map((_, j) => {
                            const angle = (Math.PI * 2 * j) / RADAR_DATA.length - Math.PI / 2;
                            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                        }).join(" ");
                        return (
                            <polygon
                                key={i}
                                points={pts}
                                fill="none"
                                stroke="rgba(0,0,0,0.05)"
                                strokeWidth="1"
                            />
                        );
                    })}

                    {/* Axis lines */}
                    {axisPoints.map((a, i) => (
                        <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                    ))}

                    {/* Data polygon (filled) */}
                    <polygon
                        points={dataPoly}
                        fill="rgba(99,102,241,0.08)"
                        stroke="none"
                    />
                    {/* Data polygon (stroke — animated) */}
                    <polygon
                        ref={radarRef}
                        points={dataPoly}
                        fill="none"
                        stroke="rgb(99,102,241)"
                        strokeWidth="2"
                        strokeLinejoin="round"
                    />

                    {/* Data dots */}
                    {dataPoints.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="3" fill="rgb(99,102,241)" stroke="white" strokeWidth="2" />
                    ))}

                    {/* Axis labels */}
                    {axisPoints.map((a, i) => (
                        <text
                            key={i}
                            x={a.labelX}
                            y={a.labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="fill-slate-400 text-[9px] font-medium"
                        >
                            {a.label}
                        </text>
                    ))}
                </svg>
            </div>

            {/* Bottom meta */}
            <div className="flex items-center justify-between mt-2">
                {RADAR_DATA.map(d => (
                    <div key={d.axis} className="text-center">
                        <p className={`text-[11px] font-bold font-mono ${d.value >= 70 ? "text-emerald-600" : d.value >= 50 ? "text-amber-600" : "text-red-600"}`}>{d.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  CONTRADICTION FEED                                                 */
/* ================================================================== */

function ContradictionFeed() {
    const tilt = useTilt();

    const severityStyle = {
        high: { icon: <Skull className="w-3.5 h-3.5" />, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
        medium: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
        low: { icon: <Zap className="w-3.5 h-3.5" />, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-500" },
    };

    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-lg transition-all duration-300"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Contradiction Feed</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-50 border border-red-200">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] text-red-600 font-bold font-mono">LIVE</span>
                </div>
            </div>

            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {CONTRADICTIONS.map((item) => {
                    const s = severityStyle[item.severity];
                    return (
                        <div
                            key={item.id}
                            className={`flex items-start gap-3 px-3 py-2.5 rounded-lg ${s.bg} border ${s.border} transition-colors group/flag cursor-default`}
                        >
                            <div className={`mt-0.5 ${s.color} flex-shrink-0`}>{s.icon}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-slate-600 leading-snug">{item.text}</p>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 mt-0.5">{item.time}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ================================================================== */
/*  QUICK START DROP ZONE                                              */
/* ================================================================== */

function QuickStartCard() {
    const tilt = useTilt();
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        // Would handle file upload here
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            console.log("[ControlCenter] Resume dropped:", files[0].name);
        }
    };

    return (
        <div
            ref={tilt.ref}
            onMouseMove={tilt.handleMouseMove}
            onMouseLeave={tilt.handleMouseLeave}
            className="bento-block rounded-lg bg-white border border-slate-200 p-5 h-full hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col"
            style={{ transformStyle: "preserve-3d" }}
        >
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Audit</span>
            </div>

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 rounded-lg border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 cursor-pointer group/drop
                    ${isDragging
                        ? "border-indigo-400 bg-indigo-50"
                        : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
                    }`}
            >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors
                    ${isDragging ? "bg-indigo-100" : "bg-slate-100 group-hover/drop:bg-indigo-50"}`}>
                    {isDragging ? (
                        <FileText className="w-6 h-6 text-indigo-600" />
                    ) : (
                        <Upload className="w-5 h-5 text-slate-400 group-hover/drop:text-indigo-600 transition-colors" />
                    )}
                </div>
                <div className="text-center">
                    <p className="text-[11px] text-slate-500 font-medium">
                        {isDragging ? "Release to audit" : "Drop Resume PDF"}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Instant background scan</p>
                </div>
            </div>
        </div>
    );
}