'use client';

import { useRouter } from "next/navigation";
import Lobby from "@/components/Lobby";

export default function Home() {
  const router = useRouter();

  const handleStartSession = (candidateName: string, role: string) => {
    // Store session info and navigate to interviewer dashboard
    const params = new URLSearchParams({ name: candidateName, role });
    router.push(`/interviewer?${params.toString()}`);
  };

  const handleJoinSession = (code: string) => {
    // Navigate to candidate dashboard
    router.push(`/candidate?code=${encodeURIComponent(code)}`);
  };

  return (
    <div className="w-full h-screen">
      <Lobby
        onStartSession={handleStartSession}
        onJoinSession={handleJoinSession}
      />

      
    </div>
  );
}
