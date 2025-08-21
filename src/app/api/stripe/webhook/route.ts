import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe, verifyWebhookSignature, generateReceiptNumber } from '@/lib/stripe';
import { sendBookingConfirmationEmail, sendEnhancedPaymentReceiptEmail } from '@/lib/email';
import { SMS_TEMPLATES, smsService } from '@/lib/sms';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = verifyWebhookSignature(body, signature, webhookSecret);
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

    // Generate receipt number
    const receiptNumber = generateReceiptNumber();

    // Calculate Stripe processing fee (estimate)
    const stripeAmount = paymentIntent.amount;
    const processingFee = Math.round(stripeAmount * 0.029 + 30); // 2.9% + 30 cents in cents
    const netAmount = stripeAmount - processingFee;

    // Update payment record with detailed information
    await prisma.payment.update({
      where: {
        bookingId: bookingId
      },
      data: {
        status: 'COMPLETED',
        transactionId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method_types?.[0] || 'card',
        processedAt: new Date(),
        processorFee: processingFee / 100, // Convert back to dollars
        netAmount: netAmount / 100, // Convert back to dollars
      }
    });

    // Update booking status and add confirmation timestamp
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'PAID',
        confirmedAt: new Date(),
      },
      include: {
        departure: {
          include: {
            schedule: { include: { route: true } }
          }
        },
        returnDeparture: {
          include: {
            schedule: { include: { route: true } }
          }
        },
        pickupLocation: true,
        dropoffLocation: true,
        user: true,
        passengers: true,
        payment: true,
        pricingTier: true,
      }
    });

    // Update departure booked seats count
    await prisma.departure.update({
      where: { id: booking.departureId },
      data: {
        bookedSeats: {
          increment: booking.passengerCount
        }
      }
    });

    // Update return departure if round trip
    if (booking.returnDepartureId) {
      await prisma.departure.update({
        where: { id: booking.returnDepartureId },
        data: {
          bookedSeats: {
            increment: booking.passengerCount
          }
        }
      });
    }

    // Create or update live departure status for tracking
    const trackingUrl = `/live/${booking.departureId}`;
    await prisma.liveDepartureStatus.upsert({
      where: { departureId: booking.departureId },
      update: {
        isLiveTracked: true,
        trackingUrl,
        statusMessage: `Scheduled departure from ${booking.departure.schedule.route.origin}`
      },
      create: {
        departureId: booking.departureId,
        currentStatus: 'SCHEDULED',
        isLiveTracked: true,
        trackingUrl,
        statusMessage: `Scheduled departure from ${booking.departure.schedule.route.origin}`,
        progressPercentage: 0,
        delayMinutes: 0
      }
    });

    // Send confirmation and receipt emails
    const emailPromises = [
      sendEnhancedPaymentReceiptEmail({
        bookingNumber: booking.bookingNumber,
        receiptNumber,
        customerName: booking.user ? 
          `${booking.user.firstName} ${booking.user.lastName}` : 
          `${booking.guestFirstName} ${booking.guestLastName}`,
        customerEmail: booking.user?.email || booking.guestEmail!,
        amount: stripeAmount / 100,
        currency: paymentIntent.currency.toUpperCase(),
        paymentDate: new Date(),
        transactionId: paymentIntent.id,
        tripDetails: {
          route: booking.departure.schedule.route.name,
          date: booking.departure.date.toISOString().split('T')[0],
          passengers: booking.passengerCount,
          pickupLocation: booking.pickupLocation.name,
          dropoffLocation: booking.dropoffLocation.name,
        },
        processingFee: processingFee / 100,
        netAmount: netAmount / 100,
      })
    ];

    // Only send booking confirmation email if user exists (not guest booking)
    if (booking.user) {
      emailPromises.push(sendBookingConfirmationEmail(booking as any, trackingUrl));
    }

    await Promise.all(emailPromises);

    // Send SMS notification with tracking link
    const phoneNumber = booking.user?.phone || booking.guestPhone;
    if (phoneNumber) {
      try {
        const trackingUrl = `/live/${booking.departureId}`;
        const departureDate = new Date(booking.departure.date).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long', 
          day: 'numeric'
        });
        const departureTime = booking.departure.schedule.time;
        
        const smsMessage = SMS_TEMPLATES.BOOKING_CONFIRMED(
          booking.departure.schedule.route.name,
          departureDate,
          departureTime,
          trackingUrl
        );

        const smsResult = await smsService.sendSMS({
          to: phoneNumber,
          message: smsMessage,
          trackingUrl
        });

        // Create SMS notification record
        await prisma.customerNotification.create({
          data: {
            bookingId: booking.id,
            departureId: booking.departureId,
            notificationType: 'SMS',
            recipientPhone: phoneNumber,
            message: smsMessage,
            trackingUrl,
            status: smsResult.success ? 'SENT' : 'FAILED',
            sentAt: smsResult.success ? new Date() : undefined
          }
        });

        console.log(`SMS sent for booking ${bookingId}: ${smsResult.success ? 'Success' : 'Failed'}`);
      } catch (smsError) {
        console.error('Error sending booking confirmation SMS:', smsError);
        
        // Still create a failed notification record for audit
        try {
          await prisma.customerNotification.create({
            data: {
              bookingId: booking.id,
              departureId: booking.departureId,
              notificationType: 'SMS',
              recipientPhone: phoneNumber,
              message: 'Booking confirmation SMS',
              status: 'FAILED'
            }
          });
        } catch (dbError) {
          console.error('Error creating notification record:', dbError);
        }
      }
    }

    // Log successful payment with detailed info
    console.log(`Payment successful: 
      Booking: ${bookingId} 
      Receipt: ${receiptNumber}
      Amount: $${stripeAmount / 100} 
      Net: $${netAmount / 100}
      Fee: $${processingFee / 100}`);

    // Create audit log entry
    await createAuditLog({
      action: 'PAYMENT_SUCCESS',
      bookingId,
      paymentIntentId: paymentIntent.id,
      amount: stripeAmount / 100,
      metadata: {
        receiptNumber,
        processingFee: processingFee / 100,
        netAmount: netAmount / 100,
      }
    });

  } catch (error) {
    console.error('Error handling payment success:', error);
    
    // Create audit log for error
    await createAuditLog({
      action: 'PAYMENT_SUCCESS_ERROR',
      bookingId: paymentIntent.metadata.bookingId,
      paymentIntentId: paymentIntent.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
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
        bookingId: bookingId
      },
      data: {
        status: 'FAILED',
        transactionId: paymentIntent.id,
        failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
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
        bookingId: bookingId
      },
      data: {
        status: 'FAILED',
        transactionId: paymentIntent.id,
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      }
    });

    console.log(`Payment cancelled for booking ${bookingId}`);

    // Create audit log
    await createAuditLog({
      action: 'PAYMENT_CANCELLED',
      bookingId,
      paymentIntentId: paymentIntent.id,
      metadata: { reason: 'User cancelled payment' }
    });

  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}

// Audit log helper function
async function createAuditLog(data: {
  action: string;
  bookingId?: string;
  paymentIntentId?: string;
  amount?: number;
  error?: string;
  metadata?: any;
}) {
  try {
    // Store in a simple log table or external service
    // For now, we'll use console logging with structured data
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'stripe-webhook',
      ...data,
    };
    
    console.log('AUDIT_LOG:', JSON.stringify(logEntry));
    
    // You could also store this in database:
    // await prisma.auditLog.create({ data: logEntry });
    
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}