import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe
let stripePromise: Promise<any>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Server-side Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Stripe configuration constants
export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethodTypes: ['card'],
  captureMethod: 'automatic' as const,
  confirmationMethod: 'automatic' as const,
} as const;

// Webhook signature verification
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}

// Helper to format amounts for Stripe (convert dollars to cents)
export function formatAmountForStripe(amount: number, currency = 'usd'): number {
  const numberFormat = new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  });
  
  const parts = numberFormat.formatToParts(amount);
  const amountValue = parseFloat(parts.find(part => part.type === 'integer')?.value || '0');
  
  return Math.round(amountValue * 100);
}

// Helper to format amounts for display (convert cents to dollars)
export function formatAmountFromStripe(amount: number, currency = 'usd'): string {
  return new Intl.NumberFormat(['en-US'], {
    style: 'currency',
    currency: currency,
    currencyDisplay: 'symbol',
  }).format(amount / 100);
}

// Payment method types
export type PaymentMethodType = 'card' | 'apple_pay' | 'google_pay';

// Payment intent creation data
export interface CreatePaymentIntentData {
  bookingId: string;
  amount: number;
  currency?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Payment processing result types
export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  requiresAction?: boolean;
}

// Stripe error handling
export function handleStripeError(error: any): { message: string; code?: string } {
  if (error instanceof Stripe.errors.StripeError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error.code === 'card_declined') {
    return {
      message: 'Your card was declined. Please try a different payment method.',
      code: error.code,
    };
  }

  if (error.code === 'expired_card') {
    return {
      message: 'Your card has expired. Please use a different payment method.',
      code: error.code,
    };
  }

  if (error.code === 'insufficient_funds') {
    return {
      message: 'Your card has insufficient funds. Please use a different payment method.',
      code: error.code,
    };
  }

  if (error.code === 'processing_error') {
    return {
      message: 'An error occurred while processing your payment. Please try again.',
      code: error.code,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    code: 'unknown_error',
  };
}

// Receipt data structure
export interface ReceiptData {
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  transactionId: string;
  tripDetails: {
    route: string;
    date: string;
    passengers: number;
    pickupLocation: string;
    dropoffLocation: string;
  };
}

// Generate receipt number
export function generateReceiptNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RCP-${timestamp}-${random}`;
}