import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe, formatAmountForStripe, generateReceiptNumber } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// Use the stripe instance from lib/stripe.ts

export async function POST(request: NextRequest) {
  try {
    const { bookingId, amount, currency = 'usd' } = await request.json();

    if (!bookingId || !amount) {
      return NextResponse.json({
        error: 'Missing required fields: bookingId, amount'
      }, { status: 400 });
    }

    // Verify booking exists and is pending payment
    let booking = null;
    
    // Check if this is a mock booking (for testing)
    if (bookingId.startsWith('mock_booking_')) {
      console.log('Payment Intent: Processing mock booking for testing');
      // Create a mock booking object for testing
      booking = {
        id: bookingId,
        bookingNumber: `SK${Date.now().toString().slice(-6)}`,
        totalAmount: amount,
        status: 'PENDING',
        departure: {
          date: new Date(),
          schedule: {
            time: '14:00',
            route: { name: 'Columbia to Charlotte Douglas International Airport' }
          }
        },
        pickupLocation: { name: 'Downtown Columbia' },
        dropoffLocation: { name: 'Charlotte Douglas International Airport' },
        user: null,
        guestEmail: 'test@example.com',
        passengerCount: 1,
        passengers: []
      } as any;
    } else {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          departure: {
            include: {
              schedule: { include: { route: true } }
            }
          },
          pickupLocation: true,
          dropoffLocation: true,
          user: true,
          passengers: true
        }
      });
    }

    if (!booking) {
      console.error('Booking not found for ID:', bookingId);
      return NextResponse.json({
        error: 'Booking not found'
      }, { status: 404 });
    }

    if (booking.status !== 'PENDING') {
      return NextResponse.json({
        error: 'Booking payment already processed'
      }, { status: 400 });
    }

    // Verify amount matches booking total
    const expectedAmount = Math.round(booking.totalAmount * 100); // Convert to cents
    const requestedAmount = Math.round(amount * 100);

    if (requestedAmount !== expectedAmount) {
      return NextResponse.json({
        error: 'Amount mismatch',
        expected: expectedAmount / 100,
        received: requestedAmount / 100
      }, { status: 400 });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: expectedAmount,
      currency,
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        customerEmail: booking.user?.email || booking.guestEmail || '',
        departureDate: booking.departure.date.toISOString(),
        passengerCount: booking.passengerCount.toString(),
        route: booking.departure.schedule.route.name
      },
      description: `Skoot Transportation - ${booking.departure.schedule.route.name} - ${booking.passengerCount} passenger(s)`,
      receipt_email: booking.user?.email || booking.guestEmail || undefined,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Store payment intent in database (skip for mock bookings)
    if (!bookingId.startsWith('mock_booking_')) {
      try {
        await prisma.payment.create({
          data: {
            bookingId: booking.id,
            transactionId: paymentIntent.id,
            amount: booking.totalAmount,
            currency: currency.toUpperCase(),
            status: 'PENDING',
            paymentMethod: 'STRIPE',
          }
        });
      } catch (dbError) {
        console.error('Failed to store payment in database:', dbError);
        // Continue anyway for mock bookings
      }
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: expectedAmount,
      booking: {
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        passengerCount: booking.passengerCount,
        departure: {
          date: booking.departure.date,
          time: booking.departure.schedule.time,
          route: booking.departure.schedule.route.name
        },
        pickupLocation: booking.pickupLocation.name
      }
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({
        error: 'Payment processing error',
        details: error.message
      }, { status: 400 });
    }

    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}