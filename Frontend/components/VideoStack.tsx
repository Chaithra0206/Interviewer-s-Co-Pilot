/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Mic, MicOff, Video, VideoOff, MoreHorizontal } from "lucide-react";

export default function VideoStack() {
  const interviewerRef = useRef<HTMLDivElement>(null);
  const candidateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from([interviewerRef.current, candidateRef.current], {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });
    }, [interviewerRef, candidateRef]);

    return () => ctx.revert();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3">
      {/* Candidate Video */}
      <div
        ref={candidateRef}
        className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-xl font-bold text-zinc-100">SC</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-medium text-white border border-white/10">
            Sarah Chen
          </div>
          <MicOff className="w-3.5 h-3.5 text-red-400" />
        </div>
      </div>

      {/* Interviewer Video */}
      <div
        ref={interviewerRef}
        className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg"
      >
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
          <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
            <span className="text-sm font-bold text-zinc-500">YOU</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-medium text-white border border-white/10">
            Alex Rivera
          </div>
        </div>
      </div>
    </div>
  );
}
