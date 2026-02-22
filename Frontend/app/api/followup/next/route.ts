import { NextResponse } from 'next/server';
import { z } from 'zod';

import { generateNextFollowup } from '@/app/actions/next-followup';
import { getInterviewState } from '@/lib/state/interview-state';

const requestSchema = z.object({
  candidateId: z.string().trim().min(1),
  selectedPrompt: z.string().trim().min(1),
  action: z.string().trim().min(1),
  forensicContext: z.unknown().optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid payload.', issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const state = getInterviewState(payload.candidateId);
    const transcriptPresent = state.interviewTranscript.trim().length > 0;

    const result = await generateNextFollowup({
      candidateId: payload.candidateId,
      selectedPrompt: payload.selectedPrompt,
      action: payload.action,
      interviewTranscript: state.interviewTranscript,
      forensicContext: payload.forensicContext,
    });

    return NextResponse.json({
      ok: true,
      nextQuestion: result.nextQuestion,
      transcriptPresent,
    });
  } catch (error) {
    console.error('[followup/next] error', error);
    console.error('[followup/next] hint: ensure OPENAI/Cerebras model env is configured and transcript is present');
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
