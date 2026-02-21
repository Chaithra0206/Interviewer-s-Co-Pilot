// components/IntelligenceFeed.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Zap, AlertCircle, CheckCircle, Brain, Clock } from "lucide-react";

const observations = [
  {
    id: 1,
    type: "insight",
    icon: Brain,
    color: "blue",
    message: "Candidate is using a Hash Map approach - matches their LeetCode pattern history",
    action: "Suggest asking about time complexity O(n) vs O(n²)",
    timestamp: "Just now",
  },
  {
    id: 2,
    type: "match",
    icon: CheckCircle,
    color: "emerald",
    message: "React hooks usage pattern matches their 5 years of React experience",
    action: "Deep dive into custom hooks implementation",
    timestamp: "2m ago",
  },
  {
    id: 3,
    type: "warning",
    icon: AlertCircle,
    color: "amber",
    message: "Contradiction: Resume mentions GraphQL expertise but struggling with schema design",
    action: "Ask about specific GraphQL projects",
    timestamp: "5m ago",
  },
  {
    id: 4,
    type: "insight",
    icon: Zap,
    color: "blue",
    message: "Using modern ES6+ features - aligns with senior level expectation",
    action: "Good sign for frontend role",
    timestamp: "8m ago",
  },
];

export default function IntelligenceFeed() {
  const [items] = useState(observations);
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".observation-item", {
        x: 20,
        opacity: 0,
        duration: 0.4,
        stagger: 0.1,
        ease: "power2.out",
      });
    }, feedRef);

    return () => ctx.revert();
  }, []);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="flex-1 bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-4 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          AI Intelligence Feed
        </h3>
        <span className="text-xs text-zinc-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Live
        </span>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent pr-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="observation-item bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30 hover:border-zinc-700/50 transition-colors"
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg ${getColorClasses(item.color)}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {item.action}
                    </span>
                    <span className="text-xs text-zinc-500">{item.timestamp}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}