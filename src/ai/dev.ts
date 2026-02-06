import { config } from 'dotenv';
config();

// Import all flows to ensure they are registered
import '@/ai/flows/chat-fix';
import '@/ai/flows/ai-tutor';
import '@/ai/flows/resume-cover-letter-generator';
import '@/ai/flows/voice-to-note';
import '@/ai/flows/long-summary-generator';

console.log('Groq AI flows loaded successfully.');
