/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Code2, Monitor, Play, Terminal, Settings, ChevronRight, ChevronDown } from "lucide-react";
import MonacoEditor, { LANGUAGE_LABELS, type SupportedLanguage } from "./MonacoEditor";

export default function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState<"compiler" | "screen">("compiler");
  const [language, setLanguage] = useState<SupportedLanguage>("typescript");
  const [output, setOutput] = useState<string>("> System initialized. Ready for evaluation.");

  const handleRunCode = () => {
    setOutput("> Compiling...\n> Running test cases...\n> [PASS] Test Case 1: Basic LRU operations\n> [PASS] Test Case 2: Capacity eviction\n> [PASS] Test Case 3: Key update refresh\n> All tests passed (0.12s)");
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("compiler")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${activeTab === "compiler"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Compiler
          </button>
          <button
            onClick={() => setActiveTab("screen")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold uppercase tracking-wider ${activeTab === "screen"
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Screen
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="appearance-none bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs font-bold uppercase tracking-wider rounded-lg pl-3 pr-8 py-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
            >
              {Object.entries(LANGUAGE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          </div>

          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Syncing
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === "compiler" ? (
            <motion.div
              key="compiler"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 min-h-0">
                <MonacoEditor language={language} />
              </div>

              {/* Console / Controls */}
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <Terminal className="w-3 h-3" />
                    Terminal Output
                  </div>
                  <button
                    onClick={handleRunCode}
                    className="flex items-center gap-2 px-4 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    Run Tests
                  </button>
                </div>
                <div className="bg-zinc-900 dark:bg-zinc-950 rounded-xl p-4 font-mono text-[11px] text-zinc-300 border border-zinc-800/50 shadow-inner h-32 overflow-y-auto scrollbar-thin">
                  {output.split('\n').map((line, i) => (
                    <div key={i} className="flex gap-3 mb-1">
                      <span className="text-zinc-600 select-none">{i + 1}</span>
                      <span className={line.includes('[PASS]') ? 'text-emerald-400' : ''}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"
            >
              <div className="text-center space-y-4 max-w-xs">
                <div className="w-16 h-16 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mx-auto border border-zinc-200 dark:border-zinc-800">
                  <Monitor className="w-8 h-8 text-zinc-300" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Waiting for Screen Share</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    The candidate hasn't started sharing their screen yet. You'll be notified when the stream begins.
                  </p>
                </div>
                <button className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1 mx-auto hover:gap-2 transition-all">
                  Request Access <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
