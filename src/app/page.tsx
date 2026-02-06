'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, MessageSquarePlus, Mic, ArrowRight, Library, GraduationCap } from 'lucide-react';

export default function DashboardPage() {
  const features = [
    {
      title: 'ChatFix',
      description: 'Rewrite messages with the perfect tone. Switch between formal, friendly, concise, or even emoji-rich styles. Ideal for texting, emails, and DMs.',
      icon: <MessageSquarePlus className="h-8 w-8 text-primary" />,
      href: '/chat-fix',
      cta: 'Start Rewriting',
    },
    {
      title: 'Resume & Cover Letter',
      description: 'Build professional documents in minutes. Generate job-winning resumes and cover letters tailored to your skills and goals.',
      icon: <FileText className="h-8 w-8 text-primary" />,
      href: '/resume-generator',
      cta: 'Create Documents',
    },
    {
      title: 'Voice-to-Note',
      description: 'Transcribe and summarize audio effortlessly. Perfect for lectures, meetings, or quick thoughts. Turn speech into organized, editable notes.',
      icon: <Mic className="h-8 w-8 text-primary" />,
      href: '/voice-note',
      cta: 'Transcribe Audio',
    },
     {
      title: 'AI Tutor',
      description: 'Learn anything with an interactive AI tutor. Master complex topics with personalized, step-by-step guidance that adapts to your knowledge.',
      icon: <GraduationCap className="h-8 w-8 text-primary" />,
      href: '/ai-tutor',
      cta: 'Start Learning',
    },
    {
      title: 'Long Summary',
      description: 'Summarize articles, reports, or any long text. Paste large content and get a clean, concise summary instantly.',
      icon: <Library className="h-8 w-8 text-primary" />,
      href: '/long-summary',
      cta: 'Summarize Text',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
        <p className="text-muted-foreground">
         Welcome to WryLyt — your all-in-one AI writing and voice assistant. From resumes to voice notes, we've got your productivity covered.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center gap-4">
                {feature.icon}
                <CardTitle className="font-headline text-2xl">{feature.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{feature.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href={feature.href}>
                  {feature.cta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
