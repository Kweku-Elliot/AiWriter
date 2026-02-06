'use server';

/**
 * @fileOverview Voice-to-Note AI flow that transcribes and summarizes audio content.
 *
 * - voiceToNote - A function that handles the voice-to-note process.
 * - VoiceToNoteInput - The input type for the voiceToNote function.
 * - VoiceToNoteOutput - The return type for the voiceToNote function.
 */

import { groq, DEFAULT_MODEL } from '@/ai/genkit';

export type VoiceToNoteInput = {
  audioDataUri: string;
};

export type VoiceToNoteOutput = {
  transcription: string;
  plainSummary: string;
  bulletedList: string;
};

export async function voiceToNote(input: VoiceToNoteInput): Promise<VoiceToNoteOutput> {
  // First, use Groq's Whisper model for audio transcription
  // Extract the base64 audio data and mime type from the data URI
  const matches = input.audioDataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid audio data URI format.');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const audioBuffer = Buffer.from(base64Data, 'base64');

  // Determine file extension from mime type
  const extMap: Record<string, string> = {
    'audio/wav': 'wav',
    'audio/webm': 'webm',
    'audio/mp3': 'mp3',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
    'audio/m4a': 'm4a',
    'audio/mp4': 'mp4',
  };
  const ext = extMap[mimeType] || 'wav';

  // Use Groq's Whisper model for transcription
  const file = new File([audioBuffer], `audio.${ext}`, { type: mimeType });
  const transcriptionResult = await groq.audio.transcriptions.create({
    file: file,
    model: 'whisper-large-v3',
    language: 'en',
  });

  const transcription = transcriptionResult.text;

  // Now use LLM to generate summaries from the transcription
  const completion = await groq.chat.completions.create({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a helpful AI assistant. Given a transcription, create two versions of a summary. You must respond ONLY with a JSON object in this exact format:
{"transcription": "the original transcription", "plainSummary": "a concise single paragraph summary", "bulletedList": "- point 1\\n- point 2\\n- point 3"}
Do not include any other text.`,
      },
      {
        role: 'user',
        content: `Here is the transcription to summarize:\n\n${transcription}`,
      },
    ],
    temperature: 0.5,
    max_completion_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(content);
  return {
    transcription: transcription,
    plainSummary: parsed.plainSummary || '',
    bulletedList: parsed.bulletedList || '',
  };
}
