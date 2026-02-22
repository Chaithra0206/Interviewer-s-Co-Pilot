import { SupportedLanguage } from "@/components/MonacoEditor";

const JUDGE0_API_URL = process.env.NEXT_PUBLIC_JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com";
const JUDGE0_API_KEY = process.env.NEXT_PUBLIC_JUDGE0_API_KEY;

const LANGUAGE_IDS: Record<SupportedLanguage, number> = {
  typescript: 74,
  javascript: 93,
  python: 71,
  java: 91,
  cpp: 54,
  c: 50,
  go: 95,
  rust: 73,
};

export async function executeCode(code: string, language: SupportedLanguage): Promise<any> {
  const languageId = LANGUAGE_IDS[language];

  if (!JUDGE0_API_KEY) {
    // Mock execution if no API key is provided
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          status: { id: 3, description: "Accepted" },
          stdout: "[PASS] Code executed successfully (Mock Mode)\n\nNote: Set NEXT_PUBLIC_JUDGE0_API_KEY in .env to enable real execution.",
          stderr: null,
          compile_output: null, 
          time: "0.045",
          memory: 2048,
        });
      }, 1000);
    });
  }

  const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "x-rapidapi-key": JUDGE0_API_KEY,
    },
    body: JSON.stringify({
      source_code: code,
      language_id: languageId,
      stdin: "",
    }),
  });

  if (!response.ok) {
    throw new Error(`Execution failed: ${response.statusText}`);
  }

  return response.json();
}

export function formatResult(result: any): string {
  if (result.status?.id !== 3) {
    const errorMsg = result.compile_output || result.stderr || result.status?.description || "Execution Failed";
    return `> \u274c Error: ${errorMsg}\n\n`;
  }

  let output = `> \u2705 Execution Successful\n`;
  if (result.time) output += `> Time: ${result.time}s | Memory: ${result.memory}KB\n`;
  output += `> Output:\n${result.stdout || "No output"}`;
  
  return output;
}
