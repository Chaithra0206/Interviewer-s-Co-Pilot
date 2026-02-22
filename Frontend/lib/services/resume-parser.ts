const pdfParse = require('pdf-parse') as (dataBuffer: Buffer) => Promise<{ text: string }>;
import { generateObject } from 'ai';
import { z } from 'zod';
import { model, type CandidateContext } from '../ai-orchestrator';

const experienceItemSchema = z.union([
  z.object({
    company: z.string().optional(),
    role: z.string().optional(),
    duration: z.string().optional(),
    highlights: z.array(z.string()).optional(),
  }),
  z.string(),
]);

const educationItemSchema = z.union([
  z.object({
    institution: z.string().optional(),
    degree: z.string().optional(),
    year: z.string().optional(),
  }),
  z.string(),
]);

const resumeSchema = z.object({
  skills: z.array(z.string()).describe('List of technical skills and technologies.').default([]),
  experience: z.array(experienceItemSchema).default([]).describe('Work history and roles.'),
  education: z.array(educationItemSchema).default([]).describe('Educational background.'),
});

export async function parseResume(pdfBuffer: Buffer): Promise<CandidateContext['resume']> {
  console.log('Extracting text from PDF buffer...');

  const result = await pdfParse(pdfBuffer);
  const text = (result.text || '').substring(0, 15000); // Truncate for Cerebras safety

  if (!text || text.trim().length === 0) {
    throw new Error('Could not extract any text from the PDF.');
  }

  console.log('Sending resume text to Cerebras for extraction...');

  const { object: resume } = await generateObject({
    model,
    system:
      'You are an expert recruitment assistant. Extract structured candidate information from the provided resume text. \n\n' +
      'Rules:\n' +
      '1. Return ONLY a JSON object.\n' +
      '2. The keys MUST be exactly: `skills` (string[]), `experience` (object[]), and `education` (object[]).\n' +
      '3. DO NOT include section headers (like "Education" or "Experience") as strings inside the arrays.\n' +
      '4. Each element in `experience` and `education` MUST be an object. If no data exists, return an empty array.\n' +
      '5. Do not include any text outside the JSON object.',
    prompt: `Resume Text to Parse:\n${text}`,
    schema: resumeSchema,
  });

  // Clean up any string entries that Cerebras might have leaked into arrays
  const cleanedResume = {
    ...resume,
    experience: resume.experience.filter((e): e is Exclude<typeof e, string> => typeof e === 'object' && e !== null),
    education: resume.education.filter((e): e is Exclude<typeof e, string> => typeof e === 'object' && e !== null),
  };

  console.log('Cleaned Resume JSON:');
  console.log(JSON.stringify(cleanedResume, null, 2));

  return cleanedResume;
}
