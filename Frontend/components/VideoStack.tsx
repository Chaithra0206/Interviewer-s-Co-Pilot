/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";


interface VideoStackProps {
  JitsiNode: React.ReactNode;
  connectionState: string;
  candidateName: string;
}

export default function VideoStack({
  JitsiNode,
  connectionState,
  candidateName,
}: VideoStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (containerRef.current) {
        gsap.from(containerRef.current, {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          ease: "back.out(1.7)",
        });
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div
        className="relative flex-1 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg min-h-[400px]"
      >
        <div className="absolute inset-0 w-full h-full z-0 pointer-events-auto shadow-inner bg-black">
          {JitsiNode}
        </div>
        
        {connectionState !== "connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 z-10">
            <div className="w-16 h-16 rounded-3xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-lg">
              {connectionState === "connecting" ? (
                <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              ) : connectionState === "failed" ? (
                <span className="text-xl font-bold text-red-500">!</span>
              ) : (
                <span className="text-xl font-bold text-zinc-100">
                  {candidateName
                    ? candidateName.split(" ").map((n) => n[0]).join("")
                    : "AR"}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
