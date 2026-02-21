'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import CandidateDashboard from "@/components/CandidateDashboard";

function CandidateContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const candidateName = searchParams.get("name") || "Sarah Chen";
    const role = searchParams.get("role") || "Senior Frontend Engineer";
<<<<<<< HEAD
    const roomId = searchParams.get("room") || searchParams.get("code") || "default-room";
=======
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4

    const handleExit = () => {
        router.push("/");
    };

    return (
        <CandidateDashboard
            candidateName={candidateName}
            role={role}
<<<<<<< HEAD
            roomId={roomId}
=======
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
            onExit={handleExit}
        />
    );
}

export default function CandidatePage() {
    return (
        <Suspense fallback={<div className="h-screen bg-zinc-950" />}>
            <CandidateContent />
        </Suspense>
    );
}
