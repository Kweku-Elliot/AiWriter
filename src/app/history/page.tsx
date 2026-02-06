'use client';

import { useUser } from '@/components/providers/user-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function HistoryPage() {
  const { user, plan, history } = useUser();
  const isSubscriber = plan === 'Pro' || plan === 'Premium+';

  if (!user || !isSubscriber) {
    return (
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-3 w-fit">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl mt-4">History is a Premium Feature</CardTitle>
          <CardDescription>
            Upgrade to a Pro or Premium+ plan to access your generation history. If you have a plan, please sign in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={user ? "/pricing" : "/new-login"}>{user ? "View Plans" : "Sign In"}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
     <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">History</h1>
        <p className="text-muted-foreground">Review your past generations.</p>
      </div>
        {history.length > 0 ? (
           <Accordion type="single" collapsible className="w-full">
            {history.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={item.id}>
                    <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span>{item.type}</span>
                            <span className="text-sm text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-4 p-4 bg-muted/50 rounded-md">
                            <div>
                                <h4 className="font-semibold">Input:</h4>
                                <pre className="text-sm whitespace-pre-wrap font-sans mt-1 p-2 bg-background rounded">
                                    {JSON.stringify(item.input, null, 2)}
                                </pre>
                            </div>
                             <div>
                                <h4 className="font-semibold">Output:</h4>
                                <pre className="text-sm whitespace-pre-wrap font-sans mt-1 p-2 bg-background rounded">
                                    {JSON.stringify(item.output, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
           </Accordion>
        ) : (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    You have no history yet. Start creating content to see it here.
                </CardContent>
            </Card>
        )}
     </div>
  );
}
