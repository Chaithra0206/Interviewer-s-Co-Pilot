/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import Editor from "@monaco-editor/react";

export type SupportedLanguage = "typescript" | "javascript" | "python" | "java" | "cpp" | "c" | "go" | "rust";

interface MonacoEditorProps {
  language?: SupportedLanguage;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}

const DEFAULT_CODE: Record<SupportedLanguage, string> = {
  typescript: `

function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}

// Test
const result = twoSum([2, 7, 11, 15], 9);
console.log(result); // [0, 1]

const result2 = twoSum([3, 2, 4], 6);
console.log(result2); // [1, 2]
`,
  javascript: `

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

// Test
const lru = new LRUCache(2);
lru.put(1, 1);
lru.put(2, 2);
console.log(lru.get(1)); // 1
`,
  python: `
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = OrderedDict()

    def get(self, key: int) -> int:
        if key not in self.cache:
            return -1
        self.cache.move_to_end(key)
        return self.cache[key]

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = value
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

# Test
lru = LRUCache(2)
lru.put(1, 1)
lru.put(2, 2)
print(lru.get(1))  # 1
lru.put(3, 3)      # evicts key 2
print(lru.get(2))  # -1
`,
  java: `
import java.util.LinkedHashMap;
import java.util.Map;

class LRUCache extends LinkedHashMap<Integer, Integer> {
    private int capacity;

    public LRUCache(int capacity) {
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    public int get(int key) {
        return super.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        super.put(key, value);
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
        return size() > capacity;
    }

    public static void main(String[] args) {
        LRUCache lru = new LRUCache(2);
        lru.put(1, 1);
        lru.put(2, 2);
        System.out.println(lru.get(1)); // 1
        lru.put(3, 3);
        System.out.println(lru.get(2)); // -1
    }
}
`,
  cpp: `

#include <unordered_map>
#include <list>
#include <iostream>
using namespace std;

class LRUCache {
    int capacity;
    list<pair<int, int>> cache;
    unordered_map<int, list<pair<int, int>>::iterator> map;

public:
    LRUCache(int capacity) : capacity(capacity) {}

    int get(int key) {
        if (map.find(key) == map.end()) return -1;
        cache.splice(cache.begin(), cache, map[key]);
        return map[key]->second;
    }

    void put(int key, int value) {
        if (map.find(key) != map.end()) {
            cache.splice(cache.begin(), cache, map[key]);
            map[key]->second = value;
            return;
        }
        if (cache.size() == capacity) {
            map.erase(cache.back().first);
            cache.pop_back();
        }
        cache.push_front({key, value});
        map[key] = cache.begin();
    }
};

int main() {
    LRUCache lru(2);
    lru.put(1, 1);
    lru.put(2, 2);
    cout << lru.get(1) << endl; // 1
    lru.put(3, 3);
    cout << lru.get(2) << endl; // -1
    return 0;
}
`,
  c: `/**
 * Architectural Scout - Technical Assessment
 * Problem: Two Sum (C Implementation)
 */

#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    int* result = (int*)malloc(2 * sizeof(int));
    *returnSize = 2;
    
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    return result;
}

int main() {
    int nums[] = {2, 7, 11, 15};
    int target = 9;
    int returnSize;
    int* result = twoSum(nums, 4, target, &returnSize);
    printf("[%d, %d]\\n", result[0], result[1]); // [0, 1]
    free(result);
    return 0;
}
`,
  go: `

package main

import (
    "container/list"
    "fmt"
)

type LRUCache struct {
    capacity int
    cache    map[int]*list.Element
    list     *list.List
}

type entry struct {
    key, value int
}

func Constructor(capacity int) LRUCache {
    return LRUCache{
        capacity: capacity,
        cache:    make(map[int]*list.Element),
        list:     list.New(),
    }
}

func (c *LRUCache) Get(key int) int {
    if el, ok := c.cache[key]; ok {
        c.list.MoveToFront(el)
        return el.Value.(*entry).value
    }
    return -1
}

func (c *LRUCache) Put(key, value int) {
    if el, ok := c.cache[key]; ok {
        c.list.MoveToFront(el)
        el.Value.(*entry).value = value
        return
    }
    if c.list.Len() == c.capacity {
        back := c.list.Back()
        c.list.Remove(back)
        delete(c.cache, back.Value.(*entry).key)
    }
    el := c.list.PushFront(&entry{key, value})
    c.cache[key] = el
}

func main() {
    lru := Constructor(2)
    lru.Put(1, 1)
    lru.Put(2, 2)
    fmt.Println(lru.Get(1)) // 1
    lru.Put(3, 3)
    fmt.Println(lru.Get(2)) // -1
}
`,
  rust: `

use std::collections::HashMap;

struct LRUCache {
    capacity: usize,
    cache: HashMap<i32, i32>,
    order: Vec<i32>,
}

impl LRUCache {
    fn new(capacity: i32) -> Self {
        LRUCache {
            capacity: capacity as usize,
            cache: HashMap::new(),
            order: Vec::new(),
        }
    }

    fn get(&mut self, key: i32) -> i32 {
        if let Some(&val) = self.cache.get(&key) {
            self.order.retain(|&k| k != key);
            self.order.push(key);
            val
        } else {
            -1
        }
    }

    fn put(&mut self, key: i32, value: i32) {
        if self.cache.contains_key(&key) {
            self.order.retain(|&k| k != key);
        } else if self.cache.len() >= self.capacity {
            let oldest = self.order.remove(0);
            self.cache.remove(&oldest);
        }
        self.cache.insert(key, value);
        self.order.push(key);
    }
}

fn main() {
    let mut lru = LRUCache::new(2);
    lru.put(1, 1);
    lru.put(2, 2);
    println!("{}", lru.get(1)); // 1
    lru.put(3, 3);
    println!("{}", lru.get(2)); // -1
}
`,
};

const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  typescript: "TypeScript",
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
  c: "C",
  go: "Go",
  rust: "Rust",
};

// Map our language keys to Monaco language IDs
const MONACO_LANGUAGE: Record<SupportedLanguage, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  java: "java",
  cpp: "cpp",
  c: "c",
  go: "go",
  rust: "rust",
};

export { LANGUAGE_LABELS, DEFAULT_CODE };

export default function MonacoEditor({ language = "typescript", value, onChange, readOnly = false }: MonacoEditorProps) {
  const displayValue = value !== undefined ? value : DEFAULT_CODE[language];

  return (
    <Editor
      height="100%"
      language={MONACO_LANGUAGE[language]}
      value={displayValue}
      theme="vs-dark"
      onChange={(val) => onChange?.(val ?? "")}
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
        readOnly,
      }}
    />
  );
}
