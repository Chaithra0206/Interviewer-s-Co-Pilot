// components/VideoStack.tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";

export default function VideoStack() {
  const interviewerRef = useRef<HTMLDivElement>(null);
  const candidateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from([interviewerRef.current, candidateRef.current], {
        scale: 0.95,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, [interviewerRef, candidateRef]);

    return () => ctx.revert();
  }, []);

  return (
    <div className="space-y-3">
      {/* Interviewer Video */}
      <div ref={interviewerRef} className="relative aspect-video bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800/50 group">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center">
            <span className="text-2xl text-zinc-400">You</span>
          </div>
        </div>
        
        {/* Live Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Name Tag */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm border border-white/10">
          Interviewer (You)
        </div>

        {/* Controls */}
        <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
            <Mic className="w-3 h-3 text-green-400" />
          </button>
          <button className="p-1.5 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/80 transition-colors">
            <Video className="w-3 h-3 text-green-400" />
          </button>
        </div>
      </div>

      {/* Candidate Video */}
      <div ref={candidateRef} className="relative aspect-video bg-zinc-900/80 rounded-xl overflow-hidden border border-zinc-800/50 group">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-600/20 border-2 border-emerald-500/30 flex items-center justify-center">
            <span className="text-2xl text-zinc-400">SC</span>
          </div>
        </div>

        {/* Name Tag */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm border border-white/10">
          Sarah Chen (Candidate)
        </div>

        {/* Muted Indicator */}
        <div className="absolute top-2 right-2 bg-amber-500/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
          <MicOff className="w-3 h-3" />
          Muted
        </div>
      </div>
    </div>
  );
}