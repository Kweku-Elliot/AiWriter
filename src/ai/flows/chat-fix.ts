'use server';
/**
 * @fileOverview An AI agent that rewrites a message in different tones.
 *
 * - chatFix - A function that rewrites the message.
 * - ChatFixInput - The input type for the chatFix function.
 * - ChatFixOutput - The return type for the chatFix function.
 */

import { groq, FAST_MODEL } from '@/ai/genkit';

export type ChatFixInput = {
  message: string;
  tone: 'Formal' | 'Friendly' | 'Smart' | 'Emojify' | 'Casual';
};

export type ChatFixOutput = {
  rewrittenMessage: string;
  error?: string;
};

export async function chatFix(input: ChatFixInput): Promise<ChatFixOutput> {
  if (!process.env.GROQ_API_KEY) {
    return { rewrittenMessage: '', error: 'GROQ_API_KEY is not configured on the server.' };
  }

  try {
    const completion = await groq.chat.completions.create({
      model: FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a message rewriting assistant. You must respond ONLY with a JSON object in this exact format: {"rewrittenMessage": "your rewritten message here"}. Do not include any other text.`,
        },
        {
          role: 'user',
          content: `Rewrite the following message in a ${input.tone} tone:\n\n${input.message}`,
        },
      ],
      temperature: 0.7,
      max_completion_tokens: 1024,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '';
    try {
      const parsed = JSON.parse(content);
      if (typeof parsed?.rewrittenMessage === 'string') {
        return { rewrittenMessage: parsed.rewrittenMessage };
      }
      return { rewrittenMessage: '', error: 'AI response was missing the rewritten message.' };
    } catch (parseError) {
      console.error('ChatFix response parse error:', parseError);
      return { rewrittenMessage: '', error: 'Failed to parse AI response.' };
    }
  } catch (error) {
    console.error('ChatFix request error:', error);
    return { rewrittenMessage: '', error: 'AI request failed. Please try again.' };
  }
}
