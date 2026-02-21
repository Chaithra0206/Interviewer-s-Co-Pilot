import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import LeftSidebar from "./LeftSidebar";
import CenterWorkspace from "./CenterWorkspace";
import RightPanel from "./RightPanel";
import { useJitsiController } from "@/lib/jitsi-controller";
import { syncAnalysis } from "@/app/actions/sync-analysis";
import type { SyncAnalysisResult } from "@/app/actions/sync-analysis";
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

// --- Speech Recognition Types ---
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: ISpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
  onend: ((this: ISpeechRecognition, ev: Event) => unknown) | null;
}
// --------------------------------

interface DashboardProps {
  candidateName: string;
  role: string;
  roomId: string;
}

export default function InterviewDashboard({ candidateName, role, roomId }: DashboardProps) {
  const {
    JitsiNode,
    connectionState,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveCall,
  } = useJitsiController(roomId);

  const [activeSidebar, setActiveSidebar] = useState<"dossier" | "intelligence" | "chat" | null>("dossier");
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  
  // Speech Recognition state
  const transcriptBuffer = useRef<string>("");
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  // Sync Analysis state
  const [latestSyncResult, setLatestSyncResult] = useState<SyncAnalysisResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

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

  // Initialize SpeechRecognition
  useEffect(() => {
    // Check if SpeechRecognition is supported
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || 
                                 (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognitionAPI() as ISpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }

      // Append finalized chunks to our buffer
      if (finalTranscript) {
        transcriptBuffer.current += finalTranscript;
      }
    };

    recognition.onerror = (event: Event) => {
      console.error("Speech recognition error:", event);
    };

    recognition.onend = () => {
      // If we're meant to be listening, automatically restart
      if (isListening) {
        try {
          recognition.start();
        } catch { /* might already be started */ }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [isListening]);

  // Start/Stop listening based on connection
  useEffect(() => {
    if (connectionState === "connected" && !isListening) {
      setIsListening(true);
      try {
        recognitionRef.current?.start();
      } catch { /* ignore */ }
    } else if (connectionState !== "connected" && isListening) {
      setIsListening(false);
      recognitionRef.current?.stop();
    }
  }, [connectionState, isListening]);

  // Sync Analysis Loop (every 15s)
  useEffect(() => {
    if (!isListening) return;

    const syncTimer = setInterval(async () => {
      const snippet = transcriptBuffer.current.trim();
      if (!snippet) return; // Nothing to analyze

      setIsSyncing(true);
      try {
        // Clear buffer before sending to avoid re-sending the same text while awaiting
        transcriptBuffer.current = "";
        
        // Use a mock githubAuditContext for now, or pass real data if available in state
        const mockAuditContext = { candidateName, role }; 

        const result = await syncAnalysis(snippet, mockAuditContext);
        setLatestSyncResult(result);
        
        if (result.alert || result.followUpQuestion) {
          setActiveSidebar("intelligence"); // Pop open intelligence panel on critical matches
        }
      } catch (err) {
        console.error("Sync Analysis error:", err);
      } finally {
        setIsSyncing(false);
      }
    }, 15000);

    return () => clearInterval(syncTimer);
  }, [isListening, candidateName, role]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const connectionLabel =
    connectionState === "connected" ? "Connected" :
      connectionState === "connecting" ? "Connecting…" :
        connectionState === "disconnected" ? "Disconnected" :
          connectionState === "failed" ? "Connection Failed" : "Waiting for peer";

  return (
    <div ref={containerRef} className="h-screen flex flex-col bg-zinc-950 text-white overflow-hidden font-sans">
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
            JitsiNode={JitsiNode}
            connectionState={connectionState}
            candidateName={candidateName}
          />
          {/* New Truth Meter / Analysis UI Overlay */}
          {latestSyncResult && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-xl">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                <span>Real-Time Sync</span>
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
            onClick={toggleAudio}
            icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            danger={!isMicOn}
          />
          <ControlButton
            active={isCameraOn}
            onClick={toggleVideo}
            icon={isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            danger={!isCameraOn}
          />
          <ControlButton icon={<Smile className="w-5 h-5" />} />
          <ControlButton
            active={!isScreenSharing}
            onClick={toggleScreenShare}
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
          <SidebarToggle
            active={activeSidebar === "intelligence"}
            onClick={() => setActiveSidebar(activeSidebar === "intelligence" ? null : "intelligence")}
            icon={<Triangle className="w-5 h-5" />}
          />
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
