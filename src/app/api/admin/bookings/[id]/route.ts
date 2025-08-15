import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const bookingId = params.id;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          },
          returnDeparture: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          },
          passengers: true,
          payment: true
        }
      });

      if (!booking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      return NextResponse.json({ booking });

    } catch (error) {
      console.error('Booking fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const bookingId = params.id;
      const body = await req.json();
      const { status, notes, paymentStatus, refundAmount } = body;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { payment: true }
      });

      if (!existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Build update data
      const updateData: any = {};
      if (status !== undefined) updateData.status = status.toUpperCase();
      if (notes !== undefined) updateData.notes = notes;
      updateData.updatedAt = new Date();

      // Update booking
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
          user: true,
          departure: {
            include: {
              schedule: {
                include: {
                  route: true
                }
              }
            }
          },
          passengers: true,
          payment: true
        }
      });

      // Handle payment status updates if provided
      if (paymentStatus !== undefined && existingBooking.payment) {
        await prisma.payment.update({
          where: { id: existingBooking.payment.id },
          data: {
            status: paymentStatus.toUpperCase(),
            ...(refundAmount && { 
              refundAmount: parseFloat(refundAmount), 
              refundedAt: new Date() 
            })
          }
        });
      }

      return NextResponse.json({
        message: 'Booking updated successfully',
        booking: updatedBooking
      });

    } catch (error) {
      console.error('Booking update error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, user) => {
    try {
      const bookingId = params.id;

      // Check if booking exists
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          passengers: true,
          payment: true
        }
      });

      if (!existingBooking) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }

      // Delete related records in correct order (due to foreign key constraints)
      
      // Delete passengers first
      if (existingBooking.passengers.length > 0) {
        await prisma.passenger.deleteMany({
          where: { bookingId: bookingId }
        });
      }

      // Delete payment record if exists
      if (existingBooking.payment) {
        await prisma.payment.delete({
          where: { id: existingBooking.payment.id }
        });
      }

      // Finally delete the booking
      await prisma.booking.delete({
        where: { id: bookingId }
      });

      return NextResponse.json({
        message: 'Booking deleted successfully'
      });

    } catch (error) {
      console.error('Booking deletion error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}