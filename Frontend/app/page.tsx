// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import InterviewDashboard from "@/components/InterviewDashboard";

export default function Home() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial page load animation
      gsap.from(mainRef.current, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.inOut",
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <main ref={mainRef} className="h-screen overflow-hidden bg-zinc-950">
      <InterviewDashboard />
    </main>
  );
}