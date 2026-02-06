'use client';

import { useUser } from '@/components/providers/user-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function ProfilePage() {
  const { user, plan, isInitialized, signOut, cancelSubscription, billingHistory } = useUser();
  const router = useRouter();
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.replace('/new-login');
    }
  }, [user, isInitialized, router]);

  if (!isInitialized || !user) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isSubscribed = plan === 'Pro' || plan === 'Premium+';

  const handleCancelConfirm = () => {
    cancelSubscription();
    setIsCancelDialogOpen(false);
  };

  return (
    <>
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
            <AlertDialogDescription>
              Your subscription will be canceled, and you will be moved to the Free plan. You will lose your monthly credit refills, but you will keep any remaining credits in your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go Back</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm} className="bg-destructive hover:bg-destructive/90">
              Confirm Cancellation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-headline">Profile</h1>
          <p className="text-muted-foreground">Manage your account and subscription details.</p>
        </div>
        <div className="flex justify-center">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={user.photoURL || ''}
                    alt={user.displayName || 'User'}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground">{user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="font-headline text-2xl">{user.displayName || 'Welcome!'}</CardTitle>
                  <CardDescription className="break-all">{user.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                <span className="font-medium">Current Plan</span>
                <span className="text-primary font-semibold bg-primary/10 px-4 py-1 rounded-full text-sm">
                  {plan}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 items-stretch">
               <Button asChild>
                  <Link href="/pricing">Manage Plan or Buy Credits</Link>
                </Button>
               {isSubscribed && (
                <Button variant="destructive" onClick={() => setIsCancelDialogOpen(true)} className="w-full">
                  Cancel Subscription
                </Button>
              )}
               <Button variant="outline" onClick={signOut} className="w-full">
                  Sign Out
                </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight font-headline">Billing History</h2>
            {billingHistory.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {billingHistory.map((item) => (
                        <Card key={item.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">{item.item}</CardTitle>
                                <CardDescription>
                                    {new Date(item.date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex justify-between items-center">
                                <span className="text-2xl font-bold text-primary">
                                    ${item.amount.toFixed(2)}
                                </span>
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {item.method}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-6 text-center text-muted-foreground">
                        You have no billing history yet.
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </>
  );
}
