
'use client';
import { useState } from "react";
import Lobby from "@/components/Lobby";
import InterviewDashboard from "@/components/InterviewDashboard";
import CandidateDashboard from "@/components/CandidateDashboard";

type Role = "interviewer" | "candidate";

export default function App() {
  const [session, setSession] = useState<{ 
    active: boolean; 
    candidateName: string; 
    role: string;
    userRole: Role | null;
  }>({
    active: false,
    candidateName: "",
    role: "",
    userRole: null,
  });

  const handleStartSession = (candidateName: string, role: string, userRole: Role = "interviewer") => {
    setSession({
      active: true,
      candidateName,
      role,
      userRole,
    });
  };

  const handleJoinSession = (code: string) => {
    // In a real app, you would fetch the session details using the code
    // For this demo, we'll assume any code joins as the candidate
    setSession({
      active: true,
      candidateName: "Sarah Chen", // Default demo name
      role: "Senior Frontend Engineer", // Default demo role
      userRole: "candidate",
    });
  };

  const handleExit = () => {
    setSession({
      active: false,
      candidateName: "",
      role: "",
      userRole: null,
    });
  };

  return (
    <div className="w-full h-screen">
      {!session.active ? (
        <Lobby 
          onStartSession={(name, role) => handleStartSession(name, role, "interviewer")} 
          onJoinSession={handleJoinSession}
        />
      ) : session.userRole === "interviewer" ? (
        <InterviewDashboard 
          candidateName={session.candidateName} 
          role={session.role} 
        />
      ) : (
        <CandidateDashboard 
          candidateName={session.candidateName}
          role={session.role}
          onExit={handleExit}
        />
      )}
      
      {/* Dev Toggle for Demo Purposes */}
      {!session.active && (
        <div className="fixed bottom-4 right-4 z-[200]">
          <button 
            onClick={() => handleStartSession("Sarah Chen", "Senior Frontend Engineer", "candidate")}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-zinc-200 dark:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all"
          >
            Demo: Join as Candidate
          </button>
        </div>
      )}
    </div>
  );
}
