'use client';

import { useState, useEffect } from 'react';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useUser } from '@/components/providers/user-provider';
import { createPaymentIntent } from '@/actions/stripe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutForm } from '@/components/CheckoutForm';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!stripePublicKey) {
  console.error("Stripe publishable key is not set. Please check your .env file.");
}

const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

export default function TestCheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const [clientSecret, setClientSecret] = useState('');
  const [billingItem, setBillingItem] = useState<{ name: string; price: number } | null>(null);

  useEffect(() => {
    if (!user) {
        toast({
            variant: 'destructive',
            title: 'Please sign in to continue',
        });
        router.replace('/new-login');
        return;
    }

    const itemString = localStorage.getItem('checkout_item');
    if (!itemString) {
      toast({
        variant: 'destructive',
        title: 'No item selected',
        description: 'Returning to pricing page.',
      });
      router.replace('/pricing');
      return;
    }

    const item = JSON.parse(itemString);
    setBillingItem(item);

    createPaymentIntent(item.price)
      .then((res) => {
        if (res.clientSecret) {
          setClientSecret(res.clientSecret);
        } else {
          console.error(res.error);
           toast({
            variant: 'destructive',
            title: 'Could not initialize payment',
            description: 'Please try again later.',
          });
          router.replace('/pricing');
        }
      })
      .catch((err) => {
        console.error('Failed to create payment intent', err);
         toast({
            variant: 'destructive',
            title: 'Could not initialize payment',
            description: 'A server error occurred.',
        });
        router.replace('/pricing');
      });
  }, [user, router, toast]);

  if (!stripePromise) {
    return (
       <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
         <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-destructive">Configuration Error</CardTitle>
                 <CardDescription>
                    The Stripe payment gateway is not configured correctly. Please ensure the Stripe publishable key is set in the environment variables.
                </CardDescription>
            </CardHeader>
         </Card>
       </div>
    )
  }

  const appearance: StripeElementsOptions['appearance'] = {
    theme: 'night',
    labels: 'floating',
     variables: {
      colorPrimary: '#00c497',
      colorBackground: '#1c2128',
      colorText: '#f0f6fc',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, sans-serif',
      spacingUnit: '4px',
      borderRadius: '4px',
    },
  };
  
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Complete Your Purchase</CardTitle>
          {billingItem ? (
            <CardDescription>
              You are purchasing <span className="font-bold text-primary">{billingItem.name}</span> for <span className="font-bold text-primary">${billingItem.price.toFixed(2)}</span>.
            </CardDescription>
          ) : (
            <CardDescription>Loading item details...</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {clientSecret ? (
            <Elements options={options} stripe={stripePromise}>
              <CheckoutForm />
            </Elements>
          ) : (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4">Initializing secure payment...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
