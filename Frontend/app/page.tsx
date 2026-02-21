'use client';

import { useRouter } from "next/navigation";
import Lobby from "@/components/Lobby";

export default function Home() {
  const router = useRouter();

<<<<<<< HEAD
  const handleStartSession = (candidateName: string, role: string, meetingId: string) => {
    const params = new URLSearchParams({ name: candidateName, role, room: meetingId });
=======
  const handleStartSession = (candidateName: string, role: string) => {
    // Store session info and navigate to interviewer dashboard
    const params = new URLSearchParams({ name: candidateName, role });
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
    router.push(`/interviewer?${params.toString()}`);
  };

  const handleJoinSession = (code: string) => {
<<<<<<< HEAD
    router.push(`/candidate?room=${encodeURIComponent(code)}`);
=======
    // Navigate to candidate dashboard
    router.push(`/candidate?code=${encodeURIComponent(code)}`);
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
  };

  return (
    <div className="w-full h-screen">
      <Lobby
        onStartSession={handleStartSession}
        onJoinSession={handleJoinSession}
      />
<<<<<<< HEAD
=======

      
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
    </div>
  );
}
