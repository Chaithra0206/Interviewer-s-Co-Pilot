'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import CandidateDashboard from "@/components/CandidateDashboard";

function CandidateContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const candidateName = searchParams.get("name") || "Sarah Chen";
    const role = searchParams.get("role") || "Senior Frontend Engineer";

    const handleExit = () => {
        router.push("/");
    };

    return (
        <CandidateDashboard
            candidateName={candidateName}
            role={role}
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
