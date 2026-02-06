'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useUser } from '@/components/providers/user-provider';
import { CREDIT_COSTS } from '@/lib/constants';
import { runAITutor, AITutorOutput } from '@/actions/ai';
import { Loader2, Send, Sparkles, Bot, RefreshCw, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { OutOfCreditsModal } from '@/components/OutOfCreditsModal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const formSchema = z.object({
  topic: z.string().min(2, 'Please enter a topic.'),
});
type FormValues = z.infer<typeof formSchema>;

type Message = {
  role: 'user' | 'model';
  content: string;
};

type Step = NonNullable<AITutorOutput['step']>;
type Quiz = NonNullable<AITutorOutput['quiz']>;


export default function AiTutorPage() {
  const { toast } = useToast();
  const { credits, deductCredits, addToHistory, plan } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [topic, setTopic] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: '' },
  });
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [conversation, currentStep, currentQuiz]);


  const startTutorSession = async (values: FormValues) => {
    if (credits < CREDIT_COSTS.AI_TUTOR) {
      setIsModalOpen(true);
      return;
    }
    setIsLoading(true);
    setTopic(values.topic);
    resetSessionState();

    try {
      const input = { topic: values.topic, history: [] };
      const output = await runAITutor(input);
      handleAIOutput(output, values.topic);
      
      const deducted = await deductCredits(CREDIT_COSTS.AI_TUTOR);
      if (deducted && plan !== 'Free') {
        await addToHistory({ type: 'AI Tutor', input: { topic: values.topic }, output });
      }

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      setTopic(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = async (option: string) => {
    if (!topic || isLoading) return;
    
    if (credits < CREDIT_COSTS.AI_TUTOR) {
      setIsModalOpen(true);
      return;
    }
    
    setIsLoading(true);

    const newConversation: Message[] = [
        ...conversation,
        { role: 'model', content: currentStep?.explanation || '' },
        { role: 'model', content: currentStep?.question || '' },
        { role: 'user', content: option }
    ];
    setConversation(newConversation);
    setCurrentStep(null);
    
    try {
      const input = { topic, history: newConversation };
      const output = await runAITutor(input);
      
      handleAIOutput(output, topic);
      const deducted = await deductCredits(CREDIT_COSTS.AI_TUTOR);
      if (deducted && plan !== 'Free') {
        await addToHistory({ type: 'AI Tutor', input: { topic: topic, answer: option }, output });
      }
      
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAIOutput = (output: AITutorOutput, topic: string) => {
      if (output.isComplete && output.quiz) {
        setIsComplete(true);
        setCurrentQuiz(output.quiz);
        setConversation(prev => [...prev, {role: 'model', content: `Great job! You've completed the lesson on ${topic}. Here's a short quiz to test your knowledge.`}]);
      } else if (output.step) {
        setCurrentStep(output.step);
      }
  };

  const resetSession = () => {
    setTopic(null);
    resetSessionState();
    form.reset();
  };
  
  const resetSessionState = () => {
    setConversation([]);
    setCurrentStep(null);
    setCurrentQuiz(null);
    setIsComplete(false);
    setShowAnswers(false);
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none">
        <div className="flex flex-col h-full min-h-[calc(100vh-8rem)]">
          <OutOfCreditsModal open={isModalOpen} onOpenChange={setIsModalOpen} />
          
          {!topic ? (
            <div className="flex items-center justify-center flex-grow">
              <Card className="w-full max-w-lg">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2"><Sparkles className="text-primary"/> AI Tutor</CardTitle>
                  <CardDescription>
                    What would you like to learn about today? Enter a topic to start your personalized lesson.
                  </CardDescription>
                </CardHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(startTutorSession)}>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="e.g., How do neural networks work?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                    <CardFooter>
                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Start Learning
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </Card>
            </div>
          ) : (
            <Card className="flex-grow flex flex-col">
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                <div className="w-full">
                  <CardTitle className="font-headline text-2xl">Learning: {topic}</CardTitle>
                  <CardDescription>Follow the AI tutor's prompts to learn step-by-step.</CardDescription>
                </div>
                <Button variant="outline" onClick={resetSession} className="w-full md:w-auto flex-shrink-0"><RefreshCw className="mr-2 h-4 w-4" /> New Topic</Button>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
                 <ScrollArea className="flex-grow pr-4 -mr-4" ref={scrollAreaRef}>
                    <div className="space-y-4">
                      {conversation.map((msg, index) => (
                         <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'model' && <AvatarFor role="model" />}
                            <div className={`rounded-lg px-4 py-2 max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            </div>
                         </div>
                      ))}
                      {currentStep && (
                        <div className="flex items-start gap-3 justify-start">
                          <AvatarFor role="model" />
                          <div className="rounded-lg px-4 py-2 max-w-[90%] md:max-w-[80%] bg-muted space-y-3">
                             <p className="text-sm whitespace-pre-wrap break-words">{currentStep.explanation}</p>
                             <p className="text-sm font-semibold whitespace-pre-wrap break-words">{currentStep.question}</p>
                          </div>
                        </div>
                      )}
                      {currentQuiz && (
                        <div className="flex items-start gap-3 justify-start">
                            <AvatarFor role="model" />
                            <div className="rounded-lg p-4 max-w-[90%] md:max-w-[80%] bg-muted space-y-4 w-full">
                                <h3 className="font-bold text-lg">{currentQuiz.title}</h3>
                                <Accordion type="single" collapsible className="w-full">
                                    {currentQuiz.questions.map((q, i) => (
                                        <AccordionItem value={`item-${i}`} key={i}>
                                            <AccordionTrigger>{q.question}</AccordionTrigger>
                                            <AccordionContent className="text-primary font-semibold">
                                                {showAnswers ? q.answer : "Click 'Show Answers' to reveal."}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                                 <Button onClick={() => setShowAnswers(!showAnswers)} size="sm" variant="outline">
                                    {showAnswers ? 'Hide Answers' : 'Show Answers'}
                                </Button>
                            </div>
                        </div>
                      )}
                       {isLoading && !currentStep && !isComplete && (
                         <div className="flex items-start gap-3 justify-start">
                           <AvatarFor role="model" />
                           <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted flex items-center">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                           </div>
                         </div>
                       )}
                    </div>
                </ScrollArea>
                 {currentStep && !isLoading && (
                  <div className="flex gap-2 flex-wrap justify-center pt-4 border-t">
                    {currentStep.options.map(option => (
                      <Button key={option} onClick={() => handleOptionClick(option)} disabled={isLoading} size="sm">
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                 {isComplete && (
                     <div className="flex justify-center pt-4 border-t">
                        <Button onClick={resetSession}><RefreshCw className="mr-2 h-4 w-4" /> Start a New Topic</Button>
                     </div>
                 )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <div className="text-center bg-background/80 p-8 rounded-lg shadow-lg">
              <Lock className="h-12 w-12 mx-auto text-primary" />
              <h2 className="mt-6 text-2xl font-bold font-headline">Coming Soon</h2>
              <p className="mt-2 text-muted-foreground">The AI Tutor feature is currently under development.</p>
          </div>
      </div>
    </div>
  );
}

const AvatarFor = ({role}: {role: 'user' | 'model'}) => (
    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-secondary flex-shrink-0">
        {role === 'model' ? <Bot className="h-5 w-5 text-secondary-foreground" /> : null}
    </div>
)
