'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/components/providers/user-provider';
import { CREDIT_COSTS } from '@/lib/constants';
import { runResumeGenerator } from '@/actions/ai';
import { Loader2, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OutOfCreditsModal } from '@/components/OutOfCreditsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ResumeAndCoverLetterOutput } from '@/ai/flows/resume-cover-letter-generator';
import jsPDF from 'jspdf';

const formSchema = z.object({
  userProfile: z.string().min(20, 'Please provide more details about your profile.'),
  jobRole: z.string().min(5, 'Please specify a job role.'),
  experience: z.string().min(20, 'Please provide more details about your experience.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ResumeGeneratorPage() {
  const { toast } = useToast();
  const { credits, deductCredits, addToHistory, plan } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResumeAndCoverLetterOutput | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isProUser = plan === 'Pro' || plan === 'Premium+';

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userProfile: '',
      jobRole: '',
      experience: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (credits < CREDIT_COSTS.RESUME_GENERATOR) {
      setIsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const output = await runResumeGenerator(data);
      const deducted = await deductCredits(CREDIT_COSTS.RESUME_GENERATOR);
      if (deducted) {
        await addToHistory({ type: 'Resume/Cover Letter', input: data, output });
        toast({ title: 'Success!', description: `${CREDIT_COSTS.RESUME_GENERATOR} credit(s) deducted.` });
      }
      setResult(output);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard!' });
  };
  
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <OutOfCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Resume & Cover Letter Generator</CardTitle>
          <CardDescription>
            Input your details to generate a professional resume and cover letter. Costs {CREDIT_COSTS.RESUME_GENERATOR} credits.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="userProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Profile</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Highly motivated software engineer with 5 years of experience in full-stack development..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Job Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Experience</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your past roles, responsibilities, and achievements..."
                        {...field}
                        rows={6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Documents
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold font-headline">Generated Documents</h2>
        <Tabs defaultValue="resume" className="flex-grow">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="coverLetter">Cover Letter</TabsTrigger>
          </TabsList>
          <Card className="mt-2 flex-grow">
            <TabsContent value="resume" className="m-0">
              <ResultCard
                content={result?.resume}
                onCopy={() => handleCopy(result?.resume || '')}
                isProUser={isProUser}
                isLoading={isLoading}
                placeholder="Your generated resume will appear here."
                fileName="resume.pdf"
              />
            </TabsContent>
            <TabsContent value="coverLetter" className="m-0">
              <ResultCard
                content={result?.coverLetter}
                onCopy={() => handleCopy(result?.coverLetter || '')}
                isProUser={isProUser}
                isLoading={isLoading}
                placeholder="Your generated cover letter will appear here."
                fileName="cover-letter.pdf"
              />
            </TabsContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}

interface ResultCardProps {
    content?: string;
    onCopy: () => void;
    isProUser: boolean;
    isLoading: boolean;
    placeholder: string;
    fileName: string;
}

function ResultCard({ content, onCopy, isProUser, isLoading, placeholder, fileName }: ResultCardProps) {
    const { toast } = useToast();

    const handleDownloadPdf = () => {
        if (!content) return;
        try {
            const doc = new jsPDF();
            
            // Set properties
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(11);
            
            // Add content
            const splitText = doc.splitTextToSize(content, 180); // 180mm width
            doc.text(splitText, 15, 20); // x=15, y=20
            
            doc.save(fileName);
            toast({ title: "Success!", description: "Your PDF has started downloading." });
        } catch(error) {
            console.error("Error generating PDF:", error);
            toast({ variant: "destructive", title: "PDF Error", description: "Could not generate PDF." });
        }
    };

  return (
    <CardContent className="p-6 relative">
       {isLoading ? (
        <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        ) : content ? (
        <>
            <div className="absolute right-2 top-2 flex gap-1">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" disabled={!isProUser} onClick={handleDownloadPdf}>
                                <Download className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        {!isProUser && <TooltipContent><p>Upgrade to Pro for PDF export.</p></TooltipContent>}
                    </Tooltip>
                </TooltipProvider>
                <Button variant="ghost" size="icon" onClick={onCopy}>
                    <Copy className="h-4 w-4" />
                </Button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm">{content}</pre>
        </>
        ) : (
            <p className="text-muted-foreground h-64 flex items-center justify-center">{placeholder}</p>
        )}
    </CardContent>
  );
}
