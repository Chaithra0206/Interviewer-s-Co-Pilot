import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import LeftSidebar from "./LeftSidebar";
import CenterWorkspace from "./CenterWorkspace";
import RightPanel from "./RightPanel";
import VoicePeer from "@/components/interview/VoicePeer";
import type { SyncAnalysisResult } from "@/app/actions/sync-analysis";
import { clearInterviewPulse, useInterviewClientState } from "@/lib/state/interview-client-store";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Hand,
  MoreVertical,
  PhoneOff,
  Info,
  Users,
  MessageSquare,
  Triangle,
  Smile,
  Wifi,
  WifiOff
} from "lucide-react";

interface DashboardProps {
  candidateName: string;
  role: string;
  roomId: string;
}

export default function InterviewDashboard({ candidateName, role, roomId }: DashboardProps) {
  const [connectionState, setConnectionState] = useState<"idle" | "connecting" | "connected" | "disconnected" | "failed">("connecting");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [activeSidebar, setActiveSidebar] = useState<"dossier" | "intelligence" | "chat" | null>("dossier");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Sync Analysis state
  const [latestSyncResult, setLatestSyncResult] = useState<SyncAnalysisResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [interviewerPeerId, setInterviewerPeerId] = useState("");
  const interviewClientState = useInterviewClientState();

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".main-stage", {
        opacity: 0,
        scale: 0.98,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(bottomBarRef.current, {
        y: 100,
        duration: 0.8,
        ease: "power4.out",
        delay: 0.5
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const leaveCall = () => {
    window.location.href = "/";
  };

  const handleSyncResult = (result: SyncAnalysisResult) => {
    setIsSyncing(false);
    setLatestSyncResult(result);
    if (result.alert || result.followUpQuestion) {
      setActiveSidebar("intelligence");
    }
  };

  const videoNode = (
    <VoicePeer
      mode="interviewer"
      githubAuditContext={{ candidateName, role }}
      micEnabled={isMicOn}
      onPeerId={setInterviewerPeerId}
      onConnectionStateChange={(next) => {
        setConnectionState(next);
      }}
      onSyncResult={handleSyncResult}
      onListeningChange={setIsSyncing}
    />
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const connectionLabel =
    connectionState === "connected" ? "Connected" :
      connectionState === "connecting" ? "Connecting..." :
        connectionState === "disconnected" ? "Disconnected" :
          connectionState === "failed" ? "Connection Failed" : "Waiting for peer";

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden font-sans">
      {interviewerPeerId && (
        <div className="px-4 pt-4">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Share This Peer ID With Candidate</p>
              <p className="font-mono text-sm text-white break-all">{interviewerPeerId}</p>
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(interviewerPeerId)}
              className="rounded-md bg-emerald-500 px-3 py-2 text-xs font-bold text-zinc-950 hover:bg-emerald-400"
            >
              Copy ID
            </button>
          </div>
        </div>
      )}
      {/* Main Content Area */}
      <main className="flex-1 flex p-4 gap-4 min-h-0 relative">
        {/* Left Sidebar (Candidate Dossier) - Always visible */}
        <div className="w-80 flex-shrink-0">
          <LeftSidebar candidateName={candidateName} role={role} />
        </div>

        {/* Center Workspace (The "Stage") */}
        <div className="flex-1 min-w-0 main-stage flex flex-col gap-4">
          <CenterWorkspace />
        </div>

        {/* Right Sidebar (Video) - Always visible */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
          <RightPanel
            JitsiNode={videoNode}
            connectionState={connectionState}
            candidateName={candidateName}
          />
          {/* New Truth Meter / Analysis UI Overlay */}
          {latestSyncResult && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500" />
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Triangle className="w-3 h-3 text-emerald-500" /> 
                  Intelligence LIVE
                </span>
                {isSyncing && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </h4>
              
              {latestSyncResult.alert && (
                <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest block mb-1">Alert</span>
                  <p className="text-xs text-red-400 font-medium">{latestSyncResult.alert}</p>
                </div>
              )}
              
              {latestSyncResult.followUpQuestion && (
                <div className="px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Drill-Down Question</span>
                  <p className="text-xs text-blue-300 font-medium">{latestSyncResult.followUpQuestion}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Google Meet Style Bottom Bar */}
      <div
        ref={bottomBarRef}
        className="h-20 px-6 flex items-center justify-between bg-zinc-950 z-50"
      >
        {/* Left: Meeting Info + Connection Status */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="text-sm font-medium border-r border-zinc-800 pr-4">
            {currentTime ? formatTime(currentTime) : "--:--"} | {roomId || "tech-assess"}
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${connectionState === "connected" ? "bg-emerald-500" :
              connectionState === "connecting" ? "bg-amber-500 animate-pulse" :
                "bg-zinc-500"
              }`} />
            {connectionState === "connected" ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden lg:inline">{connectionLabel}</span>
          </div>
        </div>

        {/* Center: Primary Controls */}
        <div className="flex items-center gap-3">
          <ControlButton
            active={isMicOn}
            onClick={() => setIsMicOn((prev) => !prev)}
            icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            danger={!isMicOn}
          />
          <ControlButton
            active={isCameraOn}
            onClick={() => setIsCameraOn((prev) => !prev)}
            icon={isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            danger={!isCameraOn}
          />
          <ControlButton icon={<Smile className="w-5 h-5" />} />
          <ControlButton
            active={!isScreenSharing}
            onClick={() => setIsScreenSharing((prev) => !prev)}
            icon={<Monitor className="w-5 h-5" />}
            danger={isScreenSharing}
          />
          <ControlButton icon={<Hand className="w-5 h-5" />} />
          <ControlButton icon={<MoreVertical className="w-5 h-5" />} />

          <button
            onClick={leaveCall}
            className="ml-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center"
          >
            <PhoneOff className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Right: Sidebar Toggles */}
        <div className="flex items-center justify-end gap-2 w-1/4">
          <SidebarToggle
            active={activeSidebar === "dossier"}
            onClick={() => setActiveSidebar(activeSidebar === "dossier" ? null : "dossier")}
            icon={<Info className="w-5 h-5" />}
          />
          <SidebarToggle
            active={false}
            onClick={() => { }}
            icon={<Users className="w-5 h-5" />}
          />
          <SidebarToggle
            active={false}
            onClick={() => { }}
            icon={<MessageSquare className="w-5 h-5" />}
          />
          <div className="relative">
            <SidebarToggle
              active={activeSidebar === "intelligence"}
              onClick={() => {
                const next = activeSidebar === "intelligence" ? null : "intelligence";
                setActiveSidebar(next);
                if (next === "intelligence") {
                  clearInterviewPulse();
                }
              }}
              icon={<Triangle className="w-5 h-5" />}
            />
            {(interviewClientState.issueCount > 0 || latestSyncResult?.alert) && activeSidebar !== "intelligence" && (
              <span className={`absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow shadow-red-500/40 border-2 border-zinc-950 ${interviewClientState.pulseTruthBadge ? "animate-pulse" : ""}`}>
                {interviewClientState.issueCount > 0 ? interviewClientState.issueCount : 1}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  icon,
  active = true,
  danger = false,
  onClick
}: {
  icon: React.ReactNode;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${danger
        ? "bg-red-500 text-white hover:bg-red-600"
        : active
          ? "bg-zinc-800 text-white hover:bg-zinc-700"
          : "bg-zinc-800 text-white hover:bg-zinc-700"
        }`}
    >
      {icon}
    </button>
  );
}

function SidebarToggle({
  icon,
  active,
  onClick
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${active
        ? "text-blue-400"
        : "text-white hover:bg-zinc-800"
        }`}
    >
      {icon}
    </button>
  );
}
