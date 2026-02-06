'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function TestPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Login Test Page</CardTitle>
          <CardDescription>This is a page for testing navigation.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Navigating to this page should be instantaneous.</p>
        </CardContent>
      </Card>
    </div>
  );
}
