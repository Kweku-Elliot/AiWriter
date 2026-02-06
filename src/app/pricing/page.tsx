'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, CreditCard, Banknote } from 'lucide-react';
import { useUser } from '@/components/providers/user-provider';
import { PaystackButtonWrapper } from '@/components/PaystackButtonWrapper';
import { StripeButtonWrapper } from '@/components/StripeButtonWrapper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const plans = [
  {
    name: 'Free',
    price: '$0',
    priceInUSD: 0,
    description: 'Get started for free',
    features: ['25 free credits', 'Standard AI processing', 'Buy credit packs'],
    credits: 25,
    planId: 'Free',
    billingName: 'Free Plan',
  },
  {
    name: 'Pro',
    price: '$4.99/month',
    priceInUSD: 4.99,
    description: 'For frequent users',
    features: ['250 credits/month', 'Access to saved history', 'PDF export', 'Priority AI processing'],
    credits: 250,
    planId: 'Pro',
    billingName: 'Pro Plan Subscription',
  },
  {
    name: 'Premium+',
    price: '$9.99/month',
    priceInUSD: 9.99,
    description: 'For power users',
    features: [
      '600 credits/month',
      'All Pro perks',
      'Faster response times',
      'Early access to new features',
    ],
    credits: 600,
    planId: 'Premium+',
    billingName: 'Premium+ Plan Subscription',
  },
];

const creditPacks = [
  { name: 'Small Pack', price: '$2.99', priceInUSD: 2.99, credits: 100, billingName: '100 Credit Pack' },
  { name: 'Medium Pack', price: '$5.99', priceInUSD: 5.99, credits: 250, billingName: '250 Credit Pack' },
  { name: 'Big Pack', price: '$9.99', priceInUSD: 9.99, credits: 600, billingName: '600 Credit Pack' },
];

const USD_TO_GHS_RATE = 15; // Placeholder conversion rate

function PaymentButtons({
  amountInUSD,
  email,
  onSuccess,
  isCurrentPlan,
  isDisabled = false,
  disabledTooltip,
  billingItem,
}: {
  amountInUSD: number;
  email: string;
  onSuccess: () => void;
  isCurrentPlan?: boolean;
  isDisabled?: boolean;
  disabledTooltip?: string;
  billingItem: { name: string; price: number, planId?: string, credits?: number };
}) {
  if (isCurrentPlan) {
    return (
      <Button className="w-full" disabled={true} variant={'outline'}>
        Current Plan
      </Button>
    );
  }

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full">
              <Button className="w-full" disabled={true}>
                Choose Plan
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const amountInGHS = amountInUSD * USD_TO_GHS_RATE;
  const amountInPesewas = amountInGHS * 100;

  return (
    <Tabs defaultValue="stripe" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="stripe">
          <CreditCard className="mr-2 h-4 w-4" />
          Stripe
        </TabsTrigger>
        <TabsTrigger value="paystack">
          <Banknote className="mr-2 h-4 w-4" />
          Paystack
        </TabsTrigger>
      </TabsList>
      <TabsContent value="stripe" className="mt-4">
        <StripeButtonWrapper billingItem={billingItem}>
          Pay with Stripe
        </StripeButtonWrapper>
      </TabsContent>
      <TabsContent value="paystack" className="mt-4">
        <PaystackButtonWrapper amount={amountInPesewas} email={email} onSuccess={onSuccess}>
          Pay with Paystack
        </PaystackButtonWrapper>
      </TabsContent>
    </Tabs>
  );
}

function PricingPageContent() {
  const { user, plan, setPlan, addCredits, addTransaction } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('payment_success') === 'true' && searchParams.get('payment_intent')) {
      const purchasedItemString = localStorage.getItem('checkout_item');
      if (purchasedItemString) {
        try {
          const purchasedItem = JSON.parse(purchasedItemString);
          if (purchasedItem.planId) {
            setPlan(purchasedItem.planId as any);
          } else if (purchasedItem.credits) {
            addCredits(purchasedItem.credits);
          }
           addTransaction({
              item: purchasedItem.name,
              amount: purchasedItem.price,
              date: new Date().toISOString(),
              method: 'Stripe',
           });

          toast({
            title: 'Payment Successful!',
            description: `Your purchase of ${purchasedItem.name} was successful.`,
          });
          
          localStorage.removeItem('checkout_item');
        } catch (e) {
          console.error('Error processing purchase from localStorage', e);
        }
      }
      window.history.replaceState(null, '', '/pricing');
    }

    if (searchParams.get('payment_canceled') === 'true') {
      toast({
        variant: 'destructive',
        title: 'Payment Canceled',
        description: 'You have canceled the payment process.',
      });
       localStorage.removeItem('checkout_item');
      window.history.replaceState(null, '', '/pricing');
    }
  }, [searchParams, setPlan, addCredits, addTransaction, toast]);


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Pricing & Plans</h1>
        <p className="text-muted-foreground">Choose a plan that works for you or buy credits as you go.</p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Subscription Plans</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => {
            const isDowngradeAttempt = plan === 'Premium+' && p.planId === 'Pro';

            return (
              <Card key={p.name} className={`flex flex-col ${plan === p.planId ? 'border-primary' : ''}`}>
                <CardHeader>
                  <CardTitle className="font-headline">{p.name}</CardTitle>
                  <CardDescription>{p.description}</CardDescription>
                  <div className="text-3xl font-bold pt-2">{p.price}</div>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {p.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {p.planId === 'Free' ? (
                    <Button className="w-full" disabled={true} variant={'outline'}>
                      Free Plan
                    </Button>
                  ) : (
                    <PaymentButtons
                      amountInUSD={p.priceInUSD}
                      email={user?.email || ''}
                      onSuccess={() => {
                        setPlan(p.planId as any);
                        addTransaction({
                          item: p.billingName,
                          amount: p.priceInUSD,
                          date: new Date().toISOString(),
                          method: 'Paystack',
                        });
                      }}
                      isCurrentPlan={plan === p.planId}
                      isDisabled={isDowngradeAttempt}
                      disabledTooltip="Cancel Premium+ to subscribe to Pro."
                      billingItem={{ name: p.billingName, price: p.priceInUSD, planId: p.planId }}
                    />
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 font-headline">Pay-As-You-Go</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {creditPacks.map((pack) => (
            <Card key={pack.name} className="flex flex-col">
              <CardHeader>
                <CardTitle className="font-headline">{pack.name}</CardTitle>
                <CardDescription>A one-time purchase of {pack.credits.toLocaleString()} credits.</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="text-3xl font-bold">{pack.price}</div>
              </CardContent>
              <CardFooter>
                <PaymentButtons
                  amountInUSD={pack.priceInUSD}
                  email={user?.email || ''}
                  onSuccess={() => {
                    addCredits(pack.credits);
                    addTransaction({
                      item: pack.billingName,
                      amount: pack.priceInUSD,
                      date: new Date().toISOString(),
                      method: 'Paystack',
                    });
                  }}
                  billingItem={{ name: pack.billingName, price: pack.priceInUSD, credits: pack.credits }}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function PricingPage() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <PricingPageContent />
    </React.Suspense>
  );
}
