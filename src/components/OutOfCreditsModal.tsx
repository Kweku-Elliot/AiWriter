'use client';
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
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface OutOfCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutOfCreditsModal({ open, onOpenChange }: OutOfCreditsModalProps) {
  const router = useRouter();

  const handleNavigation = () => {
    router.push('/pricing');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>You're out of credits!</AlertDialogTitle>
          <AlertDialogDescription>
            You don't have enough credits to perform this action. Please buy more credits or subscribe to a plan to
            continue.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleNavigation}>View Plans</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
