'use client';
import { WifiOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mx-auto bg-muted rounded-full p-4 w-fit">
            <WifiOff className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl mt-4">You are Offline</CardTitle>
          <CardDescription className="mt-2">
            It looks like you've lost your internet connection. Some features may not be available until you're back online.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Pages you've visited before might be available from the cache.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
