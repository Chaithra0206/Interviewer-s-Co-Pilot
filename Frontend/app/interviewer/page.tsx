'use client';

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import InterviewDashboard from "@/components/InterviewDashboard";

function InterviewerContent() {
    const searchParams = useSearchParams();
    const candidateName = searchParams.get("name") || "Sarah Chen";
    const role = searchParams.get("role") || "Senior Frontend Engineer";
    const roomId = "interview";

    return (
        <InterviewDashboard
            candidateName={candidateName}
            role={role}
            roomId={roomId}
        />
    );
}

export default function InterviewerPage() {
    return (
        <Suspense fallback={<div className="h-screen bg-zinc-950" />}>
            <InterviewerContent />
        </Suspense>
    );
}
