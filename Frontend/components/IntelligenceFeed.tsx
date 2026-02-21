/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Brain, Clock, Zap, AlertTriangle, Target, Sparkles } from "lucide-react";

type ObservationType = "insight" | "warning" | "match";

interface Observation {
  id: number;
  type: ObservationType;
  message: string;
  action: string;
  timestamp: string;
}

const OBSERVATIONS: Observation[] = [
  {
    id: 1,
    type: "insight",
    message: "Candidate is optimizing for space complexity using a single-pass Map approach.",
    action: "Ask about trade-offs vs Array.indexOf",
    timestamp: "NOW",
  },
  {
    id: 2,
    type: "match",
    message: "Code style perfectly aligns with Vercel's internal engineering standards.",
    action: "High cultural fit indicator",
    timestamp: "2M AGO",
  },
  {
    id: 3,
    type: "warning",
    message: "Potential gap: Resume claims 4 years of Rust, but struggling with basic ownership concepts.",
    action: "Deep dive into memory management",
    timestamp: "5M AGO",
  },
  {
    id: 4,
    type: "insight",
    message: "Using modern ES2024 features (Map.groupBy) - shows continuous learning.",
    action: "Positive technical signal",
    timestamp: "8M AGO",
  },
];

export default function IntelligenceFeed() {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feed-item", {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, feedRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-100">AI Intelligence</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          <Clock className="w-3 h-3" />
          Live Feed
        </div>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-none">
        {OBSERVATIONS.map((obs) => (
          <article key={obs.id} className="feed-item group">
            <div className="flex gap-3">
              <div className="mt-1">
                {obs.type === 'insight' && <Sparkles className="w-3.5 h-3.5 text-zinc-400" />}
                {obs.type === 'match' && <Target className="w-3.5 h-3.5 text-emerald-500" />}
                {obs.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 font-medium">
                  {obs.message}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                    <Zap className="w-2.5 h-2.5 text-zinc-900 dark:text-zinc-100" />
                    <span className="text-[9px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">{obs.action}</span>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-300 dark:text-zinc-600 uppercase">{obs.timestamp}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 h-px bg-zinc-100 dark:bg-zinc-800 group-last:hidden" />
          </article>
        ))}
      </div>
      
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800">
        <button className="w-full py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          View Full Analysis
        </button>
      </div>
    </section>
  );
}
