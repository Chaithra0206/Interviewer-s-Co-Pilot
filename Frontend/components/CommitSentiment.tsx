/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { GitBranch, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Minus } from "lucide-react";

type SentimentType = 'positive' | 'neutral' | 'negative';
type TrendType = 'up' | 'down' | 'stable';

interface Repository {
  name: string;
  commits: number;
  sentiment: SentimentType;
  quality: number;
  trend: TrendType;
}

const REPOSITORIES: Repository[] = [
  {
    name: "architectural-scout-ui",
    commits: 142,
    sentiment: "positive",
    quality: 96,
    trend: "up",
  },
  {
    name: "core-engine-api",
    commits: 89,
    sentiment: "positive",
    quality: 92,
    trend: "up",
  },
  {
    name: "legacy-auth-service",
    commits: 24,
    sentiment: "neutral",
    quality: 68,
    trend: "down",
  },
];

export default function CommitSentiment() {
  return (
    <section className="space-y-3">
      <h3 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.1em] flex items-center gap-1.5">
        <GitBranch className="w-3 h-3" />
        <span>Commit Sentiment</span>
      </h3>
      
      <div className="space-y-2">
        {REPOSITORIES.map((repo, index) => (
          <RepositoryCard key={`${repo.name}-${index}`} repository={repo} />
        ))}
      </div>
    </section>
  );
}

function RepositoryCard({ repository }: { repository: Repository, key?: React.Key }) {
  const { name, commits, sentiment, quality, trend } = repository;
  
  return (
    <article className="bg-white dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate pr-2">{name}</h4>
        <div className="flex items-center gap-1.5">
          {trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-zinc-400" />}
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
            sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
          }`}>
            {sentiment}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
        <span>{commits} commits</span>
        <div className="flex items-center gap-1">
          <span className="font-medium text-zinc-900 dark:text-zinc-100">{quality}%</span>
          {quality > 90 ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
        </div>
      </div>

      <div className="mt-2.5 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out ${quality > 90 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-zinc-400 dark:bg-zinc-600'}`}
          style={{ width: `${quality}%` }}
        />
      </div>
    </article>
  );
}
