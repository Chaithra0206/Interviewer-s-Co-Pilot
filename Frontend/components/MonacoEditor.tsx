/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Editor from "@monaco-editor/react";

export default function MonacoEditor() {
  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      defaultValue={`/**
 * Architectural Scout - Technical Assessment
 * Problem: LRU Cache Implementation
 */

class LRUCache {
  private capacity: number;
  private cache: Map<number, number>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: number): number {
    if (!this.cache.has(key)) return -1;
    
    // Refresh position
    const val = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key: number, value: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove oldest (first key in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test Suite
const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
console.log(lru.get(1)); // 1
lru.put(3, 3); // evicts key 2
console.log(lru.get(2)); // -1
`}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: "on",
        roundedSelection: true,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 20, bottom: 20 },
        fontFamily: "'JetBrains Mono', monospace",
        cursorStyle: "line",
        cursorBlinking: "smooth",
        smoothScrolling: true,
        contextmenu: false,
        renderLineHighlight: "all",
      }}
    />
  );
}
