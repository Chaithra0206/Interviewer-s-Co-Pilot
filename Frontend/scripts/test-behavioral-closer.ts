
const candidateId = "kaushik-test-123";
const secret = "test-secret-123";

async function testBehavioralCloser() {
    console.log("🧪 Testing Behavioral Closer via InterviewSync Webhook...");

    const payload = {
        candidateId: candidateId,
        githubAuditSummary: "The candidate claims expertise in Distributed Systems, but the repository only contains a simple Express CRUD app. There is a clear gap in concurrency handling and database indexing.",
        chunks: [
            { speaker: "Interviewer", text: "How do you handle scaling in your projects?" },
            { speaker: "Candidate", text: "I usually just deploy more instances of my Express app. I haven't really looked into distributed locking or consistency protocols yet." }
        ]
    };

    try {
        const res = await fetch("http://localhost:3000/api/webhooks/interviewsync", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-interviewsync-secret": secret
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("Response Status:", res.status);
        console.log("Response Body:", JSON.stringify(data, null, 2));

        if (data.finalVerdict && data.finalVerdict.behavioralCloser) {
            console.log("\n✅ SUCCESS: Behavioral Closer generated!");
            console.log("Question:", data.finalVerdict.behavioralCloser.behavioralQuestion);
            console.log("Theme:", data.finalVerdict.behavioralCloser.theme);
            console.log("Watch For:", data.finalVerdict.behavioralCloser.whatToWatchFor);
        } else {
            console.log("\n❌ FAILED: Behavioral Closer missing in response.");
        }
    } catch (err: any) {
        console.error("Error during fetch:", err.message);
    }
}

testBehavioralCloser();
