'use server';

/**
 * @fileOverview Dynamically selects between fast and powerful Groq models based on task requirements.
 *
 * - smartLoadBalancing - A function that handles the selection of the appropriate AI model.
 * - SmartLoadBalancingInput - The input type for the smartLoadBalancing function.
 * - SmartLoadBalancingOutput - The return type for the smartLoadBalancing function.
 */

import { groq, FAST_MODEL } from '@/ai/genkit';

export type SmartLoadBalancingInput = {
  taskDescription: string;
  inputData: string;
};

export type SmartLoadBalancingOutput = {
  selectedModel: 'fast' | 'powerful';
  reason: string;
};

export async function smartLoadBalancing(input: SmartLoadBalancingInput): Promise<SmartLoadBalancingOutput> {
  const completion = await groq.chat.completions.create({
    model: FAST_MODEL,
    messages: [
      {
        role: 'system',
        content: `Given a task description and input data, determine whether the fast model (llama-3.1-8b-instant) or powerful model (llama-3.3-70b-versatile) is more appropriate. Consider the fast model for simple tasks, speed and cost. Consider the powerful model for complex reasoning, long text generation, or tasks requiring high accuracy.

You must respond ONLY with a JSON object in this exact format:
{"selectedModel": "fast or powerful", "reason": "reasoning for the selection"}`,
      },
      {
        role: 'user',
        content: `Task Description: ${input.taskDescription}\nInput Data: ${input.inputData}`,
      },
    ],
    temperature: 0.3,
    max_completion_tokens: 512,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(content) as SmartLoadBalancingOutput;
}
