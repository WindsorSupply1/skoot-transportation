import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BookingSchema = z.object({
  departureId: z.string(),
  returnDepartureId: z.string().optional(),
  pickupLocationId: z.string(),
  passengerCount: z.number().min(1).max(15),
  customerType: z.enum(['REGULAR', 'STUDENT', 'MILITARY', 'LEGACY']),
  contactInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(10),
  }),
  passengers: z.array(z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string().optional(),
  })),
  extraLuggage: z.number().min(0).max(10),
  pets: z.number().min(0).max(5),
  specialRequests: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BookingSchema.parse(body);

    // Check departure availability
    const departure = await prisma.departure.findUnique({
      where: { id: validatedData.departureId },
      include: {
        schedule: { include: { route: true } },
        _count: { select: { bookings: true } }
      }
    });

    if (!departure) {
      return NextResponse.json({ error: 'Departure not found' }, { status: 404 });
    }

    const availableSeats = departure.capacity - departure._count.bookings;
    if (availableSeats < validatedData.passengerCount) {
      return NextResponse.json({ 
        error: 'Not enough seats available',
        availableSeats 
      }, { status: 400 });
    }

    // Calculate pricing
    const basePrices = {
      LEGACY: 31,
      STUDENT: 32,
      MILITARY: 32,
      REGULAR: 35
    };

    const basePrice = basePrices[validatedData.customerType];
    const passengerCost = basePrice * validatedData.passengerCount;
    const luggageCost = validatedData.extraLuggage * 5;
    const petCost = validatedData.pets * 10;
    const subtotal = passengerCost + luggageCost + petCost;

    // Round trip discount (10% off total)
    const isRoundTrip = !!validatedData.returnDepartureId;
    const discount = isRoundTrip ? Math.round(subtotal * 0.1) : 0;
    const total = isRoundTrip ? (subtotal * 2) - discount : subtotal;

    // Get default pricing tier
    const defaultPricing = await prisma.pricingTier.findFirst({ where: { isActive: true } });
    if (!defaultPricing) {
      return NextResponse.json({ error: 'No pricing available' }, { status: 500 });
    }
    
    // Create temporary guest user
    const guestUser = await prisma.user.create({
      data: {
        email: validatedData.contactInfo.email,
        firstName: validatedData.passengers[0].firstName,
        lastName: validatedData.passengers[0].lastName,
        phone: validatedData.contactInfo.phone,
        isAdmin: false
      }
    });
    
    // Create booking
    const booking = await prisma.booking.create({
      data: {
        userId: guestUser.id,
        routeId: departure.schedule.routeId,
        departureId: validatedData.departureId,
        returnDepartureId: validatedData.returnDepartureId,
        pickupLocationId: validatedData.pickupLocationId,
        dropoffLocationId: validatedData.pickupLocationId,
        pricingTierId: defaultPricing.id,
        passengerCount: validatedData.passengerCount,
        totalAmount: total,
        status: 'PENDING',
        isRoundTrip: isRoundTrip,
        specialRequests: validatedData.specialRequests,
        passengers: {
          create: validatedData.passengers.map((passenger, index) => ({
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            dateOfBirth: passenger.dateOfBirth ? new Date(passenger.dateOfBirth) : null,
            seatNumber: null,
            checkedIn: false,
          }))
        }
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
        passengers: true,
      }
    });

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        bookingNumber: booking.bookingNumber,
        totalAmount: booking.totalAmount,
        departure: {
          date: booking.departure.date,
          time: booking.departure.schedule.time,
          route: booking.departure.schedule.route.name,
        },
        returnDeparture: booking.returnDeparture ? {
          date: booking.returnDeparture.date,
          time: booking.returnDeparture.schedule.time,
          route: booking.returnDeparture.schedule.route.name,
        } : null,
        pickupLocation: booking.pickupLocation.name,
        dropoffLocation: booking.dropoffLocation.name,
        passengers: booking.passengers,
        paymentRequired: booking.totalAmount,
      }
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirmationCode = searchParams.get('confirmationCode');
    const email = searchParams.get('email');

    if (!confirmationCode || !email) {
      return NextResponse.json({ 
        error: 'Confirmation code and email required' 
      }, { status: 400 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        bookingNumber: confirmationCode,
        user: {
          email: email
        }
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
      }
    });

    if (!booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 });
    }

    return NextResponse.json({ booking });

  } catch (error) {
    console.error('Booking lookup error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}