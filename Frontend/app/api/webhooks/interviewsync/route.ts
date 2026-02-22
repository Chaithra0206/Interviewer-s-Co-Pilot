/**
 * InterviewSync Webhook — POST /api/webhooks/interviewsync
 *
 * Receives live transcript chunks from the InterviewSync platform,
 * validates the shared secret, persists to SQLite, and triggers a
 * "Re-evaluate" cycle on the Gap Detection agent.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { runPartialInterviewAnalysis } from '@/app/actions/partial-interview-analysis';
import { generateFinalVerdict } from '@/lib/ai/consensus-judge';
import { getInitialContext } from '@/lib/ai-orchestrator';
import {
    appendTranscriptChunks,
    getInterviewState,
    savePartialAnalysisResult,
} from '@/lib/state/interview-state';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const INTERVIEWSYNC_SECRET = process.env.INTERVIEWSYNC_SECRET ?? '';

const chunkSchema = z.object({
    speaker: z.string().trim().min(1, 'speaker is required'),
    text: z.string().trim().min(1, 'text is required'),
    timestamp: z.coerce.number().default(Date.now()),
});

const payloadSchema = z.object({
    candidateId: z.string().trim().min(1, 'candidateId is required'),
    chunk: chunkSchema.optional(),
    chunks: z.array(chunkSchema).optional(),
    githubAuditSummary: z.string().optional(),
}).superRefine((val, ctx) => {
    if (!val.chunk && (!val.chunks || val.chunks.length === 0)) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Either "chunk" or "chunks" must be provided.',
            path: ['chunk'],
        });
    }
});

type Payload = z.infer<typeof payloadSchema>;
type Chunk = z.infer<typeof chunkSchema>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise payload into an array of chunks regardless of input shape. */
function normaliseChunks(payload: Payload): Chunk[] {
    if (payload.chunk) return [payload.chunk];
    return payload.chunks ?? [];
}

/**
 * Validate the shared secret sent in the `x-interviewsync-secret` header.
 * Returns an error response if invalid, or `null` if the secret is correct.
 */
function validateSecret(request: Request): NextResponse | null {
    if (!INTERVIEWSYNC_SECRET) {
        console.warn(
            '[interviewsync] INTERVIEWSYNC_SECRET is not set — skipping auth check in dev.',
        );
        return null; // Allow in dev when secret is not configured
    }

    const provided = request.headers.get('x-interviewsync-secret') ?? '';
    if (provided !== INTERVIEWSYNC_SECRET) {
        return NextResponse.json(
            { ok: false, error: 'Unauthorized: invalid or missing secret.' },
            { status: 401 },
        );
    }
    return null;
}

// ---------------------------------------------------------------------------
// Re-evaluate trigger — fires the Gap Detection agent
// ---------------------------------------------------------------------------

/**
 * Trigger a re-evaluation cycle: fetch the full transcript from SQLite,
 * run the gap-detection partial analysis, and persist the results.
 */
async function triggerReEvaluate(
    candidateId: string,
    githubAuditSummary: string,
): Promise<{
    triggered: boolean;
    newRedFlags: string[];
    allRedFlags: string[];
    reasoningSummary: string;
}> {
    const prevState = getInterviewState(candidateId);

    // Build transcript from memory
    const transcript = prevState.transcriptChunks.map(c => `${c.speaker}: ${c.text}`).join('\n');

    if (!transcript || !githubAuditSummary) {
        return {
            triggered: false,
            newRedFlags: [],
            allRedFlags: [],
            reasoningSummary: 'Skipped: insufficient data for analysis.',
        };
    }


    const analysis = await runPartialInterviewAnalysis({
        candidateId,
        githubAuditSummary,
        interviewTranscript: transcript,
        existingRedFlags: prevState.redFlags,
    });

    // Detect newly-surfaced red flags
    const previousSet = new Set(prevState.redFlags.map((f) => f.toLowerCase()));
    const newRedFlags = analysis.redFlags.filter(
        (f) => !previousSet.has(f.toLowerCase()),
    );

    // Persist to in-memory state (same store the existing webhook uses)
    const updatedState = savePartialAnalysisResult(
        candidateId,
        analysis.redFlags,
        analysis.reasoningSummary,
    );

    return {
        triggered: true,
        newRedFlags,
        allRedFlags: updatedState.redFlags,
        reasoningSummary: analysis.reasoningSummary,
    };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<NextResponse> {
    // 1. Authenticate
    const authError = validateSecret(request);
    if (authError) return authError;

    try {
        // 2. Parse & validate
        const body = await request.json();
        const parsed = payloadSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { ok: false, error: 'Invalid payload.', issues: parsed.error.issues },
                { status: 400 },
            );
        }

        const payload = parsed.data;
        const chunks = normaliseChunks(payload);



        // 4. Also sync to in-memory state (so existing interview route stays consistent)
        appendTranscriptChunks(
            payload.candidateId,
            chunks.map((c) => ({ speaker: c.speaker, text: c.text })),
            payload.githubAuditSummary,
        );

        // 5. Trigger "Re-evaluate" — Gap Detection agent
        const auditSummary =
            payload.githubAuditSummary ??
            getInterviewState(payload.candidateId).githubAuditSummary;

        const evaluation = await triggerReEvaluate(
            payload.candidateId,
            auditSummary,
        );

        // 6. Trigger "Final Verdict" — Consensus Judge (Step 7 Blueprint)
        let finalVerdict = null;
        const currentState = getInterviewState(payload.candidateId);
        const transcript = currentState.transcriptChunks.map(c => `${c.speaker}: ${c.text}`).join('\n');

        if (transcript && auditSummary) {
            // Build mock context merging Github Summary into the schema expected by the Judge
            const contextForJudge = {
                ...getInitialContext(),
                interviewTranscript: transcript,
                redFlags: evaluation.allRedFlags,
                githubData: [{
                    techStack: [],
                    patterns: [],
                    codeQuality: auditSummary
                }] // Inject GitHub Audit summary into codeQuality as a text blob
            };

            finalVerdict = await generateFinalVerdict(contextForJudge);
            console.log(`[Consensus Judge] ${payload.candidateId} Final Verdict:`, finalVerdict.hireStatus);
        }

        const totalChunks = currentState.transcriptChunks.length;

        // 7. Respond
        return NextResponse.json({
            ok: true,
            candidateId: payload.candidateId,
            chunksReceived: chunks.length,
            totalChunksStored: totalChunks,
            reEvaluation: {
                triggered: evaluation.triggered,
                newRedFlags: evaluation.newRedFlags,
                allRedFlags: evaluation.allRedFlags,
                reasoningSummary: evaluation.reasoningSummary,
            },
            finalVerdict: finalVerdict
                ? {
                    hireStatus: finalVerdict.hireStatus,
                    behavioralDNA: finalVerdict.behavioralDNA,
                    reasoning: finalVerdict.reasoning,
                    behavioralCloser: finalVerdict.behavioralCloser,
                }
                : null
        });
    } catch (error) {
        console.error('[interviewsync] Webhook error:', error);
        return NextResponse.json(
            { ok: false, error: 'Internal server error.' },
            { status: 500 },
        );
    }
}
