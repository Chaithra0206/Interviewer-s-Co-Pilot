import { executeCode, formatResult } from "../lib/judge0";

async function testJudge0() {
  console.log("Testing Judge0 Code Execution (Mock Mode)...");
  
  const code = "print('Hello, Judge0!')";
  const language = "python";
  
  try {
    const result = await executeCode(code, language);
    console.log("Raw Result:", JSON.stringify(result, null, 2));
    
    const formatted = formatResult(result);
    console.log("\nFormatted Output:\n", formatted);
    
    if (formatted.includes("Mock Mode")) {
      console.log("\nSUCCESS: Mock mode detected and handled correctly.");
    } else {
      console.log("\nWARNING: Mock mode not explicitly confirmed in output.");
    }
  } catch (error) {
    console.error("Test Failed:", error);
  }
}

testJudge0();
