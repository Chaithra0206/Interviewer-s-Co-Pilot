/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
    LayoutGrid,
    Mic,
    MicOff,
    Video,
    VideoOff,
    Monitor,
    Play,
    Terminal,
    LogOut,
    MessageSquare,
    Settings,
    ChevronDown,
    Wifi,
    WifiOff
} from "lucide-react";
import MonacoEditor, { LANGUAGE_LABELS, DEFAULT_CODE, type SupportedLanguage } from "./MonacoEditor";
import { motion, AnimatePresence } from "motion/react";
import { useCodeSender } from "@/hooks/useCodeSync";
import { executeCode, formatResult } from "@/lib/judge0";
import VoicePeer from "@/components/interview/VoicePeer";

interface CandidateDashboardProps {
    candidateName: string;
    role: string;
    roomId: string;
    onExit: () => void;
}

export default function CandidateDashboard({ candidateName, role, roomId, onExit }: CandidateDashboardProps) {
    const [language, setLanguage] = useState<SupportedLanguage>("typescript");
    const [code, setCode] = useState<string>(DEFAULT_CODE["typescript"]);
    const [output, setOutput] = useState<string>("> Environment ready. Good luck with your assessment.");
    const [isRunning, setIsRunning] = useState(false);
    const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "disconnected" | "failed">("connecting");
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [interviewerPeerIdInput, setInterviewerPeerIdInput] = useState("");
    const [connectNowSignal, setConnectNowSignal] = useState(0);

    const { broadcastCode, broadcastLanguage } = useCodeSender();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".candidate-panel", {
                opacity: 0,
                y: 20,
                duration: 0.8,
                stagger: 0.1,
                ease: "power4.out",
            });
        }, containerRef);
        return () => ctx.revert();
    }, []);

    const handleLanguageChange = (newLang: SupportedLanguage) => {
        setLanguage(newLang);
        const newCode = DEFAULT_CODE[newLang];
        setCode(newCode);
        broadcastLanguage(newLang);
        broadcastCode(newCode);
    };

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput("> Compiling...\n> Running...");
        try {
            const result = await executeCode(code, language);
            setOutput(formatResult(result));
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setOutput(`> Error: ${message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const handleHangUp = () => {
        onExit();
    };

    const handlePasteId = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                setInterviewerPeerIdInput(text.trim());
            }
        } catch {
            // clipboard read can fail without permission; ignore silently
        }
    };

    const videoNode = (
        <VoicePeer
            mode="candidate"
            initialInterviewerId=""
            githubAuditContext={{ candidateName, role }}
            micEnabled={isMicOn}
            remotePeerId={interviewerPeerIdInput}
            onRemotePeerIdChange={setInterviewerPeerIdInput}
            connectNowSignal={connectNowSignal}
            showInlineCandidateControls={false}
            onConnectionStateChange={setConnectionState}
        />
    );

    const connectionLabel =
        connectionState === "connected" ? "Connected" :
            connectionState === "connecting" ? "Connecting..." :
                connectionState === "disconnected" ? "Disconnected" :
                    connectionState === "failed" ? "Failed" : "Waiting";

    const connectionColor =
        connectionState === "connected" ? "bg-emerald-500" :
            connectionState === "connecting" ? "bg-amber-500 animate-pulse" :
                "bg-zinc-500";

    return (
        <div ref={containerRef} className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 overflow-hidden font-sans">
            {/* Top Navigation */}
            <nav className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 z-50">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-white dark:text-zinc-900" />
                        </div>
                        <span className="font-bold tracking-tighter text-lg text-zinc-900 dark:text-zinc-100">ARCHITECTURAL SCOUT</span>
                    </div>
                    <div className="h-6 w-px bg-zinc-200 dark:border-zinc-800" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{role}</span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Technical Assessment</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                        <Settings className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleHangUp}
                        className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave
                    </button>
                </div>
            </nav>

            {/* Prominent Candidate Connect Strip */}
            <div className="px-6 pt-4">
                <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-3 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300 whitespace-nowrap">Paste Interviewer ID</span>
                    <input
                        value={interviewerPeerIdInput}
                        onChange={(e) => setInterviewerPeerIdInput(e.target.value)}
                        placeholder="Paste interviewer Peer ID here"
                        className="flex-1 rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-400"
                    />
                    <button
                        type="button"
                        onClick={handlePasteId}
                        className="rounded-md bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-100 hover:bg-zinc-700"
                    >
                        Paste
                    </button>
                    <button
                        type="button"
                        onClick={() => setConnectNowSignal((s) => s + 1)}
                        disabled={!interviewerPeerIdInput.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Connect
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 flex p-4 gap-4 min-h-0">
                {/* Left: Editor Area */}
                <div className="candidate-panel flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Editor
                            </div>
                            {/* Language Selector */}
                            <div className="relative">
                                <select
                                    value={language}
                                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                                    className="appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider rounded-lg pl-3 pr-8 py-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                                >
                                    {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                            </div>
                        </div>
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning}
                            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            <Play className="w-3 h-3 fill-current" />
                            {isRunning ? "Running..." : "Run Code"}
                        </button>
                    </div>

                    <div className="flex-1 min-h-0">
                        <MonacoEditor
                            language={language}
                            value={code}
                            onChange={(val) => {
                                setCode(val);
                                broadcastCode(val);
                            }}
                        />
                    </div>

                    {/* Console */}
                    <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            <Terminal className="w-3 h-3" />
                            Console
                        </div>
                        <div className="bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 font-mono text-[11px] text-zinc-300 border border-zinc-800/50 h-28 overflow-y-auto scrollbar-thin">
                            {output.split('\n').map((line, i) => (
                                <div key={i} className="mb-1">
                                    <span className={line.includes('[PASS]') ? 'text-emerald-400' : ''}>{line}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Video & Controls */}
                <div className="candidate-panel w-80 flex flex-col gap-4">
                    {/* Interviewer Video (Remote / Jitsi Wrapper) */}
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm min-h-[400px]">
                        <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto bg-black shadow-inner">
                            {videoNode}
                        </div>
                        {connectionState !== "connected" && (
                            <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900 z-10">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-lg">
                                        {connectionState === "connecting" ? (
                                            <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                        ) : connectionState === "failed" ? (
                                            <span className="text-xl font-bold text-red-500">!</span>
                                        ) : (
                                            <span className="text-xl font-bold text-zinc-400">AR</span>
                                        )}
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                        {connectionState === "connecting" ? "Joining Call..." :
                                            connectionState === "failed" ? "Connection Failed" : "Waiting"}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="absolute top-3 left-3 z-[15] bg-zinc-900/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border border-white/10">
                            Interviewer
                        </div>
                        <div className="absolute bottom-3 left-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-bold text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                            {candidateName}
                        </div>
                    </div>

                    {/* Call Controls */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={() => setIsMicOn((prev) => !prev)}
                                className={`p-3 rounded-xl border transition-all ${!isMicOn
                                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {!isMicOn ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsCameraOn((prev) => !prev)}
                                className={`p-3 rounded-xl border transition-all ${!isCameraOn
                                    ? "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {!isCameraOn ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                            </button>
                            <button
                                onClick={() => setIsScreenSharing((prev) => !prev)}
                                className={`p-3 rounded-xl border transition-all ${isScreenSharing
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                <Monitor className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="pt-2">
                            <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-widest hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                                Open Chat
                            </button>
                        </div>
                    </div>

                    {/* Screen Sharing Status */}
                    <AnimatePresence>
                        {isScreenSharing && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3"
                            >
                                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.4)]">
                                    <Monitor className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Screen Sharing</p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">You are presenting to everyone</p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Footer */}
            <footer className="h-8 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${connectionColor}`} />
                        {connectionState === "connected" ? (
                            <><Wifi className="w-3 h-3" /> {connectionLabel}</>
                        ) : (
                            <><WifiOff className="w-3 h-3" /> {connectionLabel}</>
                        )}
                    </div>
                </div>
                <div>Secure Session | End-to-End Encrypted</div>
            </footer>
        </div>
    );
}
