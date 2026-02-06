'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/components/providers/user-provider';
import { CREDIT_COSTS } from '@/lib/constants';
import { runLongSummaryGenerator } from '@/actions/ai';
import { Loader2, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OutOfCreditsModal } from '@/components/OutOfCreditsModal';
import type { LongSummaryOutput } from '@/ai/flows/long-summary-generator';

const formSchema = z.object({
  textToSummarize: z.string().min(100, 'Please enter text of at least 100 characters to summarize.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function LongSummaryPage() {
  const { toast } = useToast();
  const { credits, deductCredits, addToHistory } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LongSummaryOutput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      textToSummarize: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (credits < CREDIT_COSTS.LONG_SUMMARY) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const output = await runLongSummaryGenerator(data);
      const deducted = await deductCredits(CREDIT_COSTS.LONG_SUMMARY);
      if (deducted) {
        await addToHistory({ type: 'Long Summary', input: data, output });
        toast({ title: 'Success!', description: `${CREDIT_COSTS.LONG_SUMMARY} credit(s) deducted.` });
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
      navigator.clipboard.writeText(result.summary);
      toast({ title: 'Copied to clipboard!' });
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <OutOfCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Long Summary Generator</CardTitle>
          <CardDescription>
            Paste in a long piece of text to get a concise summary. Costs {CREDIT_COSTS.LONG_SUMMARY} credits.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="textToSummarize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text to Summarize</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste your article, paper, or document here..." {...field} rows={15} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Summary
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
                <p className="whitespace-pre-wrap">{result.summary}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">Your generated summary will appear here.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
