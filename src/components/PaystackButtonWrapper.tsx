'use client';

import React from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button, ButtonProps } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser } from './providers/user-provider';

interface PaystackButtonWrapperProps {
  amount: number; // Amount in the smallest currency unit (e.g., kobo, pesewas)
  email: string;
  onSuccess: () => void;
  children: React.ReactNode;
  buttonProps?: ButtonProps;
}

export function PaystackButtonWrapper({ amount, email, onSuccess, children, buttonProps }: PaystackButtonWrapperProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const paystackPublicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: Math.round(amount), // Amount in pesewas
    currency: 'GHS', // Set currency to Ghanaian Cedis
    publicKey: paystackPublicKey,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please Sign In',
            description: 'You need to be logged in to make a purchase.',
        });
        return;
    }
     if (!paystackPublicKey) {
      console.error('Paystack public key is not configured.');
      toast({
        variant: 'destructive',
        title: 'Payment Error',
        description: 'Payment system is not configured correctly. Please contact support.',
      });
      return;
    }
    initializePayment({
      onSuccess: () => {
        onSuccess();
        toast({ title: 'Payment Successful!', description: 'Your account has been updated.' });
      },
      onClose: () => {
        toast({
            variant: 'destructive',
            title: 'Payment Canceled',
            description: 'You have canceled the payment process.',
        });
      },
    });
  };

  return (
    <Button onClick={handlePayment} {...buttonProps} className="w-full">
      {children}
    </Button>
  );
}
