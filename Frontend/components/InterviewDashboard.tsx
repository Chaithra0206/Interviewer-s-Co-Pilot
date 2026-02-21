import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import LeftSidebar from "./LeftSidebar";
import CenterWorkspace from "./CenterWorkspace";
import RightPanel from "./RightPanel";
<<<<<<< HEAD
import { useWebRTC } from "@/hooks/useWebRTC";
=======
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
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
<<<<<<< HEAD
  Smile,
  Wifi,
  WifiOff
=======
  Smile
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
} from "lucide-react";

interface DashboardProps {
  candidateName: string;
  role: string;
<<<<<<< HEAD
  roomId: string;
}

export default function InterviewDashboard({ candidateName, role, roomId }: DashboardProps) {
  const {
    localVideoRef,
    remoteVideoRef,
    connectionState,
    isMicOn,
    isCameraOn,
    isScreenSharing,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    hangUp,
  } = useWebRTC(roomId);

=======
}

export default function InterviewDashboard({ candidateName, role }: DashboardProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
  const [activeSidebar, setActiveSidebar] = useState<"dossier" | "intelligence" | "chat" | null>("dossier");
  const [currentTime, setCurrentTime] = useState(new Date());

  const containerRef = useRef<HTMLDivElement>(null);
  const bottomBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

<<<<<<< HEAD
  const connectionLabel =
    connectionState === "connected" ? "Connected" :
      connectionState === "connecting" ? "Connecting…" :
        connectionState === "disconnected" ? "Disconnected" :
          connectionState === "failed" ? "Connection Failed" : "Waiting for peer";

=======
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
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

<<<<<<< HEAD
        {/* Right Sidebar (Video) - Always visible */}
        <div className="w-80 flex-shrink-0">
          <RightPanel
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            connectionState={connectionState}
            isCameraOn={isCameraOn}
            candidateName={candidateName}
          />
=======
        {/* Right Sidebar (Intelligence / Video) - Always visible */}
        <div className="w-80 flex-shrink-0">
          <RightPanel />
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
        </div>
      </main>

      {/* Google Meet Style Bottom Bar */}
      <div
        ref={bottomBarRef}
        className="h-20 px-6 flex items-center justify-between bg-zinc-950 z-50"
      >
<<<<<<< HEAD
        {/* Left: Meeting Info + Connection Status */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="text-sm font-medium border-r border-zinc-800 pr-4">
            {formatTime(currentTime)} | {roomId || "tech-assess"}
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
=======
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="text-sm font-medium border-r border-zinc-800 pr-4">
            {formatTime(currentTime)} | tech-assess-402
          </div>
          <div className="text-xs text-zinc-400 font-medium truncate hidden lg:block">
            {candidateName} • {role}
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
          </div>
        </div>

        {/* Center: Primary Controls */}
        <div className="flex items-center gap-3">
          <ControlButton
            active={isMicOn}
<<<<<<< HEAD
            onClick={toggleMic}
=======
            onClick={() => setIsMicOn(!isMicOn)}
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
            icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            danger={!isMicOn}
          />
          <ControlButton
            active={isCameraOn}
<<<<<<< HEAD
            onClick={toggleCamera}
=======
            onClick={() => setIsCameraOn(!isCameraOn)}
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
            icon={isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            danger={!isCameraOn}
          />
          <ControlButton icon={<Smile className="w-5 h-5" />} />
<<<<<<< HEAD
          <ControlButton
            active={!isScreenSharing}
            onClick={isScreenSharing ? stopScreenShare : startScreenShare}
            icon={<Monitor className="w-5 h-5" />}
            danger={isScreenSharing}
          />
          <ControlButton icon={<Hand className="w-5 h-5" />} />
          <ControlButton icon={<MoreVertical className="w-5 h-5" />} />

          <button
            onClick={hangUp}
            className="ml-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center"
          >
=======
          <ControlButton icon={<Monitor className="w-5 h-5" />} />
          <ControlButton icon={<Hand className="w-5 h-5" />} />
          <ControlButton icon={<MoreVertical className="w-5 h-5" />} />

          <button className="ml-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center">
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
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
<<<<<<< HEAD
        ? "bg-red-500 text-white hover:bg-red-600"
        : active
          ? "bg-zinc-800 text-white hover:bg-zinc-700"
          : "bg-zinc-800 text-white hover:bg-zinc-700"
=======
          ? "bg-red-500 text-white hover:bg-red-600"
          : active
            ? "bg-zinc-800 text-white hover:bg-zinc-700"
            : "bg-zinc-800 text-white hover:bg-zinc-700"
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
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
<<<<<<< HEAD
        ? "text-blue-400"
        : "text-white hover:bg-zinc-800"
=======
          ? "text-blue-400"
          : "text-white hover:bg-zinc-800"
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
        }`}
    >
      {icon}
    </button>
  );
}
<<<<<<< HEAD
=======

>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
