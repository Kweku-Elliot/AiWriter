'use server';
/**
 * @fileOverview Generates a summary for a long piece of text.
 *
 * - generateLongSummary - A function that handles the summary generation process.
 * - LongSummaryInput - The input type for the generateLongSummary function.
 * - LongSummaryOutput - The return type for the generateLongSummary function.
 */

import { groq, DEFAULT_MODEL } from '@/ai/genkit';

export type LongSummaryInput = {
  textToSummarize: string;
};

export type LongSummaryOutput = {
  summary: string;
};

export async function generateLongSummary(input: LongSummaryInput): Promise<LongSummaryOutput> {
  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert in summarizing long texts. You must respond ONLY with a JSON object in this exact format: {"summary": "your comprehensive summary here"}. Do not include any other text.`,
      },
      {
        role: 'user',
        content: `Based on the text provided, generate a concise and comprehensive summary.\n\nText to Summarize: ${input.textToSummarize}`,
      },
    ],
    temperature: 0.5,
    max_completion_tokens: 4096,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return { summary: parsed.summary || '' };
}
