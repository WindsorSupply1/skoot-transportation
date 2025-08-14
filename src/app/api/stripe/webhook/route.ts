import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { sendBookingConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCancellation(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update payment record
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'COMPLETED',
        stripeChargeId: paymentIntent.latest_charge as string,
        paidAt: new Date(),
      }
    });

    // Update booking status
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'PAID',
        status: 'CONFIRMED',
      },
      include: {
        departure: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        returnDeparture: {
          include: {
            schedule: { include: { route: true } },
            pickupLocation: true
          }
        },
        passengers: true,
        payment: true
      }
    });

    // Send confirmation email
    await sendBookingConfirmationEmail(booking);

    // Log successful payment
    console.log(`Payment successful for booking ${bookingId}, amount: $${paymentIntent.amount / 100}`);

  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update payment record
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'FAILED',
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'FAILED',
        status: 'PAYMENT_FAILED',
      }
    });

    console.log(`Payment failed for booking ${bookingId}`);

  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  try {
    const bookingId = paymentIntent.metadata.bookingId;
    
    if (!bookingId) {
      console.error('No booking ID in payment intent metadata');
      return;
    }

    // Update payment record
    await prisma.payment.update({
      where: {
        stripePaymentIntentId: paymentIntent.id
      },
      data: {
        status: 'CANCELLED',
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        status: 'CANCELLED',
      }
    });

    console.log(`Payment cancelled for booking ${bookingId}`);

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}