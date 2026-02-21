/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TechDNACard — Grid of "Approach Cards" extracted from a candidate's
 * GitHub repo analysis (JSON from the CandidateAuditor / Scraper skill).
 *
 * Features:
 *  • Each card shows the domain (Auth, State, API, …) and the concrete method found.
 *  • Hovering reveals a "Scout Observation" — the AI's critique of that implementation.
 *  • If a file reference exists, clicking it opens a mock code-viewer overlay
 *    with the file highlighted.
 */

"use client";

import React, { useEffect, useRef, useState, memo, useCallback } from "react";
import { gsap } from "gsap";
import {
    Shield,
    Database,
    Server,
    Layout,
    Package,
    Layers,
    Workflow,
    Eye,
    X,
    FileCode2,
    ExternalLink,
    Sparkles,
    AlertTriangle,
    Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ObservationSeverity = "positive" | "neutral" | "concern";

interface ApproachData {
    /** Domain label, e.g. "Auth", "State Mgmt", "API Layer" */
    domain: string;
    /** The method / library found, e.g. "JWT + bcrypt", "React Context" */
    method: string;
    /** Optional: the AI's observation/critique */
    observation?: string;
    /** Severity of the observation */
    severity?: ObservationSeverity;
    /** Optional: path to a key file in the repo */
    fileRef?: string;
    /** Snippet of code to show in the viewer */
    codeSnippet?: string;
}

interface TechDNACardProps {
    /** The approach data to display. Falls back to demo data if omitted. */
    approaches?: ApproachData[];
    /** Called when a file reference is clicked (can be used to integrate with a real code viewer). */
    onFileClick?: (filePath: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Demo data (derived from the InnovateHubCEC JSON)                  */
/* ------------------------------------------------------------------ */

const DEMO_APPROACHES: ApproachData[] = [
    {
        domain: "Authentication",
        method: "JWT + bcrypt + Google OAuth",
        observation:
            "Solid security posture — bcrypt for hashing, dual JWT (access + refresh), and Google OAuth2. However, tokens are stored in httpOnly cookies only on the server side; client-side expiry handling could be stronger.",
        severity: "positive",
        fileRef: "backend/src/controllers/user.controller.js",
        codeSnippet: `const generateAccessAndRefreshToken = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });
  return { accessToken, refreshToken };
};`,
    },
    {
        domain: "State Management",
        method: "React Context API",
        observation:
            "Uses React Context for global state (ChatContext) instead of Redux or Zustand. For the current app scale this is pragmatic, but may cause unnecessary re-renders as the app grows. No evidence of memoization strategy.",
        severity: "neutral",
        fileRef: "frontend/src/context/ChatContext.tsx",
        codeSnippet: `// ChatContext.tsx
import { createContext, useContext, useState } from "react";

const ChatContext = createContext<ChatState | null>(null);

export function ChatProvider({ children }) {
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  // ...
}`,
    },
    {
        domain: "API Layer",
        method: "Express REST + Mongoose ODM",
        observation:
            "Classic Express + Mongoose pattern with well-structured controllers, routes, and models. Uses asyncHandler wrapper for error propagation — good. But multiple routes lack rate-limiting and request validation middleware.",
        severity: "neutral",
        fileRef: "backend/src/app.js",
        codeSnippet: `// app.js — route declarations
app.use('/api/v1/users',        userRouter);
app.use('/api/v1/posts',        postRouter);
app.use('/api/v1/leaderboard',  leaderboardRouter);
app.use('/api/v1/chat',         chatRouter);
app.use('/api/v1/mentors',      mentorRouter);
app.use('/api/v1/contests',     contestRouter);`,
    },
    {
        domain: "Real-time Comms",
        method: "Socket.IO (bidirectional)",
        observation:
            "Socket.IO for chat and real-time updates — established but heavy. No evidence of WebSocket fallback or reconnection strategy. The presence store is in-memory, which won't survive horizontal scaling.",
        severity: "concern",
        fileRef: "backend/src/socket.js",
        codeSnippet: `import { Server } from "socket.io";

const presenceStore = new Map();

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.CORS_ORIGIN }
  });
  io.on("connection", (socket) => {
    presenceStore.set(socket.userId, socket.id);
    // ...
  });
}`,
    },
    {
        domain: "Data Layer",
        method: "MongoDB + Mongoose Schemas",
        observation:
            "Well-defined schemas with indexes, references, and virtuals. Uses mongoose-aggregate-paginate for cursor-based pagination. Missing: Schema-level validation is sparse — many fields accept any string without format checks.",
        severity: "neutral",
        fileRef: "backend/src/models/user.model.js",
        codeSnippet: `const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: function() {
    return this.provider === 'local';
  }},
  provider: { type: String, enum: ['local','google'] },
  // ...30+ fields
});`,
    },
    {
        domain: "DevOps",
        method: "Docker Multi-stage + Render",
        observation:
            "Multi-stage Dockerfile with non-root user — production-ready pattern. However, no docker-compose for local dev, no CI/CD pipeline definition found, and no health-check endpoint in the container.",
        severity: "concern",
        fileRef: "backend/Dockerfile",
        codeSnippet: `FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:18-alpine AS runner
ENV NODE_ENV=production
USER node
EXPOSE 8000
CMD ["node", "src/server.js"]`,
    },
];

/* ------------------------------------------------------------------ */
/*  Icon map                                                           */
/* ------------------------------------------------------------------ */

const DOMAIN_ICONS: Record<string, React.ReactNode> = {
    Authentication: <Shield className="w-4 h-4" />,
    "State Management": <Layers className="w-4 h-4" />,
    "API Layer": <Server className="w-4 h-4" />,
    "Real-time Comms": <Workflow className="w-4 h-4" />,
    "Data Layer": <Database className="w-4 h-4" />,
    DevOps: <Package className="w-4 h-4" />,
    Frontend: <Layout className="w-4 h-4" />,
};

const SEVERITY_STYLES: Record<ObservationSeverity, { dot: string; bg: string; text: string; border: string }> = {
    positive: {
        dot: "bg-emerald-500",
        bg: "bg-emerald-500/5 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-200 dark:border-emerald-500/20",
    },
    neutral: {
        dot: "bg-amber-500",
        bg: "bg-amber-500/5 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-200 dark:border-amber-500/20",
    },
    concern: {
        dot: "bg-red-500",
        bg: "bg-red-500/5 dark:bg-red-500/10",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-200 dark:border-red-500/20",
    },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const TechDNACard = memo(function TechDNACard({
    approaches = DEMO_APPROACHES,
    onFileClick,
}: TechDNACardProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [viewerFile, setViewerFile] = useState<ApproachData | null>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".dna-card", {
                y: 12,
                opacity: 0,
                scale: 0.97,
                duration: 0.45,
                stagger: 0.06,
                ease: "power3.out",
            });
        }, gridRef);

        return () => ctx.revert();
    }, []);

    const handleFileClick = useCallback(
        (item: ApproachData) => {
            if (onFileClick && item.fileRef) {
                onFileClick(item.fileRef);
            } else {
                setViewerFile(item);
            }
        },
        [onFileClick]
    );

    return (
        <>
            <div
                ref={gridRef}
                className="grid grid-cols-2 lg:grid-cols-3 gap-2.5"
                role="list"
                aria-label="Technical approach cards"
            >
                {approaches.map((item, idx) => (
                    <ApproachCard
                        key={`${item.domain}-${idx}`}
                        item={item}
                        onFileClick={handleFileClick}
                    />
                ))}
            </div>

            {/* Code Viewer Overlay */}
            {viewerFile && (
                <CodeViewerOverlay
                    item={viewerFile}
                    onClose={() => setViewerFile(null)}
                />
            )}
        </>
    );
});

