import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RefundRequest {
  bookingId: string;
  reason?: string;
  amount?: number; // Optional for partial refunds
  notifyCustomer?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { bookingId, reason, amount, notifyCustomer = true }: RefundRequest = await request.json();

    if (!bookingId) {
      return NextResponse.json({
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    // Get booking with payment information
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: true,
        departure: {
          include: {
            schedule: { include: { route: true } }
          }
        },
        pickupLocation: true,
        dropoffLocation: true,
      }
    });

    if (!booking) {
      return NextResponse.json({
        error: 'Booking not found'
      }, { status: 404 });
    }

    if (!booking.payment || booking.payment.status !== 'COMPLETED') {
      return NextResponse.json({
        error: 'No completed payment found for this booking'
      }, { status: 400 });
    }

    if (booking.status === 'REFUNDED') {
      return NextResponse.json({
        error: 'Booking has already been refunded'
      }, { status: 400 });
    }

    const paymentIntentId = booking.payment.transactionId;
    if (!paymentIntentId) {
      return NextResponse.json({
        error: 'No payment transaction ID found'
      }, { status: 400 });
    }

    // Calculate refund amount
    const originalAmount = Math.round(booking.payment.amount * 100); // Convert to cents
    const refundAmount = amount ? Math.round(amount * 100) : originalAmount;

    // Validate refund amount
    if (refundAmount > originalAmount) {
      return NextResponse.json({
        error: 'Refund amount cannot exceed original payment amount'
      }, { status: 400 });
    }

    if (refundAmount <= 0) {
      return NextResponse.json({
        error: 'Refund amount must be greater than zero'
      }, { status: 400 });
    }

    // Create refund with Stripe
    const stripeRefund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: refundAmount,
      reason: reason ? 'requested_by_customer' : 'duplicate',
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.bookingNumber,
        adminUserId: session.user.id,
        reason: reason || 'Admin initiated refund',
      }
    });

    // Update payment record
    const isFullRefund = refundAmount === originalAmount;
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        refundedAt: new Date(),
        refundAmount: refundAmount / 100,
        refundReason: reason || 'Admin initiated refund',
      }
    });

    // Update booking status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'REFUNDED',
        cancelledAt: new Date(),
        adminNotes: `Refunded $${refundAmount / 100} - ${reason || 'Admin initiated refund'}`,
      }
    });

    // Update departure booked seats (free up the seats)
    await prisma.departure.update({
      where: { id: booking.departureId },
      data: {
        bookedSeats: {
          decrement: booking.passengerCount
        }
      }
    });

    // Update return departure if round trip
    if (booking.returnDepartureId) {
      await prisma.departure.update({
        where: { id: booking.returnDepartureId },
        data: {
          bookedSeats: {
            decrement: booking.passengerCount
          }
        }
      });
    }

    // Send refund notification email if requested
    if (notifyCustomer && booking.user?.email) {
      // This would be implemented in the email service
      // await sendRefundNotificationEmail(booking, refundAmount / 100, reason);
    }

    // Create audit log
    await createRefundAuditLog({
      action: 'REFUND_PROCESSED',
      bookingId: booking.id,
      stripeRefundId: stripeRefund.id,
      originalAmount: originalAmount / 100,
      refundAmount: refundAmount / 100,
      reason,
      adminUserId: session.user.id,
      isFullRefund,
    });

    console.log(`Refund processed: 
      Booking: ${bookingId}
      Amount: $${refundAmount / 100}
      Stripe Refund: ${stripeRefund.id}
      Status: ${stripeRefund.status}`);

    return NextResponse.json({
      success: true,
      refund: {
        id: stripeRefund.id,
        amount: refundAmount / 100,
        status: stripeRefund.status,
        bookingNumber: booking.bookingNumber,
        isFullRefund,
      }
    });

  } catch (error) {
    console.error('Refund processing error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Failed to process refund'
    }, { status: 500 });
  }
}

// Get refund status
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({
        error: 'Unauthorized - Admin access required'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({
        error: 'Booking ID is required'
      }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
      }
    });

    if (!booking) {
      return NextResponse.json({
        error: 'Booking not found'
      }, { status: 404 });
    }

    const refundInfo = {
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      paymentStatus: booking.payment?.status,
      originalAmount: booking.payment?.amount,
      refundAmount: booking.payment?.refundAmount,
      refundedAt: booking.payment?.refundedAt,
      refundReason: booking.payment?.refundReason,
      canRefund: booking.payment?.status === 'COMPLETED' && booking.status !== 'REFUNDED',
    };

    return NextResponse.json(refundInfo);

  } catch (error) {
    console.error('Refund status fetch error:', error);
    return NextResponse.json({
      error: 'Failed to fetch refund status'
    }, { status: 500 });
  }
}

// Helper function for refund audit logging
async function createRefundAuditLog(data: {
  action: string;
  bookingId: string;
  stripeRefundId: string;
  originalAmount: number;
  refundAmount: number;
  reason?: string;
  adminUserId: string;
  isFullRefund: boolean;
}) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: 'stripe-refund',
      ...data,
    };
    
    console.log('REFUND_AUDIT_LOG:', JSON.stringify(logEntry));
    
  } catch (error) {
    console.error('Failed to create refund audit log:', error);
  }
}