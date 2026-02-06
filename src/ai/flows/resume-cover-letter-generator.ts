'use server';
/**
 * @fileOverview Generates a tailored resume and cover letter based on user input.
 *
 * - generateResumeAndCoverLetter - A function that handles the resume and cover letter generation process.
 * - ResumeAndCoverLetterInput - The input type for the generateResumeAndCoverLetter function.
 * - ResumeAndCoverLetterOutput - The return type for the generateResumeAndCoverLetter function.
 */

import { groq, DEFAULT_MODEL } from '@/ai/genkit';

export type ResumeAndCoverLetterInput = {
  userProfile: string;
  jobRole: string;
  experience: string;
};

export type ResumeAndCoverLetterOutput = {
  resume: string;
  coverLetter: string;
};

export async function generateResumeAndCoverLetter(input: ResumeAndCoverLetterInput): Promise<ResumeAndCoverLetterOutput> {
  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert resume and cover letter writer. You must respond ONLY with a JSON object in this exact format: {"resume": "the full resume text", "coverLetter": "the full cover letter text"}. Do not include any other text.`,
      },
      {
        role: 'user',
        content: `Based on the following details, generate a tailored resume and cover letter.

User Profile: ${input.userProfile}
Job Role: ${input.jobRole}
Experience: ${input.experience}

Ensure that the resume and cover letter highlight the user's qualifications and are tailored to the job role.
The output should be professional and well-formatted.`,
      },
    ],
    temperature: 0.7,
    max_completion_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return { resume: parsed.resume || '', coverLetter: parsed.coverLetter || '' };
}
