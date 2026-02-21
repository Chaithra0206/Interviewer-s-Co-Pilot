import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongodb';
import InterviewTranscript from '@/lib/models/InterviewTranscript';

// API Key for your external interview platform webhook
const WEBHOOK_API_KEY = process.env.WEBHOOK_API_KEY;

export async function POST(req: Request) {
    try {
        // 1. Validate the API Key for security
        const authHeader = req.headers.get('authorization');
        if (!WEBHOOK_API_KEY || authHeader !== `Bearer ${WEBHOOK_API_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse the request body
        const body = await req.json();
        const { sessionId, speaker, text, timestamp } = body;

        if (!sessionId || !speaker || !text) {
            return NextResponse.json(
                { error: 'Missing required fields: sessionId, speaker, or text' },
                { status: 400 }
            );
        }

        if (speaker !== 'candidate' && speaker !== 'interviewer') {
            return NextResponse.json(
                { error: 'Invalid speaker. Must be "candidate" or "interviewer"' },
                { status: 400 }
            );
        }

        // 3. Connect to MongoDB
        await connectToDatabase();

        // 4. Save the document
        // Because we have the Change Stream listener running in the background, 
        // it will automatically pick this up if the speaker is 'candidate'.
        // We don't need to call the AI here. We just drop the data and return 
        // immediately to keep the API ultra-fast.
        const newTranscript = await InterviewTranscript.create({
            sessionId,
            speaker,
            text,
            timestamp: timestamp ? new Date(timestamp) : new Date(),
        });

        return NextResponse.json(
            { success: true, id: newTranscript._id },
            { status: 201 }
        );

    } catch (error) {
        console.error('[Transcript Webhook Error]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
