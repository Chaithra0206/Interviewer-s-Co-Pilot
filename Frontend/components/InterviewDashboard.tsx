import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import LeftSidebar from "./LeftSidebar";
import CenterWorkspace from "./CenterWorkspace";
import RightPanel from "./RightPanel";
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
  Smile
} from "lucide-react";

interface DashboardProps {
  candidateName: string;
  role: string;
}

export default function InterviewDashboard({ candidateName, role }: DashboardProps) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
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

        {/* Right Sidebar (Intelligence / Video) - Always visible */}
        <div className="w-80 flex-shrink-0">
          <RightPanel />
        </div>
      </main>

      {/* Google Meet Style Bottom Bar */}
      <div
        ref={bottomBarRef}
        className="h-20 px-6 flex items-center justify-between bg-zinc-950 z-50"
      >
        {/* Left: Meeting Info */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="text-sm font-medium border-r border-zinc-800 pr-4">
            {formatTime(currentTime)} | tech-assess-402
          </div>
          <div className="text-xs text-zinc-400 font-medium truncate hidden lg:block">
            {candidateName} • {role}
          </div>
        </div>

        {/* Center: Primary Controls */}
        <div className="flex items-center gap-3">
          <ControlButton
            active={isMicOn}
            onClick={() => setIsMicOn(!isMicOn)}
            icon={isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            danger={!isMicOn}
          />
          <ControlButton
            active={isCameraOn}
            onClick={() => setIsCameraOn(!isCameraOn)}
            icon={isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            danger={!isCameraOn}
          />
          <ControlButton icon={<Smile className="w-5 h-5" />} />
          <ControlButton icon={<Monitor className="w-5 h-5" />} />
          <ControlButton icon={<Hand className="w-5 h-5" />} />
          <ControlButton icon={<MoreVertical className="w-5 h-5" />} />

          <button className="ml-2 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors flex items-center justify-center">
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

