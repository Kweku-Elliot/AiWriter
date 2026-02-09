'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/components/providers/user-provider';
import { CREDIT_COSTS } from '@/lib/constants';
import { runChatFix } from '@/actions/ai';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OutOfCreditsModal } from '@/components/OutOfCreditsModal';
import type { ChatFixOutput } from '@/ai/flows/chat-fix';

const formSchema = z.object({
  message: z.string().min(10, 'Please enter a message of at least 10 characters.'),
  tone: z.enum(['Formal', 'Friendly', 'Smart', 'Emojify', 'Casual']),
});

type FormValues = z.infer<typeof formSchema>;

export default function ChatFixPage() {
  const { toast } = useToast();
  const { credits, deductCredits, addToHistory } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ChatFixOutput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      tone: 'Friendly',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (credits < CREDIT_COSTS.CHAT_FIX) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const output = await runChatFix(data);
      if (output.error) {
        toast({ variant: 'destructive', title: 'Error', description: output.error });
        return;
      }
      const deducted = await deductCredits(CREDIT_COSTS.CHAT_FIX);
      if (deducted) {
        await addToHistory({ type: 'ChatFix', input: data, output });
        toast({ title: 'Success!', description: `${CREDIT_COSTS.CHAT_FIX} credit(s) deducted.` });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Unable to deduct credits.' });
        return;
      }
      setResult(output);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.rewrittenMessage);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <OutOfCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">ChatFix</CardTitle>
          <CardDescription>
            Rewrite your message in the perfect tone. Costs {CREDIT_COSTS.CHAT_FIX} credit per use.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Message</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Type or paste your message here..." {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Choose a Tone</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4 md:grid-cols-3"
                      >
                        {['Formal', 'Friendly', 'Smart', 'Emojify', 'Casual'].map((tone) => (
                          <FormItem key={tone} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={tone} />
                            </FormControl>
                            <FormLabel className="font-normal">{tone}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Rewrite Message
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold font-headline">Result</h2>
        <Card className="flex-grow">
          <CardContent className="p-6">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : result ? (
              <div className="relative">
                <Button variant="ghost" size="icon" className="absolute right-0 top-0" onClick={handleCopy}>
                  <Copy className="h-4 w-4" />
                </Button>
                <p className="whitespace-pre-wrap">{result.rewrittenMessage}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Your rewritten message will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
