// components/InterviewDashboard.tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import LeftSidebar from "@/components/LeftSidebar";
import CenterWorkspace from "@/components/CenterWorkspace";
import RightPanel from "@/components/RightPanel";

export default function InterviewDashboard() {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const centerPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Slide-in animations from respective sides
      gsap.from(leftPanelRef.current, {
        x: -50,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
      });

      gsap.from(centerPanelRef.current, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
      });

      gsap.from(rightPanelRef.current, {
        x: 50,
        opacity: 0,
        duration: 0.6,
        delay: 0.1,
        ease: "power3.out",
      });
    }, [leftPanelRef, centerPanelRef, rightPanelRef]);

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex h-screen p-4 gap-4">
      {/* Left Sidebar - Candidate Dossier */}
      <div ref={leftPanelRef} className="w-80 flex-shrink-0">
        <LeftSidebar />
      </div>

      {/* Center Workspace - Dynamic Area */}
      <div ref={centerPanelRef} className="flex-1 min-w-0">
        <CenterWorkspace />
      </div>

      {/* Right Panel - Video Stack & Intelligence Feed */}
      <div ref={rightPanelRef} className="w-96 flex-shrink-0">
        <RightPanel />
      </div>
    </div>
  );
}