export default TechDNACard;

/* ------------------------------------------------------------------ */
/*  ApproachCard                                                       */
/* ------------------------------------------------------------------ */

function ApproachCard({
    item,
    onFileClick,
}: {
    item: ApproachData;
    onFileClick: (item: ApproachData) => void;
}) {
    const severity = item.severity ?? "neutral";
    const styles = SEVERITY_STYLES[severity];
    const icon = DOMAIN_ICONS[item.domain] ?? <Info className="w-4 h-4" />;

    return (
        <div
            className="dna-card group relative bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 transition-all duration-300 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:-translate-y-0.5 cursor-default overflow-hidden"
            role="listitem"
        >
            {/* Severity bar */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] ${styles.dot} opacity-60`} />

            {/* Header */}
            <div className="flex items-start justify-between mb-2.5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider leading-tight">
                            {item.domain}
                        </h4>
                    </div>
                </div>
                <span className={`w-2 h-2 rounded-full ${styles.dot} mt-1 flex-shrink-0`} />
            </div>

            {/* Method */}
            <p className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300 leading-snug mb-2">
                {item.method}
            </p>

            {/* File Reference */}
            {item.fileRef && (
                <button
                    onClick={() => onFileClick(item)}
                    className="flex items-center gap-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors group/link"
                >
                    <FileCode2 className="w-2.5 h-2.5" />
                    <span className="truncate max-w-[140px] group-hover/link:underline underline-offset-2">
                        {item.fileRef.split("/").pop()}
                    </span>
                    <ExternalLink className="w-2 h-2 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                </button>
            )}

            {/* Hover Observation — Scout Observation */}
            {item.observation && (
                <div className="absolute inset-0 flex flex-col p-3.5 bg-white/[.97] dark:bg-zinc-900/[.97] backdrop-blur-sm opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-10 rounded-xl">
                    {/* Top accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-[2px] ${styles.dot}`} />

                    <div className="flex items-center gap-1.5 mb-2">
                        <div className={`w-5 h-5 rounded-md ${styles.bg} ${styles.border} border flex items-center justify-center`}>
                            {severity === "positive" && <Sparkles className={`w-3 h-3 ${styles.text}`} />}
                            {severity === "neutral" && <Eye className={`w-3 h-3 ${styles.text}`} />}
                            {severity === "concern" && <AlertTriangle className={`w-3 h-3 ${styles.text}`} />}
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Scout Observation
                        </span>
                    </div>

                    <p className="text-[10px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium flex-1 overflow-y-auto scrollbar-none">
                        {item.observation}
                    </p>

                    {item.fileRef && (
                        <button
                            onClick={() => onFileClick(item)}
                            className={`mt-2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${styles.text} hover:underline underline-offset-2 pointer-events-auto`}
                        >
                            <FileCode2 className="w-3 h-3" />
                            View Source
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  CodeViewerOverlay                                                  */
/* ------------------------------------------------------------------ */

function CodeViewerOverlay({
    item,
    onClose,
}: {
    item: ApproachData;
    onClose: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".code-viewer-panel", {
                y: 30,
                opacity: 0,
                scale: 0.97,
                duration: 0.35,
                ease: "power3.out",
            });
        }, overlayRef);

        return () => ctx.revert();
    }, []);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const severity = item.severity ?? "neutral";
    const styles = SEVERITY_STYLES[severity];

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm" />

            {/* Panel */}
            <div
                className="code-viewer-panel relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-amber-400" />
                            <div className="w-3 h-3 rounded-full bg-emerald-400" />
                        </div>
                        <div className="flex items-center gap-2">
                            <FileCode2 className="w-4 h-4 text-zinc-400" />
                            <span className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                                {item.fileRef}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                        aria-label="Close viewer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Domain + Method badge */}
                <div className="px-5 pt-3 pb-2 flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {item.domain}
                    </span>
                    <span className="text-[9px] text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                        {item.method}
                    </span>
                </div>

                {/* Code */}
                <div className="px-5 pb-4">
                    <div className="bg-zinc-950 rounded-xl border border-zinc-800/60 overflow-hidden">
                        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono scrollbar-thin">
                            <code className="text-zinc-300">
                                {(item.codeSnippet ?? `// Source: ${item.fileRef}\n// No preview available for this file.`).split("\n").map((line, i) => (
                                    <div key={i} className="flex hover:bg-white/5 transition-colors">
                                        <span className="select-none text-zinc-600 w-8 text-right mr-4 flex-shrink-0">
                                            {i + 1}
                                        </span>
                                        <span>{line}</span>
                                    </div>
                                ))}
                            </code>
                        </pre>
                    </div>
                </div>

                {/* Observation Footer */}
                {item.observation && (
                    <div className={`mx-5 mb-4 p-3 rounded-xl ${styles.bg} border ${styles.border}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                            {severity === "positive" && <Sparkles className={`w-3 h-3 ${styles.text}`} />}
                            {severity === "neutral" && <Eye className={`w-3 h-3 ${styles.text}`} />}
                            {severity === "concern" && <AlertTriangle className={`w-3 h-3 ${styles.text}`} />}
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                                Scout Observation
                            </span>
                        </div>
                        <p className={`text-[11px] leading-relaxed font-medium ${styles.text}`}>
                            {item.observation}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
