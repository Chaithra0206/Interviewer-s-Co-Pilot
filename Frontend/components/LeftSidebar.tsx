/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { User, Code, Award, TrendingUp, MapPin, Link as LinkIcon, Brain } from "lucide-react";
import SkillCloud from "./SkillCloud";
import TechDNACard from "./TechDNACard";
import CommitSentiment from "./CommitSentiment";
import IntelligenceFeed from "./IntelligenceFeed";

interface Experience {
  company: string;
  role: string;
  years: string;
  match: string;
}

const EXPERIENCES: Experience[] = [
  { company: "Vercel", role: "Senior Frontend Engineer", years: "2022 - Present", match: "98%" },
  { company: "Stripe", role: "Product Engineer", years: "2019 - 2022", match: "94%" },
  { company: "Linear", role: "Frontend Developer", years: "2017 - 2019", match: "88%" },
];


interface SidebarProps {
  candidateName: string;
  role: string;
  resumeSkills?: string[];
  resumeGaps?: string[];
  followUpQuestions?: string[];
  liveContradiction?: string | null;
  issueCategory?: string | null;
  commitSentimentMatch?: 'aligned' | 'mixed' | 'contradicted' | null;
  commitVibeNote?: string | null;
  onSelectIntelligenceItem?: (payload: { message: string; action: string }) => void;
}

type TabType = "profile" | "intelligence";

export default function LeftSidebar({
  candidateName,
  role,
  resumeSkills,
  resumeGaps,
  followUpQuestions,
  liveContradiction,
  issueCategory,
  commitSentimentMatch,
  commitVibeNote,
  onSelectIntelligenceItem,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  return (
    <aside className="h-full flex flex-col gap-4 overflow-y-auto scrollbar-none pr-1">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${activeTab === "profile"
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab("intelligence")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${activeTab === "intelligence"
            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700"
            : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span>Intelligence</span>
          <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[8px] font-bold uppercase">
            Live
          </span>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "profile" ? (
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700">
                <User className="w-8 h-8 text-zinc-400" />
              </div>
              <div className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                Top 1%
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{candidateName}</h2>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{role}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <LinkIcon className="w-3 h-3" />
                <span className="hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer transition-colors">sarahchen.dev</span>
              </div>
            </div>
          </section>

          {/* Technical DNA */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
                <Code className="w-3 h-3" />
                <span>Technical DNA</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">96% MATCH</span>
            </div>

            <SkillCloud />

            {liveContradiction && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-300">
                  {issueCategory ?? "Savage Gap"}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-red-200">{liveContradiction}</p>
              </div>
            )}
            {resumeSkills && resumeSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {resumeSkills.slice(0, 6).map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-medium border border-zinc-200 dark:border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
            {resumeGaps && resumeGaps.length > 0 && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300">Audit Gaps</p>
                <ul className="mt-1 space-y-1">
                  {resumeGaps.slice(0, 3).map((gap, idx) => (
                    <li key={`${gap}-${idx}`} className="text-[11px] text-amber-200">
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <TechDNACard />
          </section>

          {/* Commit Sentiment */}
          <CommitSentiment
            liveMatch={commitSentimentMatch}
            liveVibeNote={commitVibeNote}
          />

          {/* Experience */}
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
              <Award className="w-3 h-3" />
              <span>Experience</span>
            </h3>

            <div className="space-y-4">
              {EXPERIENCES.map((exp, i) => (
                <div key={i} className="relative pl-4 border-l border-zinc-200 dark:border-zinc-800 group cursor-default">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-zinc-300 dark:bg-zinc-700 group-hover:bg-zinc-900 dark:group-hover:bg-zinc-100 transition-colors" />
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{exp.company}</h4>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{exp.role}</p>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">{exp.years}</p>
                    </div>
                    <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600">{exp.match}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <IntelligenceFeed
          followUpQuestions={followUpQuestions ?? []}
          resumeGaps={resumeGaps ?? []}
          liveContradiction={liveContradiction}
          issueCategory={issueCategory}
          onSelect={onSelectIntelligenceItem}
        />
      )}
    </aside>
  );
}
