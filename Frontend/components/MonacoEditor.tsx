"use client";

import Editor from "@monaco-editor/react";

export default function MonacoEditor() {
  return (
    <Editor
      height="100%"
      defaultLanguage="typescript"
      defaultValue={`// Welcome to the interview compiler
// Write your solution here

function twoSum(nums: number[], target: number): number[] {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

// Test the function
const result = twoSum([2, 7, 11, 15], 9);
console.log(result); // Expected: [0, 1]
`}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: "on",
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        fontFamily: "JetBrains Mono, Fira Code, monospace",
      }}
    />
  );
}