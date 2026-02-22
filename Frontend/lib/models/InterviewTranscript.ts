interface InterviewTranscriptInput {
  sessionId: string;
  speaker: 'candidate' | 'interviewer';
  text: string;
  timestamp: Date;
}

interface InterviewTranscriptRecord extends InterviewTranscriptInput {
  _id: string;
}

const transcriptStore: InterviewTranscriptRecord[] = [];

const InterviewTranscript = {
  async create(input: InterviewTranscriptInput): Promise<InterviewTranscriptRecord> {
    const record: InterviewTranscriptRecord = {
      ...input,
      _id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    transcriptStore.push(record);
    return record;
  },
};

export default InterviewTranscript;

