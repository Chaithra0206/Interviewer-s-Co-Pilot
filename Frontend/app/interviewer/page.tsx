'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import InterviewDashboard from "@/components/InterviewDashboard";

function InterviewerContent() {
    const searchParams = useSearchParams();
    const candidateName = searchParams.get("name") || "Sarah Chen";
    const role = searchParams.get("role") || "Senior Frontend Engineer";
<<<<<<< HEAD
    const roomId = searchParams.get("room") || "default-room";

    return (
        <InterviewDashboard
            candidateName={candidateName}
            role={role}
            roomId={roomId}
        />
=======

    return (
        <InterviewDashboard candidateName={candidateName} role={role} />
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
    );
}

export default function InterviewerPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-zinc-950" />}>
            <InterviewerContent />
        </Suspense>
    );
}
