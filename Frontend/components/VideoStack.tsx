/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
<<<<<<< HEAD
import { VideoOff } from "lucide-react";
import type { ConnectionState } from "@/hooks/useWebRTC";
=======
import { Mic, MicOff, Video, VideoOff, MoreHorizontal } from "lucide-react";
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4

interface VideoStackProps {
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  connectionState: ConnectionState;
  isCameraOn: boolean;
  candidateName: string;
}

export default function VideoStack({
  localVideoRef,
  remoteVideoRef,
  connectionState,
  isCameraOn,
  candidateName,
}: VideoStackProps) {
  const interviewerContainerRef = useRef<HTMLDivElement>(null);
  const candidateContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
<<<<<<< HEAD
      gsap.from(
        [candidateContainerRef.current, interviewerContainerRef.current],
        {
          opacity: 0,
          scale: 0.9,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
        }
      );
    }, [interviewerContainerRef, candidateContainerRef]);
=======
      gsap.from([interviewerRef.current, candidateRef.current], {
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.7)",
      });
    }, [interviewerRef, candidateRef]);
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4

    return () => ctx.revert();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-3">
<<<<<<< HEAD
      {/* Candidate Video (Remote stream for the interviewer) */}
      <div
        ref={candidateContainerRef}
        className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg"
      >
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        />
        {connectionState !== "connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              {connectionState === "connecting" ? (
                <div className="w-6 h-6 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-xl font-bold text-zinc-100">
                  {candidateName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-medium text-white border border-white/10">
            {candidateName}
          </div>
          <div
            className={`w-2 h-2 rounded-full ${connectionState === "connected"
                ? "bg-emerald-500"
                : connectionState === "connecting"
                  ? "bg-amber-500 animate-pulse"
                  : "bg-zinc-500"
              }`}
          />
        </div>
      </div>

      {/* Interviewer Video (Local — You) */}
      <div
        ref={interviewerContainerRef}
        className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 group shadow-lg"
      >
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {!isCameraOn && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
              <VideoOff className="w-5 h-5 text-zinc-500" />
            </div>
=======
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
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
          </div>
        )}

        <div className="absolute bottom-3 left-3">
          <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] font-medium text-white border border-white/10">
<<<<<<< HEAD
            You
=======
            Alex Rivera
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
          </div>
        </div>
      </div>
    </div>
  );
}
