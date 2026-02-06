'use client';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/components/providers/user-provider';
import { CREDIT_COSTS } from '@/lib/constants';
import { runVoiceToNote } from '@/actions/ai';
import { Loader2, Copy, Mic, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OutOfCreditsModal } from '@/components/OutOfCreditsModal';
import type { VoiceToNoteOutput } from '@/ai/flows/voice-to-note';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type RecordingState = 'idle' | 'recording' | 'processing' | 'done';
type FormatType = 'plain' | 'bulleted';

export default function VoiceNotePage() {
  const { toast } = useToast();
  const { credits, deductCredits, addToHistory } = useUser();
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [result, setResult] = useState<VoiceToNoteOutput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [format, setFormat] = useState<FormatType>('bulleted');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    if (credits < CREDIT_COSTS.VOICE_NOTE) {
      setIsModalOpen(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          processRecording(base64Audio);
        };
      };

      mediaRecorderRef.current.start();
      setRecordingState('recording');
      setResult(null);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('processing');
    }
  };

  const processRecording = async (audioDataUri: string) => {
    setRecordingState('processing');
    try {
      const input = { audioDataUri };
      const output = await runVoiceToNote(input);
      
      const deducted = await deductCredits(CREDIT_COSTS.VOICE_NOTE);

      if (deducted) {
        await addToHistory({ type: 'Voice-to-Note', input: { format: 'both' }, output });
        toast({ title: 'Success!', description: `${CREDIT_COSTS.VOICE_NOTE} credit(s) deducted.` });
      }
      setResult(output);
    } catch (error: any)
    {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Processing Error',
        description: error.message || 'Failed to process audio. Please try again.',
      });
    } finally {
      setRecordingState('done');
    }
  };

  const handleCopy = () => {
    if (result) {
      const textToCopy = format === 'bulleted' ? result.bulletedList : result.plainSummary;
      navigator.clipboard.writeText(textToCopy);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  const handleMainButtonClick = () => {
    if (recordingState === 'recording') {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const getButtonContent = () => {
    switch (recordingState) {
      case 'idle':
        return <><Mic className="mr-2 h-4 w-4" /> Start Recording</>;
      case 'recording':
        return <><Square className="mr-2 h-4 w-4 animate-pulse text-red-500" /> Stop Recording</>;
      case 'processing':
        return <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>;
      case 'done':
        return <><Mic className="mr-2 h-4 w-4" /> Record Again</>;
    }
  };
  
  const displayedContent = result ? (format === 'bulleted' ? result.bulletedList : result.plainSummary) : '';

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <OutOfCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Voice-to-Note</CardTitle>
          <CardDescription>
            Record your thoughts, and the AI will transcribe and summarize them. Costs {CREDIT_COSTS.VOICE_NOTE} credits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
             <Label>Choose a Format</Label>
              <RadioGroup
                value={format}
                onValueChange={(value: any) => setFormat(value)}
                className="grid grid-cols-2 gap-4"
                disabled={recordingState === 'recording' || recordingState === 'processing'}
              >
                <div>
                  <RadioGroupItem value="bulleted" id="bulleted" className="peer sr-only" />
                  <Label
                    htmlFor="bulleted"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Bulleted List
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="plain" id="plain" className="peer sr-only" />
                  <Label
                    htmlFor="plain"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    Plain Summary
                  </Label>
                </div>
              </RadioGroup>
          </div>
           <Button
            onClick={handleMainButtonClick}
            disabled={recordingState === 'processing'}
            className="w-full h-24 text-lg"
            variant={recordingState === 'recording' ? 'destructive' : 'default'}
          >
            {getButtonContent()}
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold font-headline">Result</h2>
        <Card className="flex-grow">
          <CardContent className="p-6">
            {recordingState === 'processing' ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : result ? (
              <div className="relative space-y-4">
                <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <div>
                  <h3 className="font-semibold mb-2">Transcription</h3>
                  <p className="text-sm text-muted-foreground italic">"{result.transcription}"</p>
                </div>
                <hr />
                <div>
                  <h3 className="font-semibold mb-2">
                    {format === 'bulleted' ? 'Bulleted List' : 'Plain Summary'}
                  </h3>
                  <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: displayedContent.replace(/- /g, '&bull; ').replace(/\n/g, '<br />') }} />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-muted-foreground text-center">Your transcribed note will appear here after recording.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
