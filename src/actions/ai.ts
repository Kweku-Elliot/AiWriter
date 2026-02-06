'use server';
import { chatFix, ChatFixInput, ChatFixOutput } from '@/ai/flows/chat-fix';
import {
  generateResumeAndCoverLetter,
  ResumeAndCoverLetterInput,
  ResumeAndCoverLetterOutput,
} from '@/ai/flows/resume-cover-letter-generator';
import { voiceToNote, VoiceToNoteInput, VoiceToNoteOutput } from '@/ai/flows/voice-to-note';
import { aiTutor, AITutorInput, AITutorOutput } from '@/ai/flows/ai-tutor';
import {
  generateLongSummary,
  LongSummaryInput,
  LongSummaryOutput,
} from '@/ai/flows/long-summary-generator';

export async function runChatFix(input: ChatFixInput): Promise<ChatFixOutput> {
  try {
    const result = await chatFix(input);
    return result;
  } catch (error) {
    console.error('Error in runChatFix:', error);
    throw new Error('Failed to rewrite message. Please try again.');
  }
}

export async function runResumeGenerator(input: ResumeAndCoverLetterInput): Promise<ResumeAndCoverLetterOutput> {
  try {
    const result = await generateResumeAndCoverLetter(input);
    return result;
  } catch (error) {
    console.error('Error in runResumeGenerator:', error);
    throw new Error('Failed to generate documents. Please try again.');
  }
}

export async function runVoiceToNote(input: VoiceToNoteInput): Promise<VoiceToNoteOutput> {
  try {
    const result = await voiceToNote(input);
    return result;
  } catch (error) {
    console.error('Error in runVoiceToNote:', error);
    if (error instanceof Error && error.message.includes('media')) {
       throw new Error('Audio processing failed. Please ensure the audio format is correct.');
    }
    throw new Error('Failed to process voice note. Please try again.');
  }
}

export async function runAITutor(input: AITutorInput): Promise<AITutorOutput> {
  try {
    const result = await aiTutor(input);
    return result;
  } catch (error) {
    console.error('Error in runAITutor:', error);
    throw new Error('Failed to get response from tutor. Please try again.');
  }
}

export async function runLongSummaryGenerator(input: LongSummaryInput): Promise<LongSummaryOutput> {
  try {
    const result = await generateLongSummary(input);
    return result;
  } catch (error) {
    console.error('Error in runLongSummaryGenerator:', error);
    throw new Error('Failed to generate summary. Please try again.');
  }
}
