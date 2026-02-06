'use server';
/**
 * @fileOverview An AI agent that acts as a personal tutor.
 *
 * - aiTutor - A function that handles the tutoring process.
 * - AITutorInput - The input type for the aiTutor function.
 * - AITutorOutput - The return type for the aiTutor function.
 */

import { groq, DEFAULT_MODEL } from '@/ai/genkit';

export type AITutorInput = {
  topic: string;
  history: Array<{ role: 'user' | 'model'; content: string }>;
};

export type AITutorOutput = {
  step?: {
    explanation: string;
    question: string;
    options: string[];
  };
  quiz?: {
    title: string;
    questions: Array<{ question: string; answer: string }>;
  };
  isComplete: boolean;
};

export async function aiTutor(input: AITutorInput): Promise<AITutorOutput> {
  const historyMessages = input.history.map((msg) => ({
    role: msg.role === 'model' ? 'assistant' as const : 'user' as const,
    content: msg.content,
  }));

  const systemPrompt = `You are an expert AI Tutor. Your goal is to teach the user about a given topic in a step-by-step, interactive way.

You must break down the topic into small, manageable concepts. For each concept, provide a brief explanation, and then ask a simple question with clear options to check for understanding.

The user wants to learn about: ${input.topic}

Based on the topic and history, determine the next action.
- If the conversation history has more than 5 entries, the lesson has progressed enough for a check-in. Set 'isComplete' to true and generate a short, 3-question quiz in the 'quiz' field to test their knowledge so far. Do not provide a 'step' in this case.
- Otherwise, provide the next lesson explanation, a clear question, and a list of options in the 'step' field. Set 'isComplete' to false.

You MUST respond ONLY with a JSON object in one of these formats:

For a lesson step:
{"step": {"explanation": "...", "question": "...", "options": ["A", "B", "C"]}, "isComplete": false}

For a quiz:
{"quiz": {"title": "...", "questions": [{"question": "...", "answer": "..."}]}, "isComplete": true}`;

  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      ...(historyMessages.length === 0
        ? [{ role: 'user' as const, content: `Teach me about: ${input.topic}. Start with the most fundamental concept.` }]
        : []),
    ],
    temperature: 0.7,
    max_completion_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(content) as AITutorOutput;
}
