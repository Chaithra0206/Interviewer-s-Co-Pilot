/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
<<<<<<< HEAD
import {
  LayoutGrid,
  Plus,
  Copy,
  Check,
=======
import { 
  LayoutGrid, 
  Plus, 
  Copy, 
  Check, 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
  Link as LinkIcon,
  Video,
  Keyboard,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";

interface LobbyProps {
<<<<<<< HEAD
  onStartSession: (candidateName: string, role: string, meetingId: string) => void;
=======
  onStartSession: (candidateName: string, role: string) => void;
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
  onJoinSession: (code: string) => void;
}

export default function Lobby({ onStartSession, onJoinSession }: LobbyProps) {
  const [candidateName, setCandidateName] = useState("");
  const [role, setRole] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [meetingId] = useState(() => Math.random().toString(36).substring(2, 11).match(/.{1,3}/g)?.join('-').toUpperCase() || "ABC-DEFG-HIJ");
<<<<<<< HEAD

=======
  
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(leftRef.current, {
        x: -40,
        opacity: 0,
        duration: 1,
        ease: "power4.out"
      });
<<<<<<< HEAD

=======
      
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
      gsap.from(rightRef.current, {
        x: 40,
        opacity: 0,
        duration: 1,
        delay: 0.2,
        ease: "power4.out"
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (candidateName && role) {
      setIsGenerated(true);
    }
  };

  const handleCopy = () => {
    const url = `${window.location.origin}/join/${meetingId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-black overflow-hidden">
      {/* Top Nav */}
      <nav className="h-16 px-6 flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white dark:text-zinc-900" />
          </div>
          <span className="font-bold tracking-tighter text-lg text-zinc-900 dark:text-zinc-100">ARCHITECTURAL SCOUT</span>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
          <span className="hidden sm:inline">2:42 PM • Sat, Feb 21</span>
          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800" />
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center px-6 lg:px-24 gap-12 lg:gap-24">
        {/* Left Content */}
        <div ref={leftRef} className="flex-1 max-w-xl space-y-8 py-12">
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1]">
              Engineering Interviews  <br />
              <span className="text-zinc-400">Built for Fairness and Depth</span>
            </h1>
            <p className="text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
              We re-engineered the technical assessment experience to be more secure, intelligent, and professional.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
<<<<<<< HEAD
            <button
=======
            <button 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-zinc-900/10"
            >
              <Video className="w-5 h-5" />
              New meeting
            </button>
<<<<<<< HEAD

            <div className="w-full sm:w-auto flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 transition-all">
              <Keyboard className="w-5 h-5 text-zinc-400" />
              <input
                type="text"
=======
            
            <div className="w-full sm:w-auto flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 transition-all">
              <Keyboard className="w-5 h-5 text-zinc-400" />
              <input 
                type="text" 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                placeholder="Enter a code or link"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-sm font-medium w-full sm:w-40"
              />
            </div>
<<<<<<< HEAD
            <button
=======
            <button 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
              onClick={() => joinCode && onJoinSession(joinCode)}
              className="text-zinc-400 font-bold text-sm hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors px-4"
            >
              Join
            </button>
          </div>

<<<<<<< HEAD

=======
          
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
        </div>

        {/* Right Visual */}
        <div ref={rightRef} className="flex-1 w-full max-w-2xl">
          <div className="relative aspect-[4/3] rounded-[40px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl group">
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/10 to-transparent" />
<<<<<<< HEAD

=======
            
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
            {/* Mock UI Elements */}
            <div className="absolute top-8 left-8 right-8 bottom-8 flex flex-col gap-4">
              <div className="h-12 w-48 bg-white/50 dark:bg-zinc-800/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-zinc-700/30" />
              <div className="flex-1 flex gap-4">
                <div className="flex-1 bg-white/50 dark:bg-zinc-800/50 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-zinc-700/30" />
                <div className="w-32 bg-white/50 dark:bg-zinc-800/50 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-zinc-700/30" />
              </div>
              <div className="h-16 bg-white/50 dark:bg-zinc-800/50 rounded-xl backdrop-blur-sm border border-white/20 dark:border-zinc-700/30" />
            </div>

            {/* Floating Badge */}
            <div className="absolute bottom-12 left-12 right-12 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl transform group-hover:scale-[1.02] transition-transform duration-500">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Get a link you can share</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Click <span className="font-bold text-zinc-900 dark:text-zinc-100">New meeting</span> to get a link you can send to people you want to interview.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Meeting Modal Overlay */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
<<<<<<< HEAD
          <div
=======
          <div 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
            className="absolute inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
            <div className="p-8">
              {!isGenerated ? (
                <form onSubmit={handleGenerate} className="space-y-6">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Create new meeting</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Enter the candidate details to generate a secure war room link.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Candidate Name</label>
<<<<<<< HEAD
                      <input
                        type="text"
=======
                      <input 
                        type="text" 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                        required
                        value={candidateName}
                        onChange={(e) => setCandidateName(e.target.value)}
                        placeholder="e.g. Sarah Chen"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Target Role</label>
<<<<<<< HEAD
                      <input
                        type="text"
=======
                      <input 
                        type="text" 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        placeholder="e.g. Senior Frontend Engineer"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
                      />
                    </div>
                  </div>

<<<<<<< HEAD
                  <button
=======
                  <button 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                    type="submit"
                    className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Generate Link
                  </button>
                </form>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Here's your meeting link</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Copy this link and send it to {candidateName}.</p>
                  </div>

                  <div className="flex items-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <LinkIcon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm font-mono text-zinc-500 truncate flex-1">
                      {window.location.origin}/join/{meetingId}
                    </span>
<<<<<<< HEAD
                    <button
=======
                    <button 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                      onClick={handleCopy}
                      className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />}
                    </button>
                  </div>

                  <div className="space-y-3">
<<<<<<< HEAD
                    <button
                      onClick={() => onStartSession(candidateName, role, meetingId)}
=======
                    <button 
                      onClick={() => onStartSession(candidateName, role)}
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                      className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl py-4 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                    >
                      Start Session
                      <ArrowRight className="w-4 h-4" />
                    </button>
<<<<<<< HEAD
                    <button
=======
                    <button 
>>>>>>> 95535ce4d0d6f9d6bbd465dc08a2173caee37eb4
                      onClick={() => {
                        setIsGenerated(false);
                        setShowCreateModal(false);
                      }}
                      className="w-full py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

