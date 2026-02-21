// components/CenterWorkspace.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Monitor, Play, Terminal } from "lucide-react";
import MonacoEditor from "@/components/MonacoEditor";

export default function CenterWorkspace() {
  const [activeTab, setActiveTab] = useState<"compiler" | "screen">("compiler");
  const [output, setOutput] = useState<string>("// Console output will appear here\n> Ready to run code...");

  const handleRunCode = () => {
    setOutput("> Running code...\n> Hello, World!\n> Execution completed in 0.23s");
  };

  return (
    <div className="h-full flex flex-col bg-zinc-900/50 backdrop-blur-sm rounded-2xl border border-zinc-800/50 overflow-hidden">
      {/* Tab Bar */}
      <div className="flex items-center gap-1 p-2 border-b border-zinc-800/50">
        <button
          onClick={() => setActiveTab("compiler")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "compiler"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span className="text-sm font-medium">Compiler</span>
        </button>
        <button
          onClick={() => setActiveTab("screen")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === "screen"
              ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              : "text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">Screen Share</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 p-4">
        <AnimatePresence mode="wait">
          {activeTab === "compiler" ? (
            <motion.div
              key="compiler"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col gap-4"
            >
              {/* Editor */}
              <div className="flex-1 rounded-lg overflow-hidden border border-zinc-800/50">
                <MonacoEditor />
              </div>

              {/* Controls & Output */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleRunCode}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <Play className="w-4 h-4" />
                    Run Code
                  </button>
                </div>

                {/* Output Console */}
                <div className="bg-zinc-950/50 rounded-lg border border-zinc-800/50 p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-zinc-400">
                    <Terminal className="w-3 h-3" />
                    <span>Console Output</span>
                  </div>
                  <pre className="font-mono text-xs text-zinc-300 whitespace-pre-wrap">
                    {output}
                  </pre>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center bg-zinc-950/50 rounded-lg border border-zinc-800/50"
            >
              <div className="text-center">
                <Monitor className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">Candidate's screen share will appear here</p>
                <p className="text-xs text-zinc-600 mt-1">Waiting for candidate to start sharing...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}