'use client';

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { useUser } from './providers/user-provider';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface StripeButtonWrapperProps {
  billingItem: { name: string; price: number, credits?: number, planId?: string };
  children: React.ReactNode;
  buttonProps?: ButtonProps;
}

export function StripeButtonWrapper({ children, buttonProps, billingItem }: StripeButtonWrapperProps) {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  
  const handleNavigation = () => {
    if (!user) {
       toast({
        variant: 'destructive',
        title: 'Please Sign In',
        description: 'You need to be logged in to proceed to checkout.',
      });
      router.push('/new-login');
      return;
    }
    // Store item in localStorage to retrieve on checkout page
    localStorage.setItem('checkout_item', JSON.stringify(billingItem));
    router.push('/test-checkout');
  };

  return (
    <Button onClick={handleNavigation} {...buttonProps} className="w-full">
      {children}
    </Button>
  );
}
