// components/CommitSentiment.tsx
import { GitBranch, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

export default function CommitSentiment() {
  const repos = [
    {
      name: "frontend-app",
      commits: 234,
      sentiment: "positive",
      quality: 95,
      trend: "up",
    },
    {
      name: "api-service",
      commits: 156,
      sentiment: "positive",
      quality: 88,
      trend: "up",
    },
    {
      name: "legacy-system",
      commits: 45,
      sentiment: "neutral",
      quality: 65,
      trend: "down",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-1">
        <GitBranch className="w-3 h-3" />
        Commit Sentiment
      </h3>
      <div className="space-y-2">
        {repos.map((repo, i) => (
          <div key={i} className="bg-zinc-800/30 rounded-lg p-3 border border-zinc-700/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{repo.name}</span>
              <div className="flex items-center gap-1">
                {repo.trend === "up" ? (
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-amber-400" />
                )}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    repo.sentiment === "positive"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}
                >
                  {repo.sentiment}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>{repo.commits} commits</span>
              <div className="flex items-center gap-1">
                <span>Quality: {repo.quality}%</span>
                {repo.quality < 70 && (
                  <AlertCircle className="w-3 h-3 text-amber-400" />
                )}
              </div>
            </div>
            <div className="mt-2 h-1 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  repo.quality > 80 ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${repo.quality}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}