// components/LeftSidebar.tsx
import { User, GitBranch, Code, Award, TrendingUp } from "lucide-react";
import SkillCloud from "@/components/SkillCloud";
import CommitSentiment from "@/components/CommitSentiment";

export default function LeftSidebar() {
  return (
    <div className="h-full bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 p-5 flex flex-col gap-5 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      {/* Profile Header */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <User className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Sarah Chen</h2>
          <p className="text-sm text-zinc-400">Senior Frontend Engineer</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Top 5% Match
            </span>
          </div>
        </div>
      </div>

      {/* Technical DNA Overview */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Code className="w-3 h-3" />
              Technical DNA
            </span>
            <span className="text-xs text-emerald-400">92% Match</span>
          </div>
          <SkillCloud />
        </div>

        {/* Key Strengths */}
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Key Strengths</h3>
          <div className="flex flex-wrap gap-2">
            {["React", "TypeScript", "Node.js", "System Design", "GraphQL"].map((skill) => (
              <span
                key={skill}
                className="text-xs bg-zinc-800/80 text-zinc-300 px-2 py-1 rounded-md border border-zinc-700/50"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Commit Sentiment */}
        <CommitSentiment />
      </div>

      {/* Experience Timeline */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
          <Award className="w-3 h-3" />
          Experience
        </h3>
        <div className="space-y-3">
          {[
            { company: "TechCorp", role: "Senior Frontend", years: "2022-Present", match: "98%" },
            { company: "StartupX", role: "Full Stack", years: "2019-2022", match: "87%" },
            { company: "DevStudio", role: "Frontend Dev", years: "2017-2019", match: "82%" },
          ].map((exp, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div>
                <p className="font-medium">{exp.company}</p>
                <p className="text-xs text-zinc-400">{exp.role}</p>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                {exp.match} match
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}