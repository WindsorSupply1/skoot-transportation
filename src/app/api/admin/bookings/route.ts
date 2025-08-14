import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status');
      const search = searchParams.get('search');
      const dateFrom = searchParams.get('dateFrom');
      const dateTo = searchParams.get('dateTo');

      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (status && status !== 'all') {
        where.bookingStatus = status;
      }

      if (search) {
        where.OR = [
          { confirmationCode: { contains: search, mode: 'insensitive' } },
          { contactEmail: { contains: search, mode: 'insensitive' } },
          { passengers: { some: { 
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }}}
        ];
      }

      if (dateFrom || dateTo) {
        where.departure = {
          date: {}
        };
        if (dateFrom) where.departure.date.gte = new Date(dateFrom);
        if (dateTo) where.departure.date.lte = new Date(dateTo);
      }

      // Get bookings with related data
      const [bookings, totalCount] = await Promise.all([
        prisma.booking.findMany({
          where,
          include: {
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
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.booking.count({ where })
      ]);

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return NextResponse.json({
        bookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPreviousPage,
          limit
        }
      });

    } catch (error) {
      console.error('Bookings fetch error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const {
        bookingId,
        bookingStatus,
        paymentStatus,
        notes,
        refundAmount
      } = await req.json();

      if (!bookingId) {
        return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
      }

      // Build update data
      const updateData: any = {};
      if (bookingStatus !== undefined) updateData.bookingStatus = bookingStatus;
      if (notes !== undefined) updateData.notes = notes;

      // Update booking
      const booking = await prisma.booking.update({
        where: { id: bookingId },
        data: updateData,
        include: {
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

      // Handle payment status updates
      if (paymentStatus !== undefined && booking.payment) {
        await prisma.payment.update({
          where: { id: booking.payment.id },
          data: {
            paymentStatus,
            ...(refundAmount && { refundAmount, refundedAt: new Date() })
          }
        });
      }

      return NextResponse.json({
        message: 'Booking updated successfully',
        booking
      });

    } catch (error) {
      console.error('Booking update error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }, true);
}