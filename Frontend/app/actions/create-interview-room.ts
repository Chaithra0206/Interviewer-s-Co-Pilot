'use server';


export interface CreateInterviewRoomResult {
  url: string;
}

export async function createInterviewRoom(): Promise<CreateInterviewRoomResult> {
  // Now using Jitsi, so we just return a unique room name
  return { url: `architectural-scout-${Date.now()}` };
}

