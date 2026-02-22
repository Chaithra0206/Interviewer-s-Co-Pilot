
import { generateFinalVerdict } from '../lib/ai/consensus-judge';

async function verifyBehavioralCloser() {
    console.log("🧪 Verifying Behavioral Closer Logic (Standalone)...");

    // Mock Context
    const context = {
        candidateId: "kaushik-test",
        resume: {
            name: "Kaushik",
            skills: ["Distributed Systems", "Tailwind CSS", "Express"]
        },
        githubData: [{
            repoUrl: "https://github.com/kaushik/test",
            techStack: ["Node", "Express"],
            patterns: [],
            codeQuality: "Simple Express CRUD app. No concurrency handliing."
        }],
        interviewTranscript: "Candidate says they usually deploy more instances for scaling but doesn't know about distributed locking.",
        redFlags: ["Gap in Concurrency Knowledge"],
        actualApproach: [
            { feature: "Scaling", method: "Redundancy only", observation: "Lacks deep understanding of distributed consistency." }
        ],
        discrepancies: ["Repo shows basic CRUD despite Resume claiming Distributed Systems expertise."],
        jdMatchScore: 60,
        contradictionScore: 40,
        savageVerdict: "Junior-Level Hire"
    };

    try {
        const verdict = await generateFinalVerdict(context as any);
        console.log("\n=== FINAL VERDICT ===");
        console.log("Hire Status:", verdict.hireStatus);
        console.log("Reasoning:", verdict.reasoning);

        if (verdict.behavioralCloser) {
            console.log("\n=== BEHAVIORAL CLOSER ===");
            console.log("Theme:", verdict.behavioralCloser.theme);
            console.log("Question:", verdict.behavioralCloser.behavioralQuestion);
            console.log("Cheat Sheet:", verdict.behavioralCloser.whatToWatchFor);
        } else {
            console.log("\n❌ No Behavioral Closer found.");
        }
    } catch (err) {
        console.error("Error during verification:", err);
    }
}

verifyBehavioralCloser();
