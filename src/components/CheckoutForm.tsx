'use client';
import { useEffect, useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { toast } = useToast();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      return;
    }

    setIsLoading(true);
    setMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required', // Important: Prevents automatic redirection
    });

    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setMessage(error.message || 'An unexpected error occurred.');
      } else {
        setMessage('An unexpected error occurred.');
      }
      setIsLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded, now we can redirect manually
      router.push('/pricing?payment_success=true');
    } else {
        // Handle other statuses like 'processing' or 'requires_action' if needed
        setMessage('Payment processing.');
    }

    setIsLoading(false);
  };
  
  const handleCancel = () => {
    router.push('/pricing?payment_canceled=true');
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Pay now'}
        </span>
      </Button>
      <Button variant="outline" onClick={handleCancel} className="w-full mt-2" type="button">
        Cancel
      </Button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message" className="text-sm text-destructive mt-2 text-center">{message}</div>}
    </form>
  );
}
